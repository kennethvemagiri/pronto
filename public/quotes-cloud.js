(function () {
  'use strict';

  const cloud = document.querySelector('.quotes-cloud');
  if (!cloud) return;

  const cards = Array.from(cloud.querySelectorAll('.quote-card'));
  if (!cards.length) return;

  // Per-card typing state so animations never sync/overlap incorrectly.
  const typing = new WeakMap(); // el -> { token: number }

  function uniqSample(arr, n) {
    const out = [];
    const used = new Set();
    const max = Math.min(n, arr.length);
    while (out.length < max) {
      const idx = Math.floor(Math.random() * arr.length);
      if (used.has(idx)) continue;
      used.add(idx);
      out.push(arr[idx]);
    }
    return out;
  }

  function normalizeQuotes(raw) {
    return raw
      .replace(/\r\n/g, '\n')
      .split(/\n+/g)
      .join(' ')
      .replace(/\[\u2026continued[\s\S]*?\]/gi, '') // remove placeholder line if present
      .split(/[.!?]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10 && s.length <= 90);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function typeInto(el, text, opts) {
    // Fast, smooth typing — close to a 60fps feel.
    const speed = opts && opts.speed ? opts.speed : 10; // ms per char baseline
    const jitter = opts && opts.jitter ? opts.jitter : 6;

    const st = typing.get(el) || { token: 0 };
    st.token++;
    typing.set(el, st);
    const token = st.token;

    el.classList.add('is-on');
    el.textContent = '';

    for (let i = 0; i < text.length; i++) {
      if ((typing.get(el) || {}).token !== token) return;
      el.textContent += text[i];
      const d = speed + Math.floor(Math.random() * jitter);
      // punctuation pause
      const ch = text[i];
      const extra = (ch === '.' || ch === '!' || ch === '?') ? 40 : (ch === ',' ? 20 : 0);
      await sleep(d + extra);
    }

    if ((typing.get(el) || {}).token !== token) return;
  }

  function pickOne(quotes) {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  function startStaggeredTyping(quotes) {
    const baseInterval = 9200; // each card cycles on its own interval
    const startGap = 1200;     // stagger on initial load

    cards.forEach((card, i) => {
      const offset = i * 2200;
      // Initial delayed start so they don't all begin together
      setTimeout(() => {
        typeInto(card, pickOne(quotes), { speed: 10, jitter: 6 });
        // Independent cycle per-card; desynced by offset
        setInterval(() => {
          typeInto(card, pickOne(quotes), { speed: 10, jitter: 6 });
        }, baseInterval + offset);
      }, i * startGap);
    });
  }

  // Fetch from your source-of-truth file so you can edit quotes without code changes.
  fetch('/animations/clarity_intent_quotes.txt', { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error('quotes fetch failed'))))
    .then((txt) => {
      const quotes = normalizeQuotes(txt);
      if (!quotes.length) return;
      cloud.classList.add('is-ready');
      startStaggeredTyping(quotes);
    })
    .catch(() => {
      // Fail silently: landing must never break because of quotes.
    });
})();

