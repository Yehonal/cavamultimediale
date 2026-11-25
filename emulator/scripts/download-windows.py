#!/usr/bin/env python3
"""Reconstruct and verify the original v86 Windows 98 demo backing disk."""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import time
from urllib.error import URLError
from urllib.request import Request, urlopen


SOURCE_BASE_URL = "https://i.copy.sh/windows98/"
EXPECTED_SIZE = 314_572_800
EXPECTED_SHA256 = "a3325b93873934873a8f39501b9087b6d8e8d73eee8d97b69f1a41eeddea4f91"
CHUNK_SIZE = 262_144
CHUNK_COUNT = EXPECTED_SIZE // CHUNK_SIZE
MAX_ATTEMPTS = 4


def verify_file(path: Path) -> None:
  actual_size = path.stat().st_size
  if actual_size != EXPECTED_SIZE:
    raise ValueError(f"Windows disk size mismatch: expected {EXPECTED_SIZE}, got {actual_size}")
  digest = hashlib.sha256()
  with path.open("rb") as disk:
    while block := disk.read(8 * 1024 * 1024):
      digest.update(block)
  if digest.hexdigest() != EXPECTED_SHA256:
    raise ValueError(f"Windows disk SHA-256 mismatch: {digest.hexdigest()}")


def fetch_part(index: int, cache_dir: Path | None = None) -> bytes:
  start = index * CHUNK_SIZE
  filename = f"{start}-{start + CHUNK_SIZE}.img"
  if cache_dir is not None:
    # Accept the official filenames and the earlier private harness cache names.
    for name in (filename, f"windows98_{filename}"):
      cached = cache_dir / name
      if cached.is_file():
        data = cached.read_bytes()
        if len(data) != CHUNK_SIZE:
          raise ValueError(f"Cached Windows part has an invalid size: {cached}")
        return data
  url = SOURCE_BASE_URL + filename
  for attempt in range(MAX_ATTEMPTS):
    try:
      request = Request(url, headers={"User-Agent": "Cava-Multimediale-Archive/1.0"})
      with urlopen(request, timeout=60) as response:
        if response.status != 200:
          raise ValueError(f"Unexpected HTTP status for {url}: {response.status}")
        data = response.read(CHUNK_SIZE + 1)
      if len(data) != CHUNK_SIZE:
        raise ValueError(f"Windows part size mismatch for {filename}: {len(data)}")
      return data
    except (OSError, URLError, ValueError) as error:
      if attempt + 1 == MAX_ATTEMPTS:
        raise OSError(f"Could not download {url} after {MAX_ATTEMPTS} attempts: {error}") from error
      time.sleep(2 ** attempt)
  raise AssertionError("Unreachable retry state")


def download_windows(destination: Path, workers: int = 8, cache_dir: Path | None = None) -> bool:
  if destination.exists():
    verify_file(destination)
    return False
  destination.parent.mkdir(parents=True, exist_ok=True)
  temporary_path: Path | None = None
  try:
    with tempfile.NamedTemporaryFile(prefix=f".{destination.name}-", suffix=".part", dir=destination.parent, delete=False) as output:
      temporary_path = Path(output.name)
      output.truncate(EXPECTED_SIZE)
      with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(fetch_part, index, cache_dir): index for index in range(CHUNK_COUNT)}
        try:
          for completed, future in enumerate(as_completed(futures), 1):
            index = futures[future]
            output.seek(index * CHUNK_SIZE)
            output.write(future.result())
            if completed % 100 == 0 or completed == CHUNK_COUNT:
              print(f"Windows parts: {completed}/{CHUNK_COUNT}", file=sys.stderr, flush=True)
        except BaseException:
          for future in futures:
            future.cancel()
          raise
      output.flush()
      os.fsync(output.fileno())
    verify_file(temporary_path)
    os.replace(temporary_path, destination)
    return True
  finally:
    if temporary_path is not None:
      temporary_path.unlink(missing_ok=True)


def main() -> int:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--output", type=Path, required=True, help="Destination for the verified Windows 98 base disk")
  parser.add_argument("--workers", type=int, default=8, help="Concurrent part downloads (1-16; default: 8)")
  parser.add_argument("--cache-dir", type=Path, help="Optional existing raw part cache; read only, verified by the final disk hash")
  args = parser.parse_args()
  if not 1 <= args.workers <= 16:
    parser.error("--workers must be between 1 and 16")
  if args.cache_dir is not None and not args.cache_dir.is_dir():
    parser.error("--cache-dir must be an existing directory")
  try:
    downloaded = download_windows(args.output, args.workers, args.cache_dir)
  except (OSError, URLError, ValueError) as error:
    print(f"Windows download failed: {error}", file=sys.stderr)
    return 1
  print(json.dumps({"output": str(args.output.absolute()), "downloaded": downloaded, "size": EXPECTED_SIZE, "sha256": EXPECTED_SHA256, "source_base_url": SOURCE_BASE_URL, "chunk_size": CHUNK_SIZE, "chunk_count": CHUNK_COUNT}, indent=2))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
