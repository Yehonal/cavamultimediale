import type { DiskImage } from "./vendor/libv86.mjs";

export interface Archive {
  id: string;
  memorySize: number;
  videoMemorySize: number;
  hda: DiskImage;
  cdrom: DiskImage;
  initialState: DiskImage;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Configurazione dell’archivio non valida.");
  }
  return value as Record<string, unknown>;
}

function resource(value: unknown, base: URL): string {
  if (typeof value !== "string" || !value) throw new Error("Manca un file dell’archivio.");
  const url = new URL(value, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(new URL("./", base).pathname)) {
    throw new Error("I file dell’archivio devono appartenere a questa pubblicazione.");
  }
  return url.href;
}

function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error("Dimensioni dell’archivio non valide.");
  }
  return value;
}

function disk(value: unknown, base: URL): DiskImage {
  const data = record(value);
  const size = integer(data.size, 512, 4 * 1024 ** 3);
  const chunkSize = integer(data.chunkSize, 512, 8 * 1024 ** 2);
  if (size % 512 || chunkSize % 512) throw new Error("Formato del disco non valido.");
  return { url: resource(data.url, base), size, async: true, use_parts: true, fixed_chunk_size: chunkSize };
}

export function parseArchive(value: unknown, manifestUrl: string): Archive {
  const data = record(value);
  const base = new URL(manifestUrl);
  if (data.schema !== 1 || data.emulatorVersion !== "0.5.476") {
    throw new Error("L’archivio richiede una versione diversa dell’emulatore. Ricarica la pagina.");
  }
  if (typeof data.id !== "string" || !/^[a-zA-Z0-9._-]{1,80}$/.test(data.id)) {
    throw new Error("Versione dell’archivio non valida.");
  }
  const state = record(data.initialState);
  return {
    id: data.id,
    memorySize: integer(data.memorySize, 16 * 1024 ** 2, 256 * 1024 ** 2),
    videoMemorySize: integer(data.videoMemorySize, 1024 ** 2, 16 * 1024 ** 2),
    hda: disk(data.hda, base),
    cdrom: disk(data.cdrom, base),
    initialState: { url: resource(state.url, base) },
  };
}
