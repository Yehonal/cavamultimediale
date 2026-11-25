#!/usr/bin/env python3
"""Reassemble and verify the original v86 snapshot before publication."""

import argparse
import hashlib
import json
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    if manifest.get("schema") != 1 or not manifest.get("parts"):
        raise ValueError("Invalid state manifest")
    if args.output.exists():
        raise FileExistsError(args.output)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_name(args.output.name + ".partial")
    complete_hash = hashlib.sha256()
    total = 0
    try:
        with temporary.open("xb") as target:
            for part in manifest["parts"]:
                name = part["file"]
                if Path(name).name != name or not name.startswith("part-"):
                    raise ValueError(f"Invalid part path: {name}")
                data = (args.manifest.parent / name).read_bytes()
                if len(data) != part["size"] or hashlib.sha256(data).hexdigest() != part["sha256"]:
                    raise ValueError(f"State part checksum mismatch: {name}")
                target.write(data)
                complete_hash.update(data)
                total += len(data)
        if total != manifest["size"] or complete_hash.hexdigest() != manifest["sha256"]:
            raise ValueError("Complete state checksum mismatch")
        os.replace(temporary, args.output)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Verified state: {total} bytes, SHA-256 {complete_hash.hexdigest()}")


if __name__ == "__main__":
    main()
