/* Why Bahrain: two small behaviours on top of main.js and ascent.js.
   1. A list marked data-spot lights the line nearest the middle of the screen (the "no tax" lines).
   2. Anything marked data-reveal gets .is-in once it is on screen (draws the route line).
   Without JS, or with reduced motion, everything is simply shown. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };

  /* ---------- spotlight lists ---------- */
  var lists = Array.prototype.slice.call(document.querySelectorAll('[data-spot]')).map(function (ul) {
    return { ul: ul, items: Array.prototype.slice.call(ul.children), cur: -1 };
  });
  var spot = function () {
    var mid = vh() / 2;
    lists.forEach(function (L) {
      var r = L.ul.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh() + 100) return;
      var best = 0, bd = 1e9;
      L.items.forEach(function (li, k) {
        var b = li.getBoundingClientRect();
        var d = Math.abs(b.top + b.height / 2 - mid);
        if (d < bd) { bd = d; best = k; }
      });
      if (best !== L.cur) {
        L.items.forEach(function (li, k) { li.classList.toggle('is-on', k === best); });
        L.cur = best;
      }
    });
  };
  if (lists.length) {
    window.addEventListener('scroll', spot, { passive: true });
    window.addEventListener('resize', spot);
    window.addEventListener('load', spot);
    spot();
  }

  /* ---------- reveal on view ---------- */
  var rv = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    rv.forEach(function (el) { io.observe(el); });
  }
})();
