const infoButton = document.getElementById("project-info-button");
const infoDialog = document.getElementById("project-info-dialog");
const infoClose = document.getElementById("project-info-close");
const infoTitle = document.getElementById("project-info-title");

if (!(infoButton instanceof HTMLButtonElement)
    || !(infoDialog instanceof HTMLDialogElement)
    || !(infoClose instanceof HTMLButtonElement)
    || !(infoTitle instanceof HTMLHeadingElement)) {
  throw new Error("Elementi delle informazioni del progetto mancanti.");
}

infoButton.addEventListener("click", () => {
  infoDialog.showModal();
  // Moving focus out of the emulated screen releases the guest keyboard.
  infoTitle.focus({ preventScroll: true });
});

infoClose.addEventListener("click", () => infoDialog.close());
infoDialog.addEventListener("close", () => infoButton.focus({ preventScroll: true }));

// Keep reading, navigation, and Escape inside the host's native modal.
// Browser defaults still provide Tab trapping and Escape-to-close.
for (const eventType of ["keydown", "keyup"]) {
  infoDialog.addEventListener(eventType, (event) => event.stopPropagation());
}

export {};
