/* Asia37 – Navigation und Scroll-Effekte. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var nav = document.getElementById('nav');
  var links = document.getElementById('nav-links');
  var burger = document.getElementById('nav-burger');

  /* ----------------------------------------------------------- Mobile-Menü */
  if (burger && links) {
    function setNavigation(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      links.classList.toggle('is-open', open);
    }
    burger.addEventListener('click', function () {
      setNavigation(burger.getAttribute('aria-expanded') !== 'true');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName !== 'A') return;
      setNavigation(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || burger.getAttribute('aria-expanded') !== 'true') return;
      setNavigation(false);
      burger.focus();
    });
  }

  /* ----------------------------------------------------------- Sticky-Nav */
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 12); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------- Reveal */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  var menuTools = document.querySelector('.menu-tools');
  var menuScope = document.querySelector('.menu-scope');
  if (menuTools && menuScope && 'ResizeObserver' in window) {
    var updateMenuHeight = function () {
      menuScope.style.setProperty('--menu-tools-height', menuTools.offsetHeight + 'px');
    };
    updateMenuHeight();
    new ResizeObserver(updateMenuHeight).observe(menuTools);
  }

  /* ----------------------------------------------------------- Jahr im Footer */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
