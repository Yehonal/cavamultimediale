#!/usr/bin/env node
// Build and verify the original CAVA checkpoint without altering CAVA.EXE.
// All disks are copy-on-write; save states always use the original base disk.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const { values: args } = parseArgs({ options: Object.fromEntries([
  "runtime", "base", "cd", "reference-state", "overlay", "output", "verify-state",
].map(name => [name, { type: "string" }])) });
for (const name of ["runtime", "base", "cd", "output"]) {
  if (!args[name]) throw Error(`Missing --${name}`);
  args[name] = path.resolve(args[name]);
}
fs.mkdirSync(args.output, { recursive: true });
globalThis.ImageData = class {
  constructor(data, width, height) { Object.assign(this, { data, width, height }); }
};
const { V86 } = await import(pathToFileURL(path.join(args.runtime, "libv86.mjs")));
const hash = data => createHash("sha256").update(data).digest("hex");
const bytes = filename => {
  const buffer = fs.readFileSync(filename);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(label, predicate, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await delay(200);
  }
  throw Error(`Timed out: ${label}`);
}

// Tiny PNG writer using Node built-ins, avoiding a screenshot dependency.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function chunk(name, data) {
  const type = Buffer.from(name);
  let crc = 0xffffffff;
  for (const value of Buffer.concat([type, data])) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8);
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0); type.copy(out, 4); data.copy(out, 8);
  out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
  return out;
}
function frame(machine) {
  const vga = machine.v86.cpu.devices.vga;
  vga.cpu.svga_mark_dirty(); vga.screen_fill_buffer();
  const { screen_width: width, screen_height: height, image_data: source } = vga;
  if (!source) throw Error("No graphical frame available");
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    data.set(source.data.subarray(y * source.width * 4, (y * source.width + width) * 4), y * width * 4);
  }
  return { width, height, data };
}
function screenshot(machine, name) {
  const image = frame(machine);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0); header.writeUInt32BE(image.height, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y++) image.data.copy(rows, y * (image.width * 4 + 1) + 1, y * image.width * 4, (y + 1) * image.width * 4);
  fs.writeFileSync(path.join(args.output, `${name}.png`), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0)),
  ]));
  return hash(image.data);
}
function coreHash(machine) {
  const image = frame(machine);
  assert.equal(image.width, 640); assert.equal(image.height, 480);
  const rows = [];
  // Static buildings, excluding animated sky, hover titles, icons and scroller.
  for (let y = 200; y < 330; y++) rows.push(image.data.subarray(y * 640 * 4, (y * 640 + 590) * 4));
  return hash(Buffer.concat(rows));
}

