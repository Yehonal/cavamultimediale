#!/usr/bin/env python3
"""Package a verified original-CD checkpoint alongside the built host page."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import zstandard


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--prepare-report", type=Path, required=True)
    parser.add_argument("--dist", type=Path, required=True)
    args = parser.parse_args()
    emulator = Path(__file__).resolve().parent.parent
    report = json.loads((args.output / "verification.json").read_text())
    prepared = json.loads(args.prepare_report.read_text())
    raw = (args.output / "cava-ready.bin").read_bytes()
    if hashlib.sha256(raw).hexdigest() != report["stateSha256"] or len(raw) != report["stateBytes"]:
        raise ValueError("Checkpoint differs from the freshly verified state")
    if not all(report.get(key) is True for key in ["freshProcessRestore", "firstFrameIdentical", "absoluteMouse"]):
        raise ValueError("Native verification is incomplete")
    if report["sampleRate"] != 11025 or report["introElapsedMs"] < 45000 or prepared["cavaFilesUnchanged"] != 1028:
        raise ValueError("Original intro or unmodified application was not verified")
    payload = zstandard.ZstdCompressor(level=3).compress(raw)
    digest = hashlib.sha256(payload).hexdigest()
    relative = Path("media/states") / ("cava-intro-" + digest[:12])
    target = args.dist / relative
    target.mkdir(parents=True, exist_ok=True)
    (target / "cava-ready.bin.zst").write_bytes(payload)
    report["compressedState"] = {"size": len(payload), "sha256": digest}
    report["cavaFilesUnchanged"] = prepared["cavaFilesUnchanged"]
    (target / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    original = emulator / "runtime-state/cava-ready-3ca79c73"
    source = json.loads((original / "WINDOWS-SOURCE.json").read_text())
    source["state"].update({"size": len(payload), "sha256": digest,
        "start": "First original intro frame; user gesture starts audio and CPU"})
    source["overlay"] = "Original CAVA, VMDisp9x and VBMouse are embedded in the checkpoint; backing disk unchanged."
    (target / "WINDOWS-SOURCE.json").write_text(json.dumps(source, indent=2) + "\n")
    for name in ["VMDISP9X-LICENSE.txt", "VMDISP9X-PROVENANCE.json"]:
        shutil.copyfile(original / name, target / name)
    third_party = emulator / "third-party"
    shutil.copyfile(third_party / "VBADOS-PROVENANCE.json", target / "VBADOS-PROVENANCE.json")
    for directory in ["sources", "drivers"]:
        shutil.copytree(third_party / directory, target / directory, dirs_exist_ok=True)
    (target / "licenses").mkdir(exist_ok=True)
    shutil.copyfile(third_party / "licenses/LICENSE-VBADOS-GPL-2.0.txt", target / "licenses/LICENSE-VBADOS-GPL-2.0.txt")
    evidence = target / "evidence"
    evidence.mkdir(exist_ok=True)
    for name in ["first-frame", "restored-first-frame", "home-after-intro", "abbey", "abbey-detail", "commerce", "ceramics"]:
        shutil.copyfile(args.output / (name + ".png"), evidence / (name + ".png"))
    archive = json.loads((emulator / "archive.json").read_text())
    archive["id"] = "cava-intro-" + digest[:12]
    archive["initialState"] = {"url": (relative / "cava-ready.bin.zst").as_posix()}
    (args.dist / "archive.json").write_text(json.dumps(archive, indent=2) + "\n")
    result = {"archiveId": archive["id"], "state": archive["initialState"]["url"],
              "size": len(payload), "sha256": digest,
              "verification": (relative / "verification.json").as_posix()}
    (args.dist / "release.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
