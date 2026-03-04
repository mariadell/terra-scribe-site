'use strict';

/* ============================================================
   TerraScribe — main.js
   Zero-dependency: nav scroll, mobile menu, scroll animations,
   screenshot carousel, FAQ accordion
   ============================================================ */

(function () {

  /* ── Helpers ─────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }


  /* ── 1. Nav: add .scrolled class on scroll ───────────── */
  var nav = qs('.nav');
  var SCROLL_THRESHOLD = 48;

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load


  /* ── 1b. Hero transcription typewriter ───────────────── */
  var transcriptionEl = qs('#heroTranscription');
  if (transcriptionEl) {
    var phrasesJson = transcriptionEl.getAttribute('data-phrases');
    var phrases = [];
    try {
      phrases = phrasesJson ? JSON.parse(phrasesJson) : [];
    } catch (e) {
      phrases = ['Hive 3, oxalic acid, 2ml'];
    }
    if (phrases.length === 0) phrases = ['Hive 3, oxalic acid, 2ml'];

    var CHAR_DELAY = 45;
    var PAUSE_AFTER = 2800;
    var PAUSE_BETWEEN = 600;
    var idx = 0;

    function typeNext() {
      var phrase = phrases[idx % phrases.length];
      idx++;
      transcriptionEl.innerHTML = '';
      transcriptionEl.setAttribute('aria-label', phrase);

      function typeChar(i) {
        transcriptionEl.textContent = phrase.slice(0, i);
        var cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.setAttribute('aria-hidden', 'true');
        transcriptionEl.appendChild(cursor);

        if (i < phrase.length) {
          setTimeout(function () {
            cursor.remove();
            typeChar(i + 1);
          }, CHAR_DELAY);
        } else {
          setTimeout(clearAndNext, PAUSE_AFTER);
        }
      }

      function clearAndNext() {
        transcriptionEl.innerHTML = '';
        transcriptionEl.setAttribute('aria-label', '');
        setTimeout(typeNext, PAUSE_BETWEEN);
      }

      typeChar(0);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transcriptionEl.textContent = phrases[0];
      transcriptionEl.setAttribute('aria-label', phrases[0]);
    } else {
      typeNext();
    }
  }


  /* ── 2. Mobile nav drawer ────────────────────────────── */
  var burger  = qs('#navBurger');
  var drawer  = qs('#navDrawer');
  var drawerLinks = qsa('.nav-drawer a');

  function openDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.add('open');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      drawer && drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }

  drawerLinks.forEach(function (link) {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) closeDrawer();
  });


  /* ── 3. Smooth scroll for anchor links ───────────────── */
  qsa('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = qs(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeDrawer();
      var offset = nav ? nav.offsetHeight + 8 : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });


  /* ── 4. Intersection Observer: scroll animations ─────── */
  var animEls   = qsa('.fade-up, .fade-in');
  var staggerEls = qsa('.stagger');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  animEls.forEach(function (el) { observer.observe(el); });

  // Stagger: observe each direct child with increasing delay
  staggerEls.forEach(function (parent) {
    var children = qsa(':scope > *', parent);
    children.forEach(function (child, i) {
      child.style.transitionDelay = (i * 0.09) + 's';
      observer.observe(child);
    });
  });


  /* ── 5. FAQ accordion ────────────────────────────────── */
  var faqItems = qsa('.faq-item');

  faqItems.forEach(function (item) {
    var btn = qs('.faq-q', item);
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(function (fi) {
        fi.classList.remove('open');
        var q = qs('.faq-q', fi);
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      // Open clicked (unless it was already open)
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ── 6. Screenshot carousel ──────────────────────────── */
  var carousel  = qs('#carousel');
  var prevBtn   = qs('#carouselPrev');
  var nextBtn   = qs('#carouselNext');
  var dots      = qsa('.c-dot');
  var items     = carousel ? qsa('.c-item', carousel) : [];
  var currentIdx = 0;

  function getItemWidth() {
    if (!items.length) return 0;
    var style = getComputedStyle(carousel);
    var gap = parseFloat(style.gap || style.columnGap) || 32;
    return items[0].offsetWidth + gap;
  }

  function setActive(index) {
    var maxIdx = items.length - 1;
    index = Math.max(0, Math.min(index, maxIdx));
    currentIdx = index;

    // Update .active on items
    items.forEach(function (item, i) {
      item.classList.toggle('active', i === index);
    });

    // Update dots
    dots.forEach(function (d, i) {
      var active = i === index;
      d.classList.toggle('active', active);
      if (d.getAttribute('role') === 'tab') {
        d.setAttribute('aria-selected', active ? 'true' : 'false');
      }
    });

    // Scroll the carousel to centre the active item (padding centres first item at 0)
    if (carousel) {
      var itemW = getItemWidth();
      carousel.scrollTo({
        left: index * itemW,
        behavior: 'smooth'
      });
    }
  }

  // Click on any item to activate it
  items.forEach(function (item, i) {
    item.addEventListener('click', function () { setActive(i); });
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { setActive(currentIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { setActive(currentIdx + 1); });

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { setActive(i); });
  });

  // Keyboard
  if (carousel) {
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setActive(currentIdx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(currentIdx + 1); }
    });
  }

  // Sync active state when user scrolls manually
  if (carousel) {
    carousel.addEventListener('scroll', function () {
      var itemW = getItemWidth();
      if (itemW <= 0) return;
      var idx = Math.round(carousel.scrollLeft / itemW);
      idx = Math.max(0, Math.min(idx, items.length - 1));
      if (idx !== currentIdx) {
        currentIdx = idx;
        items.forEach(function (item, i) { item.classList.toggle('active', i === idx); });
        dots.forEach(function (d, i) {
          d.classList.toggle('active', i === idx);
          if (d.getAttribute('role') === 'tab') d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        });
      }
    }, { passive: true });
  }

  // Init
  setActive(0);


  /* ── 7. Contact form: basic client-side feedback ─────── */
  var form = qs('.contact-form-card form');
  if (form) {
    form.addEventListener('submit', function (e) {
      // Only intercept if it's the placeholder Formspree ID
      var action = form.getAttribute('action') || '';
      if (action.includes('YOUR_FORM_ID')) {
        e.preventDefault();
        var note = qs('.form-note', form);
        if (note) {
          note.textContent = 'Please set up a real Formspree endpoint in the form action attribute.';
          note.style.color = '#BA1A1A';
        }
      }
      // If real endpoint: let the form submit normally
    });
  }

})();
