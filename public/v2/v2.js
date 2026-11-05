/* BFH version 2: the climb.
   A pinned stage: as you scroll, the scenes cross-fade, the marker climbs the floor scale,
   the smart features appear as you pass them, and four tall cards rise at the end.
   Plain JS. Smooth scroll uses Lenis if it loads. With reduced motion or on small screens
   the stage is not pinned and everything reads as normal sections. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 820px)').matches;
  var story = document.querySelector('.story');
  var pinned = !!story && !reduce && !narrow;
  var lenis = null;

  doc.classList.add('js');
  if (pinned) doc.classList.add('pinned');
  if (/[?&]notes\b/.test(window.location.search)) doc.classList.add('show-notes');

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------- smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  var hdr = document.getElementById('hdr');
  var heroCopy = document.querySelector('.hero-copy');
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var vid = document.querySelector('.bgvid');
  var cardsWrap = document.querySelector('.cards');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var scale = document.querySelector('.scale');
  var totop = document.querySelector('.totop');

  if (reduce && vid) { vid.removeAttribute('autoplay'); vid.pause(); }

  /* ---------- the floor scale ---------- */
  var FLOORS = 53;
  var facts = [];
  var mark = null, markLabel = null;
  if (scale) {
    var ticks = scale.querySelector('.ticks');
    [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 53].forEach(function (f) {
      var t = document.createElement('i');
      var major = f % 10 === 0 || f === FLOORS;
      t.className = 'tick' + (major ? ' maj' : '');
      t.style.setProperty('--y', ((f - 1) / (FLOORS - 1) * 100).toFixed(2));
      if (major) { var b = document.createElement('b'); b.textContent = f + 'F'; t.appendChild(b); }
      ticks.appendChild(t);
    });
    facts = Array.prototype.slice.call(scale.querySelectorAll('.fact'));
    facts.forEach(function (el, i) {
      el._floor = 6 + i * 6;
      el.style.setProperty('--y', ((el._floor - 1) / (FLOORS - 1) * 100).toFixed(2));
    });
    mark = scale.querySelector('.mark');
    markLabel = scale.querySelector('.fl');
  }

  /* ---------- scroll-driven render ---------- */
  var STOPS = [0, 0.3, 0.52, 0.74];

  function render() {
    var y = window.pageYOffset || doc.scrollTop || 0;
    var r = pinned ? story.getBoundingClientRect() : null;
    var vh = window.innerHeight;

    hdr.classList.toggle('is-solid', pinned ? r.bottom < vh * 0.4 : y > 80);
    if (totop) totop.classList.toggle('show', pinned ? r.bottom < vh * 0.4 : y > vh);
    if (!pinned) return;

    var p = clamp(-r.top / (story.offsetHeight - vh), 0, 1);

    // hero copy lifts away
    var h = clamp((p - 0.03) / 0.13, 0, 1);
    heroCopy.style.opacity = String((1 - h).toFixed(3));
    heroCopy.style.transform = 'translate3d(0,' + (-60 * h).toFixed(1) + 'px,0)';
    heroCopy.style.visibility = h >= 1 ? 'hidden' : 'visible';
    var statsEl = document.querySelector('.stats');
    if (statsEl) { statsEl.style.opacity = String((1 - h).toFixed(3)); statsEl.style.visibility = h >= 1 ? 'hidden' : 'visible'; }

    // scenes cross-fade and slowly push in
    scenes.forEach(function (s, i) {
      var o = clamp(1 - Math.abs(p - STOPS[i]) / 0.2, 0, 1);
      if (i === 0 && p < STOPS[0]) o = 1;
      if (i === scenes.length - 1 && p > STOPS[i]) o = 1;
      s.style.opacity = o.toFixed(3);
      var z = 1.02 + 0.1 * clamp((p - (STOPS[i] - 0.2)) / 0.45, 0, 1);
      s.style.transform = 'scale(' + z.toFixed(4) + ')';
    });
    if (vid) {
      if (p < 0.34) { if (vid.paused) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } }
      else if (!vid.paused) { vid.pause(); }
    }

    // the climb
    var climb = clamp((p - 0.05) / 0.8, 0, 1);
    var floor = Math.round(1 + (FLOORS - 1) * climb);
    if (mark) {
      mark.style.bottom = ((floor - 1) / (FLOORS - 1) * 100).toFixed(2) + '%';
      markLabel.textContent = floor + 'F';
      var cur = -1;
      facts.forEach(function (el, i) { if (floor >= el._floor) cur = i; });
      facts.forEach(function (el, i) { el.classList.toggle('on', i <= cur); el.classList.toggle('cur', i === cur); });
    }
    if (scale) scale.style.opacity = String(clamp((r.bottom - vh * 0.2) / (vh * 0.4), 0, 1).toFixed(3));

    // four cards rise
    var cp = clamp((p - 0.84) / 0.15, 0, 1);
    cardsWrap.classList.toggle('show', cp > 0.02);
    if (scale) scale.classList.toggle('end', cp > 0.02);
    cards.forEach(function (c, k) { c.style.setProperty('--cp', ease(clamp((cp - k * 0.12) / 0.55, 0, 1)).toFixed(3)); });
  }

  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', render);
  render();

  /* ---------- hero numbers count up once ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('.cnt'));
  function runCount(el, delay) {
    var to = parseFloat(el.getAttribute('data-to'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var q = clamp((ts - start - delay) / 1800, 0, 1);
      el.textContent = (to * (1 - Math.pow(1 - q, 4))).toFixed(dec);
      if (q < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduce) {
    var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCount(en.target, 0);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 }) : null;
    counters.forEach(function (el) {
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      el.textContent = (0).toFixed(dec);
      if (el.closest('.stats') || !cio) runCount(el, 500);   // hero numbers run on load
      else cio.observe(el);                                    // others run when scrolled into view
    });
  }

  /* ---------- menu on small screens ---------- */
  var burger = document.querySelector('.burger');
  var mnav = document.getElementById('mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    mnav.classList.toggle('open', open);
    mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    var lines = burger.querySelectorAll('i');
    lines[0].style.transform = open ? 'translateY(3.75px) rotate(45deg)' : '';
    lines[1].style.transform = open ? 'translateY(-3.75px) rotate(-45deg)' : '';
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    doc.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!mnav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- anchor links ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -60 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- active nav item + reveals ---------- */
  if ('IntersectionObserver' in window) {
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) { links[a.getAttribute('href')] = a; });
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove('on'); });
        var l = links['#' + en.target.id];
        if (l) l.classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'towers', 'spaces', 'features', 'visit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navIo.observe(el);
    });

    var rv = Array.prototype.slice.call(document.querySelectorAll('.rv'));
    if (reduce) { rv.forEach(function (el) { el.classList.add('in'); }); }
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
      rv.forEach(function (el) { io.observe(el); });
    }
  }
})();