function audioClock(machine) {
  const state = { enabled: false, rate: 22050, frames: 0, peak: 0, timer: null, captureHold: false };
  const pump = () => {
    const capturingIntro = state.captureHold && machine.v86.cpu.devices.sb16.sampling_rate === 11025;
    if (state.enabled && machine.is_running() && !capturingIntro) machine.bus.send("dac-request-data");
  };
  machine.add_listener("dac-enable", () => { state.enabled = true; pump(); });
  machine.add_listener("dac-disable", () => { state.enabled = false; clearTimeout(state.timer); });
  machine.add_listener("dac-tell-sampling-rate", rate => { state.rate = rate; });
  machine.add_listener("dac-send-data", data => {
    state.frames += data[0].length;
    for (const value of data[0]) state.peak = Math.max(state.peak, Math.abs(value));
    clearTimeout(state.timer);
    state.timer = setTimeout(pump, Math.max(1, 1000 * data[0].length / state.rate));
  });
  machine.add_listener("emulator-loaded", () => {
    state.rate = machine.v86.cpu.devices.sb16.sampling_rate || 22050;
    state.enabled = true;
    pump();
  });
  machine.add_listener("emulator-stopped", () => clearTimeout(state.timer));
  // V86 installs its own running-state listener asynchronously during init;
  // wait until all listeners have observed start before testing is_running().
  machine.add_listener("emulator-started", () => queueMicrotask(pump));
  return state;
}
async function create(statePath) {
  const machine = new V86({
    wasm_path: path.join(args.runtime, "v86.wasm"),
    bios: { buffer: bytes(path.join(args.runtime, "seabios.bin")) },
    vga_bios: { buffer: bytes(path.join(args.runtime, "vgabios.bin")) },
    memory_size: 134217728, vga_memory_size: 8388608,
    hda: { url: args.base, size: 314572800, async: true, fixed_chunk_size: 262144 },
    cdrom: { url: args.cd, size: 645816320, async: true },
    ...(statePath ? { initial_state: { url: path.resolve(statePath) } } : {}),
    autostart: false, disable_speaker: true, disable_keyboard: true, disable_mouse: true,
  });
  const audio = audioClock(machine);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Runtime initialization timed out")), 45_000);
    machine.add_listener("emulator-loaded", () => { clearTimeout(timer); resolve(); });
  });
  const timer = setInterval(() => machine.v86.cpu.devices.vga.screen_fill_buffer(), 16);
  return { machine, audio, async close() {
    clearInterval(timer); clearTimeout(audio.timer);
    await machine.stop(); await machine.destroy(); machine.zstd_worker?.terminate();
  } };
}
async function absolute(machine, x, y, click = false) {
  assert.equal(machine.absolute_pointer_enabled, true, "Guest absolute mouse must be active");
  machine.bus.send("mouse-absolute", [x, y, 640, 480]);
  machine.bus.send("mouse-delta", [1, 0]);
  await delay(120);
  if (click) {
    machine.bus.send("mouse-click", [true, false, false]); await delay(150);
    machine.bus.send("mouse-click", [false, false, false]); await delay(150);
  }
}
async function type(machine, text) {
  const keys = {};
  for (const [characters, codes] of [
    ["qwertyuiop", [16,17,18,19,20,21,22,23,24,25]],
    ["asdfghjkl", [30,31,32,33,34,35,36,37,38]],
    ["zxcvbnm", [44,45,46,47,48,49,50]],
  ]) [...characters].forEach((letter, i) => { keys[letter] = codes[i]; });
  Object.assign(keys, { ":": 39, "\\": 43, ".": 52 });
  for (const letter of text.toLowerCase()) {
    const code = keys[letter]; if (!code) throw Error(`Unsupported key: ${letter}`);
    await machine.keyboard_send_scancodes(letter === ":" ? [42, code, code | 128, 170] : [code, code | 128], 25);
  }
}

