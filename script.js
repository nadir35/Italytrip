/* Італія · 2–11 жовтня 2026 — Italy · 2–11 October 2026
   Чотири задачі: мова, відлік, чекліст, позначка розділу.
   Four jobs: language, countdown, checklist, section marker.
   Без залежностей, нічого не завантажується. */

(function () {
  'use strict';

  var DEPART = '2026-10-02';
  var RETURN = '2026-10-11';
  var STORE  = 'italy-oct-2026:';
  var LANGKEY = STORE + 'lang';

  var lang = 'uk';

  /* --- storage ----------------------------------------------------- */

  function read(key) {
    try { return window.localStorage.getItem(STORE + key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(STORE + key, value); } catch (e) { /* приватний режим */ }
  }
  function drop(key) {
    try { window.localStorage.removeItem(STORE + key); } catch (e) { /* ignore */ }
  }

  /* --- language ---------------------------------------------------- */

  var TITLE = {
    uk: 'Італія · 2–11 жовтня 2026',
    en: 'Italy · 2–11 October 2026'
  };

  function initialLang() {
    var saved;
    try { saved = window.localStorage.getItem(LANGKEY); } catch (e) { saved = null; }
    if (saved === 'uk' || saved === 'en') return saved;
    var nav = (navigator.language || '').toLowerCase();
    return nav.indexOf('en') === 0 ? 'en' : 'uk';
  }

  function setLang(next, persist) {
    lang = (next === 'en') ? 'en' : 'uk';
    var root = document.documentElement;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    document.title = TITLE[lang];
    var buttons = document.querySelectorAll('[data-set-lang]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
    /* point each figure's accessible name at the description in this language */
    var figures = document.querySelectorAll('[data-desc-uk]');
    Array.prototype.forEach.call(figures, function (f) {
      var id = f.getAttribute('data-desc-' + lang);
      if (id) f.setAttribute('aria-labelledby', id);
    });
    if (persist) {
      try { window.localStorage.setItem(LANGKEY, lang); } catch (e) { /* ignore */ }
    }
    countdown();
  }

  function wireLang() {
    var buttons = document.querySelectorAll('[data-set-lang]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        setLang(b.getAttribute('data-set-lang'), true);
      });
    });
  }

  /* --- dates ------------------------------------------------------- */

  function iso(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }
  function midnight(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  /* день / дні / днів */
  function pluralUk(n) {
    var ten = n % 10, hundred = n % 100;
    if (ten === 1 && hundred !== 11) return 'день';
    if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return 'дні';
    return 'днів';
  }

  /* --- countdown --------------------------------------------------- */

  function countdown() {
    var numEl = document.getElementById('countdown-num');
    var labEl = document.getElementById('countdown-label');
    if (!numEl || !labEl) return;

    var today = midnight(iso(new Date()));
    var toGo  = daysBetween(today, midnight(DEPART));
    var left  = daysBetween(today, midnight(RETURN));
    var uk = lang === 'uk';
    var num, label;

    if (toGo > 1) {
      num = String(toGo);
      label = uk ? pluralUk(toGo) + ' до вильоту' : 'days until departure';
    } else if (toGo === 1) {
      num = '1';
      label = uk ? 'день до вильоту — пакуватися сьогодні' : 'day until departure — pack tonight';
    } else if (toGo === 0) {
      num = uk ? 'Сьогодні' : 'Today';
      label = uk ? 'виліт до Верони' : 'we fly to Verona';
    } else if (left > 0) {
      num = (uk ? 'День ' : 'Day ') + (1 - toGo);
      label = (uk ? 'з 10 · ' : 'of 10 · ') + (bedLabel(today) || (uk ? 'у дорозі' : 'on the road'));
    } else if (left === 0) {
      num = uk ? 'Додому' : 'Home';
      label = 'VRN 14:35 → LEJ 18:00';
    } else {
      num = uk ? 'Готово' : 'Done';
      label = uk ? 'дев\'ять ночей, три бази' : 'nine nights, three bases';
    }

    numEl.textContent = num;
    labEl.textContent = label;
  }

  function bedLabel(today) {
    var card = document.querySelector('.day[data-date="' + iso(today) + '"]');
    if (!card) return '';
    var bed = card.querySelector('.bed[lang="' + lang + '"]');
    return bed ? bed.textContent.trim() : '';
  }

  /* --- today's card ------------------------------------------------ */

  function markToday() {
    var card = document.querySelector('.day[data-date="' + iso(new Date()) + '"]');
    if (card) card.setAttribute('data-today', '');
  }

  /* --- checklist --------------------------------------------------- */

  function checklist() {
    var list = document.getElementById('check');
    if (!list) return;

    var boxes = Array.prototype.slice.call(list.querySelectorAll('input[type="checkbox"]'));
    var counts = document.querySelectorAll('.progress__text .c');
    var totals = document.querySelectorAll('.progress__text .t');
    var barEl  = document.getElementById('progress-bar');
    var resetEl = document.getElementById('reset');

    Array.prototype.forEach.call(totals, function (t) { t.textContent = String(boxes.length); });

    /* The shipped order is the ranking: most consequential first. Booked things
       then rise above the rest, so the list always reads as "done" above "to do"
       without losing the ranking inside either group. */
    boxes.forEach(function (box, i) { box.parentNode.parentNode.setAttribute('data-rank', i); });

    function reorder() {
      var items = Array.prototype.slice.call(list.children);
      items.sort(function (a, b) {
        var ac = a.querySelector('input').checked ? 0 : 1;
        var bc = b.querySelector('input').checked ? 0 : 1;
        if (ac !== bc) { return ac - bc; }
        return (+a.getAttribute('data-rank')) - (+b.getAttribute('data-rank'));
      });
      items.forEach(function (li) { list.appendChild(li); });
    }

    function paint() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      Array.prototype.forEach.call(counts, function (c) { c.textContent = String(done); });
      if (barEl) barEl.style.width = (boxes.length ? (done / boxes.length) * 100 : 0) + '%';
    }

    boxes.forEach(function (box) {
      var key = box.getAttribute('data-key');
      var saved = read(key);
      /* Whatever is already booked ships checked in the HTML, so storage has to
         be able to say "unticked" out loud: an absent key means "never touched",
         which is not the same as "no". Dropping the key on untick would let the
         HTML default tick the box again on the next load. */
      if (saved === '1') { box.checked = true; }
      else if (saved === '0') { box.checked = false; }
      box.addEventListener('change', function () {
        write(key, box.checked ? '1' : '0');
        paint();
        reorder();
      });
    });

    if (resetEl) {
      resetEl.addEventListener('click', function () {
        boxes.forEach(function (box) {
          drop(box.getAttribute('data-key'));
          box.checked = box.defaultChecked;   /* booked things stay booked */
        });
        paint();
        reorder();
      });
    }

    paint();
    reorder();
  }

  /* --- section marker in the nav ------------------------------------ */

  function spy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (!document.getElementById(id)) return;
      (byId[id] = byId[id] || []).push(a);
    });

    var order = Object.keys(byId);
    var seen = {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var current = order.filter(function (id) { return seen[id]; })[0];
      order.forEach(function (id) {
        byId[id].forEach(function (a) {
          if (id === current) { a.setAttribute('aria-current', 'true'); }
          else { a.removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-72px 0px -60% 0px' });

    order.forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* --- go ----------------------------------------------------------- */

  markToday();
  wireLang();
  setLang(initialLang(), false);
  checklist();
  spy();
})();
