/* Bahrain Financial Harbour: interaction and motion.
   Vanilla JS. Smooth scroll uses Lenis when its script loads; everything else works without it.
   All motion is skipped under prefers-reduced-motion. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lenis = null;

  doc.classList.add('js');
  if (/[?&]notes\b/.test(window.location.search)) doc.classList.add('show-notes');

  /* ---------- smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- header + hero parallax ---------- */
  var header = document.querySelector('.site-header');
  var heroTitle = document.querySelector('.hero-title-wrap');
  var ticking = false;

  function update() {
    var y = window.pageYOffset || doc.scrollTop || 0;
    if (header) header.classList.toggle('is-solid', y > 80);
    if (!reduce && heroTitle && y < window.innerHeight * 1.2) {
      // the title lags the footage a little as you scroll
      heroTitle.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
      heroTitle.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)).toFixed(3));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  /* ---------- menu overlay ---------- */
  var menu = document.getElementById('menu');
  var opener = document.querySelector('[data-menu-open]');
  var lastFocus = null;

  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    doc.classList.add('menu-open');
    if (lenis) lenis.stop();
    if (opener) opener.setAttribute('aria-expanded', 'true');
    var closeBtn = menu.querySelector('button[data-menu-close]');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 80);
  }

  function closeMenu(silent) {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    doc.classList.remove('menu-open');
    if (lenis) lenis.start();
    if (opener) opener.setAttribute('aria-expanded', 'false');
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (opener) opener.addEventListener('click', openMenu);
  document.querySelectorAll('[data-menu-close]').forEach(function (el) {
    el.addEventListener('click', function () { closeMenu(el.tagName !== 'BUTTON'); });
  });
  document.addEventListener('keydown', function (e) {
    if (!menu || !menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key === 'Tab') {
      var f = menu.querySelectorAll('a[href], button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- anchor links ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -64 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- scroll reveals ---------- */
  function splitWords(el) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi';
            i.style.setProperty('--i', idx++); i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    })(el);
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  if (!reduce && io) {
    // headlines: words rise through a mask, in sequence
    document.querySelectorAll('main h2').forEach(function (h) {
      splitWords(h);
      h.setAttribute('data-split', '');
      io.observe(h);
    });

    // body copy, figures and cards: fade up 20px, staggered within each group
    var picked = Array.prototype.slice.call(document.querySelectorAll(
      'main section:not(.hero) p, main section:not(.hero) figure, main section:not(.hero) blockquote, ' +
      'main section:not(.hero) .card, main section:not(.hero) .cols3 > div, main section:not(.hero) .cols4 > div, footer .cols4 > div'
    )).filter(function (el, _i, all) {
      return !all.some(function (o) { return o !== el && o.contains(el); });
    });
    var seen = new Map();
    picked.forEach(function (el) {
      var n = seen.get(el.parentNode) || 0;
      seen.set(el.parentNode, n + 1);
      el.classList.add('fade');
      el.style.setProperty('--d', Math.min(n * 90, 450) + 'ms');
      io.observe(el);
    });
  }

  /* ---------- counters: count up once ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 1800);
      el.textContent = (to * (1 - Math.pow(1 - p, 4))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('.count');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countUp(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) {
      c.textContent = (0).toFixed(parseInt(c.getAttribute('data-dec') || '0', 10));
      cio.observe(c);
    });
  }

  /* ---------- cursor + magnetic buttons ---------- */
  if (fine && !reduce) {
    var cur = document.querySelector('.cursor');
    if (cur) {
      var x = 0, y = 0, cx = 0, cy = 0, shown = false;
      window.addEventListener('pointermove', function (e) {
        x = e.clientX; y = e.clientY;
        if (!shown) { cx = x; cy = y; shown = true; cur.classList.add('is-on'); }
      }, { passive: true });
      document.addEventListener('pointerover', function (e) {
        var t = e.target.closest ? e.target.closest('a, button, .btn, [data-cursor]') : null;
        cur.classList.toggle('is-link', !!t);
      });
      document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); shown = false; });
      (function loop() {
        cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
        cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
        requestAnimationFrame(loop);
      })();
    }
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }
})();
