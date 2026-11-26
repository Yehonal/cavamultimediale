#!/usr/bin/env python3
"""Serve the packaged release for isolated browser QA, without changing its files.

The archive manifest and compressed checkpoint are served verbatim from --dist.
Disk chunks are generated read-only from the original backing images. The only
test seam is an observer appended to the HTTP response for app.js; it records
state and input delivery, never supplies guest input or changes application code.
"""
import argparse
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

import zstandard


OBSERVABILITY = r"""
// Test-only observation; this suffix is never written to the release artifact.
const qa = globalThis.__cavaQA = {
  machines: [], events: [], clicks: [], samples: [], pcm: {frames: 0, peak: 0}
};
const qaObserved = new WeakSet();
setInterval(() => {
  if (!emulator || qaObserved.has(emulator)) return;
  qaObserved.add(emulator);
  const machine = emulator, id = qa.machines.length + 1;
  qa.machines.push(machine);
  const record = (name, data) => qa.events.push({name, id, data, time: performance.now()});
  for (const name of ['emulator-loaded', 'emulator-started', 'emulator-stopped', 'vmware-absolute-mouse']) {
    machine.add_listener(name, data => record(name, data));
  }
  machine.add_listener('dac-send-data', data => {
    qa.pcm.frames += data[0].length;
    for (const value of data[0]) qa.pcm.peak = Math.max(qa.pcm.peak, Math.abs(value));
  });
  const send = machine.bus.send.bind(machine.bus);
  machine.bus.send = (name, data) => {
    const vmware = machine.v86?.cpu?.devices.vmware;
    if (name === 'mouse-click') qa.clicks.push({
      id, data, time: performance.now(), absolute: [vmware?.last_x, vmware?.last_y]
    });
    if (name === 'mouse-absolute') {
      qa.samples.push({id, data, time: performance.now()});
      if (qa.samples.length > 30) qa.samples.shift();
    }
    return send(name, data);
  };
  const run = machine.run.bind(machine);
  machine.run = () => {
    record('run-request', {audio: machine.speaker_adapter?.audio_context?.state});
    return run();
  };
}, 5);
qa.snapshot = () => ({
  ready, busy, mode, archiveStartPending,
  machines: qa.machines.length,
  running: emulator?.is_running(), absolute: emulator?.absolute_pointer_enabled,
  instructions: emulator?.v86?.cpu ? emulator.get_instruction_counter() : null,
  audio: emulator?.speaker_adapter?.audio_context?.state,
  sampleRate: emulator?.v86?.cpu?.devices.sb16?.sampling_rate,
  mouse: emulator?.v86?.cpu?.devices.vmware ? {
    absolute: emulator.v86.cpu.devices.vmware.absolute,
    x: emulator.v86.cpu.devices.vmware.last_x, y: emulator.v86.cpu.devices.vmware.last_y
  } : null,
  clicks: qa.clicks, samples: qa.samples, events: qa.events, pcm: qa.pcm,
  rect: screen.getBoundingClientRect().toJSON(),
  activeElement: document.activeElement?.id,
  error: errorMessage.hidden ? null : errorMessage.textContent
});
"""

REFERENCES = {
    "abbey-it": "SETUP/DATI/GRAFICA/BADI/IBADIA.JPG",
    "abbey-en": "SETUP/DATI/GRAFICA/BADI/EBADIA.JPG",
    "ambo": "SETUP/DATI/GRAFICA/BADI/BA2.JPG",
    "commerce-it": "SETUP/DATI/GRAFICA/ARTI/IIMGMAIN.JPG",
    "commerce-en": "SETUP/DATI/GRAFICA/ARTI/EIMGMAIN.JPG",
    "ceramics": "SETUP/DATI/GRAFICA/ARTI/ART0.JPG",
}


