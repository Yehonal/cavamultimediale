function canSynchronize(machine, screen) {
    return !!machine?.absolute_pointer_enabled
        && machine.is_running()
        && machine.mouse_adapter?.enabled === true
        && machine.mouse_adapter.emu_enabled === true
        && !screen.ownerDocument.pointerLockElement;
}
/** Position the guest before v86 receives the following native mousedown. */
export function syncAbsolutePointer(machine, screen, event) {
    if (!canSynchronize(machine, screen))
        return false;
    const point = event.changedTouches
        ? event.changedTouches[event.changedTouches.length - 1]
        : event;
    if (!point || typeof point.clientX !== "number" || typeof point.clientY !== "number")
        return false;
    const rect = screen.getBoundingClientRect();
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    if (![x, y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0)
        return false;
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
export function handleAbsoluteTouchMove(machine, screen, event) {
    if (!canSynchronize(machine, screen))
        return false;
    event.stopPropagation();
    if (event.cancelable)
        event.preventDefault();
    syncAbsolutePointer(machine, screen, event);
    return true;
}
/** Deliver the real touch lifetime instead of a same-task compatibility click. */
export function createAbsoluteTouchInput() {
    let active;
    function release() {
        if (!active)
            return false;
        const current = active;
        active = undefined;
        current.machine.bus.send("mouse-click", [false, false, false]);
        return true;
    }
    return {
        start(machine, screen, event) {
            if (event.pointerType !== "touch" || !canSynchronize(machine, screen))
                return false;
            // A second finger must not create another press or move the first one.
            if (active || event.isPrimary === false)
                return true;
            if (!syncAbsolutePointer(machine, screen, event))
                return false;
            active = { machine, screen, pointerId: event.pointerId };
            machine.bus.send("mouse-click", [true, false, false]);
            return true;
        },
        end(event) {
            if (!active || event.pointerId !== active.pointerId)
                return false;
            syncAbsolutePointer(active.machine, active.screen, event);
            return release();
        },
        cancel(pointerId) {
            return active?.pointerId === pointerId ? release() : false;
        },
        reset(machine) {
            if (!machine || active?.machine === machine)
                release();
        },
    };
}
