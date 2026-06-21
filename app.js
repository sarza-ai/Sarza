/* ============================================================
   Sarza AI — shared scripts (nav + contact form)
   ============================================================ */

// ── Mobile navigation toggle ──
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close the menu after tapping a link
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
})();

// ── Contact form ──
// Works with zero setup: opens a pre-filled email to hello@sarza.ai.
// To capture leads automatically instead, create a free form endpoint at
// https://formspree.io and set data-endpoint on the <form> to that URL.
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var successBox = document.getElementById('form-success');
  var errorBox = document.getElementById('form-error');

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    var fname = val('fname');
    var lname = val('lname');
    var email = val('email');
    var biz = val('bizname');
    var challenge = val('challenge');
    var message = val('message');

    if (!fname || !email) {
      if (errorBox) {
        errorBox.textContent = 'Please add at least your first name and email.';
        errorBox.style.display = 'block';
      }
      return;
    }

    var endpoint = form.getAttribute('data-endpoint');

    function showSuccess() {
      form.style.display = 'none';
      if (successBox) successBox.style.display = 'block';
    }

    if (endpoint) {
      // Submit to a form backend (e.g. Formspree) via fetch.
      var data = new FormData(form);
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (r.ok) { showSuccess(); }
          else { throw new Error('bad response'); }
        })
        .catch(function () {
          if (errorBox) {
            errorBox.innerHTML = 'Something went wrong. Please email us directly at <a href="mailto:hello@sarza.ai">hello@sarza.ai</a>.';
            errorBox.style.display = 'block';
          }
        });
      return;
    }

    // No backend configured — open a pre-filled email (always works).
    var subject = 'Strategy call request — ' + (biz || (fname + ' ' + lname).trim());
    var body =
      'Name: ' + fname + ' ' + lname + '\n' +
      'Email: ' + email + '\n' +
      'Business: ' + biz + '\n' +
      'Biggest challenge: ' + challenge + '\n\n' +
      (message ? message + '\n' : '');
    window.location.href =
      'mailto:hello@sarza.ai?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    showSuccess();
  });
})();

// ── AI Chat Widget ──
(function () {
  'use strict';

  var HISTORY = [];
  var busy = false;
  var OFFLINE_MSG = 'I\'m offline right now — please <a href="/contact">book a free call</a> or email <a href="mailto:hello@sarza.ai">hello@sarza.ai</a>.';

  function escHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  function inject() {
    var host = document.createElement('div');
    host.id = 'sarza-chat';
    host.innerHTML =
      '<button class="chat-bubble" id="chat-bubble" aria-label="Chat with Sarza AI" aria-expanded="false">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '</button>' +
      '<div class="chat-panel" id="chat-panel" role="dialog" aria-label="Sarza AI assistant" aria-hidden="true">' +
        '<div class="chat-header">' +
          '<div class="chat-header-info">' +
            '<span class="chat-online-dot" aria-hidden="true"></span>' +
            '<span class="chat-title">Sarza<strong>AI</strong></span>' +
          '</div>' +
          '<button class="chat-close" id="chat-close" aria-label="Close chat">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="chat-messages" id="chat-messages">' +
          '<div class="chat-msg chat-msg-bot">' +
            '<p>Hi! I\'m the Sarza AI assistant. Ask me anything about AI automation for your business — or just say hi.</p>' +
          '</div>' +
        '</div>' +
        '<div class="chat-footer">' +
          '<div class="chat-input-wrap">' +
            '<input type="text" id="chat-input" class="chat-input" placeholder="Ask a question…" autocomplete="off" maxlength="500" />' +
            '<button class="chat-send" id="chat-send" aria-label="Send message">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(host);
  }

  function openPanel() {
    var panel = document.getElementById('chat-panel');
    var bubble = document.getElementById('chat-bubble');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    bubble.setAttribute('aria-expanded', 'true');
    var input = document.getElementById('chat-input');
    if (input) setTimeout(function () { input.focus(); }, 50);
  }

  function closePanel() {
    var panel = document.getElementById('chat-panel');
    var bubble = document.getElementById('chat-bubble');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    bubble.setAttribute('aria-expanded', 'false');
  }

  function addMessage(role, html) {
    var msgs = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg-user' : 'chat-msg-bot');
    div.innerHTML = '<p>' + html + '</p>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var msgs = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chat-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('chat-typing');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function send() {
    if (busy) return;
    var input = document.getElementById('chat-input');
    var text = (input.value || '').trim();
    if (!text) return;
    input.value = '';

    HISTORY.push({ role: 'user', content: text });
    addMessage('user', escHtml(text));
    busy = true;
    showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: HISTORY }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        removeTyping();
        busy = false;
        var reply = (data && data.reply) ? data.reply : '';
        if (reply) {
          HISTORY.push({ role: 'assistant', content: reply });
          addMessage('bot', escHtml(reply));
        } else {
          addMessage('bot', OFFLINE_MSG);
        }
      })
      .catch(function () {
        removeTyping();
        busy = false;
        addMessage('bot', OFFLINE_MSG);
      });
  }

  function init() {
    inject();
    var bubble = document.getElementById('chat-bubble');
    var closeBtn = document.getElementById('chat-close');
    var sendBtn = document.getElementById('chat-send');
    var input = document.getElementById('chat-input');

    bubble.addEventListener('click', function () {
      var panel = document.getElementById('chat-panel');
      if (panel.classList.contains('open')) { closePanel(); } else { openPanel(); }
    });
    closeBtn.addEventListener('click', closePanel);
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var panel = document.getElementById('chat-panel');
        if (panel && panel.classList.contains('open')) { closePanel(); }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
