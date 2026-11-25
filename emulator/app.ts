import { V86, type EmulatorOptions } from "./vendor/libv86.mjs";
import { parseArchive, type Archive } from "./hosted.js";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento mancante: ${id}`);
  return found as T;
}

const diskInput = element<HTMLInputElement>("windows-image");
const cdInput = element<HTMLInputElement>("cd-image");
const stateInput = element<HTMLInputElement>("saved-state");
const startButton = element<HTMLButtonElement>("start-button");
const demoButton = element<HTMLButtonElement>("demo-button");
const pauseButton = element<HTMLButtonElement>("pause-button");
const restartButton = element<HTMLButtonElement>("restart-button");
const fullscreenButton = element<HTMLButtonElement>("fullscreen-button");
const saveButton = element<HTMLButtonElement>("save-button");
const audioButton = element<HTMLButtonElement>("audio-button");
const screen = element<HTMLDivElement>("screen-container");
const progress = element<HTMLProgressElement>("progress-bar");
const errorMessage = element<HTMLParagraphElement>("error-message");
const placeholder = element<HTMLDivElement>("screen-placeholder");
const statusText = element<HTMLParagraphElement>("status-text");
const statusDetail = element<HTMLParagraphElement>("status-detail");

type Mode = "archive" | "demo" | "windows";
let emulator: V86 | undefined;
let mode: Mode = "archive";
let ready = false;
let busy = false;
let demoPassed = false;
let activeDiskName = "windows";
let rejectStartup: ((error: Error) => void) | undefined;
let archive: Archive | undefined;
let audioPreference: "auto" | "enabled" | "muted" = "auto";

async function hostedImages(): Promise<Pick<EmulatorOptions, "hda" | "cdrom" | "initial_state" | "memory_size" | "vga_memory_size">> {
  const url = new URL("archive.json", window.location.href);
  const response = await fetch(url, { cache: "no-cache", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error("L’archivio non è disponibile in questo momento. Premi Riprova tra poco.");
  archive = parseArchive(await response.json(), url.href);
  const firstChunk = (image: Archive["hda"]): string => {
    const virtualUrl = new URL(image.url!);
    return new URL(`0-${image.fixed_chunk_size}.img.zst`, virtualUrl).href;
  };
  const resources = [firstChunk(archive.hda), firstChunk(archive.cdrom), archive.initialState.url!];
  await Promise.all(resources.map(async (resourceUrl) => {
    const check = await fetch(resourceUrl, { method: "HEAD", signal: AbortSignal.timeout(30_000) });
    if (!check.ok) throw new Error("L’archivio è incompleto o temporaneamente non raggiungibile. Premi Riprova tra poco.");
  }));
  activeDiskName = archive.id;
  return {
    hda: archive.hda,
    cdrom: archive.cdrom,
    initial_state: archive.initialState,
    memory_size: archive.memorySize,
    vga_memory_size: archive.videoMemorySize,
  };
}

function status(title: string, detail: string): void {
  statusText.textContent = title;
  statusDetail.textContent = detail;
}

function showError(error: unknown): void {
  errorMessage.textContent = error instanceof Error ? error.message : String(error);
  errorMessage.hidden = false;
}

function controls(): void {
  startButton.disabled = busy || !diskInput.files?.[0] || !cdInput.files?.[0];
  demoButton.disabled = busy;
  for (const input of [diskInput, cdInput, stateInput]) input.disabled = busy;
  for (const button of [pauseButton, restartButton, fullscreenButton]) button.disabled = busy || !ready;
  restartButton.disabled = busy || (!ready && mode !== "archive");
  restartButton.textContent = mode === "archive" ? (ready ? "Ricomincia" : "Riprova") : "Riavvia";
  saveButton.disabled = busy || !ready || mode !== "windows";
  audioButton.disabled = busy || !ready || !emulator?.speaker_adapter?.audio_context;
  const audioEnabled = emulator?.speaker_adapter?.audio_context?.state === "running";
  audioButton.textContent = audioEnabled ? "Disattiva audio" : "Attiva audio";
  audioButton.setAttribute("aria-pressed", String(audioEnabled));
  pauseButton.textContent = emulator?.is_running() ? "Pausa" : "Riprendi";
}

function runningStatus(): void {
  if (!emulator?.is_running()) {
    status("Emulatore in pausa", "Premi Riprendi per continuare dalla stessa schermata.");
  } else if (mode === "demo") {
    status(demoPassed ? "Emulatore verificato" : "Verifica in corso", demoPassed
      ? "Il processore emulato ha eseguito il disco di prova. Ora puoi scegliere Windows e il CD."
      : "Avvio del disco di prova, senza Windows e senza il CD originale.");
  } else if (mode === "archive") {
    status("Cava Multimediale", "Clicca nell’applicazione per iniziare la visita. Puoi attivare l’audio dai controlli.");
  } else {
    status("Computer virtuale avviato", "Attendi Windows, poi apri D:\\RUN\\RUN.EXE da Start → Esegui. Clicca nello schermo per usare mouse, tastiera e audio.");
  }
}

function captureInput(enabled: boolean): void {
  emulator?.keyboard_set_enabled(enabled);
  emulator?.mouse_set_enabled(enabled);
}

async function dispose(machine: V86): Promise<void> {
  try {
    await machine.destroy();
  } finally {
    // The pinned upstream destroy() does not release its decompression worker.
    machine.zstd_worker?.terminate();
    machine.zstd_worker = null;
  }
}

async function enableAudio(): Promise<void> {
  if (audioPreference === "muted") return;
  try {
    await emulator?.speaker_adapter?.audio_context?.resume();
    controls();
  } catch {
    // Browsers may require another explicit click before enabling sound.
  }
}

function enforceAudioPreference(): void {
  const context = emulator?.speaker_adapter?.audio_context;
  // v86 resumes its AudioContext whenever the CPU starts. Keep an explicit
  // visitor mute across pause/resume and snapshot restarts.
  if (audioPreference === "muted" && context?.state === "running") {
    void context.suspend().catch(() => undefined);
  }
  controls();
}

function fileInfo(input: HTMLInputElement, label: string, empty: string): void {
  const file = input.files?.[0];
  element(label).textContent = file
    ? `${file.name} · ${(file.size / 1024 / 1024).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB`
    : empty;
  controls();
}

diskInput.addEventListener("change", () => fileInfo(diskInput, "windows-file-info", "Nessun disco selezionato."));
cdInput.addEventListener("change", () => fileInfo(cdInput, "cd-file-info", "Nessun CD selezionato."));
stateInput.addEventListener("change", () => fileInfo(stateInput, "state-file-info", "Avvio normale di Windows."));

async function localImages(): Promise<Pick<EmulatorOptions, "hda" | "cdrom" | "initial_state">> {
  const disk = diskInput.files?.[0];
  const cd = cdInput.files?.[0];
  const saved = stateInput.files?.[0];
  if (!disk || !cd) throw new Error("Seleziona il disco Windows e il CD originale.");
  if (disk.size < 512 || disk.size % 512 !== 0) {
    throw new Error("Il disco Windows deve essere un’immagine raw IMG o BIN non compressa, con settori da 512 byte.");
  }
  const bootSector = new Uint8Array(await disk.slice(0, 512).arrayBuffer());
  if (bootSector[510] !== 0x55 || bootSector[511] !== 0xaa) {
    throw new Error("Il disco selezionato non contiene un settore di avvio riconoscibile. Serve l’immagine completa del disco con Windows installato.");
  }
  const signature = await cd.slice(32769, 32774).text();
  if (signature !== "CD001") throw new Error("Il CD selezionato non è un’immagine ISO 9660 riconoscibile.");
  if (saved && (saved.size < 16 || saved.size > 1024 ** 3)) {
    throw new Error("Lo stato salvato è vuoto o troppo grande. Usa uno stato prodotto da questa versione dell’emulatore.");
  }
  activeDiskName = disk.name.replace(/\.[^.]+$/, "");
  return {
    hda: { buffer: disk, async: true },
    cdrom: { buffer: cd, async: true },
    ...(saved ? { initial_state: { buffer: await saved.arrayBuffer() } } : {}),
  };
}

async function start(nextMode: Mode): Promise<void> {
  if (busy) return;
  if (emulator && mode === "windows" && !window.confirm("Sostituire la sessione corrente? Le modifiche non esportate con Salva sessione andranno perse.")) return;
  busy = true;
  errorMessage.hidden = true;
  controls();
  status(nextMode === "archive" ? "Preparazione di Cava Multimediale" : "Caricamento dell’emulatore", "L’applicazione si avvierà appena il caricamento è completo.");
  progress.hidden = false;
  progress.removeAttribute("value");
  let replacing = false;
  try {
    const images = nextMode === "archive" ? await hostedImages()
      : nextMode === "windows" ? await localImages()
      : { fda: { url: "demo-boot.img" } };
    replacing = true;
    ready = false;
    if (emulator) await dispose(emulator);
    emulator = undefined;
    screen.replaceChildren(Object.assign(document.createElement("div"), { className: "text-screen" }), document.createElement("canvas"));
    const canvas = screen.querySelector("canvas");
    if (canvas) canvas.style.display = "none";
    placeholder.hidden = false;
    mode = nextMode;
    demoPassed = false;
    element("mode-label").textContent = mode === "demo" ? "Verifica" : mode === "archive" ? "Edizione originale" : "Disco locale";
    status(mode === "archive" ? "Caricamento di Cava Multimediale" : "Caricamento dell’emulatore", "Preparazione dell’applicazione originale…");
    progress.hidden = false;
    progress.removeAttribute("value");

    const current = new V86({
      wasm_path: "vendor/v86.wasm",
      bios: { url: "vendor/seabios.bin" },
      vga_bios: { url: "vendor/vgabios.bin" },
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      screen: { container: screen },
      mac_address_translation: true,
      ...images,
      autostart: false,
    });
    emulator = current;
    captureInput(false);
    void enableAudio();
    // v86 does not abort pending WASM initialization in destroy(). Retired
    // instances must stay stopped and clean themselves up if loading finishes.
    current.add_listener("emulator-loaded", () => {
      current.keyboard_set_enabled(false);
      current.mouse_set_enabled(false);
      if (emulator !== current) void dispose(current).catch(() => undefined);
    });
    let serial = "";
    current.add_listener("serial0-output-byte", (byte) => {
      serial = (serial + String.fromCharCode(byte)).slice(-128);
      if (mode === "demo" && serial.includes("V86_SMOKE_OK")) {
        demoPassed = true;
        if (ready) runningStatus();
      }
    });
    current.add_listener("download-progress", (event) => {
      if (ready) return;
      const percentage = event.total ? Math.round(event.loaded / event.total * 100) : 0;
      statusDetail.textContent = mode === "archive"
        ? `Preparazione della visita${percentage ? ` · ${percentage}%` : "…"}`
        : `Caricamento: ${event.file_name.split("/").pop() ?? "runtime"}`;
      if (event.lengthComputable && event.total) progress.value = event.loaded / event.total * 100;
      else progress.removeAttribute("value");
    });
    current.add_listener("download-error", () => {
      if (emulator !== current || !ready) return;
      showError(new Error("Una parte dell’archivio non è stata caricata. Controlla la connessione e premi Ricomincia."));
    });
    for (const name of ["emulator-started", "emulator-stopped"] as const) {
      current.add_listener(name, () => {
        if (emulator === current) enforceAudioPreference();
        if (emulator === current && ready && !busy) {
          runningStatus();
          controls();
        }
      });
    }
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => finish(new Error("Il caricamento sta richiedendo troppo tempo. Controlla la connessione e premi Riprova.")), 180_000);
      function finish(error?: Error): void {
        window.clearTimeout(timeout);
        rejectStartup = undefined;
        current.remove_listener("emulator-loaded", loaded);
        current.remove_listener("download-error", downloadError);
        if (error) reject(error);
        else resolve();
      }
      function loaded(): void { finish(); }
      function downloadError(event: { file_name?: string }): void {
        finish(new Error(`Impossibile caricare ${event.file_name ?? "il runtime"}. Controlla la connessione e riprova.`));
      }
      rejectStartup = finish;
      current.add_listener("emulator-loaded", loaded);
      current.add_listener("download-error", downloadError);
    });
    await current.run();
    ready = true;
    placeholder.hidden = true;
    captureInput(false);
    current.speaker_adapter?.audio_context?.addEventListener("statechange", enforceAudioPreference);
    enforceAudioPreference();
    runningStatus();
  } catch (error) {
    if (replacing) {
      ready = false;
      try { if (emulator) await dispose(emulator); } catch { /* Failed initialization may not expose a CPU yet. */ }
      emulator = undefined;
      placeholder.hidden = false;
      status("Avvio non riuscito", nextMode === "archive"
        ? "Premi Riprova per caricare nuovamente l’applicazione."
        : "Controlla i file e riprova. Serve un disco con Windows già installato.");
    }
    if (!replacing && nextMode === "archive") status("Archivio non disponibile", "Premi Riprova per caricare nuovamente l’applicazione.");
    showError(error);
  } finally {
    rejectStartup = undefined;
    busy = false;
    progress.hidden = true;
    controls();
  }
}

startButton.addEventListener("click", () => { void start("windows"); });
demoButton.addEventListener("click", () => { void start("demo"); });

pauseButton.addEventListener("click", async () => {
  if (!emulator || busy || !ready) return;
  busy = true;
  controls();
  captureInput(false);
  try {
    if (emulator.is_running()) await emulator.stop();
    else { await enableAudio(); await emulator.run(); }
    runningStatus();
  } catch (error) { showError(error); }
  finally { busy = false; controls(); }
});

restartButton.addEventListener("click", async () => {
  if (mode === "archive" && !busy) { void start("archive"); return; }
  if (!emulator || busy || !ready) return;
  if (mode === "windows" && !window.confirm("Riavviare Windows? I dati non salvati nei programmi possono andare persi.")) return;
  busy = true;
  controls();
  try {
    emulator.restart();
    if (!emulator.is_running()) await emulator.run();
    runningStatus();
  } catch (error) { showError(error); }
  finally { busy = false; controls(); }
});

fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await element("screen-frame").requestFullscreen();
  } catch { showError(new Error("Questo browser non consente lo schermo intero. Puoi continuare nella pagina.")); }
});

saveButton.addEventListener("click", async () => {
  if (!emulator || busy || !ready || mode !== "windows") return;
  busy = true;
  controls();
  captureInput(false);
  const current = emulator;
  const wasRunning = current.is_running();
  status("Salvataggio della sessione", "Preparazione del file con memoria e modifiche al disco. Conserva anche il disco Windows e il CD originali.");
  try {
    if (wasRunning) await current.stop();
    const state = await current.save_state();
    const url = URL.createObjectURL(new Blob([state], { type: "application/octet-stream" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cava-${activeDiskName}-v86-0.5.476.v86state`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    status("Download della sessione avviato", "Per riprenderla, seleziona questo stato con gli stessi file Windows e CD. Attendi il completamento del download prima di chiudere.");
  } catch (error) { showError(error); }
  finally {
    try { if (wasRunning) await current.run(); } catch (error) { showError(error); }
    busy = false;
    controls();
  }
});