async function verify() {
  const expected = JSON.parse(fs.readFileSync(path.join(args.output, "build-report.json"), "utf8"));
  const session = await create(args["verify-state"]);
  const { machine: e, audio } = session;
  try {
    assert.equal(screenshot(e, "restored-first-frame"), expected.firstFrameSha256, "Fresh restore preserves first intro frame");
    assert.equal(e.absolute_pointer_enabled, true);
    assert.equal(e.v86.cpu.devices.sb16.sampling_rate, 11025);
    const started = Date.now(), before = e.get_instruction_counter();
    await e.run();
    await until("headless audio clock starts", () => audio.frames > 0, 10_000);
    console.log("NATIVE_AUDIO_STARTED", audio.frames);
    await until("original intro reaches home", () => coreHash(e) === expected.homeCoreSha256, 100_000);
    const introElapsedMs = Date.now() - started;
    assert.ok(introElapsedMs >= 45_000, "Intro was not skipped");
    assert.ok(audio.frames > 450_000 && audio.peak > 0.01, "Original PCM played");
    assert.notEqual(e.get_instruction_counter(), before);
    screenshot(e, "home-after-intro");
    console.log("NATIVE_INTRO_VERIFIED", JSON.stringify({ introElapsedMs, audioFrames: audio.frames, peak: audio.peak }));
    const navigate = async (x, y, name, previousHash) => {
      await absolute(e, x, y, true);
      // Cursor pixels must not satisfy the content-change assertion by themselves.
      await absolute(e, 639, 479);
      await until(name, () => coreHash(e) !== previousHash, 20_000);
      await delay(1500);
      screenshot(e, name);
      return coreHash(e);
    };
    const backHome = async () => {
      await e.keyboard_send_scancodes([1, 129]);
      await until("return to home", () => coreHash(e) === expected.homeCoreSha256, 20_000);
    };
    const abbey = await navigate(370, 400, "abbey", expected.homeCoreSha256);
    await navigate(80, 230, "abbey-detail", abbey);
    await e.keyboard_send_scancodes([1, 129]);
    await until("close abbey detail", () => [abbey, expected.homeCoreSha256].includes(coreHash(e)), 20_000);
    if (coreHash(e) !== expected.homeCoreSha256) await backHome();
    const commerce = await navigate(570, 400, "commerce", expected.homeCoreSha256);
    await navigate(180, 100, "ceramics", commerce);
    await e.stop();
    const report = {
      ...expected, verifiedAt: new Date().toISOString(), freshProcessRestore: true,
      firstFrameIdentical: true, absoluteMouse: true, sampleRate: 11025,
      introElapsedMs, audioFrames: audio.frames, audioPeak: audio.peak,
      navigation: ["Abbazia Benedettina", "Abbey detail", "Commercio & Artigianato", "Ceramiche"],
      stateBytes: fs.statSync(args["verify-state"]).size,
      stateSha256: hash(fs.readFileSync(args["verify-state"])),
    };
    fs.writeFileSync(path.join(args.output, "verification.json"), JSON.stringify(report, null, 2) + "\n");
    console.log("NATIVE_VERIFICATION_OK", JSON.stringify(report));
  } catch (error) {
    try { screenshot(e, "verification-failure"); } catch {}
    throw error;
  } finally { await session.close(); }
}

