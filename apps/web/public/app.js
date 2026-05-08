(function () {
  'use strict';

  const elements = {
    chatMessages: document.getElementById('chat-messages'),
    chatWelcome: document.getElementById('chat-welcome'),
    roughPrompt: document.getElementById('rough-prompt'),
    polishBtn: document.getElementById('polish-btn'),
  };

  function polishPrompt(raw, tone) {
    const text = (raw || '').trim();
    if (!text) return { bullets: [], improvements: [] };

    const improvements = [];
    let cleaned = text;

    // 1. Normalise whitespace and punctuation
    cleaned = cleaned
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*[.?!]\s*$/, '')
      .trim();

    // 2. Common typo / spelling corrections
    const typos = [
      [/\bporofolio\b/gi, 'portfolio'],
      [/\bportfoilo\b/gi, 'portfolio'],
      [/\bportflio\b/gi, 'portfolio'],
      [/\bfuild\b/gi, 'fluid'],
      [/\bwebiste\b/gi, 'website'],
      [/\bwebstie\b/gi, 'website'],
      [/\bworkbecnh\b/gi, 'workbench'],
      [/\bworkbnch\b/gi, 'workbench'],
      [/\bdashboad\b/gi, 'dashboard'],
      [/\bdashborad\b/gi, 'dashboard'],
      [/\bmarkteing\b/gi, 'marketing'],
      [/\bmarketting\b/gi, 'marketing'],
      [/\bresponsivie\b/gi, 'responsive'],
      [/\banimaiton\b/gi, 'animation'],
      [/\banimtaion\b/gi, 'animation'],
      [/\blandign\b/gi, 'landing'],
      [/\bdesgin\b/gi, 'design'],
      [/\bwokring\b/gi, 'working'],
      [/\bcrative\b/gi, 'creative'],
      [/\bcrestive\b/gi, 'creative'],
      [/\bprofesional\b/gi, 'professional'],
      [/\bprofessonal\b/gi, 'professional'],
      [/\bapplicaiton\b/gi, 'application'],
      [/\bapplicaton\b/gi, 'application'],
    ];
    let hadTypo = false;
    typos.forEach(function (pair) {
      const fixed = cleaned.replace(pair[0], pair[1]);
      if (fixed !== cleaned) { cleaned = fixed; hadTypo = true; }
    });
    if (hadTypo) improvements.push('Fixed spelling errors');

    // 3. Fix "a/an" article grammar
    cleaned = cleaned.replace(/\ban\s+([bcdfghjklmnpqrstvwxyz])/gi, function (match, letter) {
      return (/[A-Z]/.test(match[0]) ? 'A ' : 'a ') + letter;
    });
    cleaned = cleaned.replace(/\ba\s+([aeiou])/gi, function (match, letter) {
      return (/[A-Z]/.test(match[0]) ? 'An ' : 'an ') + letter;
    });

    // 4. Strip weak filler openers
    const fillerOpeners = /^(um+,?\s*|so,?\s*|basically,?\s*|okay so,?\s*|i want(ed)? (you |to )?|i need(ed)? (you |to )?|can you (please )?|could you (please )?|please (help me |can you )?)/i;
    const stripped = cleaned.replace(fillerOpeners, '');
    if (stripped.length > 10 && stripped !== cleaned) {
      cleaned = stripped[0].toUpperCase() + stripped.slice(1);
      improvements.push('Removed filler opener for a direct prompt');
    }

    // 5. Capitalise first letter
    if (cleaned.length > 0) {
      cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
    }

    // 6. Detect intent
    const isWrite    = /\b(write|draft|create|make|generate|compose|build|design)\b/i.test(cleaned);
    const isExplain  = /\b(explain|what is|what are|describe|tell me|how does|why does|define)\b/i.test(cleaned);
    const isList     = /\b(list|give me|show me|name|examples? of)\b/i.test(cleaned);
    const isCode     = /\b(code|function|script|program|implement|develop)\b/i.test(cleaned);
    const isSummary  = /\b(summar(ise|ize)|tldr|brief(ly)?)\b/i.test(cleaned);
    const isPortfolio = /\bportfolio\b/i.test(cleaned);
    const isWebsite  = /\b(website|web (app|page|site)|landing page)\b/i.test(cleaned);
    const isDashboard = /\bdashboard\b/i.test(cleaned);

    // 7. Add tailored context
    if (isPortfolio) {
      cleaned += '. Include sections for About, Skills, Projects, and Contact. Use a professional yet personal tone that showcases personality and expertise.';
      improvements.push('Added portfolio sections and tone guidance');
    } else if (isWebsite && /fluid|animation|motion|3d|effect/i.test(cleaned)) {
      cleaned += '. Describe the visual style, animation behaviour, colour palette, and how it should feel on interaction.';
      improvements.push('Added visual and interaction specifications');
    } else if (isWebsite) {
      cleaned += '. Specify the target audience, key pages needed, and the overall look and feel.';
      improvements.push('Added website scope and audience guidance');
    } else if (isDashboard) {
      cleaned += '. Include the key metrics to display, user role, and preferred layout (cards, charts, tables).';
      improvements.push('Added dashboard scope and layout guidance');
    } else if (isCode) {
      cleaned += '. Specify the language/framework, expected input/output, and include inline comments.';
      improvements.push('Added technical specification requirements');
    } else if (isExplain) {
      cleaned += '. Explain with a simple analogy and a real-world example. Assume no prior knowledge.';
      improvements.push('Added clarity and example requirement');
    } else if (isList) {
      cleaned += '. Provide at least 5 specific, actionable items with a brief explanation for each.';
      improvements.push('Added quantity and detail requirement');
    } else if (isSummary) {
      cleaned += '. Use bullet points, keep it under 100 words, and highlight the 3 most important points.';
      improvements.push('Added summary format and length constraints');
    } else if (isWrite) {
      cleaned += '. Use a clear structure with an intro, main points, and conclusion. Match the tone to the audience.';
      improvements.push('Added structure and tone guidance');
    } else {
      improvements.push('Clarified intent and phrasing');
    }

    // Apply tone
    if (tone === 'professional') {
      cleaned += ' Use formal, precise language and a structured format.';
      improvements.push('Tone set to professional');
    } else if (tone === 'friendly') {
      cleaned += ' Use a warm, conversational tone.';
      improvements.push('Tone set to friendly');
    } else if (tone === 'detailed') {
      cleaned += ' Be thorough — include examples, edge cases, and detailed explanations.';
      improvements.push('Tone set to detailed');
    } else if (tone === 'creative') {
      cleaned += ' Use an expressive, imaginative tone that encourages originality.';
      improvements.push('Tone set to creative');
    }

    improvements.push('Ready for any LLM — no clarification needed');

    return { raw: text, cleaned, bullets: [cleaned], improvements };
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function normalizePolishedText(s) {
    return String(s || '')
      .replace(/\\\\r\\\\n/g, '\n')
      .replace(/\\\\n/g, '\n')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n');
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function computePromptScores(original, enhanced, params) {
    const o = String(original || '').trim();
    const e = String(enhanced || '').trim();
    const audience = params && params.audience ? String(params.audience).trim() : '';
    const constraints = params && params.constraints ? String(params.constraints).trim() : '';

    const hasStructure = /\b(include|specify|provide|use|format|output|steps?|bullet|table|json|markdown)\b/i.test(e);
    const hasNumbers = /\b\d+\b/.test(e);
    const hasConstraints = !!constraints || /\b(max|under|limit|no\s+bullet|must|should|avoid)\b/i.test(e);
    const hasAudience = !!audience || /\b(for|target)\s+(audience|beginners|students|executives|developers?)\b/i.test(e);

    const lenGain = o.length ? (e.length - o.length) / o.length : 0;
    const tooLong = e.length > 800;
    const tooShort = e.length < 40;

    let clarity = 72;
    if (hasStructure) clarity += 10;
    if (hasConstraints) clarity += 6;
    if (tooShort) clarity -= 10;
    if (tooLong) clarity -= 8;
    if (lenGain > 0.2) clarity += 4;
    clarity = clamp(Math.round(clarity), 55, 95);

    let specificity = 70;
    if (hasAudience) specificity += 8;
    if (hasConstraints) specificity += 8;
    if (hasNumbers) specificity += 4;
    if (hasStructure) specificity += 6;
    if (lenGain > 0.35) specificity += 4;
    if (tooShort) specificity -= 10;
    specificity = clamp(Math.round(specificity), 55, 95);

    return { clarity, specificity };
  }

  function computeImprovementTags(result) {
    const tags = [];
    const audience = result && result.audience ? String(result.audience).trim() : '';
    const constraints = result && result.constraints ? String(result.constraints).trim() : '';
    const after = result && result.cleaned ? String(result.cleaned) : '';

    if (audience) tags.push('Added target audience');
    if (constraints) tags.push('Set constraints');
    if (/\b(output|format|return|respond|structure|json|markdown|table|bullets?)\b/i.test(after)) tags.push('Defined output format');
    if (/\b(steps?|checklist|sections?|outline)\b/i.test(after)) tags.push('Added structure');
    if (/\b(at least|must|include)\b/i.test(after)) tags.push('Made requirements explicit');

    // Ensure we always show something useful.
    if (!tags.length) tags.push('Improved clarity');
    return tags.slice(0, 4);
  }

  // Render marked-up output with keywords and editable words
  function renderMarkedOutput(markedData) {
    if (!markedData || markedData.length === 0) {
      return null;
    }

    function normalizeText(s) {
      return normalizePolishedText(s);
    }

    function appendTextWithBreaks(parent, text) {
      const t = normalizeText(text);
      const parts = t.split('\n');
      for (let i = 0; i < parts.length; i += 1) {
        if (parts[i]) parent.appendChild(document.createTextNode(parts[i]));
        if (i !== parts.length - 1) parent.appendChild(document.createElement('br'));
      }
    }

    const fragment = document.createDocumentFragment();
    markedData.forEach(function (segment) {
      if (segment.type === 'keyword') {
        const span = document.createElement('span');
        span.className = 'keyword';
        appendTextWithBreaks(span, segment.text);
        fragment.appendChild(span);
      } else if (segment.type === 'editable') {
        const span = document.createElement('span');
        span.className = 'editable';
        span.contentEditable = 'true';
        appendTextWithBreaks(span, segment.text);
        span.dataset.originalText = normalizeText(segment.text);
        fragment.appendChild(span);
      } else {
        const wrap = document.createElement('span');
        appendTextWithBreaks(wrap, segment.text);
        fragment.appendChild(wrap);
      }
    });

    return fragment;
  }

  function appendUserMessage(raw) {
    if (elements.chatWelcome) elements.chatWelcome.style.display = 'none';
    if (!elements.chatMessages) return;
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.innerHTML = '<p class="chat-message-body">' + escapeHtml(raw) + '</p>';
    elements.chatMessages.appendChild(div);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  // Renders a plain error card inside the chat stream
  function appendErrorMessage(msg, linkHtml) {
    if (elements.chatWelcome) elements.chatWelcome.style.display = 'none';
    if (!elements.chatMessages) return;
    var div = document.createElement('div');
    div.className = 'wb-chat-error';
    div.innerHTML =
      '<span class="wb-chat-error-icon" aria-hidden="true">⚠</span>' +
      '<span class="wb-chat-error-text">' + escapeHtml(msg) + '</span>' +
      (linkHtml ? '<span class="wb-chat-error-link">' + linkHtml + '</span>' : '');
    elements.chatMessages.appendChild(div);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function appendAssistantMessage(result) {
    if (elements.chatWelcome) elements.chatWelcome.style.display = 'none';
    if (!elements.chatMessages) return;
    const beforeText = String(result.raw || '').trim();
    const afterText = normalizePolishedText(result.cleaned).trim();
    const tags = computeImprovementTags(result);
    const scores = computePromptScores(beforeText, afterText, { audience: result.audience, constraints: result.constraints });

    const div = document.createElement('div');
    div.className = 'chat-message assistant';
    div.innerHTML =
      '<div class="wb-output-card">' +
        '<div class="wb-output-header">' +
          '<div class="wb-output-title">Before → After</div>' +
          '<div class="wb-output-scores">' +
            '<div class="wb-score" style="--p:' + scores.clarity + '">' +
              '<div class="wb-score-ring" aria-hidden="true"></div>' +
              '<div class="wb-score-meta"><div class="wb-score-label">Clarity</div><div class="wb-score-val">' + scores.clarity + '%</div></div>' +
            '</div>' +
            '<div class="wb-score" style="--p:' + scores.specificity + '">' +
              '<div class="wb-score-ring" aria-hidden="true"></div>' +
              '<div class="wb-score-meta"><div class="wb-score-label">Specificity</div><div class="wb-score-val">' + scores.specificity + '%</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="wb-output-before">' +
          '<div class="wb-output-label">Before</div>' +
          '<div class="wb-output-text wb-output-text--before">' + escapeHtml(beforeText) + '</div>' +
        '</div>' +

        '<div class="wb-output-divider"></div>' +

        '<div class="wb-output-after">' +
          '<div class="wb-output-label-row">' +
            '<div class="wb-output-label">After</div>' +
            '<button type="button" class="wb-output-copy" aria-label="Copy enhanced prompt" title="Copy">' +
              '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
                '<rect x="5" y="5" width="9" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
                '<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v7A1.5 1.5 0 0 0 3.5 12H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
          '<div class="wb-output-text wb-output-text--after"></div>' +
        '</div>' +

        '<div class="wb-output-tags">' +
          tags.map(function (t) { return '<span class="wb-tag">' + escapeHtml(t) + '</span>'; }).join('') +
        '</div>' +
      '</div>';

    const afterEl = div.querySelector('.wb-output-text--after');

    // Use marked output if available (AI mode with keywords/editables)
    if (afterEl) {
      if (result.marked && Array.isArray(result.marked)) {
        afterEl.className += ' wb-marked-output';
        const markedFragment = renderMarkedOutput(result.marked);
        if (markedFragment) afterEl.appendChild(markedFragment);
        else afterEl.textContent = afterText;
      } else {
        afterEl.innerHTML = escapeHtml(afterText || '').replace(/\n/g, '<br>');
      }
    }

    // Store original prompt and mode for re-polish
    if (result.raw && result.mode) {
      div.dataset.originalPrompt = result.raw;
      div.dataset.mode = result.mode;
      div.dataset.audience = result.audience || '';
      div.dataset.tone = result.tone || '';
      div.dataset.constraints = result.constraints || '';
    }

    const copyBtn = div.querySelector('.wb-output-copy');
    if (copyBtn) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        copyBtn.addEventListener('click', function () {
          var t = (afterEl ? (afterEl.textContent || '') : '').trim();
          if (!t) return;
          navigator.clipboard.writeText(t).then(function () {
            copyBtn.classList.add('is-copied');
            setTimeout(function () { copyBtn.classList.remove('is-copied'); }, 1200);
          });
        });
      } else {
        copyBtn.disabled = true;
        copyBtn.title = 'Copy is available on HTTPS or localhost with clipboard permissions.';
      }
    }

    elements.chatMessages.appendChild(div);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function getParams() {
    const audience = document.getElementById('target-audience');
    const tone = document.getElementById('desired-tone');
    const constraints = document.getElementById('constraints');
    return {
      audience: audience ? audience.value.trim() : '',
      tone: tone ? tone.value.trim() : '',
      constraints: constraints ? constraints.value.trim() : '',
    };
  }

  function applyApiResult(raw, api, mode, audience, tone, constraints) {
    return {
      raw: raw,
      cleaned: normalizePolishedText(api.polished || ''),
      bullets: Array.isArray(api.bullets) && api.bullets.length
        ? api.bullets.map(normalizePolishedText)
        : [normalizePolishedText(api.polished || raw)],
      improvements: Array.isArray(api.improvements) && api.improvements.length ? api.improvements : ['Clearer structure and intent', 'More specific, actionable phrasing'],
      marked: Array.isArray(api.marked) ? api.marked : null,
      mode: mode,
      audience: audience,
      tone: tone,
      constraints: constraints,
    };
  }

  function showToast(msg) {
    var existing = document.querySelector('.pronto-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'pronto-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    });
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3500);
  }

  function isAiOn() {
    var wrap = document.getElementById('wb-ai-wrap');
    return wrap ? wrap.classList.contains('is-on') : false;
  }

  function isConciseOn() {
    var wrap = document.getElementById('wb-concise-wrap');
    return wrap ? wrap.classList.contains('is-on') : false;
  }

  // Shake the input card to signal "you need to type something"
  function shakeInput() {
    var card = document.querySelector('.wb-input-card');
    if (!card) return;
    card.classList.add('wb-shake');
    setTimeout(function () { card.classList.remove('wb-shake'); }, 500);
  }

  function runPolish() {
    const raw = (elements.roughPrompt && elements.roughPrompt.value) || '';
    const trimmed = raw ? raw.trim() : '';

    if (!trimmed) {
      shakeInput();
      return;
    }

    const btn = elements.polishBtn;
    const originalInner = btn ? btn.innerHTML : '';
    if (btn) btn.disabled = true;
    if (elements.roughPrompt) elements.roughPrompt.value = '';

    appendUserMessage(trimmed);

    const params = getParams();
    const mode = isConciseOn() ? 'concise' : (isAiOn() ? 'ai' : 'basic');

    var authHeaders = {};
    if (window._supabaseSession && window._supabaseSession.access_token) {
      authHeaders['Authorization'] = 'Bearer ' + window._supabaseSession.access_token;
    }

    fetch('/api/polish', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders),
      body: JSON.stringify({
        prompt: trimmed,
        audience: params.audience,
        tone: params.tone,
        constraints: params.constraints,
        mode: mode,
      }),
    })
      .then(function (res) {
        if (res.status === 429) {
          var e = new Error('rate_limit'); e.code = 'rate_limit'; throw e;
        }
        if (res.status === 503) {
          var e = new Error('no_ai'); e.code = 'no_ai'; throw e;
        }
        if (res.ok) return res.json();
        return res.json().then(function (body) {
          var e = new Error(body.message || body.error || 'Request failed');
          e.code = 'api_error';
          throw e;
        });
      })
      .then(function (api) {
        var result = applyApiResult(trimmed, api, mode, params.audience, params.tone, params.constraints);
        appendAssistantMessage(result);
      })
      .catch(function (err) {
        var code = err && err.code;

        // Rate limit — show in-chat error with upgrade link
        if (code === 'rate_limit') {
          appendErrorMessage(
            'You\'ve used your 20 free polishes this hour. Resets in 60 min.',
            '<a href="/pricing.html">Upgrade to Pro for unlimited →</a>'
          );
          return;
        }

        // All other errors — fall back to local polish and tell the user why
        var note;
        if (!navigator.onLine) {
          note = mode === 'concise' ? 'No internet connection — basic polish applied.' : 'No internet connection — basic polish applied.';
        } else if (code === 'no_ai') {
          note = mode === 'concise' ? 'AI not configured — basic polish applied.' : 'AI not configured — basic polish applied.';
        } else {
          note = mode === 'concise' ? 'AI had an issue — basic polish applied.' : 'AI had an issue — basic polish applied.';
        }

        var result = polishPrompt(trimmed, params.tone);
        result._fallbackNote = note;
        result.raw = trimmed;
        result.mode = 'basic';
        result.audience = params.audience;
        result.tone = params.tone;
        result.constraints = params.constraints;
        appendAssistantMessage(result);
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalInner;
        }
      });
  }

  if (elements.polishBtn) {
    elements.polishBtn.addEventListener('click', runPolish);
  }

  if (elements.roughPrompt) {
    elements.roughPrompt.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        runPolish();
      }
    });
  }

})();
