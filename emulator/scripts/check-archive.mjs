import { readFile } from "node:fs/promises";
import { parseArchive } from "../dist/hosted.js";

const base = process.env.CAVA_PUBLIC_BASE_URL;
if (!base) throw new Error("CAVA_PUBLIC_BASE_URL is required to verify the published archive.");
const manifestUrl = new URL("archive.json", base).href;
const archive = parseArchive(JSON.parse(await readFile(new URL("../archive.json", import.meta.url), "utf8")), manifestUrl);
const resources = [archive.initialState.url];
for (const disk of [archive.hda, archive.cdrom]) {
  const last = Math.floor((disk.size - 1) / disk.fixed_chunk_size) * disk.fixed_chunk_size;
  resources.push(new URL(`0-${disk.fixed_chunk_size}.img.zst`, disk.url).href);
  resources.push(new URL(`${last}-${last + disk.fixed_chunk_size}.img.zst`, disk.url).href);
}
await Promise.all(resources.map(async (url) => {
  const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(30_000) });
  if (!response.ok || Number(response.headers.get("content-length")) <= 0) {
    throw new Error(`Archive resource is missing or empty: ${url} (HTTP ${response.status})`);
  }
}));
console.log(`Verified hosted archive ${archive.id}: both disks and the initial snapshot are available.`);