async function build() {
  for (const name of ["reference-state", "overlay"]) if (!args[name]) throw Error(`Missing --${name}`);
  const reference = await create(args["reference-state"]);
  let homeCoreSha256;
  try {
    await reference.machine.run();
    reference.machine.bus.send("mouse-delta", [500, -500]);
    await delay(800);
    homeCoreSha256 = coreHash(reference.machine);
    screenshot(reference.machine, "reference-home");
  } finally { await reference.close(); }
  const session = await create();
  const { machine: e } = session;
  const stateFile = path.join(args.output, "cava-ready.bin");
  try {
    const overlay = fs.readFileSync(args.overlay);
    const prepared = JSON.parse(fs.readFileSync(path.join(path.dirname(args.overlay), "prepare-report.json"), "utf8"));
    assert.equal(hash(overlay), prepared.overlaySha256, "Prepared overlay hash must match");
    assert.equal(prepared.cavaFilesUnchanged, 1028);
    assert.equal(prepared.cavaExeSha256, "528b570b428b488ab6ee1348d877f86b320e02178f64c3133e7ca64ab3984680");
    assert.equal(overlay.subarray(0, 8).toString(), "V86OVL1\0");
    const count = overlay.readUInt32LE(8);
    assert.equal(overlay.length, 12 + count * 260);
    const entries = Array.from({ length: count }, (_, i) => [
      overlay.readUInt32LE(12 + i * 260), Uint8Array.from(overlay.subarray(16 + i * 260, 272 + i * 260)),
    ]);
    e.v86.cpu.devices.ide.primary.master.buffer.set_state([entries]);
    await e.run();
    let selectedNormalBoot = false;
    await until("Windows desktop after cold boot", async () => {
      // A checkpoint of a running Windows installation can retain the
      // interrupted-boot flag. Explicitly choose Normal if its recovery menu
      // appears; never capture the fallback Safe Mode desktop.
      const text = e.screen_adapter.get_text_screen();
      if (!selectedNormalBoot && /Windows 98 Startup Menu/i.test(text)
          && /Normal/i.test(text) && /Safe mode/i.test(text)) {
        selectedNormalBoot = true;
        console.log("NATIVE_SELECT_NORMAL_BOOT");
        await e.keyboard_send_scancodes([2, 130, 28, 156], 60);
      }
      const v = e.v86.cpu.devices.vga;
      if (!v.svga_enabled || v.screen_width !== 640 || v.screen_height !== 480 || v.svga_bpp !== 24) return false;
      const rgba = frame(e).data;
      const p = (200 * 640 + 300) * 4;
      const taskbar = (470 * 640 + 200) * 4;
      return rgba[p] === 0 && rgba[p + 1] === 128 && rgba[p + 2] === 128
        && rgba[taskbar] === 192 && rgba[taskbar + 1] === 192 && rgba[taskbar + 2] === 192;
    }, 150_000);
    await delay(3000);
    console.log("NATIVE_DESKTOP_READY");
    assert.equal(e.absolute_pointer_enabled, true);
    const points = [[320, 240], [100, 100], [520, 350]];
    for (let i = 0; i < points.length; i++) {
      await absolute(e, ...points[i]); screenshot(e, `pointer-${i + 1}`);
      assert.equal(e.v86.cpu.devices.vmware.queue.length, 0, "Guest consumes pointer packets");
    }
    await absolute(e, 28, 468, true); screenshot(e, "start-menu-click");
    await e.keyboard_send_scancodes([1, 129]); await delay(200);
    await absolute(e, 639, 479);
    await e.keyboard_send_scancodes([224, 91]); await delay(100);
    await e.keyboard_send_scancodes([19, 147]); await delay(100);
    await e.keyboard_send_scancodes([224, 219]); await delay(300);
    await type(e, "c:\\cava\\cava.exe");
    screenshot(e, "launch-dialog");
    // Stop the test audio consumer before its first intro DMA request. The
    // saved state must include the first PCM block as well as the first frame.
    session.audio.captureHold = true;
    const captured = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error("CAVA intro audio did not start")), 30_000);
      const capture = async () => {
        // Ignore a late Windows startup/UI sound at 22050 Hz.
        if (e.v86.cpu.devices.sb16.sampling_rate !== 11025) return;
        e.remove_listener("dac-enable", capture); clearTimeout(timeout);
        try {
          await e.stop();
          assert.equal(e.v86.cpu.devices.sb16.sampling_rate, 11025);
          const saved = await e.save_state(); fs.writeFileSync(stateFile, Buffer.from(saved));
          resolve(screenshot(e, "first-frame"));
        } catch (error) { reject(error); }
      };
      e.add_listener("dac-enable", capture);
    });
    await e.keyboard_send_scancodes([28, 156]);
    const firstFrameSha256 = await captured;
    const report = { createdAt: new Date().toISOString(), homeCoreSha256, firstFrameSha256,
      resolution: [640, 480, 24], absolutePoints: points, originalExecutableUnmodified: true,
      baseSha256: "a3325b93873934873a8f39501b9087b6d8e8d73eee8d97b69f1a41eeddea4f91",
      cdSha256: "f8cfdc7753c9d712750f13a2d4f60f6e6ff3796673b9342876d07f2dff284704",
      mouseConfiguration: { boot: "mouse.drv=vbmouse.drv", "386Enh": "mouse=*vmd" } };
    fs.writeFileSync(path.join(args.output, "build-report.json"), JSON.stringify(report, null, 2) + "\n");
    console.log("NATIVE_CHECKPOINT_READY", stateFile);
  } catch (error) {
    try { screenshot(e, "build-failure"); } catch {}
    throw error;
  } finally { await session.close(); }
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url),
      "--runtime", args.runtime, "--base", args.base, "--cd", args.cd,
      "--output", args.output, "--verify-state", stateFile], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(Error(`Fresh-process verification exited ${code}`)));
  });
}

if (args["verify-state"]) await verify();
else await build();
