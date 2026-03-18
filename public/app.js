(function () {
  'use strict';

  const elements = {
    chatMessages: document.getElementById('chat-messages'),
    chatWelcome: document.getElementById('chat-welcome'),
    roughPrompt: document.getElementById('rough-prompt'),
    polishBtn: document.getElementById('polish-btn'),
  };

  function polishPrompt(raw) {
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
    // "an" before consonant sounds → "a"
    cleaned = cleaned.replace(/\ban\s+([bcdfghjklmnpqrstvwxyz])/gi, function (match, letter) {
      return (/[A-Z]/.test(match[0]) ? 'A ' : 'a ') + letter;
    });
    // "a" before vowel sounds → "an"
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

    // 7. Add tailored context — specific to what was detected
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

    improvements.push('Ready for any LLM — no clarification needed');

    return { raw: text, cleaned, bullets: [cleaned], improvements };
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
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

  function appendAssistantMessage(result) {
    if (elements.chatWelcome) elements.chatWelcome.style.display = 'none';
    if (!elements.chatMessages) return;
    const text = result.cleaned || (result.bullets && result.bullets.length ? result.bullets.join('\n\n') : '');
    const improvementsHtml = result.improvements && result.improvements.length
      ? '<ul class="chat-message-improvements">' +
        result.improvements.map(function (i) {
          return '<li><span class="check">✓</span> ' + escapeHtml(i) + '</li>';
        }).join('') + '</ul>'
      : '';
    const div = document.createElement('div');
    div.className = 'chat-message assistant';
    div.innerHTML =
      '<p class="chat-message-body">' + escapeHtml(text || '') + '</p>' +
      improvementsHtml +
      '<div class="chat-message-actions"><button type="button" class="btn btn-outline btn-sm btn-copy-msg">Copy</button></div>';
    const body = div.querySelector('.chat-message-body');
    const copyBtn = div.querySelector('.btn-copy-msg');

    // Clipboard API requires secure context (HTTPS) on most origins; on HTTP, this often won't exist.
    if (copyBtn && body) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        copyBtn.addEventListener('click', function () {
          var t = (body.textContent || '').trim();
          if (t) {
            navigator.clipboard.writeText(t).then(function () {
              copyBtn.textContent = 'Copied!';
              setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
            });
          }
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

  function applyApiResult(raw, api) {
    return {
      raw: raw,
      cleaned: api.polished || '',
      bullets: Array.isArray(api.bullets) && api.bullets.length ? api.bullets : [api.polished || raw],
      improvements: Array.isArray(api.improvements) && api.improvements.length ? api.improvements : ['Clearer structure and intent', 'More specific, actionable phrasing'],
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

  function runPolish() {
    const raw = (elements.roughPrompt && elements.roughPrompt.value) || '';
    const trimmed = raw ? raw.trim() : '';
    if (!trimmed) return;

    const btn = elements.polishBtn;
    const originalInner = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
    }
    if (elements.roughPrompt) elements.roughPrompt.value = '';

    appendUserMessage(trimmed);

    const params = getParams();
    const mode = isAiOn() ? 'ai' : 'basic';

    fetch('/api/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
          showToast('Rate limit reached — 20 polishes per hour on the free plan.');
          throw new Error('rate_limit');
        }
        if (res.ok) return res.json();
        return res.json().then(function (body) { throw new Error(body.message || body.error || 'Request failed'); });
      })
      .then(function (api) {
        var result = applyApiResult(trimmed, api);
        appendAssistantMessage(result);
      })
      .catch(function (err) {
        if (err && err.message === 'rate_limit') return;
        var result = polishPrompt(trimmed);
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
