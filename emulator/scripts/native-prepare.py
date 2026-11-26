#!/usr/bin/env python3
"""Create the VBMouse guest overlay from the pinned original CAVA checkpoint.

Only a disposable copy is modified. The original base, CD, snapshot, and CAVA
executable stay untouched. Requires requirements-native.txt.
"""
import argparse
import hashlib
import json
import mmap
from pathlib import Path
import re
import shutil
import struct
import tempfile
import zipfile

from pyfatfs.PyFatFS import PyFatFS
import zstandard

BASE_SHA = "a3325b93873934873a8f39501b9087b6d8e8d73eee8d97b69f1a41eeddea4f91"
STATE_SHA = "3ca79c73f61ebd9b2d9dc302619feba19c917aeae0b6b3fcd8db5174756ef800"
ZIP_SHA = "824d74731d719ff4c8ca7914f6f93e554812fca3a9ef8c44317c1da728184d27"
CAVA_SHA = "528b570b428b488ab6ee1348d877f86b320e02178f64c3133e7ca64ab3984680"
DRIVERS = {
    "VBMOUSE.EXE": "eb34c5fc0a215d310bd486cfd63dd747df63481db0bbb18635b57e67585b8c91",
    "VBMOUSE.DRV": "6d55493289a71fc99e99f8f8cce9232b74bdeac9ac85abc4724a2381900f7c72",
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify(path, expected):
    with path.open("rb") as source:
        actual = hashlib.file_digest(source, "sha256").hexdigest()
    if actual != expected:
        raise ValueError(f"Unexpected input SHA-256: {path}: {actual}")


def install_ini(text):
    section = ""
    changed = {"boot": 0, "386enh": 0}
    lines = []
    for line in text.splitlines():
        if re.fullmatch(r"\s*\[[^]]+\]\s*", line):
            section = line.strip()[1:-1].lower()
        if section == "boot" and re.match(r"(?i)^\s*mouse\.drv\s*=", line):
            line = "mouse.drv=vbmouse.drv"
            changed[section] += 1
        elif section == "386enh" and re.match(r"(?i)^\s*mouse\s*=", line):
            # OEMSETUP.INF's x:*vmd is required for the legacy .DRV path.
            # Keeping *vmouse, msmouse.vxd prevents this Windows 98 from booting.
            line = "mouse=*vmd"
            changed[section] += 1
        lines.append(line)
    if changed != {"boot": 1, "386enh": 1}:
        raise ValueError(f"Unexpected mouse configuration: {changed}")
    return "\r\n".join(lines) + "\r\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--state", type=Path, required=True)
    parser.add_argument("--drivers", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    disk = args.output / "working.img"
    if disk.exists():
        raise FileExistsError(f"Refusing to overwrite working disk: {disk}")
    for path, expected in [(args.base, BASE_SHA), (args.state, STATE_SHA), (args.drivers, ZIP_SHA)]:
        verify(path, expected)
    with zipfile.ZipFile(args.drivers) as archive:
        drivers = {name: archive.read(name) for name in DRIVERS}
    for name, content in drivers.items():
        if sha(content) != DRIVERS[name]:
            raise ValueError(f"Unexpected driver: {name}")

    shutil.copyfile(args.base, disk)
    with tempfile.TemporaryFile() as raw_file:
        with args.state.open("rb") as source, zstandard.ZstdDecompressor().stream_reader(source) as reader:
            shutil.copyfileobj(reader, raw_file)
        raw_file.flush()
        with mmap.mmap(raw_file.fileno(), 0, access=mmap.ACCESS_READ) as raw:
            magic, version, size, json_size = struct.unpack_from("<IIII", raw)
            if (magic, version, size) != (0x86768676, 6, len(raw)):
                raise ValueError("Unsupported v86 snapshot format")
            info = json.loads(raw[16:16 + json_size])
            buffer_start = (16 + json_size + 3) & ~3
            devices = [device for channel in info["state"][85] if channel
                       for device in channel[:2] if device and not device[13] and device[28]]
            if len(devices) != 1:
                raise ValueError("Expected exactly one hard disk")
            entries = devices[0][28][0]
            with disk.open("r+b") as target:
                for index, ref in entries:
                    buf = info["buffer_infos"][ref["buffer_id"]]
                    if buf["length"] != 256:
                        raise ValueError("Unexpected overlay block length")
                    offset = buffer_start + buf["offset"]
                    target.seek(index * 256)
                    target.write(raw[offset:offset + 256])

    with disk.open("rb") as source:
        mbr = source.read(512)
    partitions = [mbr[446 + i * 16:462 + i * 16] for i in range(4)]
    partitions = [part for part in partitions if part[4] in (4, 6, 14)]
    if len(partitions) != 1:
        raise ValueError("Expected one FAT16 partition")
    partition_offset = struct.unpack_from("<I", partitions[0], 8)[0] * 512
    with PyFatFS(str(disk), offset=partition_offset, preserve_case=False) as guest:
        before = {name: sha(guest.readbytes(name)) for name in guest.walk.files("/CAVA")}
        if len(before) != 1028 or before.get("/CAVA/CAVA.EXE") != CAVA_SHA:
            raise ValueError("Unexpected original CAVA installation")
        guest.makedir("/VBADOS", recreate=True)
        guest.writebytes("/VBADOS/VBMOUSE.EXE", drivers["VBMOUSE.EXE"])
        guest.writebytes("/WINDOWS/SYSTEM/VBMOUSE.DRV", drivers["VBMOUSE.DRV"])
        ini = guest.readbytes("/WINDOWS/SYSTEM.INI").decode("cp1252")
        new_ini = install_ini(ini).encode("cp1252")
        guest.writebytes("/WINDOWS/SYSTEM.INI", new_ini)
        autoexec = guest.readbytes("/AUTOEXEC.BAT").decode("cp1252")
        if "vbmouse" in autoexec.lower():
            raise ValueError("The pinned baseline unexpectedly has a mouse driver")
        new_autoexec = (autoexec.rstrip() + "\r\n" if autoexec.strip() else "") + "C:\\VBADOS\\VBMOUSE.EXE\r\n"
        guest.writebytes("/AUTOEXEC.BAT", new_autoexec.encode("cp1252"))
    with PyFatFS(str(disk), offset=partition_offset, read_only=True) as guest:
        after = {name: sha(guest.readbytes(name)) for name in guest.walk.files("/CAVA")}
        if after != before:
            raise ValueError("CAVA files changed during driver installation")
        for name, content in [("/VBADOS/VBMOUSE.EXE", drivers["VBMOUSE.EXE"]),
                              ("/WINDOWS/SYSTEM/VBMOUSE.DRV", drivers["VBMOUSE.DRV"]),
                              ("/WINDOWS/SYSTEM.INI", new_ini),
                              ("/AUTOEXEC.BAT", new_autoexec.encode("cp1252"))]:
            if guest.readbytes(name) != content:
                raise ValueError(f"Driver configuration did not persist: {name}")

    overlay = args.output / "base-overlay.bin"
    count = 0
    with args.base.open("rb") as base_file, disk.open("rb") as disk_file, overlay.open("xb") as target:
        target.write(b"V86OVL1\0" + struct.pack("<I", 0))
        with mmap.mmap(base_file.fileno(), 0, access=mmap.ACCESS_READ) as base, \
                mmap.mmap(disk_file.fileno(), 0, access=mmap.ACCESS_READ) as changed:
            if len(base) != len(changed) or len(base) != 314572800:
                raise ValueError("Disk size changed")
            for offset in range(0, len(base), 256):
                data = changed[offset:offset + 256]
                if data != base[offset:offset + 256]:
                    target.write(struct.pack("<I", offset // 256) + data)
                    count += 1
        target.seek(8)
        target.write(struct.pack("<I", count))
    report = {"baseSha256": BASE_SHA, "originalStateSha256": STATE_SHA,
              "driverZipSha256": ZIP_SHA, "driverSha256": DRIVERS,
              "cavaFilesUnchanged": len(after), "cavaExeSha256": CAVA_SHA,
              "overlayBlocks": count, "overlaySha256": sha(overlay.read_bytes()),
              "configuration": {"AUTOEXEC.BAT": new_autoexec,
                                "SYSTEM.INI[boot]": "mouse.drv=vbmouse.drv",
                                "SYSTEM.INI[386Enh]": "mouse=*vmd"}}
    (args.output / "prepare-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
