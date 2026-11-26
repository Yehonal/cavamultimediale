#!/usr/bin/env node
// Isolated, real-browser release gate. Never connects to a user's browser.
// Usage: CHROME_PATH=/usr/bin/google-chrome node scripts/browser-verify.mjs \
//   --base windows98-base.img --cd CAVA.iso --dist dist --output browser-evidence
// Optional --state must identify the same compressed state declared by dist.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { chromium } from "playwright";

const { values: args } = parseArgs({ options: Object.fromEntries(
  ["base", "cd", "state", "dist", "output"].map(name => [name, { type: "string" }]),
) });
for (const name of ["base", "cd", "dist", "output"]) {
  if (!args[name]) throw Error(`Missing --${name}`);
  args[name] = path.resolve(args[name]);
}
if (args.state) args.state = path.resolve(args.state);
fs.mkdirSync(args.output, { recursive: true });

// Static city pixels from the verified original home frame. This region omits
// the moving sky, hover captions, bottom scroller and the parked guest cursor.
const HOME_CORE = "9df321fd5cbf1f4b3087f773acec91aee3b06aac6d98ad5cbbbf903f51dd5452";
const started = Date.now();
const report = {
  schema: 1, startedAt: new Date(started).toISOString(), passed: false,
  browser: null, release: null, checks: [], evidence: [], errors: [], httpErrors: [],
  timeoutMs: 300_000, originalHomeCoreSha256: HOME_CORE,
};
let server, browser, page, cdp, serverLog = "", stage = "initializing";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function bounded(promise, milliseconds) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error("Cleanup operation timed out")), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
const state = () => page.evaluate(() => globalThis.__cavaQA.snapshot());
function check(name, details = {}) {
  report.checks.push({ name, elapsedMs: Date.now() - started, ...details });
  console.log("BROWSER_CHECK", name);
}
async function until(label, predicate, timeout = 15_000) {
  stage = label;
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) return result;
    const error = await page.evaluate(() => globalThis.__cavaQA?.snapshot().error);
    if (error) throw Error(`${label}: ${error}`);
    await delay(200);
  }
  throw Error(`Timed out: ${label}`);
}
async function frame(withPng = false) {
  return page.evaluate(async withPng => {
    const canvas = document.querySelector("#screen-container canvas");
    if (!canvas || canvas.width !== 640 || canvas.height !== 480) {
      return { width: canvas?.width, height: canvas?.height };
    }
    const pixels = canvas.getContext("2d").getImageData(0, 0, 640, 480).data;
    const core = new Uint8Array(590 * 130 * 4);
    for (let y = 200; y < 330; y++) {
      core.set(pixels.subarray(y * 640 * 4, (y * 640 + 590) * 4), (y - 200) * 590 * 4);
    }
    const sha = async data => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)))
      .map(value => value.toString(16).padStart(2, "0")).join("");
    return { width: 640, height: 480, sha256: await sha(pixels), coreSha256: await sha(core),
      ...(withPng ? { png: canvas.toDataURL("image/png") } : {}) };
  }, withPng);
}
async function capture(name) {
  const image = await frame(true);
  const guest = `${name}-guest.png`, host = `${name}-page.png`;
  if (image.png) fs.writeFileSync(path.join(args.output, guest), Buffer.from(image.png.split(",")[1], "base64"));
  delete image.png;
  await page.screenshot({ path: path.join(args.output, host) });
  const result = { name, elapsedMs: Date.now() - started, state: await state(), frame: image,
    viewport: page.viewportSize(), fullscreen: await page.evaluate(() => !!document.fullscreenElement),
    guest, host };
  report.evidence.push(result);
  return result;
}
async function coordinates(x, y) {
  const rectangle = await page.locator("#screen-container").boundingBox();
  assert.ok(rectangle && rectangle.width && rectangle.height, "Guest screen is visible");
  return { x: rectangle.x + x * rectangle.width / 640, y: rectangle.y + y * rectangle.height / 480 };
}
async function guest(x, y, action = "click") {
  const point = await coordinates(x, y);
  if (action === "move") await page.mouse.move(point.x, point.y);
  else if (action === "touch") {
    const before = (await state()).clicks.length;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...point, id: 0 }] });
    await delay(100);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const clicks = (await state()).clicks.slice(before);
    assert.deepEqual(clicks.map(event => event.data), [[true, false, false], [false, false, false]],
      "One real touch must produce exactly one guest down/up pair, without a compatibility duplicate");
    assert.ok(clicks[1].time - clicks[0].time >= 80, "Guest press must follow the real finger lifetime");
    check("touch-single-click-lifecycle", { x, y, heldMs: clicks[1].time - clicks[0].time });
  }
  else if (action === "first-click") {
    // A trusted down/up without a preceding move exercises pointerdown sync.
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point,
      button: "left", buttons: 1, clickCount: 1 });
    await delay(100);
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point,
      button: "left", buttons: 0, clickCount: 1 });
  } else await page.mouse.click(point.x, point.y, { delay: 100 });
}
async function park() { await guest(639, 479, "move"); }
async function home() {
  await park();
  await until("home screen", async () => (await frame()).coreSha256 === HOME_CORE);
}
async function menuHome() { await guest(94, 466); await home(); }

