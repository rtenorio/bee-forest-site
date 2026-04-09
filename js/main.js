/* ============================================================
   BEE FOREST — main.js
   Nav behavior, mobile drawer, scroll reveal
   ============================================================ */

(function () {
  'use strict';

  // ── Page Loader ─────────────────────────────────────────────
  const loader = document.querySelector('.page-loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('is-hidden'), 300);
    });
  }

  // ── Navigation scroll behavior ───────────────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    const isHero = nav.classList.contains('nav--hero');

    function updateNav() {
      if (isHero) {
        if (window.scrollY > 60) {
          nav.classList.remove('nav--transparent');
          nav.classList.add('nav--solid');
          nav.classList.remove('nav--hero');
        } else {
          nav.classList.add('nav--transparent');
          nav.classList.remove('nav--solid');
          nav.classList.add('nav--hero');
        }
      }
    }

    if (isHero) {
      nav.classList.add('nav--transparent');
      updateNav();
      window.addEventListener('scroll', updateNav, { passive: true });
    } else {
      nav.classList.add('nav--solid');
    }
  }

  // ── Mark active nav link ─────────────────────────────────────
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.nav__link, .nav__drawer-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.replace(/\/$/, '') || '/index.html';
    if (currentPath.endsWith(linkPath) && linkPath !== '/') {
      link.classList.add('nav__link--active');
    } else if ((currentPath === '/' || currentPath.endsWith('index.html')) && linkPath === '/') {
      link.classList.add('nav__link--active');
    }
  });

  // ── Mobile Drawer ─────────────────────────────────────────────
  const hamburger = document.querySelector('.nav__hamburger');
  const drawer    = document.querySelector('.nav__drawer');
  const drawerClose   = document.querySelector('.nav__drawer-close');
  const drawerOverlay = document.querySelector('.nav__drawer-overlay');

  function openDrawer()  { drawer?.classList.add('is-open');    document.body.style.overflow = 'hidden'; }
  function closeDrawer() { drawer?.classList.remove('is-open'); document.body.style.overflow = ''; }

  hamburger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  document.querySelectorAll('.nav__drawer-link').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // ── Scroll Reveal ─────────────────────────────────────────────
  const revealEls = document.querySelectorAll('[data-reveal]');

  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  // ── Toast helper (global) ─────────────────────────────────────
  window.BF = window.BF || {};

  window.BF.toast = function (message, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = `toast${type ? ` toast--${type}` : ''}`;
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  };

  // ── Smooth anchor scrolling ───────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
