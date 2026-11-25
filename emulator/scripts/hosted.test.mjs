import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseArchive } from "../dist/hosted.js";

const manifest = JSON.parse(await readFile(new URL("../archive.example.json", import.meta.url), "utf8"));
const base = "https://example.test/cavamultimediale/emulator/archive.json";

test("archive resolves both disks and the ready snapshot within the project path", () => {
  const archive = parseArchive(manifest, base);
  assert.equal(archive.cdrom.url, "https://example.test/cavamultimediale/emulator/media/cava-f8cfdc7753c9/.img.zst");
  assert.equal(archive.cdrom.size, 645816320);
  assert.equal(archive.cdrom.fixed_chunk_size, 262144);
  assert.equal(archive.cdrom.use_parts, true);
  assert.equal(archive.hda.async, true);
  assert.equal(archive.memorySize, 134217728);
  assert.ok(archive.initialState.url.endsWith("/cava-ready.bin.zst"));
});

test("incompatible snapshots fail before starting the virtual machine", () => {
  assert.throws(() => parseArchive({ ...manifest, emulatorVersion: "other" }, base), /versione diversa/);
  assert.throws(() => parseArchive({ ...manifest, memorySize: -1 }, base), /Dimensioni/);
});

test("archive assets cannot escape the published project", () => {
  for (const url of ["https://another.test/disk", "../../other-project/state.bin", "//another.test/state.bin"]) {
    assert.throws(() => parseArchive({ ...manifest, initialState: { url } }, base), /questa pubblicazione/);
  }
});
