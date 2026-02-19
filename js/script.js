/* ===================================
   LOULOUCHANA — script.js
   Fonctionnalités :
   1. Smooth scroll navigation
   2. Header scroll-aware (shadow)
   3. Menu burger mobile
   4. Scroll reveal animations (IntersectionObserver)
   5. Validation formulaire contact
   6. Compteur animé des stats
   =================================== */

'use strict';

/* =============================
   1. SMOOTH SCROLL + NAV ACTIVE
   ============================= */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    // Fermer mobile menu si ouvert
    closeMobileMenu();
    const offset = 70; // hauteur header
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* =============================
   2. HEADER — shadow on scroll
   ============================= */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

/* =============================
   3. BURGER / MOBILE MENU
   ============================= */
const burger      = document.getElementById('burger');
const mobileMenu  = document.getElementById('mobileMenu');
const menuClose   = document.getElementById('menuClose');

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

burger.addEventListener('click', () => {
  burger.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
});
menuClose.addEventListener('click', closeMobileMenu);

// Fermer si on clique en dehors
mobileMenu.addEventListener('click', e => {
  if (e.target === mobileMenu) closeMobileMenu();
});

// Fermer avec Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileMenu();
});

/* =============================
   4. SCROLL REVEAL (IntersectionObserver)
   Ajoute la classe .visible aux éléments
   .reveal quand ils entrent dans le viewport.
   Décalage possible via .reveal-delay-N
   ============================= */
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // une seule fois
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

/* =============================
   5. COMPTEUR ANIMÉ — STATS
   Anime les nombres des .stat-number
   de 0 jusqu'à leur valeur finale
   quand ils deviennent visibles.
   ============================= */
function animateCounter(el, target, duration = 1400, suffix = '') {
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Easing: easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;
    el.textContent = isDecimal
      ? current.toFixed(1) + suffix
      : Math.round(current) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const raw = el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const target = parseFloat(raw);
    animateCounter(el, target, 1600, suffix);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

/* =============================
   6. VALIDATION FORMULAIRE
   Vérifie : nom non vide,
   email valide (regex), message
   > 10 caractères, objet sélectionné.
   Affiche erreurs inline, puis
   montre un message de succès simulé.
   ============================= */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
  e.preventDefault();
  let valid = true;

  // Reset erreurs
  form.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));
  form.querySelectorAll('input, textarea, select').forEach(el => el.classList.remove('error'));

  // Validation champ par champ
  const fields = [
    {
      id: 'name',
      errorId: 'nameError',
      validate: v => v.trim().length >= 2,
      msg: 'Merci de renseigner ton prénom (2 caractères min.).'
    },
    {
      id: 'email',
      errorId: 'emailError',
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg: 'Adresse email invalide.'
    },
    {
      id: 'subject',
      errorId: 'subjectError',
      validate: v => v !== '',
      msg: 'Choisis un sujet pour ta demande.'
    },
    {
      id: 'message',
      errorId: 'messageError',
      validate: v => v.trim().length >= 10,
      msg: 'Ton message est trop court (10 caractères min.).'
    }
  ];

  fields.forEach(({ id, errorId, validate, msg }) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(errorId);
    if (!validate(input.value)) {
      input.classList.add('error');
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
      valid = false;
    }
  });

  if (!valid) return;

  // Simulation envoi
  const btn = form.querySelector('.btn-submit');
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;
    form.reset();
    const success = document.getElementById('formSuccess');
    success.classList.add('visible');
    setTimeout(() => success.classList.remove('visible'), 5000);
  }, 1800);
}

/* =============================
   BONUS: Parallax léger sur hero
   L'image hero scrolle légèrement
   plus lentement que le contenu
   pour un effet de profondeur.
   ============================= */
const heroImg = document.querySelector('.hero-image-wrap img');
if (heroImg) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Limite l'effet aux premiers 600px
        if (scrollY < 800) {
          heroImg.style.transform = `scale(1) translateY(${scrollY * 0.18}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}