audioButton.addEventListener("click", async () => {
  const context = emulator?.speaker_adapter?.audio_context;
  if (!context || busy || !ready) return;
  try {
    if (context.state === "running") {
      audioPreference = "muted";
      await context.suspend();
    } else {
      audioPreference = "enabled";
      await context.resume();
    }
  } catch (error) { showError(error); }
  controls();
});

screen.addEventListener("pointerdown", () => {
  if (!ready || busy) return;
  screen.focus();
  captureInput(true);
  void enableAudio();
});
screen.addEventListener("focus", () => { if (ready && !busy) captureInput(true); });
screen.addEventListener("blur", () => captureInput(false));
window.addEventListener("blur", () => captureInput(false));
window.addEventListener("keydown", (event) => {
  if (event.code !== "Escape" || !event.ctrlKey || !event.altKey || document.activeElement !== screen) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  // Release guest modifiers before returning keyboard focus to the page.
  void emulator?.keyboard_send_scancodes([0x9d, 0xb8, 0xe0, 0x9d, 0xe0, 0xb8]);
  captureInput(false);
  pauseButton.focus();
}, true);
document.addEventListener("pointerdown", (event) => {
  if (event.target instanceof Node && !screen.contains(event.target)) captureInput(false);
}, true);
window.addEventListener("beforeunload", (event) => {
  if (ready && mode === "windows") {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  if (!rejectStartup) return;
  event.preventDefault();
  rejectStartup(new Error(`Impossibile avviare l’emulatore: ${event.reason instanceof Error ? event.reason.message : String(event.reason)}`));
});
controls();
void start("archive");
