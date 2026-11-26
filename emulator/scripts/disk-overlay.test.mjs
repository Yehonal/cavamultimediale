import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { V86 } from "../dist/vendor/libv86.mjs";

test("first partfile read merges restored dirty blocks with uncached backing data", { timeout: 30_000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "cava-overlay-"));
  const dist = new URL("../dist/", import.meta.url);
  const binary = async name => {
    const data = await readFile(new URL(name, dist));
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  };
  let machine;
  try {
    // Plain parts use the same read/overlay path as compressed hosted chunks.
    const backing = Buffer.alloc(1024, 0x11);
    await writeFile(path.join(directory, "0-1024.img"), backing);
    machine = new V86({
      wasm_path: fileURLToPath(new URL("vendor/v86.wasm", dist)),
      bios: { buffer: await binary("vendor/seabios.bin") },
      vga_bios: { buffer: await binary("vendor/vgabios.bin") },
      memory_size: 32 * 1024 * 1024, vga_memory_size: 1024 * 1024,
      hda: { url: path.join(directory, ".img"), size: 128 * 1024,
        async: true, use_parts: true, fixed_chunk_size: 1024 },
      autostart: false, disable_speaker: true, disable_keyboard: true, disable_mouse: true,
    });
    await new Promise(resolve => machine.add_listener("emulator-loaded", resolve));
    const disk = machine.v86.cpu.devices.ide.primary.master.buffer;
    const dirty = new Uint8Array(256).fill(0xa5);
    disk.set_state([[[0, dirty]]]);
    const read = () => new Promise(resolve => disk.get(0, 512, resolve));
    const first = await read();
    assert.deepEqual(first.subarray(0, 256), dirty, "First cache miss must return the restored overlay");
    assert.deepEqual(first.subarray(256), new Uint8Array(256).fill(0x11), "Unmodified data comes from the base");
    assert.deepEqual(await read(), first, "A cached read must agree with the first read");
    assert.deepEqual(await readFile(path.join(directory, "0-1024.img")), backing, "Backing image remains unchanged");
  } finally {
    if (machine) await machine.destroy();
    await rm(directory, { recursive: true, force: true });
  }
});
