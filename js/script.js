/* =====================================================
   LOULOUCHANA v2 — script.js
   Fonctionnalités :
   1. Curseur personnalisé (desktop)
   2. Smooth scroll + active nav
   3. Header scroll-aware
   4. Burger / menu mobile
   5. Parallax hero subtil
   6. Scroll reveal (IntersectionObserver)
   7. Compteur animé stats
   8. Portfolio : filtres
   9. Témoignages : drag scroll + dots
   10. Formulaire AJAX (vers send_mail.php)
   ===================================================== */

'use strict';

/* ═══════════════════════════════════════════════
   1. CURSEUR PERSONNALISÉ (desktop uniquement)
   ═══════════════════════════════════════════════ */
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

if (!isTouchDevice()) {
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Ring suit avec un léger lag
  function animateCursor() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Agrandir le ring sur les éléments interactifs
  document.querySelectorAll('a, button, .portfolio-card, .testi-card, .tarif-card')
    .forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
}

/* ═══════════════════════════════════════════════
   2. SMOOTH SCROLL
   ═══════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    closeMobileMenu();
    const offset = 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ═══════════════════════════════════════════════
   3. HEADER SCROLL-AWARE
   ═══════════════════════════════════════════════ */
const header = document.getElementById('header');

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

/* ═══════════════════════════════════════════════
   4. BURGER / MENU MOBILE
   ═══════════════════════════════════════════════ */
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const menuClose  = document.getElementById('menuClose');

function openMobileMenu() {
  burger.classList.add('open');
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
  burger.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  burger.classList.remove('open');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
  burger.setAttribute('aria-expanded', 'false');
}

burger.addEventListener('click', () =>
  burger.classList.contains('open') ? closeMobileMenu() : openMobileMenu()
);
menuClose?.addEventListener('click', closeMobileMenu);
document.addEventListener('keydown', e => e.key === 'Escape' && closeMobileMenu());

/* ═══════════════════════════════════════════════
   5. PARALLAX HERO (performance-safe)
   ═══════════════════════════════════════════════ */