async function loadReferences() {
  await page.evaluate(async () => {
    const references = globalThis.__cavaReferences = {};
    await Promise.all(["abbey-it", "abbey-en", "ambo", "commerce-it", "commerce-en", "ceramics"].map(async name => {
      const response = await fetch(`__qa/reference/${name}`);
      if (!response.ok) throw Error(`Missing original CD reference: ${name}`);
      const image = await createImageBitmap(await response.blob());
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      references[name] = { width: image.width, height: image.height,
        pixels: context.getImageData(0, 0, image.width, image.height).data };
      image.close();
    }));
  });
}
async function scene(name) {
  const photo = name === "ambo" || name === "ceramics";
  const region = photo ? { x: 46, y: 100, width: 226, height: 316 } : { x: 0, y: 0, width: 640, height: 450 };
  return page.evaluate(({ name, region }) => {
    const reference = globalThis.__cavaReferences[name];
    const actual = document.querySelector("#screen-container canvas").getContext("2d")
      .getImageData(region.x, region.y, region.width, region.height).data;
    let error = 0, close = 0;
    for (let y = 0; y < region.height; y++) for (let x = 0; x < region.width; x++) {
      const a = (y * region.width + x) * 4, b = (y * reference.width + x) * 4;
      let maxError = 0;
      for (let channel = 0; channel < 3; channel++) {
        const difference = Math.abs(actual[a + channel] - reference.pixels[b + channel]);
        error += difference;
        maxError = Math.max(maxError, difference);
      }
      if (maxError <= 24) close++;
    }
    const pixels = region.width * region.height;
    return { meanAbsoluteError: error / (pixels * 3), closeFraction: close / pixels, region };
  }, { name, region });
}
async function expectScene(name, evidenceName) {
  // Allow the original Win32 JPEG rendering and 16-bit color quantization.
  // A menu hover cannot satisfy a complete image/photo comparison.
  const comparison = await until(`original CD scene: ${name}`, async () => {
    const result = await scene(name);
    return result.meanAbsoluteError < 6 && result.closeFraction > 0.93 ? result : false;
  }, 20_000);
  check(name, comparison);
  await capture(evidenceName);
}

async function pointerProbe(name, x, y) {
  await home();
  const before = await page.evaluate(() => Array.from(document.querySelector("#screen-container canvas")
    .getContext("2d").getImageData(0, 200, 590, 130).data));
  await guest(x, y, "move");
  const result = await until(`visible cursor alignment: ${name}`, async () => {
    const difference = await page.evaluate(before => {
      const after = document.querySelector("#screen-container canvas").getContext("2d")
        .getImageData(0, 200, 590, 130).data;
      let left = 640, top = 480, right = -1, bottom = -1, pixels = 0;
      for (let i = 0; i < after.length; i += 4) {
        if (after[i] === before[i] && after[i + 1] === before[i + 1] && after[i + 2] === before[i + 2]) continue;
        const px = (i / 4) % 590, py = Math.floor(i / 4 / 590) + 200;
        left = Math.min(left, px); top = Math.min(top, py);
        right = Math.max(right, px); bottom = Math.max(bottom, py); pixels++;
      }
      return { left, top, right, bottom, pixels };
    }, before);
    return difference.pixels > 10 && Math.abs(difference.left - x) <= 2 && Math.abs(difference.top - y) <= 2
      && difference.right <= x + 32 && difference.bottom <= y + 40 ? difference : false;
  }, 6000);
  check(name, { requested: { x, y }, visibleCursor: result });
  await capture(name);
  await home();
}

async function startServer() {
  const script = fileURLToPath(new URL("native-serve.py", import.meta.url));
  const flags = [script, "--base", args.base, "--cd", args.cd, "--dist", args.dist];
  if (args.state) flags.push("--state", args.state);
  server = spawn(process.env.PYTHON || "python3", flags, { stdio: ["ignore", "pipe", "pipe"] });
  server.stderr.on("data", chunk => { serverLog = (serverLog + chunk).slice(-200_000); });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Native-media server did not start")), 20_000);
    const lines = createInterface({ input: server.stdout });
    lines.once("line", line => {
      clearTimeout(timer);
      try { resolve(JSON.parse(line)); } catch { reject(Error(`Invalid server response: ${line}`)); }
    });
    server.once("error", error => { clearTimeout(timer); reject(error); });
    server.once("exit", code => { clearTimeout(timer); reject(Error(`Native-media server exited (${code}): ${serverLog}`)); });
  });
}

