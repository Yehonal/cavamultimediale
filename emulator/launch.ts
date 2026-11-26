interface ArchiveMachine {
  speaker_adapter?: { audio_context?: Pick<AudioContext, "state" | "resume"> };
  run(): Promise<void>;
  stop(): Promise<void>;
}

/** Resume the audio clock from a host gesture before advancing the intro. */
export async function launchArchive(
  machine: ArchiveMachine,
  isCurrent: () => boolean,
  timeoutMs = 10_000,
): Promise<boolean> {
  if (!isCurrent()) return false;
  const context = machine.speaker_adapter?.audio_context;
  if (!context || context.state === "closed") {
    throw new Error("L’audio del CD non è disponibile. Premi Ricomincia per ricaricarlo.");
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // resume() must run immediately, while the button's user activation exists.
    await Promise.race([
      context.resume(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Il browser non ha attivato l’audio. Premi Avvia il CD per riprovare.")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  if (!isCurrent()) return false;
  if (context.state !== "running") {
    throw new Error("Il browser non ha attivato l’audio. Premi Avvia il CD per riprovare.");
  }
  try {
    await machine.run();
  } catch (error) {
    await machine.stop();
    throw error;
  }
  if (!isCurrent()) {
    await machine.stop();
    return false;
  }
  return true;
}
