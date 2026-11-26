import test from "node:test";
import assert from "node:assert/strict";
import { launchArchive } from "../dist/launch.js";

function fixture() {
  const events = [];
  const context = { state: "suspended", async resume() { events.push("audio"); this.state = "running"; } };
  const machine = {
    speaker_adapter: { audio_context: context },
    async run() { events.push("run"); },
    async stop() { events.push("stop"); },
  };
  return { events, context, machine };
}

test("archive starts audio before CPU, without sending a guest click", async () => {
  const { events, machine } = fixture();
  assert.equal(await launchArchive(machine, () => true), true);
  assert.deepEqual(events, ["audio", "run"]);
});

test("a retired archive cannot resume audio or CPU", async () => {
  const { events, machine } = fixture();
  assert.equal(await launchArchive(machine, () => false), false);
  assert.deepEqual(events, []);
});

test("an audio resume that resolves after replacement cannot start the old CPU", async () => {
  const { events, context, machine } = fixture();
  let current = true;
  context.resume = async () => { events.push("audio"); context.state = "running"; current = false; };
  assert.equal(await launchArchive(machine, () => current), false);
  assert.deepEqual(events, ["audio"]);
});

test("missing or closed audio keeps the intro stopped", async () => {
  for (const context of [undefined, { state: "closed" }]) {
    const { events, machine } = fixture();
    machine.speaker_adapter.audio_context = context;
    await assert.rejects(launchArchive(machine, () => true), /audio.*non è disponibile/);
    assert.deepEqual(events, []);
  }
});

test("rejected or still-suspended audio does not advance the intro", async () => {
  for (const reject of [true, false]) {
    const { events, context, machine } = fixture();
    context.resume = async () => { events.push("audio"); if (reject) throw Error("blocked"); };
    await assert.rejects(launchArchive(machine, () => true), /blocked|non ha attivato/);
    assert.deepEqual(events, ["audio"]);
  }
});

test("audio timeout stays stopped even when resume resolves later", async () => {
  const { events, context, machine } = fixture();
  let resolve;
  context.resume = () => new Promise(done => { resolve = done; });
  await assert.rejects(launchArchive(machine, () => true, 10), /non ha attivato/);
  context.state = "running";
  resolve();
  await Promise.resolve();
  assert.deepEqual(events, []);
});

test("failed CPU start is stopped before exposing a retry", async () => {
  const { events, machine } = fixture();
  machine.run = async () => { events.push("run"); throw Error("start failed"); };
  await assert.rejects(launchArchive(machine, () => true), /start failed/);
  assert.deepEqual(events, ["audio", "run", "stop"]);
});

test("replacement during CPU start stops the retired machine", async () => {
  const { events, machine } = fixture();
  let current = true;
  machine.run = async () => { events.push("run"); current = false; };
  assert.equal(await launchArchive(machine, () => current), false);
  assert.deepEqual(events, ["audio", "run", "stop"]);
});