async function verify() {
  report.release = await startServer();
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    headless: true, args: ["--no-sandbox", "--autoplay-policy=user-gesture-required"] });
  report.browser = { version: browser.version(), executable: process.env.CHROME_PATH || "Playwright Chromium",
    playwright: "1.62.1" };
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true });
  page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("requestfailed", request => {
    if (request.method() !== "HEAD") report.errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on("response", response => {
    if (response.status() >= 400) report.httpErrors.push({ url: response.url(), status: response.status() });
  });
  cdp = await context.newCDPSession(page);
  await page.goto(report.release.url, { waitUntil: "domcontentloaded" });
  await page.bringToFront();
  await page.waitForFunction(() => {
    const s = globalThis.__cavaQA?.snapshot();
    return s?.ready && !s.busy && s.archiveStartPending;
  }, null, { timeout: 60_000 });
  await loadReferences();
  const initial = await capture("01-awaiting-start");
  assert.equal(initial.state.running, false);
  assert.equal(initial.state.absolute, true);
  assert.equal(initial.state.sampleRate, 11025);
  assert.equal(initial.state.clicks.length, 0);
  assert.equal(await page.locator("#archive-start").isVisible(), true);
  assert.equal(await page.locator("#screen-container").evaluate(element => element.inert), true);
  assert.equal(await page.locator("#pause-button").isDisabled(), true);
  await delay(700);
  assert.equal((await state()).instructions, initial.state.instructions, "Gate must keep the CPU stopped");
  assert.equal((await frame()).sha256, initial.frame.sha256, "Gate preserves the first intro frame");
  check("paused-first-frame");

  const introStarted = Date.now();
  await page.locator("#launch-button").click();
  await until("original intro starts", async () => (await state()).running);
  const launched = await state();
  assert.equal(launched.clicks.length, 0, "The external launch button must not click inside the guest");
  assert.equal(launched.events.find(event => event.name === "run-request")?.data.audio, "running",
    "Audio must be running before the emulated CPU resumes");
  await until("original video and PCM progress", async () => {
    const s = await state();
    return s.pcm.frames > 10_000 && s.pcm.peak > 0.01 && (await frame()).sha256 !== initial.frame.sha256;
  });
  check("audio-before-cpu-and-intro-progress");
  await capture("02-original-intro");
  await page.locator("#pause-button").click();
  await until("intro pauses", async () => !(await state()).running);
  await delay(100); // Allow the last already queued display update to settle.
  const paused = await state(), pausedFrame = await frame();
  await delay(350);
  assert.equal((await state()).instructions, paused.instructions);
  assert.equal((await frame()).sha256, pausedFrame.sha256);
  await page.locator("#pause-button").click();
  await until("intro resumes", async () => (await state()).running);
  check("pause-and-resume");
  await until("one complete original intro reaches home", async () => (await frame()).coreSha256 === HOME_CORE, 95_000);
  const elapsed = Date.now() - introStarted, completed = await state();
  assert.ok(elapsed >= 45_000, `Intro appears skipped (${elapsed} ms)`);
  assert.ok(completed.pcm.frames > 450_000 && completed.pcm.peak > 0.01, "Original intro PCM must play");
  assert.equal(completed.clicks.length, 0, "No guest click may skip the introduction");
  check("complete-original-intro", { elapsedMs: elapsed, pcm: completed.pcm });
  await capture("03-home-after-intro");

  // The first guest click has no warm-up mousemove and no keyboard focus.
  await guest(370, 400, "first-click");
  const firstDown = (await state()).clicks.find(event => event.data[0]);
  assert.ok(firstDown, "First native guest press is delivered");
  assert.ok(Math.abs(firstDown.absolute[0] - 370 / 640 * 65535) <= 2);
  assert.ok(Math.abs(firstDown.absolute[1] - 400 / 480 * 65535) <= 2);
  await park();
  await expectScene("abbey-it", "04-abbey-first-click");
  check("first-click-absolute-position-before-native-press", { click: firstDown });
  await guest(80, 230); await park();
  await expectScene("ambo", "05-basilica-ambo");
  await menuHome();
  await page.keyboard.press("Control+Alt+Escape");
  assert.equal((await state()).activeElement, "pause-button");
  await pointerProbe("06-hover-with-host-keyboard-focus", 100, 250);

  await page.setViewportSize({ width: 480, height: 800 });
  assert.ok((await state()).rect.width < 640, "The scaled-screen test must actually shrink the guest");
  await pointerProbe("07-scaled-pointer", 520, 250);
  await guest(570, 400); await park();
  await expectScene("commerce-it", "08-scaled-commerce");
  await guest(180, 100); await park();
  await expectScene("ceramics", "09-scaled-ceramics");
  await menuHome();

  await page.setViewportSize({ width: 1280, height: 900 });
  await guest(62, 465); await home(); // Select the original English edition.
  await page.locator("#fullscreen-button").click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  assert.ok((await state()).rect.width > 640, "Fullscreen must change the screen scale");
  await pointerProbe("10-fullscreen-pointer", 320, 250);
  await guest(370, 400, "first-click"); await park();
  await expectScene("abbey-en", "11-fullscreen-english-abbey");
  await page.evaluate(() => document.exitFullscreen());
  await menuHome();

  await page.setViewportSize({ width: 390, height: 844 });
  const beforeTouchTime = (await state()).samples.at(-1)?.time ?? -1;
  const touchStart = await coordinates(300, 250), touchEnd = await coordinates(400, 270);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...touchStart, id: 0 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...touchEnd, id: 0 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await delay(200);
  const touched = await state();
  const touchSamples = touched.samples.filter(sample => sample.time > beforeTouchTime);
  assert.ok(touchSamples.length >= 2 && touchSamples.every(sample => sample.data.every(Number.isFinite)),
    "Touchmove must not send NaN coordinates to VMware");
  assert.ok(touchSamples.some(({ data }) => Math.abs(data[0] / data[2] * 640 - 400) <= 2
    && Math.abs(data[1] / data[3] * 480 - 270) <= 2), "Touchmove must deliver the new absolute position");
  assert.ok(Number.isFinite(touched.mouse.x) && Number.isFinite(touched.mouse.y));
  check("touchmove-finite-absolute-position");
  await guest(570, 400, "touch"); await park();
  await expectScene("commerce-en", "12-touch-english-commerce");
  await guest(180, 100, "touch"); await park();
  await expectScene("ceramics", "13-touch-ceramics");

  const beforeRestart = await state();
  await page.locator("#restart-button").click();
  await until("restart restores the first-frame gate", async () => {
    const s = await state();
    return s.ready && !s.busy && s.archiveStartPending && s.machines > beforeRestart.machines;
  }, 45_000);
  const restarted = await capture("14-restarted-first-frame");
  assert.equal(restarted.state.running, false);
  assert.equal(restarted.state.absolute, true);
  assert.equal(restarted.frame.sha256, initial.frame.sha256);
  assert.equal(restarted.state.clicks.length, beforeRestart.clicks.length, "Restart must not click the guest");
  await delay(700);
  assert.equal((await state()).instructions, restarted.state.instructions);
  assert.equal(await page.locator("#launch-button").isVisible(), true);
  check("restart-preserves-original-first-frame-and-gate");
  assert.deepEqual(report.errors, [], "Browser runtime and network requests must not fail");
  assert.deepEqual(report.httpErrors, [], "No release asset may return HTTP errors");
  assert.equal((await state()).error, null);
  report.passed = true;
}

let watchdog;
// Reserve the last 15 seconds for failure evidence and process cleanup. The
// hard deadline also covers a stuck browser/CDP call while collecting evidence.
const hardDeadline = setTimeout(() => {
  report.passed = false;
  report.failure = { stage, message: "Browser gate reached its total 5-minute limit" };
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.now() - started;
  if (server) server.kill("SIGTERM");
  fs.writeFileSync(path.join(args.output, "browser-verification.json"), JSON.stringify(report, null, 2) + "\n");
  process.exit(1);
}, Math.max(1, report.timeoutMs - (Date.now() - started)));
try {
  await Promise.race([verify(), new Promise((_, reject) => {
    watchdog = setTimeout(() => reject(Error(`Browser gate exhausted its execution budget at: ${stage}`)),
      Math.max(1, report.timeoutMs - 15_000 - (Date.now() - started)));
  })]);
} catch (error) {
  report.failure = { stage, message: error.message, stack: error.stack };
  if (page && !page.isClosed()) {
    try { await bounded(capture("failure"), 5000); } catch { /* Preserve the original error. */ }
  }
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  if (browser) {
    try { await bounded(browser.close(), 5000); } catch { /* The hard deadline bounds cleanup. */ }
  }
  if (server) server.kill("SIGTERM");
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.now() - started;
  if (serverLog) report.serverLog = serverLog;
  fs.writeFileSync(path.join(args.output, "browser-verification.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(report.passed ? "BROWSER_VERIFICATION_OK" : "BROWSER_VERIFICATION_FAILED",
    JSON.stringify({ elapsedMs: report.elapsedMs, failure: report.failure,
      report: path.join(args.output, "browser-verification.json") }));
  clearTimeout(hardDeadline);
}
