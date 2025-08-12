(function() {
  function showMessage(msg) {
    const container = document.getElementById('durum');
    if (!container) return;
    container.innerHTML = `<div class="status-message status-error">${msg}</div>`;
    setTimeout(() => (container.innerHTML = ''), 5000);
  }

  function logError(err, context = 'Genel') {
    const message = err && err.message ? err.message : String(err);
    console.error(`Hata [${context}]:`, err);
    showMessage(`Beklenmeyen bir hata oluştu (${context}): ${message}`);
  }

  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'Pencere');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Promise');
  });

  window.handleAppError = logError;
})();
