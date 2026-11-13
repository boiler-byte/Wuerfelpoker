/* Installation is optional; the game also runs normally in a browser. */
'use strict';
(() => {
  const installButton = document.getElementById('installButton');
  const helpDialog = document.getElementById('installHelpDialog');
  const closeHelp = document.getElementById('closeInstallHelp');
  let deferredInstallPrompt = null;
  const onIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;

  function updateInstallButton() {
    installButton.hidden = isInstalled() || (!deferredInstallPrompt && !onIOS);
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateInstallButton();
  });

  installButton.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      const prompt = deferredInstallPrompt;
      deferredInstallPrompt = null;
      updateInstallButton();
      await prompt.prompt();
      try { await prompt.userChoice; } catch { /* Prompt may be dismissed. */ }
    } else if (onIOS && !isInstalled()) {
      helpDialog.showModal();
    }
  });
  closeHelp.addEventListener('click', () => helpDialog.close());
  helpDialog.addEventListener('click', event => {
    if (event.target === helpDialog) helpDialog.close();
  });
  updateInstallButton();

  // Service workers require HTTPS (or localhost), not a file:// URL.
  if ('serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost' ||
       location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', {scope:'./'})
        .catch(error => console.warn('Offline-Modus konnte nicht eingerichtet werden:', error));
    });
  }
})();
