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
    if (!a || a.hasAttribute('data-modal')) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -64 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- popups: spaces, smart features, interview ----------
     One <dialog id="modal"> is filled from the data-* attributes of the card that was clicked. */
  var modal = document.getElementById('modal');
  var mBody = document.getElementById('modal-body');
  var mLabel = document.getElementById('modal-label');
  var mOpener = null;

  if (modal && mBody && typeof modal.showModal === 'function') {
    var SPACE_CHIPS = ['Executive Space', 'High-Speed WiFi', 'Video Conferencing', 'Premium Seating', 'Meeting Support', 'Sound Insulated'];
    var SPACE_DETAILS = [
      ['Capacity', 'Up to 20 Attendees'],
      ['Seating style', 'Boardroom, U-Shape, Classroom, Theatre'],
      ['Presentation screen', '75" 4K Display'],
      ['Location', 'Central Business District'],
      ['Refreshments', 'Service Available']
    ];
    var SPACE_GROUPS = [
      ['Connectivity', ['High-Speed Business WiFi', 'Dedicated Wired Internet', 'Video Conferencing Support', 'Wireless Screen Sharing']],
      ['Workspace amenities', ['Executive Meeting Table', 'Ergonomic Seating', 'Digital Presentation System', 'Whiteboard & Flipcharts', 'Laptop-Compatible Connectivity', 'Sound-Insulated Environment']],
      ['Business support', ['Administrative Assistance', 'Printing & Scanning Services', 'Catering Options Available', 'Event Coordination Support', 'On-Site Technical Assistance', 'Flexible Booking Options']],
      ['Safety & security', ['24/7 Security Monitoring', 'Controlled Access Entry', 'Emergency Response Systems', 'Fire Safety Compliance']]
    ];
    var LABELS = { space: 'Space information', feature: 'Smart feature', video: 'Interview' };
    var ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

    var esc = function (t) {
      return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    var mail = function (subject) {
      return 'mailto:bfharbour@gmail.com?subject=' + encodeURIComponent(subject);
    };
    var gallery = function (imgs, alt) {
      var h = '<div class="m-gallery">';
      imgs.forEach(function (src, i) {
        h += '<img src="' + esc(src) + '" alt="' + (i === 0 ? esc(alt) : '') + '"' + (i === 0 ? ' class="is-active"' : '') + ' decoding="async">';
      });
      if (imgs.length > 1) {
        h += '<button type="button" class="m-nav prev" data-gal="-1" aria-label="Previous photo">' + ARROW_L + '</button>' +
             '<button type="button" class="m-nav next" data-gal="1" aria-label="Next photo">' + ARROW_R + '</button>' +
             '<span class="m-count" aria-live="polite">1 / ' + imgs.length + '</span>';
      }
      return h + '</div>';
    };
    var group = function (g) {
      return '<div><h4>' + esc(g[0]) + '</h4><ul>' + g[1].map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
    };
    var cta = function (label, subject) {
      return '<div class="m-actions"><a class="btn" href="' + esc(mail(subject)) + '" style="border-color:#0B4F42;color:#0B4F42"><span>' + esc(label) + '</span></a></div>';
    };

    var buildSpace = function (d) {
      var parking = d.kind === 'parking';
      var h = gallery([d.img, d.img2], d.title);
      h += '<div class="m-text"><div class="m-kicker"><span aria-hidden="true"></span>' + esc(d.num) + ' &mdash; ' + esc(d.avail) + '</div>' +
           '<h3 class="m-title" id="modal-title">' + esc(d.title) + '</h3><p class="m-price">' + esc(d.price) + '</p>';
      if (!parking) {
        h += '<ul class="m-chips">' + SPACE_CHIPS.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
             '<dl class="m-details">' + SPACE_DETAILS.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>';
      }
      h += '<div class="m-groups">' + SPACE_GROUPS.filter(function (g) { return !parking || g[0] === 'Safety & security'; }).map(group).join('') + '</div>';
      h += cta('Enquire about this space', 'Space enquiry: ' + d.title + ' (' + d.num + ')');
      h += '<p class="todo m-todo">TODO-VERIFY &middot; space details carried over from the current site&rsquo;s popup; photos come from the existing set</p></div>';
      return h;
    };
    var buildFeature = function (d) {
      return gallery([d.img], d.title) +
        '<div class="m-text"><div class="m-kicker"><span aria-hidden="true"></span>' + esc(d.num) + ' &mdash; Smart feature</div>' +
        '<h3 class="m-title" id="modal-title">' + esc(d.title) + '</h3>' +
        '<p class="m-note">One of the engineering and smart features built into the Harbour.</p>' +
        cta('Enquire about leasing', 'Leasing enquiry: ' + d.title) + '</div>';
    };
    var buildVideo = function (d) {
      return '<div class="m-video"><video controls playsinline autoplay preload="metadata" poster="' + esc(d.poster || '') + '" src="' + esc(d.src) + '"></video></div>' +
        '<div class="m-text m-text-tight"><h3 class="m-title" id="modal-title">' + esc(d.title) + '</h3></div>';
    };

    var openModal = function (trigger) {
      var d = trigger.dataset;
      var kind = d.modal;
      mBody.innerHTML = kind === 'space' ? buildSpace(d) : kind === 'feature' ? buildFeature(d) : buildVideo(d);
      mLabel.textContent = LABELS[kind] || 'Details';
      mOpener = trigger;
      modal.showModal();
      doc.classList.add('modal-open');
      if (lenis) lenis.stop();
      var panel = modal.querySelector('.modal-panel');
      if (panel) panel.scrollTop = 0;
    };
    var step = function (dir) {
      var imgs = mBody.querySelectorAll('.m-gallery img');
      if (imgs.length < 2) return;
      var cur = 0;
      Array.prototype.forEach.call(imgs, function (im, i) { if (im.classList.contains('is-active')) cur = i; });
      var next = (cur + dir + imgs.length) % imgs.length;
      imgs[cur].classList.remove('is-active');
      imgs[next].classList.add('is-active');
      var c = mBody.querySelector('.m-count');
      if (c) c.textContent = (next + 1) + ' / ' + imgs.length;
    };

    // runs once per close, whichever way the popup was closed
    var cleanup = function () {
      if (!doc.classList.contains('modal-open')) return;
      doc.classList.remove('modal-open');
      if (lenis && !doc.classList.contains('menu-open')) lenis.start();
      mBody.innerHTML = '';   // also stops the video
      if (mOpener && mOpener.focus) mOpener.focus({ preventScroll: true });
      mOpener = null;
    };
    var closeModal = function () {
      if (modal.open) modal.close();
      cleanup();
    };

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-modal]') : null;
      if (t) { e.preventDefault(); openModal(t); return; }
      if (!modal.open) return;
      if (e.target === modal || (e.target.closest && e.target.closest('[data-modal-close]'))) { closeModal(); return; }
      var g = e.target.closest ? e.target.closest('[data-gal]') : null;
      if (g) step(parseInt(g.getAttribute('data-gal'), 10));
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.open) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
    modal.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(); });
    modal.addEventListener('close', function () { if (!modal.open) cleanup(); });
  }

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
