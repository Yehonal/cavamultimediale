// Minimal adapter for the pinned v86 runtime. Its upstream types omit File,
// although v86 supports lazy File-backed disks through AsyncFileBuffer.
export interface DiskImage {
  url?: string;
  buffer?: File | ArrayBuffer;
  async?: boolean;
  size?: number;
  use_parts?: boolean;
  fixed_chunk_size?: number;
}

export interface EmulatorOptions {
  wasm_path: string;
  memory_size: number;
  vga_memory_size: number;
  bios: DiskImage;
  vga_bios: DiskImage;
  screen: { container: HTMLElement };
  hda?: DiskImage;
  cdrom?: DiskImage;
  fda?: DiskImage;
  initial_state?: DiskImage;
  mac_address_translation?: boolean;
  autostart: boolean;
}

interface Events {
  "emulator-loaded": void;
  "emulator-started": void;
  "emulator-stopped": void;
  "serial0-output-byte": number;
  "download-progress": { file_name: string; loaded: number; total: number; lengthComputable: boolean };
  "download-error": { file_name?: string };
}

export class V86 {
  constructor(options: EmulatorOptions);
  add_listener<K extends keyof Events>(name: K, callback: (event: Events[K]) => void): void;
  remove_listener<K extends keyof Events>(name: K, callback: (event: Events[K]) => void): void;
  run(): Promise<void>;
  stop(): Promise<void>;
  restart(): void;
  destroy(): Promise<void>;
  save_state(): Promise<ArrayBuffer>;
  is_running(): boolean;
  keyboard_set_enabled(enabled: boolean): void;
  keyboard_send_scancodes(codes: number[]): Promise<void>;
  mouse_set_enabled(enabled: boolean): void;
  speaker_adapter?: { audio_context?: AudioContext; mixer?: { node_merger?: ChannelMergerNode } };
  zstd_worker?: Worker | null;
}
