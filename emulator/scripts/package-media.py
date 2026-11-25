#!/usr/bin/env python3
"""Package a verified raw disk as independently compressed v86 partfiles."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile

import zstandard


CHUNK_SIZE = 262_144
VIRTUAL_URL = ".img.zst"


def sha256_argument(value: str) -> str:
  if not re.fullmatch(r"[a-fA-F0-9]{64}", value):
    raise argparse.ArgumentTypeError("Expected a 64-character SHA-256 digest")
  return value.lower()


def package_media(
  source: Path,
  destination: Path,
  expected_sha256: str,
  expected_size: int | None = None,
  level: int = 10,
) -> dict:
  source = source.resolve(strict=True)
  destination = destination.absolute()
  if not source.is_file():
    raise ValueError(f"The source is not a regular file: {source}")
  if destination.exists():
    raise ValueError(f"Output already exists; use a new directory: {destination}")
  logical_size = source.stat().st_size
  if logical_size <= 0:
    raise ValueError("The source disk is empty")
  if expected_size is not None and logical_size != expected_size:
    raise ValueError(f"Disk size mismatch: expected {expected_size}, got {logical_size}")
  if not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha256):
    raise ValueError("An expected SHA-256 digest is required")
  if not 1 <= level <= 22:
    raise ValueError("Zstandard level must be between 1 and 22")

  destination.parent.mkdir(parents=True, exist_ok=True)
  staging = Path(tempfile.mkdtemp(prefix=f".{destination.name}-", dir=destination.parent))
  compressor = zstandard.ZstdCompressor(level=level, write_checksum=True, write_content_size=True)
  digest = hashlib.sha256()
  chunks = []
  offset = 0
  compressed_size = 0
  try:
    with source.open("rb") as disk:
      while block := disk.read(CHUNK_SIZE):
        digest.update(block)
        block_size = len(block)
        # v86 asks its decompressor for exactly fixed_chunk_size bytes, even at EOF.
        padded = block.ljust(CHUNK_SIZE, b"\0")
        compressed = compressor.compress(padded)
        filename = f"{offset}-{offset + CHUNK_SIZE}.img.zst"
        (staging / filename).write_bytes(compressed)
        chunks.append({
          "file": filename,
          "offset": offset,
          "logical_size": block_size,
          "compressed_size": len(compressed),
          "sha256": hashlib.sha256(compressed).hexdigest(),
        })
        offset += block_size
        compressed_size += len(compressed)
        if len(chunks) % 256 == 0:
          print(f"Packaged {offset:,}/{logical_size:,} bytes", file=sys.stderr, flush=True)

    actual_sha256 = digest.hexdigest()
    if offset != logical_size:
      raise ValueError("The source size changed during packaging")
    if actual_sha256 != expected_sha256.lower():
      raise ValueError(f"SHA-256 mismatch: expected {expected_sha256.lower()}, got {actual_sha256}")

    manifest = {
      "schema_version": 1,
      "format": "v86-partfiles-zstd",
      "source_name": source.name,
      "sha256": actual_sha256,
      "logical_size": logical_size,
      "chunk_size": CHUNK_SIZE,
      "chunk_count": len(chunks),
      "padded_size": len(chunks) * CHUNK_SIZE,
      "compressed_size": compressed_size,
      "compression": {"format": "zstd", "level": level, "library_version": zstandard.__version__},
      "v86": {
        "url": VIRTUAL_URL,
        "size": logical_size,
        "async": True,
        "use_parts": True,
        "fixed_chunk_size": CHUNK_SIZE,
      },
      "chunks": chunks,
    }
    (staging / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    # An invalid or interrupted package never appears at the publication path.
    os.rename(staging, destination)
    return manifest
  finally:
    if staging.exists():
      shutil.rmtree(staging)


def main() -> int:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("source", type=Path, help="Uncompressed raw disk or ISO")
  parser.add_argument("destination", type=Path, help="New output directory")
  parser.add_argument("--expected-sha256", required=True, type=sha256_argument)
  parser.add_argument("--expected-size", type=int, help="Optional expected logical size in bytes")
  parser.add_argument("--level", type=int, default=10, help="Zstandard level, 1–22 (default: 10)")
  args = parser.parse_args()
  try:
    manifest = package_media(args.source, args.destination, args.expected_sha256, args.expected_size, args.level)
  except (OSError, ValueError, zstandard.ZstdError) as error:
    print(f"Packaging failed: {error}", file=sys.stderr)
    return 1
  print(json.dumps({
    "output": str(args.destination.absolute()),
    "sha256": manifest["sha256"],
    "logical_size": manifest["logical_size"],
    "chunk_count": manifest["chunk_count"],
    "compressed_size": manifest["compressed_size"],
  }, indent=2))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
