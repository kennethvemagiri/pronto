(function () {
  'use strict';

  const imgA = document.getElementById('home-anim-a');
  const imgB = document.getElementById('home-anim-b');
  if (!imgA || !imgB) return;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const basePath = '/animations/home%20animation%20transparent/ezgif-frame-';

  const pad3 = (n) => String(n).padStart(3, '0');
  const srcFor = (n) => `${basePath}${pad3(n)}.png`;

  const range = (start, end) => {
    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  };

  // Light sequence: frames 005–089, looping the last ~3 seconds
  const lightSeq = range(5, 89);

  const state = {
    timeoutId:  null,
    preloaded:  new Map(),
    active:     'a',
    busy:       false,
    generation: 0,
  };

  // ── Preloading ────────────────────────────────────────────────────────────
  function preload(frames) {
    frames.forEach((n) => {
      if (state.preloaded.has(n)) return;
      const im = new Image();
      im.decoding = 'async';
      im.src = srcFor(n);
      state.preloaded.set(n, im);
    });
  }

  // ── Frame display (double-buffer, generation-safe) ────────────────────────
  function setFrame(n, onShown) {
    const activeEl = state.active === 'a' ? imgA : imgB;
    const nextEl   = state.active === 'a' ? imgB : imgA;

    nextEl.onload  = null;
    nextEl.onerror = null;

    const pre = state.preloaded.get(n);
    const src = pre ? pre.src : srcFor(n);

    const gen = state.generation;

    function swap() {
      if (state.generation !== gen) return;
      activeEl.classList.remove('is-active');
      nextEl.classList.add('is-active');
      state.active = state.active === 'a' ? 'b' : 'a';
      if (onShown) onShown();
    }

    function commitSwapAfterDecode() {
      if (state.generation !== gen) return;
      if (typeof nextEl.decode === 'function') {
        nextEl.decode().then(
          () => requestAnimationFrame(swap),
          () => requestAnimationFrame(swap),
        );
      } else {
        requestAnimationFrame(swap);
      }
    }

    nextEl.src = src;

    if (nextEl.complete && nextEl.naturalWidth > 0) {
      commitSwapAfterDecode();
    } else {
      nextEl.onload = function () {
        nextEl.onload  = null;
        nextEl.onerror = null;
        commitSwapAfterDecode();
      };
      nextEl.onerror = function () {
        nextEl.onload  = null;
        nextEl.onerror = null;
        if (state.generation === gen && onShown) onShown();
      };
    }
  }

  // ── Sequence player ────────────────────────────────────────────────────────
  function cancelAnim() {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
    state.generation++;
  }

  function playSequence(frames, fps, onDone) {
    cancelAnim();
    if (!frames || !frames.length) { if (onDone) onDone(); return; }

    const frameMs = Math.max(16, Math.round(1000 / fps));
    const gen = state.generation;
    let i = 0;

    function step() {
      if (state.generation !== gen) return;
      if (i >= frames.length) {
        if (onDone) onDone();
        return;
      }

      const n = frames[i++];
      const t0 = performance.now();

      setFrame(n, function onShown() {
        if (state.generation !== gen) return;
        const wait = Math.max(0, frameMs - (performance.now() - t0));
        state.timeoutId = setTimeout(step, wait);
      });
    }

    step();
  }

  // ── Animation loop ─────────────────────────────────────────────────────────
  let lightPlayCount = 0;

  function toLight() {
    if (reducedMotion) { setFrame(lightSeq[lightSeq.length - 1]); return; }

    const fps = 26;
    const tailLen = Math.max(1, Math.min(lightSeq.length, Math.round(fps * 3)));
    const tailSeq = lightSeq.slice(-tailLen);

    function loopTail() {
      playSequence(tailSeq, fps, loopTail);
    }

    // Skip frame-005 on first play — HTML already shows it, avoids blink.
    const introSeq = (lightPlayCount === 0) ? lightSeq.slice(1) : lightSeq;
    lightPlayCount++;
    playSequence(introSeq, fps, loopTail);
  }

  // ── Preload schedule ──────────────────────────────────────────────────────
  preload([5, 6, 7, 8, 9, 10]);
  preload(lightSeq);

  // ── Boot guard ────────────────────────────────────────────────────────────
  const mediaInner = imgA.closest('.home-hero-media-inner');

  function boot() {
    if (mediaInner) mediaInner.setAttribute('data-anim-ready', '1');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(toLight, 120);
    }));
  }

  if (imgA.complete && imgA.naturalWidth > 0) {
    requestAnimationFrame(boot);
  } else {
    imgA.addEventListener('load',  boot, { once: true });
    imgA.addEventListener('error', boot, { once: true });
  }
})();
