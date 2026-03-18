(function () {
  'use strict';

  var STORAGE_KEY = 'pronto-theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setStored(val) {
    try { localStorage.setItem(STORAGE_KEY, val); } catch (e) {}
  }

  function isDark() {
    return document.documentElement.getAttribute('data-mode') === DARK;
  }

  function applyTheme(mode) {
    if (mode === DARK) {
      document.documentElement.setAttribute('data-mode', DARK);
    } else {
      document.documentElement.removeAttribute('data-mode');
    }
    // Update all toggle buttons on the page
    document.querySelectorAll('.theme-toggle, .wb-theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-label', mode === DARK ? 'Switch to light mode' : 'Switch to dark mode');
      btn.textContent = mode === DARK ? '○' : '●';
    });
  }

  function toggleTheme() {
    var next = isDark() ? LIGHT : DARK;
    setStored(next);
    applyTheme(next);
  }

  // Init — run on DOMContentLoaded so buttons exist
  document.addEventListener('DOMContentLoaded', function () {
    // Default is always light. Only go dark if the user explicitly chose it.
    var stored = getStored();
    var mode = stored === DARK ? DARK : LIGHT;
    applyTheme(mode);

    // Wire up all toggle buttons
    document.querySelectorAll('.theme-toggle, .wb-theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  });
})();
