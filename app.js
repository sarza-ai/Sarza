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
// Works with zero setup: opens a pre-filled email to hello@sarzaai.com.
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
            errorBox.innerHTML = 'Something went wrong. Please email us directly at <a href="mailto:hello@sarzaai.com">hello@sarzaai.com</a>.';
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
      'mailto:hello@sarzaai.com?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    showSuccess();
  });
})();
