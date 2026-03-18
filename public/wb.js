(function () {
  'use strict';

  var textarea     = document.getElementById('rough-prompt');
  var polishBtn    = document.getElementById('polish-btn');
  var chatMessages = document.getElementById('chat-messages');
  var chatWelcome  = document.getElementById('chat-welcome');
  var toneSelect   = document.getElementById('desired-tone');

  /* ── Auto-resize textarea ── */
  if (textarea) {
    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 180) + 'px';
    });
  }


  /* ── AI toggle ── */
  var aiWrap = document.getElementById('wb-ai-wrap');
  var aiToggle = document.getElementById('wb-ai-toggle');
  var aiMsg = document.getElementById('wb-ai-msg');
  if (aiWrap && aiToggle) {
    aiToggle.addEventListener('click', function () {
      var isOn = aiWrap.classList.toggle('is-on');
      aiWrap.classList.toggle('is-off', !isOn);
      aiToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      aiToggle.setAttribute('aria-label', isOn ? 'AI assist on' : 'AI assist off');
      if (aiMsg) aiMsg.textContent = isOn ? 'deep AI polish' : 'basic polish';
    });
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

  /* ── Inject icon copy button into assistant messages ── */
  function addCopyButton(msgEl) {
    var body = msgEl.querySelector('.chat-message-body');
    var oldActions = msgEl.querySelector('.chat-message-actions');
    if (!body || msgEl.querySelector('.wb-copy-btn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wb-copy-btn';
    btn.setAttribute('aria-label', 'Copy polished prompt');
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<rect x="5" y="5" width="9" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v7A1.5 1.5 0 0 0 3.5 12H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg>';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      btn.addEventListener('click', function () {
        var t = (body.textContent || '').trim();
        if (!t) return;
        navigator.clipboard.writeText(t).then(function () {
          btn.classList.add('is-copied');
          btn.setAttribute('aria-label', 'Copied!');
          setTimeout(function () {
            btn.classList.remove('is-copied');
            btn.setAttribute('aria-label', 'Copy polished prompt');
          }, 1500);
        });
      });
    } else {
      btn.disabled = true;
      btn.title = 'Copy available on HTTPS or localhost';
    }

    msgEl.appendChild(btn);
    if (oldActions) oldActions.remove();
  }

  /* ── Inject collapsible toggle into improvements sections ── */
  function addImprovementsToggle(msgEl) {
    var list = msgEl.querySelector('.chat-message-improvements');
    if (!list || list.dataset.toggled) return;
    list.dataset.toggled = '1';

    var count = list.querySelectorAll('li').length;
    if (!count) return;

    // Build header button
    var header = document.createElement('div');
    header.className = 'wb-improvements-header';
    header.innerHTML =
      '<span class="wb-improvements-label">◆ ' + count + ' insight' + (count !== 1 ? 's' : '') + '</span>' +
      '<span class="wb-improvements-chevron">▾</span>';

    // Insert header just before the list
    list.parentNode.insertBefore(header, list);

    header.addEventListener('click', function () {
      var collapsed = header.classList.toggle('is-collapsed');
      list.classList.toggle('is-hidden', collapsed);
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
              addCopyButton(node);
              addImprovementsToggle(node);
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

  /* ── New chat ── */
  var newChatBtn = document.getElementById('wb-new-chat');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', function () {
      if (chatMessages) {
        chatMessages.querySelectorAll('.chat-message, .wb-typing').forEach(function (el) {
          el.remove();
        });
      }
      hideTyping();
      if (chatWelcome) chatWelcome.style.display = '';
      if (textarea)    { textarea.value = ''; textarea.style.height = ''; }
      // Reset tone to Default
      tonePills.forEach(function (p) { p.classList.remove('is-active'); });
      var defaultPill = document.querySelector('.wb-tone-pill[data-tone=""]');
      if (defaultPill) defaultPill.classList.add('is-active');
      if (toneSelect) toneSelect.value = '';
      closeSidebar();
    });
  }

  /* ── Sidebar (mobile + desktop collapse) ── */
  var sidebar = document.getElementById('wb-sidebar');
  var overlay = document.getElementById('wb-sidebar-overlay');
  var toggle  = document.querySelector('.wb-sidebar-toggle');
  var collapseBtn = document.getElementById('wb-sidebar-collapse');
  var expandBtn = document.getElementById('wb-sidebar-expand');

  function openSidebar()  {
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-visible');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function collapseSidebar() {
    if (sidebar) sidebar.classList.add('is-collapsed');
  }
  function expandSidebar() {
    if (sidebar) sidebar.classList.remove('is-collapsed');
  }

  if (toggle) toggle.addEventListener('click', function () {
    sidebar && sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
  });
  if (overlay) overlay.addEventListener('click', closeSidebar);

  if (collapseBtn) collapseBtn.addEventListener('click', function () {
    if (window.innerWidth < 720) closeSidebar();
    else collapseSidebar();
  });
  if (expandBtn) expandBtn.addEventListener('click', expandSidebar);

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (window.innerWidth < 720) closeSidebar();
      else if (sidebar) {
        sidebar.classList.contains('is-collapsed') ? expandSidebar() : collapseSidebar();
      }
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 720) closeSidebar();
    if (window.innerWidth < 720 && sidebar) sidebar.classList.remove('is-collapsed');
  });

  // Close sidebar when navigating (e.g. New chat, sidebar links)
  document.querySelectorAll('.wb-sidebar-link').forEach(function (link) {
    link.addEventListener('click', closeSidebar);
  });

})();
