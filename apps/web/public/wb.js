(function () {
  'use strict';

  var textarea       = document.getElementById('rough-prompt');
  var polishBtn      = document.getElementById('polish-btn');
  var chatMessages   = document.getElementById('chat-messages');
  var chatWelcome    = document.getElementById('chat-welcome');
  var toneSelect     = document.getElementById('desired-tone');
  var extrasPanel    = document.getElementById('wb-extras');
  var extrasToggle   = document.getElementById('wb-extras-toggle');
  var clearBtn       = document.getElementById('wb-clear-btn');
  var audienceInput  = document.getElementById('target-audience');
  var constraintsInput = document.getElementById('constraints');

  /* ── Auto-resize textarea ── */
  if (textarea) {
    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 180) + 'px';
    });
  }

  /* ── Clear button active state ── */
  function hasAssistantMessages() {
    if (!chatMessages) return false;
    return !!chatMessages.querySelector('.chat-message.assistant, .wb-chat-error, .wb-typing');
  }

  function updateClearButtonState() {
    if (!clearBtn) return;
    var hasText = textarea ? !!String(textarea.value || '').trim() : false;
    var hasOutput = hasAssistantMessages();
    clearBtn.classList.toggle('is-active', hasText || hasOutput);

    // Center welcome state when nothing has been sent yet
    if (chatMessages) {
      var isEmpty = !hasOutput;
      chatMessages.classList.toggle('is-empty', isEmpty);
    }
  }

  if (textarea) {
    textarea.addEventListener('input', updateClearButtonState);
  }
  if (chatMessages) {
    var clearStateObserver = new MutationObserver(updateClearButtonState);
    clearStateObserver.observe(chatMessages, { childList: true, subtree: true });
  }
  updateClearButtonState();


  /* ── Extras panel toggle (audience + constraints) ── */
  if (extrasToggle && extrasPanel) {
    extrasToggle.addEventListener('click', function () {
      var isOpen = extrasPanel.classList.toggle('is-open');
      extrasToggle.classList.toggle('is-active', isOpen);
      extrasToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      extrasToggle.setAttribute('aria-label', isOpen ? 'Hide audience and constraints' : 'Add audience and constraints');
      if (isOpen && audienceInput) audienceInput.focus();
    });
  }

  /* ── AI toggle ── */
  var aiWrap = document.getElementById('wb-ai-wrap');
  var aiToggle = document.getElementById('wb-ai-toggle');
  var aiMsg = document.getElementById('wb-ai-msg');
  var conciseWrap = document.getElementById('wb-concise-wrap');
  var conciseToggle = document.getElementById('wb-concise-toggle');
  var modeSelect = document.getElementById('wb-mode-select');

  function setModeLabel() {
    if (!aiMsg) return;
    var conciseOn = conciseWrap ? conciseWrap.classList.contains('is-on') : false;
    var aiOn = aiWrap ? aiWrap.classList.contains('is-on') : false;
    aiMsg.textContent = conciseOn ? 'concise polish' : (aiOn ? 'deep AI polish' : 'basic polish');
  }

  function setWrapState(wrap, isOn) {
    if (!wrap) return;
    wrap.classList.toggle('is-on', !!isOn);
    wrap.classList.toggle('is-off', !isOn);
  }

  function applyMode(mode) {
    var m = String(mode || '').toLowerCase();
    if (m === 'concise') {
      if (aiWrap) setWrapState(aiWrap, false);
      if (conciseWrap) setWrapState(conciseWrap, true);
      if (aiToggle) {
        aiToggle.setAttribute('aria-pressed', 'false');
        aiToggle.setAttribute('aria-label', 'AI assist off');
      }
      if (conciseToggle) {
        conciseToggle.setAttribute('aria-pressed', 'true');
        conciseToggle.setAttribute('aria-label', 'Concise mode on');
      }
    } else if (m === 'ai') {
      if (conciseWrap) setWrapState(conciseWrap, false);
      if (aiWrap) setWrapState(aiWrap, true);
      if (aiToggle) {
        aiToggle.setAttribute('aria-pressed', 'true');
        aiToggle.setAttribute('aria-label', 'AI assist on');
      }
      if (conciseToggle) {
        conciseToggle.setAttribute('aria-pressed', 'false');
        conciseToggle.setAttribute('aria-label', 'Concise mode off');
      }
    } else {
      // basic
      if (conciseWrap) setWrapState(conciseWrap, false);
      if (aiWrap) setWrapState(aiWrap, false);
      if (aiToggle) {
        aiToggle.setAttribute('aria-pressed', 'false');
        aiToggle.setAttribute('aria-label', 'AI assist off');
      }
      if (conciseToggle) {
        conciseToggle.setAttribute('aria-pressed', 'false');
        conciseToggle.setAttribute('aria-label', 'Concise mode off');
      }
    }

    if (modeSelect) modeSelect.value = m || 'basic';
    setModeLabel();
  }

  function getCurrentMode() {
    var conciseOn = conciseWrap ? conciseWrap.classList.contains('is-on') : false;
    var aiOn = aiWrap ? aiWrap.classList.contains('is-on') : false;
    if (conciseOn) return 'concise';
    if (aiOn) return 'ai';
    return 'basic';
  }

  if (aiWrap && aiToggle) {
    aiToggle.addEventListener('click', function () {
      var isOn = aiWrap.classList.toggle('is-on');
      aiWrap.classList.toggle('is-off', !isOn);
      aiToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      aiToggle.setAttribute('aria-label', isOn ? 'AI assist on' : 'AI assist off');
      if (conciseWrap) setWrapState(conciseWrap, false);
      if (modeSelect) modeSelect.value = getCurrentMode();
      setModeLabel();
    });
  }

  /* ── Concise toggle ── */
  if (conciseWrap && conciseToggle) {
    conciseToggle.addEventListener('click', function () {
      if (aiWrap) setWrapState(aiWrap, false);
      if (aiToggle) {
        aiToggle.setAttribute('aria-pressed', 'false');
        aiToggle.setAttribute('aria-label', 'AI assist off');
      }

      var isOn = conciseWrap.classList.toggle('is-on');
      conciseWrap.classList.toggle('is-off', !isOn);
      conciseToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      conciseToggle.setAttribute('aria-label', isOn ? 'Concise mode on' : 'Concise mode off');
      if (modeSelect) modeSelect.value = getCurrentMode();
      setModeLabel();
    });
  }

  // Ensure initial label matches initial UI state
  if (modeSelect) {
    modeSelect.value = getCurrentMode();
    modeSelect.addEventListener('change', function () {
      applyMode(modeSelect.value);
    });
  }
  setModeLabel();

  /* ── API health badge ── */
  var apiBadge = document.getElementById('wb-api-badge');
  var apiText = apiBadge ? apiBadge.querySelector('.wb-api-text') : null;
  var apiCheckTimer = null;
  var inFlight = null;

  function setApiState(state) {
    if (!apiBadge) return;
    apiBadge.classList.toggle('is-online', state === 'online');
    apiBadge.classList.toggle('is-offline', state === 'offline');
    apiBadge.classList.toggle('is-checking', state === 'checking');

    if (apiText) apiText.textContent = state;
    apiBadge.title =
      state === 'online' ? 'API online' :
      state === 'offline' ? 'API offline' :
      'Checking API…';
  }

  function checkApiHealth() {
    if (!apiBadge) return;

    // avoid piling up requests
    if (inFlight && inFlight.abort) {
      try { inFlight.abort(); } catch (_) {}
    }

    setApiState('checking');
    var ctrl = new AbortController();
    inFlight = ctrl;

    // 3.5s timeout
    var to = setTimeout(function () {
      try { ctrl.abort(); } catch (_) {}
    }, 3500);

    fetch('/health', { method: 'GET', cache: 'no-store', signal: ctrl.signal })
      .then(function (r) {
        if (!r.ok) throw new Error('bad_status');
        return r.json().catch(function () { return {}; });
      })
      .then(function (body) {
        // Treat "ok" as online; any response is still a sign the API is reachable.
        var ok = body && body.status === 'ok';
        setApiState(ok ? 'online' : 'online');
      })
      .catch(function () {
        setApiState('offline');
      })
      .finally(function () {
        clearTimeout(to);
        inFlight = null;
      });
  }

  if (apiBadge) {
    checkApiHealth();
    apiCheckTimer = setInterval(checkApiHealth, 15000);
    window.addEventListener('online', checkApiHealth);
    window.addEventListener('offline', function () { setApiState('offline'); });
  }

  /* ── Tone pill buttons ── */
  var tonePills = document.querySelectorAll('.wb-tone-pill');
  tonePills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      // Deactivate all pills
      tonePills.forEach(function (p) { p.classList.remove('is-active'); });
      // Activate clicked pill
      pill.classList.add('is-active');
      // Sync hidden select so app.js picks up the value
      if (toneSelect) toneSelect.value = pill.dataset.tone || '';
      // Refocus textarea
      if (textarea) textarea.focus();
    });
  });

  /* ── Typing indicator ── */
  var typingEl = null;

  function showTyping() {
    if (!chatMessages || typingEl) return;
    if (chatWelcome) chatWelcome.style.display = 'none';
    typingEl = document.createElement('div');
    typingEl.className = 'wb-typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }
    typingEl = null;
  }

  // Watch polish button disabled state to drive typing indicator
  if (polishBtn) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'disabled') {
          polishBtn.disabled ? showTyping() : hideTyping();
        }
      });
    });
    observer.observe(polishBtn, { attributes: true });
  }

  // Copy + tags + scores are now rendered directly by app.js in the output card.

  /* ── Clear input + output (no refresh) ── */
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      // Clear textarea
      if (textarea) {
        textarea.value = '';
        textarea.dispatchEvent(new Event('input'));
        textarea.focus();
      }

      // Close extras panel
      if (extrasPanel && extrasToggle) {
        extrasPanel.classList.remove('is-open');
        extrasToggle.classList.remove('is-active');
        extrasToggle.setAttribute('aria-expanded', 'false');
        extrasToggle.setAttribute('aria-label', 'Add audience and constraints');
      }

      // Clear chat/output messages but keep welcome block
      if (chatMessages) {
        Array.prototype.slice.call(chatMessages.children).forEach(function (child) {
          if (chatWelcome && child === chatWelcome) return;
          chatMessages.removeChild(child);
        });
        if (chatWelcome) chatWelcome.style.display = '';
        chatMessages.scrollTop = 0;
      }

      // Remove typing indicator if present
      hideTyping();

      // Update clear button state after clearing
      updateClearButtonState();
    });
  }

  /* ── Re-polish on editable word change ── */
  var editDebounceTimer = null;
  var pendingAbortController = null;

  function renderMarkedFragment(markedData) {
    if (!markedData || !Array.isArray(markedData)) return null;
    function normalizePolishedText(s) {
      return String(s || '')
        .replace(/\\\\r\\\\n/g, '\n')
        .replace(/\\\\n/g, '\n')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n');
    }
    function appendTextWithBreaks(el, text) {
      var t = normalizePolishedText(text);
      var parts = t.split('\n');
      for (var i = 0; i < parts.length; i += 1) {
        if (parts[i]) el.appendChild(document.createTextNode(parts[i]));
        if (i !== parts.length - 1) el.appendChild(document.createElement('br'));
      }
    }
    var fragment = document.createDocumentFragment();
    markedData.forEach(function (segment) {
      if (segment.type === 'keyword') {
        var span = document.createElement('span');
        span.className = 'keyword';
        appendTextWithBreaks(span, segment.text);
        fragment.appendChild(span);
      } else if (segment.type === 'editable') {
        var span = document.createElement('span');
        span.className = 'editable';
        span.contentEditable = 'true';
        appendTextWithBreaks(span, segment.text);
        span.dataset.originalText = normalizePolishedText(segment.text);
        fragment.appendChild(span);
      } else {
        var wrap = document.createElement('span');
        appendTextWithBreaks(wrap, segment.text);
        fragment.appendChild(wrap);
      }
    });
    return fragment;
  }

  function triggerRePolish(editableEl) {
    var body = editableEl.closest('.chat-message-body');
    var msgEl = editableEl.closest('.chat-message.assistant');
    if (!body || !msgEl) return;

    var originalPrompt = msgEl.dataset.originalPrompt;
    var mode = msgEl.dataset.mode;
    var audience = msgEl.dataset.audience || '';
    var tone = msgEl.dataset.tone || '';
    var constraints = msgEl.dataset.constraints || '';

    if (!originalPrompt || mode !== 'ai') return;

    // Show loading state
    editableEl.classList.add('is-editing');

    // Cancel previous request if still pending
    if (pendingAbortController) {
      pendingAbortController.abort();
    }
    pendingAbortController = new AbortController();

    // Build updated prompt (replace the specific edited word)
    var updatedPrompt = originalPrompt;
    var editedText = editableEl.textContent.trim();
    var originalText = editableEl.dataset.originalText;
    if (originalText && editedText !== originalText) {
      // Replace first occurrence of original with edited
      updatedPrompt = updatedPrompt.replace(originalText, editedText);
    }

    var authHeaders = {};
    if (window._supabaseSession && window._supabaseSession.access_token) {
      authHeaders['Authorization'] = 'Bearer ' + window._supabaseSession.access_token;
    }

    fetch('/api/polish', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders),
      body: JSON.stringify({
        prompt: updatedPrompt,
        audience: audience,
        tone: tone,
        constraints: constraints,
        mode: 'ai',
      }),
      signal: pendingAbortController.signal,
    })
      .then(function (res) {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(function (data) {
        if (!pendingAbortController.signal.aborted && data.marked) {
          // Replace body contents with new marked output
          body.innerHTML = '';
          var newFragment = renderMarkedFragment(data.marked);
          if (newFragment) {
            body.appendChild(newFragment);
          }
          // Show brief success feedback
          var feedback = document.createElement('span');
          feedback.className = 'wb-repolish-feedback';
          feedback.textContent = '✓ Re-polished';
          body.appendChild(feedback);
          setTimeout(function () {
            if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
          }, 1500);
        }
      })
      .catch(function (err) {
        if (err.name !== 'AbortError') {
          console.warn('[repolish]', err.message);
        }
      })
      .finally(function () {
        editableEl.classList.remove('is-editing');
        pendingAbortController = null;
      });
  }

  function addEditableListeners(msgEl) {
    var body = msgEl.querySelector('.chat-message-body.wb-marked-output');
    if (!body) return;

    body.addEventListener('input', function (e) {
      if (e.target.classList.contains('editable')) {
        clearTimeout(editDebounceTimer);
        editDebounceTimer = setTimeout(function () {
          triggerRePolish(e.target);
        }, 500);
      }
    });
  }

  // Watch for new assistant messages
  if (chatMessages) {
    var msgObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.classList.contains('assistant')) {
            // slight delay so app.js finishes building the message
            setTimeout(function () {
              addEditableListeners(node);
            }, 80);
          }
        });
      });
    });
    msgObserver.observe(chatMessages, { childList: true });
  }

  /* ── Suggestion chips → fill textarea ── */
  document.querySelectorAll('.wb-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!textarea) return;
      textarea.value = chip.textContent.trim();
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
    });
  });

  // No sidebar / no persistence: refresh clears everything by design.

})();
