(function () {
  'use strict';

  const header = document.querySelector('.header');
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (!header || !btn || !nav) return;

  function setOpen(open) {
    header.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', () => {
    const open = !header.classList.contains('nav-open');
    setOpen(open);
  });

  // Close on navigation
  nav.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    setOpen(false);
  });

  // Close when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 720px)').matches) setOpen(false);
  });

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

