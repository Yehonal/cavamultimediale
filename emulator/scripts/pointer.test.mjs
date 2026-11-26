import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { syncAbsolutePointer, handleAbsoluteTouchMove } from "../dist/pointer.js";

function fixture(rect = { left: 100, top: 60, width: 640, height: 480 }) {
  const events = [];
  const screen = { ownerDocument: { pointerLockElement: null }, getBoundingClientRect: () => rect };
  const machine = {
    absolute_pointer_enabled: true,
    is_running: () => true,
    mouse_adapter: { enabled: true, emu_enabled: true },
    bus: { send: (name, data) => events.push({ name, data }) },
  };
  return { machine, screen, events };
}
function touch(changedTouches) {
  return { changedTouches, cancelable: true, prevented: false, stopped: false,
    preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
}

test("normal screen maps the clicked position in CSS coordinates", () => {
  const { machine, screen, events } = fixture();
  assert.equal(syncAbsolutePointer(machine, screen, { clientX: 260, clientY: 180 }), true);
  assert.deepEqual(events, [{ name: "mouse-absolute", data: [160, 120, 640, 480] }, { name: "mouse-delta", data: [1, 0] }]);
});

test("half-size and enlarged screens preserve the same guest position", () => {
  for (const scale of [0.5, 1, 2]) {
    const { machine, screen, events } = fixture({ left: 100, top: 60, width: 640 * scale, height: 480 * scale });
    syncAbsolutePointer(machine, screen, { clientX: 100 + 160 * scale, clientY: 60 + 120 * scale });
    const [x, y, w, h] = events[0].data;
    assert.equal(x / w, 0.25); assert.equal(y / h, 0.25);
  }
});

test("fullscreen coordinates exclude wide and tall letterbox margins", () => {
  for (const rect of [{ left: 240, top: 0, width: 1440, height: 1080 }, { left: 0, top: 400, width: 960, height: 720 }]) {
    const { machine, screen, events } = fixture(rect);
    syncAbsolutePointer(machine, screen, { clientX: rect.left + rect.width * .75, clientY: rect.top + rect.height * .5 });
    const [x, y, w, h] = events[0].data;
    assert.equal(x / w, .75); assert.equal(y / h, .5);
  }
});

test("first click without hover notifies the guest before the native button event", () => {
  const { machine, screen, events } = fixture();
  syncAbsolutePointer(machine, screen, { clientX: 580, clientY: 420 });
  machine.bus.send("mouse-click", [true, false, false]);
  assert.deepEqual(events.map(event => event.name), ["mouse-absolute", "mouse-delta", "mouse-click"]);
  assert.notDeepEqual(events[1].data, [0, 0]);
});

test("corners and a touch outside the screen stay within the absolute range", () => {
  const { machine, screen, events } = fixture();
  syncAbsolutePointer(machine, screen, touch([{ clientX: -20, clientY: 900 }]));
  assert.deepEqual(events[0].data, [0, 480, 640, 480]);
});

test("relative guests receive no synthetic movement", () => {
  const { machine, screen, events } = fixture(); machine.absolute_pointer_enabled = false;
  assert.equal(syncAbsolutePointer(machine, screen, { clientX: 260, clientY: 180 }), false);
  assert.deepEqual(events, []);
});

test("paused, disabled, missing and pointer-locked machines receive no absolute injection", () => {
  for (const scenario of ["paused", "disabled", "guest-disabled", "missing-adapter", "locked", "missing"]) {
    const { machine, screen, events } = fixture();
    if (scenario === "paused") machine.is_running = () => false;
    if (scenario === "disabled") machine.mouse_adapter.emu_enabled = false;
    if (scenario === "guest-disabled") machine.mouse_adapter.enabled = false;
    if (scenario === "missing-adapter") delete machine.mouse_adapter;
    if (scenario === "locked") screen.ownerDocument.pointerLockElement = {};
    assert.equal(syncAbsolutePointer(scenario === "missing" ? undefined : machine, screen, { clientX: 260, clientY: 180 }), false);
    assert.deepEqual(events, []);
  }
});

test("invalid coordinates or a hidden screen never enqueue NaN or unmatched notification", () => {
  for (const value of [NaN, Infinity, undefined]) {
    const { machine, screen, events } = fixture();
    assert.equal(syncAbsolutePointer(machine, screen, { clientX: value, clientY: 180 }), false);
    assert.deepEqual(events, []);
  }
  for (const width of [0, -1, NaN, Infinity]) {
    const { machine, screen, events } = fixture({ left: 0, top: 0, width, height: 480 });
    assert.equal(syncAbsolutePointer(machine, screen, { clientX: 260, clientY: 180 }), false);
    assert.deepEqual(events, []);
  }
});

test("TouchEvent uses changedTouches and suppresses upstream malformed touchmove", () => {
  const { machine, screen, events } = fixture(); const event = touch([{ clientX: 260, clientY: 180 }]);
  assert.equal(handleAbsoluteTouchMove(machine, screen, event), true);
  assert.equal(event.stopped, true); assert.equal(event.prevented, true);
  assert.deepEqual(events[0], { name: "mouse-absolute", data: [160, 120, 640, 480] });
  assert.ok(events.every(entry => entry.data.every(Number.isFinite)));
});

test("empty and invalid TouchEvents cannot queue malformed packets", () => {
  for (const points of [[], [{ clientX: NaN, clientY: 180 }]]) {
    const { machine, screen, events } = fixture(); const event = touch(points);
    assert.equal(handleAbsoluteTouchMove(machine, screen, event), true);
    assert.equal(event.stopped, true); assert.deepEqual(events, []);
  }
});

test("touch fallback remains native until the guest enables absolute mode", () => {
  const { machine, screen, events } = fixture(); machine.absolute_pointer_enabled = false;
  const event = touch([{ clientX: 260, clientY: 180 }]);
  assert.equal(handleAbsoluteTouchMove(machine, screen, event), false);
  assert.equal(event.stopped, false); assert.equal(event.prevented, false); assert.deepEqual(events, []);
});

test("pinned v86 queues a PS/2 notification for absolute position before native clicks", { timeout: 30_000 }, async () => {
  const { V86 } = await import("../dist/vendor/libv86.mjs");
  const dist = new URL("../dist/", import.meta.url);
  async function binary(path) { const data = await readFile(new URL(path, dist)); return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); }
  const machine = new V86({
    wasm_path: fileURLToPath(new URL("vendor/v86.wasm", dist)),
    bios: { buffer: await binary("vendor/seabios.bin") }, vga_bios: { buffer: await binary("vendor/vgabios.bin") },
    memory_size: 32 * 1024 * 1024, vga_memory_size: 8 * 1024 * 1024,
    autostart: false, disable_speaker: true, disable_keyboard: true,
  });
  try {
    await new Promise(resolve => machine.add_listener("emulator-loaded", resolve));
    await machine.run();
    const { ps2, vmware } = machine.v86.cpu.devices;
    vmware.set_state([true, true]);
    ps2.use_mouse = true; ps2.enable_mouse_stream = true; ps2.command_register |= 2;
    machine.emulator_bus.send("mouse-enable", true);
    assert.equal(machine.absolute_pointer_enabled, true);
    const { screen } = fixture();
    assert.equal(syncAbsolutePointer(machine, screen, { clientX: 580, clientY: 420 }), true);
    machine.bus.send("mouse-click", [true, false, false]); machine.bus.send("mouse-click", [false, false, false]);
    assert.deepEqual(vmware.queue, [0, 49151, 49151, 0, 0x20, 49151, 49151, 0, 0, 49151, 49151, 0]);
    assert.equal(ps2.mouse_buffer.length, 9, "three PS/2 packets notify all three VMware packets");
  } finally { await machine.destroy(); }
});