def iso_file(source, name):
    """Read one known artwork asset from the ISO 9660 primary directory."""
    def record(data):
        return {
            "block": int.from_bytes(data[2:6], "little"),
            "size": int.from_bytes(data[10:14], "little"),
            "directory": bool(data[25] & 2),
            "name": data[33:33 + data[32]].decode("ascii").split(";")[0],
        }

    with source.open("rb") as stream:
        stream.seek(16 * 2048)
        pvd = stream.read(2048)
        if pvd[1:6] != b"CD001":
            raise ValueError("The CD image is not ISO 9660")
        current = record(pvd[156:156 + pvd[156]])
        for component in name.split("/"):
            if not current["directory"]:
                raise FileNotFoundError(name)
            stream.seek(current["block"] * 2048)
            data = stream.read(current["size"])
            entries, offset = {}, 0
            while offset < len(data):
                length = data[offset]
                if length == 0:
                    offset = (offset // 2048 + 1) * 2048
                    continue
                item = record(data[offset:offset + length])
                entries[item["name"]] = item
                offset += length
            current = entries[component]
        if current["directory"]:
            raise ValueError("Expected a CD file")
        stream.seek(current["block"] * 2048)
        return stream.read(current["size"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ["dist", "base", "cd"]:
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--state", type=Path, help="Optional identity check against the packaged checkpoint")
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args()
    root = args.dist.resolve()

    def local_file(relative):
        url = urlsplit(relative)
        if url.scheme or url.netloc or url.query or url.fragment or url.path.startswith("/"):
            raise ValueError("Expected a relative release asset: " + relative)
        result = (root / unquote(url.path)).resolve()
        if not result.is_relative_to(root):
            raise ValueError("Release asset escapes dist")
        return result

    archive = json.loads((root / "archive.json").read_text())
    release = json.loads((root / "release.json").read_text())
    state = local_file(archive["initialState"]["url"])
    state_digest = hashlib.sha256(state.read_bytes()).hexdigest()
    if (release["state"] != archive["initialState"]["url"]
            or release["sha256"] != state_digest or release["size"] != state.stat().st_size):
        raise ValueError("release.json, archive.json and the packaged state do not agree")
    if args.state and hashlib.sha256(args.state.read_bytes()).hexdigest() != state_digest:
        raise ValueError("--state differs from the checkpoint actually served by dist")

    disks = []
    for kind, source in [("hda", args.base), ("cdrom", args.cd)]:
        item = archive[kind]
        virtual = local_file(item["url"])
        if not item["url"].endswith("/.img.zst") or source.stat().st_size != item["size"]:
            raise ValueError("Unexpected disk chunk format or backing-image size: " + kind)
        disks.append((virtual.parent.relative_to(root).as_posix() + "/", source, item["chunkSize"]))

    references = {name: iso_file(args.cd, original) for name, original in REFERENCES.items()}
    cache = {}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_HEAD(self):
            self.respond(False)

        def do_GET(self):
            self.respond(True)

        def respond(self, body):
            try:
                requested = unquote(urlsplit(self.path).path)
                if requested == "/favicon.ico":
                    self.send_response(204)
                    self.end_headers()
                    return
                if not requested.startswith("/emulator/"):
                    raise FileNotFoundError(requested)
                relative = requested[len("/emulator/"):]
                mime, file, data = "application/octet-stream", None, None
                if relative.startswith("__qa/reference/"):
                    data = references[relative.removeprefix("__qa/reference/")]
                    mime = "image/jpeg"
                else:
                    for prefix, source, size in disks:
                        if not relative.startswith(prefix):
                            continue
                        match = re.fullmatch(r"(\d+)-(\d+)\.img\.zst", relative[len(prefix):])
                        if not match:
                            continue
                        start, end = map(int, match.groups())
                        if start % size or end - start != size or start >= source.stat().st_size:
                            raise ValueError("Invalid disk chunk")
                        key = (prefix, start)
                        if key not in cache:
                            with source.open("rb") as stream:
                                stream.seek(start)
                                chunk = stream.read(size)
                            cache[key] = zstandard.ZstdCompressor(level=1).compress(chunk.ljust(size, b"\0"))
                        data = cache[key]
                        break
                    if data is None:
                        file = local_file(relative or "index.html")
                        if not file.is_file():
                            raise FileNotFoundError(relative)
                        mime = mimetypes.guess_type(str(file))[0] or mime
                        if file == root / "app.js":
                            data = file.read_bytes() + OBSERVABILITY.encode()
                            file = None
                length = file.stat().st_size if file else len(data)
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(length))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                if body:
                    if file:
                        with file.open("rb") as stream:
                            while block := stream.read(1024 * 1024):
                                self.wfile.write(block)
                    else:
                        self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                pass
            except Exception as error:
                print("HTTP_ERROR", self.path, repr(error), file=sys.stderr, flush=True)
                self.send_error(404, str(error))

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(json.dumps({
        "url": f"http://127.0.0.1:{server.server_port}/emulator/", "pid": os.getpid(),
        "state": str(state), "stateSha256": state_digest, "archive": archive, "release": release,
        "appSha256": hashlib.sha256((root / "app.js").read_bytes()).hexdigest(),
        "references": {name: {"source": REFERENCES[name], "sha256": hashlib.sha256(data).hexdigest()}
                       for name, data in references.items()},
    }), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
