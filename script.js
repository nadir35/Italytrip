/* Італія · 2–12 жовтня 2026
   Три невеликі задачі: відлік, чекліст, позначка розділу.
   Без залежностей, нічого не завантажується. */

(function () {
  'use strict';

  var DEPART = '2026-10-02';
  var RETURN = '2026-10-12';
  var STORE  = 'italy-oct-2026:';

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

  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }

  /* --- countdown --------------------------------------------------- */

  function countdown() {
    var numEl = document.getElementById('countdown-num');
    var labEl = document.getElementById('countdown-label');
    if (!numEl || !labEl) return;

    var today = midnight(iso(new Date()));
    var toGo  = daysBetween(today, midnight(DEPART));
    var left  = daysBetween(today, midnight(RETURN));

    var num, label;

    if (toGo > 1) {
      num = String(toGo);
      label = plural(toGo) + ' до вильоту';
    } else if (toGo === 1) {
      num = '1';
      label = 'день до вильоту — пакуватися сьогодні';
    } else if (toGo === 0) {
      num = 'Сьогодні';
      label = 'LEJ 18:40 → BLQ 23:40';
    } else if (left > 0) {
      num = 'День ' + (1 - toGo);
      label = 'з 11 · ' + (nightLabel(today) || 'у дорозі');
    } else if (left === 0) {
      num = 'Додому';
      label = 'BLQ 18:40 → LEJ 23:10';
    } else {
      num = 'Готово';
      label = 'десять ночей, чотири бази';
    }

    numEl.textContent = num;
    labEl.textContent = label;
  }

  /* день / дні / днів */
  function plural(n) {
    var ten = n % 10, hundred = n % 100;
    if (ten === 1 && hundred !== 11) return 'день';
    if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return 'дні';
    return 'днів';
  }

  function nightLabel(today) {
    var card = document.querySelector('.day[data-date="' + iso(today) + '"]');
    if (!card) return '';
    var bed = card.querySelector('.bed');
    return bed ? bed.textContent.replace(/^Ночуємо\s*/, '').trim() : '';
  }

  /* --- today's card ------------------------------------------------ */

  function markToday() {
    var card = document.querySelector('.day[data-date="' + iso(new Date()) + '"]');
    if (card) card.setAttribute('data-today', '');
  }

  /* --- checklist --------------------------------------------------- */

  function readStore(key) {
    try { return window.localStorage.getItem(STORE + key); }
    catch (e) { return null; }
  }

  function writeStore(key, value) {
    try { window.localStorage.setItem(STORE + key, value); }
    catch (e) { /* приватний режим або переповнене сховище — сторінка працює далі */ }
  }

  function dropStore(key) {
    try { window.localStorage.removeItem(STORE + key); }
    catch (e) { /* ignore */ }
  }

  function checklist() {
    var list = document.getElementById('check');
    if (!list) return;

    var boxes   = Array.prototype.slice.call(list.querySelectorAll('input[type="checkbox"]'));
    var countEl = document.getElementById('progress-count');
    var totalEl = document.getElementById('progress-total');
    var barEl   = document.getElementById('progress-bar');
    var resetEl = document.getElementById('reset');

    if (totalEl) totalEl.textContent = String(boxes.length);

    function paint() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      if (countEl) countEl.textContent = String(done);
      if (barEl) barEl.style.width = (boxes.length ? (done / boxes.length) * 100 : 0) + '%';
    }

    boxes.forEach(function (box) {
      var key = box.getAttribute('data-key');
      if (readStore(key) === '1') box.checked = true;
      box.addEventListener('change', function () {
        if (box.checked) { writeStore(key, '1'); } else { dropStore(key); }
        paint();
      });
    });

    if (resetEl) {
      resetEl.addEventListener('click', function () {
        boxes.forEach(function (box) {
          box.checked = false;
          dropStore(box.getAttribute('data-key'));
        });
        paint();
      });
    }

    paint();
  }

  /* --- section marker in the nav ------------------------------------ */

  function spy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) map[id] = a;
    });

    var seen = {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        seen[entry.target.id] = entry.isIntersecting;
      });
      var current = Object.keys(map).filter(function (id) { return seen[id]; })[0];
      links.forEach(function (a) {
        if (current && map[current] === a) { a.setAttribute('aria-current', 'true'); }
        else { a.removeAttribute('aria-current'); }
      });
    }, { rootMargin: '-72px 0px -60% 0px' });

    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  /* --- go ----------------------------------------------------------- */

  markToday();
  countdown();
  checklist();
  spy();
})();
