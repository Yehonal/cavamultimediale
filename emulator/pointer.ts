// Host integration for the pinned v86 0.5.476 VMware absolute mouse.
// Relative guests retain v86's native input handling.
export interface PointerMachine {
  absolute_pointer_enabled: boolean;
  is_running(): boolean;
  mouse_adapter?: { enabled: boolean; emu_enabled: boolean };
  bus: {
    send(name: "mouse-absolute", data: [number, number, number, number]): void;
    send(name: "mouse-delta", data: [number, number]): void;
    send(name: "mouse-click", data: [boolean, boolean, boolean]): void;
  };
}

interface Point { clientX: number; clientY: number }
interface PointerSample {
  clientX?: number;
  clientY?: number;
  changedTouches?: ArrayLike<Point>;
}
type Screen = Pick<HTMLElement, "getBoundingClientRect" | "ownerDocument">;
interface TouchPointer extends PointerSample {
  pointerId: number;
  pointerType: string;
  isPrimary?: boolean;
}

function canSynchronize(machine: PointerMachine | undefined, screen: Screen): machine is PointerMachine {
  return !!machine?.absolute_pointer_enabled
    && machine.is_running()
    && machine.mouse_adapter?.enabled === true
    && machine.mouse_adapter.emu_enabled === true
    && !screen.ownerDocument.pointerLockElement;
}

/** Position the guest before v86 receives the following native mousedown. */
export function syncAbsolutePointer(machine: PointerMachine | undefined, screen: Screen, event: PointerSample): boolean {
  if (!canSynchronize(machine, screen)) return false;
  const point = event.changedTouches
    ? event.changedTouches[event.changedTouches.length - 1]
    : event;
  if (!point || typeof point.clientX !== "number" || typeof point.clientY !== "number") return false;
  const rect = screen.getBoundingClientRect();
  const x = point.clientX - rect.left;
  const y = point.clientY - rect.top;
  if (![x, y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) return false;
  machine.bus.send("mouse-absolute", [
    Math.max(0, Math.min(x, rect.width)),
    Math.max(0, Math.min(y, rect.height)),
    rect.width,
    rect.height,
  ]);
  // VMware queues the absolute packet but does not raise IRQ12. A nonzero
  // PS/2 delta notifies the absolute guest driver; a zero delta would not.
  machine.bus.send("mouse-delta", [1, 0]);
  return true;
}

/** Replace v86's TouchEvent.clientX/Y path, which otherwise enqueues NaN. */
export function handleAbsoluteTouchMove(
  machine: PointerMachine | undefined,
  screen: Screen,
  event: PointerSample & Pick<TouchEvent, "cancelable" | "preventDefault" | "stopPropagation">,
): boolean {
  if (!canSynchronize(machine, screen)) return false;
  event.stopPropagation();
  if (event.cancelable) event.preventDefault();
  syncAbsolutePointer(machine, screen, event);
  return true;
}

/** Deliver the real touch lifetime instead of a same-task compatibility click. */
export function createAbsoluteTouchInput() {
  let active: { machine: PointerMachine; screen: Screen; pointerId: number } | undefined;
  function release(): boolean {
    if (!active) return false;
    const current = active;
    active = undefined;
    current.machine.bus.send("mouse-click", [false, false, false]);
    return true;
  }
  return {
    start(machine: PointerMachine | undefined, screen: Screen, event: TouchPointer): boolean {
      if (event.pointerType !== "touch" || !canSynchronize(machine, screen)) return false;
      // A second finger must not create another press or move the first one.
      if (active || event.isPrimary === false) return true;
      if (!syncAbsolutePointer(machine, screen, event)) return false;
      active = { machine, screen, pointerId: event.pointerId };
      machine.bus.send("mouse-click", [true, false, false]);
      return true;
    },
    end(event: TouchPointer): boolean {
      if (!active || event.pointerId !== active.pointerId) return false;
      syncAbsolutePointer(active.machine, active.screen, event);
      return release();
    },
    cancel(pointerId: number): boolean {
      return active?.pointerId === pointerId ? release() : false;
    },
    reset(machine?: PointerMachine): void {
      if (!machine || active?.machine === machine) release();
    },
  };
}
