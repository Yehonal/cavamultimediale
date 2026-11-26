// Host integration for the pinned v86 0.5.476 VMware absolute mouse.
// Relative guests retain v86's native input handling.
export interface PointerMachine {
  absolute_pointer_enabled: boolean;
  is_running(): boolean;
  mouse_adapter?: { enabled: boolean; emu_enabled: boolean };
  bus: {
    send(name: "mouse-absolute", data: [number, number, number, number]): void;
    send(name: "mouse-delta", data: [number, number]): void;
  };
}

interface Point { clientX: number; clientY: number }
interface PointerSample {
  clientX?: number;
  clientY?: number;
  changedTouches?: ArrayLike<Point>;
}
type Screen = Pick<HTMLElement, "getBoundingClientRect" | "ownerDocument">;

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
