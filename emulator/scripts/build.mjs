import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const revision = "9457e7a2f6890f3133bb6ac0f749e588f63c4c36";
const biosFiles = {
  "seabios.bin": "73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98",
  "vgabios.bin": "a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880",
};
await rm("dist", { recursive: true, force: true });
await mkdir("dist/vendor", { recursive: true });
await mkdir(".cache", { recursive: true });
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--project", "tsconfig.json"], { stdio: "inherit" });
for (const file of ["index.html", "style.css"]) await cp(file, `dist/${file}`);
await cp("assets", "dist/assets", { recursive: true });
try {
  await cp("archive.json", "dist/archive.json");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
for (const file of ["libv86.mjs", "v86.wasm", "v86-fallback.wasm"]) {
  await cp(`node_modules/v86/build/${file}`, `dist/vendor/${file}`);
}
// v86 0.5.476 restores the SB16 rate without notifying its browser DAC. The
// existing rate-change method sends that notification before enabling playback.
// Guard the exact upstream bundle so a dependency update cannot patch blindly.
const runtime = await readFile("dist/vendor/libv86.mjs", "utf8");
const runtimeHash = createHash("sha256").update(runtime).digest("hex");
const audioRestore = "this.sampling_rate=a[27]";
// Partfile reads must apply the restored copy-on-write overlay before copying
// a downloaded chunk into the returned buffer. Upstream applies it afterwards,
// so the first mixed read returns stale base sectors; subsequent reads differ.
const partfileRead = "l.set(q,p*this.fixed_chunk_size);this.handle_read((g+p)*this.fixed_chunk_size,this.fixed_chunk_size|0,q)";
const mergedPartfileRead = "this.handle_read((g+p)*this.fixed_chunk_size,this.fixed_chunk_size|0,q);l.set(q,p*this.fixed_chunk_size)";
if (runtimeHash !== "6027e988d9d891fadeb7799c2ad0b092c65f52dbd899e80e3a37afe068d7f2b7"
    || runtime.split(audioRestore).length !== 2 || runtime.split(partfileRead).length !== 2) {
  throw new Error("Unexpected v86 bundle: review the audio restore and disk overlay fixes before publishing.");
}
await writeFile("dist/vendor/libv86.mjs", runtime
  .replace(audioRestore, "this.sampling_rate_change(a[27])")
  .replace(partfileRead, mergedPartfileRead));
for (const [file, expectedHash] of Object.entries(biosFiles)) {
  const cache = path.join(".cache", `${revision}-${file}`);
  let data;
  try { data = await readFile(cache); } catch {
    const response = await fetch(`https://raw.githubusercontent.com/copy/v86/${revision}/bios/${file}`, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`BIOS ${file}: HTTP ${response.status}`);
    data = Buffer.from(await response.arrayBuffer());
  }
  if (createHash("sha256").update(data).digest("hex") !== expectedHash) throw new Error(`Checksum BIOS non valido: ${file}`);
  await writeFile(cache, data);
  await writeFile(`dist/vendor/${file}`, data);
}
await cp("third-party", "dist/vendor", { recursive: true });
await cp("node_modules/v86/LICENSE", "dist/vendor/licenses/v86-BSD-2-Clause.txt");

// Original 16-bit boot sector: prints to BIOS video and serial port, then halts.
// No Microsoft code, OS or original CD content is embedded in this demo.
const demo = Buffer.alloc(512);
Buffer.from("fa31c08ed88ed0bc007cfbbe247cac84c0740db40ebb0700cd10baf803eeebeefaf4ebfc", "hex").copy(demo);
Buffer.from("Cava Multimediale - emulator test\r\nV86_SMOKE_OK\r\n\r\nCPU and BIOS are working.\r\nSelect your Windows disk and original CD to continue.\r\n\0", "ascii").copy(demo, 36);
demo[510] = 0x55;
demo[511] = 0xaa;
await writeFile("dist/demo-boot.img", demo);
await writeFile("dist/.nojekyll", "");

// Version every changed module edge and stylesheet, including the patched
// runtime, so returning visitors receive matching code and presentation.
async function version(file) {
  return createHash("sha256").update(await readFile(`dist/${file}`)).digest("hex").slice(0, 12);
}
let app = await readFile("dist/app.js", "utf8");
app = app.replace('"./vendor/libv86.mjs"', `"./vendor/libv86.mjs?v=${await version("vendor/libv86.mjs")}"`)
  .replace('"./hosted.js"', `"./hosted.js?v=${await version("hosted.js")}"`)
  .replace('"./pointer.js"', `"./pointer.js?v=${await version("pointer.js")}"`)
  .replace('"./launch.js"', `"./launch.js?v=${await version("launch.js")}"`);
await writeFile("dist/app.js", app);
const html = await readFile("dist/index.html", "utf8");
await writeFile("dist/index.html", html.replace('href="style.css"', `href="style.css?v=${await version("style.css")}"`)
  .replace('src="app.js"', `src="app.js?v=${await version("app.js")}"`));
const infoHtml = await readFile("info.html", "utf8");
const infoMarker = "<!-- PROJECT_INFO_CONTENT -->";
if (infoHtml.split(infoMarker).length !== 2) throw new Error("Expected one project information content slot.");
const infoContent = await readFile("project-info.html", "utf8");
await writeFile("dist/info.html", infoHtml.replace(infoMarker, () => infoContent)
  .replace('href="style.css"', `href="style.css?v=${await version("style.css")}"`));
console.log(`Emulator built in ${root}dist/ (v86 0.5.476, BIOS ${revision}).`);
