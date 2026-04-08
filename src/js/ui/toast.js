let activeToastTimer = null;

export function showToast(dom, message) {
  dom.toastRoot.innerHTML = "";
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  dom.toastRoot.appendChild(toast);

  if (activeToastTimer) {
    window.clearTimeout(activeToastTimer);
  }

  activeToastTimer = window.setTimeout(() => {
    dom.toastRoot.innerHTML = "";
    activeToastTimer = null;
  }, 2200);
}