const heroBgImg = document.querySelector('.hero-bg img');
if (heroBgImg && !isTouchDevice()) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight * 1.2) {
        // Parallax doux : l'image monte moins vite que le scroll
        heroBgImg.style.transform = `scale(1.08) translateY(${scrollY * 0.22}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
  // Init scale pour éviter le blanc sur les bords
  heroBgImg.style.transform = 'scale(1.08) translateY(0)';
}

/* ═══════════════════════════════════════════════
   6. SCROLL REVEAL (IntersectionObserver)
   ═══════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ═══════════════════════════════════════════════
   7. COMPTEUR ANIMÉ (stats about)
   ═══════════════════════════════════════════════ */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCount(el, target, duration, suffix) {
  const isFloat = !Number.isInteger(target);
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / duration, 1);
    const v = easeOutCubic(p) * target;
    el.textContent = (isFloat ? v.toFixed(1) : Math.round(v)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    const val    = parseFloat(target.dataset.count);
    const suffix = target.dataset.suffix || '';
    animateCount(target, val, 1400, suffix);
    counterObserver.unobserve(target);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

/* ═══════════════════════════════════════════════
   8. PORTFOLIO — FILTRES
   ═══════════════════════════════════════════════ */
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioCards = document.querySelectorAll('.portfolio-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    portfolioCards.forEach(card => {
      const match = filter === 'all' || card.dataset.type === filter;

      // Animation de sortie/entrée
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      if (match) {
        card.style.display = '';
        // On force reflow pour déclencher la transition
        void card.offsetWidth;
        card.style.opacity = '1';
        card.style.transform = '';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.94)';
        setTimeout(() => {
          if (btn.dataset.filter !== 'all' && card.dataset.type !== btn.dataset.filter) {
            card.style.display = 'none';
          }
        }, 350);
      }
    });
  });
});

/* ═══════════════════════════════════════════════
   9. TÉMOIGNAGES — DRAG TO SCROLL + DOTS
   ═══════════════════════════════════════════════ */
const testiWrap  = document.querySelector('.testi-scroll-wrap');
const testiTrack = document.querySelector('.testi-track');
const testiDots  = document.querySelectorAll('.testi-dot');

if (testiWrap && testiTrack) {
  // Drag to scroll
  let isDown = false, startX = 0, scrollLeft = 0;

  testiWrap.addEventListener('mousedown', e => {
    isDown = true;
    testiWrap.style.cursor = 'grabbing';
    startX = e.pageX - testiWrap.offsetLeft;
    scrollLeft = testiWrap.scrollLeft;
  });
  testiWrap.addEventListener('mouseleave', () => { isDown = false; testiWrap.style.cursor = 'grab'; });
  testiWrap.addEventListener('mouseup',    () => { isDown = false; testiWrap.style.cursor = 'grab'; });
  testiWrap.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - testiWrap.offsetLeft;
    const walk = (x - startX) * 1.4;
    testiWrap.scrollLeft = scrollLeft - walk;
  });

  // Touch swipe
  let touchStartX = 0;
  testiWrap.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    scrollLeft = testiWrap.scrollLeft;
  }, { passive: true });
  testiWrap.addEventListener('touchmove', e => {
    const diff = touchStartX - e.touches[0].clientX;
    testiWrap.scrollLeft = scrollLeft + diff;
  }, { passive: true });

  // Mise à jour dots au scroll
  if (testiDots.length > 0) {
    testiWrap.addEventListener('scroll', () => {
      const cardWidth = testiTrack.children[0]?.offsetWidth || 300;
      const idx = Math.round(testiWrap.scrollLeft / cardWidth);
      testiDots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
    }, { passive: true });

    // Click dots
    testiDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const cardWidth = testiTrack.children[0]?.offsetWidth || 300;
        testiWrap.scrollTo({ left: cardWidth * i + (i > 0 ? 16 * i : 0), behavior: 'smooth' });
      });
    });
  }
}

/* ═══════════════════════════════════════════════
   10. FORMULAIRE CONTACT — AJAX vers send_mail.php
   ═══════════════════════════════════════════════ */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', handleFormSubmit);
}

const RULES = [
  {
    id: 'name', errorId: 'nameError',
    validate: v => v.trim().length >= 2 && v.trim().length <= 100,
    msg: 'Merci de renseigner ton prénom (2 caractères min.).'
  },
  {
    id: 'email', errorId: 'emailError',
    validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    msg: 'Adresse email invalide.'
  },
  {
    id: 'subject', errorId: 'subjectError',
    validate: v => v !== '',
    msg: 'Choisis un sujet pour ta demande.'
  },
  {
    id: 'message', errorId: 'messageError',
    validate: v => v.trim().length >= 10,
    msg: 'Ton message est trop court (10 caractères min.).'
  }
];

function clearFormState() {
  form.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));
  form.querySelectorAll('input, textarea, select').forEach(el => el.classList.remove('error'));
  document.getElementById('formSuccess')?.classList.remove('visible');
  document.getElementById('formServerError')?.classList.remove('visible');
}

function validateAll() {
  let valid = true;
  RULES.forEach(({ id, errorId, validate, msg }) => {
    const el = document.getElementById(id);
    if (!validate(el.value)) {
      el.classList.add('error');
      const err = document.getElementById(errorId);
      err.textContent = msg;
      err.classList.add('visible');
      if (valid) el.focus();
      valid = false;
    }
  });
  return valid;
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('span').textContent = loading ? 'Envoi…' : 'Envoyer 💌';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  clearFormState();
  if (!validateAll()) return;

  const btn = form.querySelector('.btn-submit-form');
  setLoading(btn, true);

  const payload = {
    name:    document.getElementById('name').value.trim(),
    email:   document.getElementById('email').value.trim(),
    subject: document.getElementById('subject').value,
    message: document.getElementById('message').value.trim(),
    website: document.getElementById('website')?.value || '' // honeypot
  };

  try {
    const res  = await fetch('send_mail.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      form.reset();
      const s = document.getElementById('formSuccess');
      s.classList.add('visible');
      s.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => s.classList.remove('visible'), 7000);
    } else if (res.status === 429) {
      showError('⏳ Attends quelques secondes avant de renvoyer un message.');
    } else {
      showError(data.error || 'Erreur lors de l\'envoi. Contacte-moi sur Instagram 💌');
    }
  } catch {
    showError('Connexion impossible. Réessaie ou contacte-moi directement sur Instagram 💌');
  } finally {
    setLoading(btn, false);
  }
}

function showError(msg) {
  const el = document.getElementById('formServerError');
  if (el) {
    el.textContent = msg;
    el.classList.add('visible');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
