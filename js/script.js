// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the mobile menu after a link is tapped
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Highlight the nav link matching the section currently in view
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const setActiveLink = (id) => {
  navAnchors.forEach((a) => {
    const target = a.getAttribute('href')?.replace('#', '');
    a.classList.toggle('active', target === id);
  });
};

if (sections.length && navAnchors.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

// Fade/slide elements in as they scroll into view
const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

// Contact modal (injected so every page shares one copy)
const CONTACT_EMAIL = 'michaelsolomoninfo@gmail.com';
const contactTriggers = document.querySelectorAll('[data-contact]');

if (contactTriggers.length && typeof HTMLDialogElement === 'function') {
  const modal = document.createElement('dialog');
  modal.className = 'contact-modal';
  modal.setAttribute('aria-labelledby', 'contactModalTitle');
  modal.innerHTML = `
    <div class="modal-head">
      <div>
        <h2 id="contactModalTitle">Let's Chat</h2>
        <p>Drop me a note and I'll get back to you.</p>
      </div>
      <button type="button" class="modal-close" aria-label="Close">&times;</button>
    </div>
    <form class="modal-body" id="contactForm">
      <div class="field">
        <label for="contactName">Name</label>
        <input id="contactName" name="name" type="text" autocomplete="name" required>
      </div>
      <div class="field">
        <label for="contactEmail">Email</label>
        <input id="contactEmail" name="email" type="email" autocomplete="email" required>
      </div>
      <div class="field">
        <label for="contactMessage">Message</label>
        <textarea id="contactMessage" name="message" required></textarea>
      </div>
      <input type="text" name="_honey" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="modal-actions">
        <button type="submit" class="btn btn-primary">Send message</button>
      </div>
      <p class="modal-status" role="status" aria-live="polite"></p>
      <p class="modal-alt">Prefer LinkedIn? <a href="https://www.linkedin.com/in/michael-solomon-info/" target="_blank" rel="noopener">Message me there</a>.</p>
    </form>
  `;
  document.body.appendChild(modal);

  const form = modal.querySelector('#contactForm');

  const openModal = () => {
    modal.showModal();
    document.body.classList.add('modal-open');
  };

  contactTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => document.body.classList.remove('modal-open'));

  // Close when clicking the backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  const submitBtn = form.querySelector('button[type="submit"]');
  const status = modal.querySelector('.modal-status');

  const setStatus = (text, type = '') => {
    status.textContent = text;
    status.className = `modal-status ${type}`.trim();
  };

  modal.addEventListener('close', () => setStatus(''));

  // GitHub Pages has no backend, so submissions are relayed by FormSubmit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    // Bots fill the hidden honeypot field; silently drop those
    if (data._honey) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    setStatus('');

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
          _replyto: data.email,
          _subject: `Portfolio inquiry from ${data.name}`,
          _template: 'table',
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || String(result.success) !== 'true') throw new Error(result.message || 'Send failed');

      form.reset();
      setStatus("Thanks! Your message is on its way. I'll be in touch soon.", 'success');
    } catch (err) {
      status.className = 'modal-status error';
      status.innerHTML = `Something went wrong. You can email me directly at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
}
