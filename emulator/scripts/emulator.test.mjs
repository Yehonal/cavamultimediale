import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { V86 } from "../dist/vendor/libv86.mjs";

const dist = new URL("../dist/", import.meta.url);
async function binary(path) {
  const data = await readFile(new URL(path, dist));
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

test("real x86 boot, pause, snapshot and restore", { timeout: 30_000 }, async () => {
  const machine = new V86({
    wasm_path: fileURLToPath(new URL("vendor/v86.wasm", dist)),
    bios: { buffer: await binary("vendor/seabios.bin") },
    vga_bios: { buffer: await binary("vendor/vgabios.bin") },
    fda: { buffer: await binary("demo-boot.img") },
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 8 * 1024 * 1024,
    autostart: true,
    disable_speaker: true,
    disable_keyboard: true,
    disable_mouse: true,
  });
  let output = "";
  let timer;
  try {
    await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`CPU boot timed out: ${output}`)), 20_000);
      machine.add_listener("serial0-output-byte", (byte) => {
        output += String.fromCharCode(byte);
        if (output.includes("V86_SMOKE_OK")) resolve();
      });
    });
    clearTimeout(timer);
    await machine.stop();
    assert.equal(machine.is_running(), false);
    const state = await machine.save_state();
    assert.ok(state.byteLength > 1024);
    await machine.restore_state(state);
    await machine.run();
    assert.equal(machine.is_running(), true);
    await machine.stop();
    assert.equal(machine.is_running(), false);
    assert.match(output, /V86_SMOKE_OK/);
  } finally {
    clearTimeout(timer);
    await machine.destroy();
  }
});
