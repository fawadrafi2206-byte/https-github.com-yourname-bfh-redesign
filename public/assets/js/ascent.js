/* Bahrain Financial Harbour: "Ascent" home page.
   Scroll-driven chapters: the manifesto that lights up, the horizontal rail of spaces,
   the smart-feature list that drives a picture, the tower parallax and the floor gauge.
   Pinned effects run on desktop with motion allowed; phones and reduced motion get plain stacks.
   Popups, the Climb, the form and the videos live in main.js. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 860px)');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };

  /* ---------- manifesto: words light up with the scroll ---------- */
  var mani = document.querySelector('.a-mani');
  var maniText = mani ? mani.querySelector('[data-fill]') : null;
  var mw = [];
  if (maniText) {
    var plain = maniText.textContent.trim();
    maniText.setAttribute('aria-label', plain);
    maniText.innerHTML = plain.split(/\s+/).map(function (w) { return '<span class="mw" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
    mw = Array.prototype.slice.call(maniText.querySelectorAll('.mw'));
  }
  var maniLit = -1;
  var maniUpdate = function () {
    if (!mani || !mw.length) return;
    var pinned = !reduce && !narrow.matches;
    mani.classList.toggle('is-pinned', pinned);
    if (!pinned) { mani.classList.remove('is-done'); maniLit = -1; return; }
    var r = mani.getBoundingClientRect();
    var span = r.height - vh();
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    var lit = Math.min(mw.length, Math.round(p * 1.18 * mw.length));
    if (lit !== maniLit) {
      for (var i = 0; i < mw.length; i++) mw[i].classList.toggle('is-lit', i < lit);
      maniLit = lit;
    }
    mani.classList.toggle('is-done', lit >= mw.length);
  };

  /* ---------- spaces: a pinned, horizontal rail (swipeable everywhere else) ---------- */
  var rail = document.querySelector('.a-rail');
  var track = rail ? rail.querySelector('.a-rail-track') : null;
  var railRange = 0;
  var railMeasure = function () {
    if (!rail || !track) return;
    var pinned = !reduce && !narrow.matches;
    rail.classList.toggle('is-pinned', pinned);
    if (!pinned) { rail.style.height = ''; track.style.removeProperty('--rx'); rail.style.removeProperty('--rp'); return; }
    var last = track.lastElementChild;
    var gut = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
    var contentRight = last ? last.offsetLeft + last.offsetWidth : track.scrollWidth;
    railRange = Math.max(0, contentRight + gut - window.innerWidth);
    rail.style.height = (vh() + railRange) + 'px';
  };
  var railUpdate = function () {
    if (!rail || !rail.classList.contains('is-pinned')) return;
    var r = rail.getBoundingClientRect();
    var span = r.height - vh();
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    track.style.setProperty('--rx', (-railRange * p).toFixed(1) + 'px');
    rail.style.setProperty('--rp', p.toFixed(4));
  };

  /* ---------- smart building: the list picks the picture ---------- */
  var feat = document.querySelector('.a-feat');
  var fItems = feat ? Array.prototype.slice.call(feat.querySelectorAll('.a-feat-list li')) : [];
  var fImgs = feat ? Array.prototype.slice.call(feat.querySelectorAll('.a-feat-frame img')) : [];
  var fCount = feat ? feat.querySelector('.a-feat-count') : null;
  var fCur = -1;
  var featSet = function (i) {
    fCur = i;
    fItems.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
    fImgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    if (fCount) fCount.textContent = pad(i + 1) + ' / ' + pad(fItems.length);
  };
  var featUpdate = function () {
    if (!fItems.length) return;
    var mid = vh() / 2, best = 0, bd = 1e9;
    fItems.forEach(function (li, k) {
      var r = li.getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bd) { bd = d; best = k; }
    });
    if (best !== fCur) featSet(best);
  };
  fItems.forEach(function (li, k) { li.addEventListener('mouseenter', function () { if (k !== fCur) featSet(k); }); });
  if (fItems.length) featSet(0);

  /* ---------- towers: the photo drifts slower than the page ---------- */
  var towers = document.querySelector('.a-towers');
  var towersBg = towers ? towers.querySelector('.a-towers-bg') : null;
  var towersUpdate = function () {
    if (!towersBg || reduce) return;
    var r = towers.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh() + 200) return;
    towersBg.style.setProperty('--py', ((r.top + r.height / 2 - vh() / 2) * -0.09).toFixed(1) + 'px');
  };

  /* ---------- floor gauge: the page is a climb ---------- */
  var gauge = document.querySelector('.a-gauge');
  var gFl = gauge ? gauge.querySelector('.fl') : null;
  var gCh = gauge ? gauge.querySelector('.ch') : null;
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  var climb = document.getElementById('climb');
  var gaugeUpdate = function () {
    if (!gauge || window.innerWidth <= 1100) return;
    var max = document.documentElement.scrollHeight - vh();
    var p = max > 0 ? clamp((window.pageYOffset || 0) / max, 0, 1) : 0;
    gauge.style.setProperty('--p', p.toFixed(4));
    if (gFl) gFl.textContent = 1 + Math.round(52 * p);
    var cur = chapters[0];
    chapters.forEach(function (c) { if (c.getBoundingClientRect().top <= vh() * 0.45) cur = c; });
    if (gCh && cur) gCh.textContent = cur.getAttribute('data-chapter');
    var past = (window.pageYOffset || 0) > vh() * 0.6;
    var inClimb = false;
    if (climb && climb.classList.contains('climb--pinned')) {
      var cr = climb.getBoundingClientRect();
      inClimb = cr.top <= vh() * 0.2 && cr.bottom >= vh() * 0.8;
    }
    gauge.classList.toggle('is-on', past && !inClimb);
  };

  var onScroll = function () { maniUpdate(); railUpdate(); featUpdate(); towersUpdate(); gaugeUpdate(); };
  var onResize = function () { railMeasure(); onScroll(); };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  onResize();
})();
