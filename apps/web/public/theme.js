(function () {
  'use strict';

  var DARK = 'dark';
  var LIGHT = 'light';

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
    applyTheme(next);
  }

  // Init — run on DOMContentLoaded so buttons exist
  document.addEventListener('DOMContentLoaded', function () {
    // MVP "no memory": default is always light on refresh.
    applyTheme(LIGHT);

    // Wire up all toggle buttons
    document.querySelectorAll('.theme-toggle, .wb-theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  });
})();
