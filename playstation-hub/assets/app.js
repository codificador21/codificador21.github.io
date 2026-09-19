/* ==========================================================================
   APEX ROOM — site script
   --------------------------------------------------------------------------
   EVERYTHING YOU NEED TO EDIT IS IN THE CONFIG BLOCK BELOW.
   Change a value here and it updates everywhere on the page automatically.
   ========================================================================== */

/* Each page defines window.SITE_CONFIG before loading this file.
   That object is the ONLY thing you edit per site — see any site's index.html. */
const CONFIG = Object.assign({
  phone: null, phoneDisplay: null, whatsapp: null, email: null, instagram: null,
  addressLines: [], mapsUrl: null, hours: null
}, window.SITE_CONFIG || {});

/* ==========================================================================
   Nothing below here needs editing.
   ========================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rupee = n => '₹' + Number(n).toLocaleString('en-IN');

/* --------------------------------------------------------------------------
   1. Inject CONFIG values into the page
   -------------------------------------------------------------------------- */
function applyConfig () {
  const ext = a => { a.target = '_blank'; a.rel = 'noopener'; };
  // A detail we could not verify is shown as "to be confirmed" rather than invented.
  const tbc = el => {
    el.removeAttribute('href');
    if (el.dataset.tbc === '') { el.hidden = true; return; }   // icon-only: hide it
    el.textContent = el.dataset.tbc || 'To be confirmed';
    el.classList.add('todo');
  };

  $$('[data-wa]').forEach(a => {
    if (!CONFIG.whatsapp) return tbc(a);
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=` +
      encodeURIComponent(a.dataset.wa || 'Hi! I would like to book a slot.');
    ext(a);
  });
  $$('[data-tel]').forEach(a => CONFIG.phone ? a.href = 'tel:+' + CONFIG.phone : tbc(a));
  $$('[data-phone-text]').forEach(el => {
    el.textContent = CONFIG.phoneDisplay || 'Phone to be confirmed';
  });
  $$('[data-email]').forEach(a => {
    if (!CONFIG.email) return tbc(a);
    a.href = 'mailto:' + CONFIG.email; a.textContent = CONFIG.email;
  });
  $$('[data-maps]').forEach(a => CONFIG.mapsUrl ? (a.href = CONFIG.mapsUrl, ext(a)) : tbc(a));
  $$('[data-instagram]').forEach(a => CONFIG.instagram ? (a.href = CONFIG.instagram, ext(a)) : tbc(a));

  const addr = $('[data-address]');
  if (addr) addr.innerHTML = CONFIG.addressLines.length
    ? CONFIG.addressLines.join('<br>') : 'Address to be confirmed';
  const hrs = $('[data-hours]');
  if (hrs) hrs.innerHTML = CONFIG.hours ? CONFIG.hours.join('<br>') : 'Opening hours to be confirmed';

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
}

/* --------------------------------------------------------------------------
   2. Preloader
   -------------------------------------------------------------------------- */
function preloader () {
  const el = $('.preloader');
  if (!el) return;
  const bar = $('.preloader__bar i');
  let p = 0;
  const tick = setInterval(() => {
    p = Math.min(100, p + Math.random() * 18 + 7);
    if (bar) bar.style.width = p + '%';
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        el.classList.add('is-done');
        document.body.style.overflow = '';
      }, 260);
    }
  }, reduced ? 20 : 130);
  document.body.style.overflow = 'hidden';
  // Safety net: never trap the visitor behind the loader.
  setTimeout(() => { el.classList.add('is-done'); document.body.style.overflow = ''; }, 4000);
}

/* --------------------------------------------------------------------------
   3. Custom cursor (fine pointers only)
   -------------------------------------------------------------------------- */
function cursor () {
  if (reduced || window.matchMedia('(pointer:coarse)').matches) return;
  const dot = $('.cursor'), ring = $('.cursor-ring');
  if (!dot || !ring) return;
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    document.body.classList.add('cursor-ready');
    dot.style.transform = `translate(${mx - 3.5}px, ${my - 3.5}px)`;
  }, { passive: true });

  (function loop () {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    const s = ring.offsetWidth / 2;
    ring.style.transform = `translate(${rx - s}px, ${ry - s}px)`;
    requestAnimationFrame(loop);
  })();

  const hot = 'a, button, summary, input[type=range], .zone, .plan, .value, figure';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hot)) document.body.classList.add('cursor-hot');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hot)) document.body.classList.remove('cursor-hot');
  });
}

/* --------------------------------------------------------------------------
   4. Particle field — drifting dots joined by lines, reacting to the pointer
   -------------------------------------------------------------------------- */
function particles () {
  const cv = $('#particles');
  if (!cv || reduced) return;
  const ctx = cv.getContext('2d');
  let w, h, dpr, pts = [], mouse = { x: -999, y: -999 };

  function size () {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width  = innerWidth  * dpr;
    h = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    const count = Math.min(90, Math.round(innerWidth * innerHeight / 22000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .28 * dpr,
      vy: (Math.random() - .5) * .28 * dpr,
      r: (Math.random() * 1.5 + .5) * dpr,
      c: Math.random() > .82 ? '255,47,134' : '93,220,255'
    }));
  }

  addEventListener('resize', size);
  addEventListener('mousemove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
  size();

  (function draw () {
    ctx.clearRect(0, 0, w, h);
    const link = 130 * dpr;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // gentle pull toward the pointer
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 180 * dpr && d > 1) { p.x += dx / d * .5; p.y += dy / d * .5; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},.75)`;
      ctx.fill();

      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dd = Math.hypot(p.x - q.x, p.y - q.y);
        if (dd < link) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(93,220,255,${(1 - dd / link) * .14})`;
          ctx.lineWidth = dpr * .6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  })();
}

/* --------------------------------------------------------------------------
   5. Scroll progress bar + sticky nav + active section link
   -------------------------------------------------------------------------- */
function scrollUi () {
  const bar = $('.progress'), nav = $('.nav');
  const links = $$('.nav__links a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-stuck', y > 30);

    let current = -1;
    sections.forEach((s, i) => { if (s.offsetTop - 140 <= y) current = i; });
    links.forEach((a, i) => a.classList.toggle('is-active', i === current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------------
   6. Reveal on scroll + count-up numbers
   -------------------------------------------------------------------------- */
function reveals () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('is-in'), delay);
      if (el.dataset.count !== undefined) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });

  $$('[data-reveal]').forEach(el => io.observe(el));
  $$('[data-count]').forEach(el => io.observe(el));
}

function countUp (el) {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  if (reduced) { el.textContent = prefix + target.toLocaleString('en-IN') + suffix; return; }
  const dur = 1500;
  const t0 = performance.now();
  (function step (t) {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * eased).toLocaleString('en-IN') + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* --------------------------------------------------------------------------
   7. Text scramble on section headings
   -------------------------------------------------------------------------- */
function scramble () {
  if (reduced) return;
  const chars = '▚▞█▓▒░#$%&/\\<>*+=';
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      run(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: .5 });

  $$('[data-scramble]').forEach(el => io.observe(el));

  function run (el) {
    const final = el.textContent;
    const queue = [...final].map((c, i) => ({
      c, from: Math.floor(Math.random() * 14), to: Math.floor(Math.random() * 14) + 14 + i * 1.1
    }));
    let frame = 0;
    (function tick () {
      let out = '', done = 0;
      queue.forEach(q => {
        if (frame >= q.to) { out += q.c; done++; }
        else if (frame >= q.from) out += chars[Math.floor(Math.random() * chars.length)];
        else out += q.c === ' ' ? ' ' : '';
      });
      el.textContent = out;
      if (done < queue.length) { frame++; requestAnimationFrame(tick); }
      else el.textContent = final;
    })();
  }
}

/* --------------------------------------------------------------------------
   8. 3D tilt + magnetic buttons
   -------------------------------------------------------------------------- */
function tilt () {
  if (reduced || window.matchMedia('(pointer:coarse)').matches) return;

  $$('[data-tilt]').forEach(card => {
    const strength = parseFloat(card.dataset.tilt) || 9;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      card.style.transform =
        `perspective(900px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  $$('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform =
        `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* --------------------------------------------------------------------------
   9. Parallax on decorated images
   -------------------------------------------------------------------------- */
function parallax () {
  if (reduced) return;
  const items = $$('[data-parallax]');
  if (!items.length) return;
  let ticking = false;
  const run = () => {
    items.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || .12;
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - innerHeight / 2) * -speed;
      el.style.setProperty('--py', offset.toFixed(1) + 'px');
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(run); ticking = true; }
  }, { passive: true });
  run();
}

/* --------------------------------------------------------------------------
   10. Mobile menu
   -------------------------------------------------------------------------- */
function mobileMenu () {
  const burger = $('.burger'), menu = $('.mobile-menu');
  if (!burger || !menu) return;
  const toggle = (open) => {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle(!menu.classList.contains('is-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
}

/* --------------------------------------------------------------------------
   11. Session calculator
   -------------------------------------------------------------------------- */
function calculator () {
  const root = $('#calc');
  if (!root) return;

  const state = { mode: 'ps5_1', hours: 6, plan: 12 };

  const rates = {
    ps5_1:  { label: 'PS5 · 1 player',           rate: CONFIG.ps5.p1,       heads: 1, memberships: 1 },
    ps5_2:  { label: 'PS5 · 2 players',          rate: CONFIG.ps5.p2,       heads: 2, memberships: 1 },
    proj_2: { label: 'Projector room · 2 players', rate: CONFIG.projector.p2, heads: 2, memberships: 1 },
    proj_4: { label: 'Projector room · 4 players', rate: CONFIG.projector.p4, heads: 4, memberships: 2 }
  };
  const walkKey = { ps5_1: 'ps5_1', ps5_2: 'ps5_2', proj_2: 'proj_2', proj_4: 'proj_4' };

  const bind = (sel, key, cast = String) => {
    $$(sel + ' button', root).forEach(b => {
      b.addEventListener('click', () => {
        $$(sel + ' button', root).forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on');
        state[key] = cast(b.dataset.val);
        render();
      });
    });
  };
  bind('[data-seg="mode"]', 'mode');
  bind('[data-seg="plan"]', 'plan', Number);

  const slider = $('#hoursRange', root);
  const hoursOut = $('#hoursOut', root);
  slider.addEventListener('input', () => {
    state.hours = Number(slider.value);
    if (hoursOut) hoursOut.textContent = state.hours;
    slider.style.setProperty('--fill', ((state.hours - slider.min) / (slider.max - slider.min) * 100) + '%');
    render();
  });

  function render () {
    const r = rates[state.mode];
    const plan = CONFIG.plans.find(p => p.months === state.plan);
    const months = plan.months;
    const hoursTotal = state.hours * months;

    const membershipCost = plan.price * r.memberships;
    const playCost = r.rate * hoursTotal;
    const total = membershipCost + playCost;
    const perHead = total / r.heads;
    const perMonth = total / months;

    $('#outTotal', root).textContent = rupee(Math.round(total));
    $('#outPlanLine', root).innerHTML =
      `${r.memberships} × ${months}-month membership <b>${rupee(membershipCost)}</b>`;
    $('#outPlayLine', root).innerHTML =
      `${hoursTotal} hrs of play @ ${rupee(r.rate)}/hr <b>${rupee(playCost)}</b>`;
    $('#outHeadLine', root).innerHTML =
      `Cost per player over ${months} months <b>${rupee(Math.round(perHead))}</b>`;
    $('#outMonthLine', root).innerHTML =
      `Works out to <b>${rupee(Math.round(perMonth))}/month</b>`;

    const note = $('#outNote', root);
    const w = CONFIG.walkIn && CONFIG.walkIn[walkKey[state.mode]];
    if (w) {
      const walkTotal = w * hoursTotal;
      const saved = walkTotal - total;
      note.innerHTML = saved > 0
        ? `At walk-in rates the same ${hoursTotal} hours would cost ${rupee(walkTotal)}. <b>You save ${rupee(Math.round(saved))}</b> — the membership pays for itself in about <b>${Math.ceil(membershipCost / (w - r.rate))} hours</b> of play.`
        : `At walk-in rates the same ${hoursTotal} hours would cost ${rupee(walkTotal)}.`;
    } else {
      note.innerHTML =
        `That is <b>${rupee(Math.round(r.rate / r.heads))}/hour per player</b> on the member rate, with the membership spread across the full ${months} months. One membership covers up to 2 players.`;
    }
  }

  slider.style.setProperty('--fill', ((state.hours - slider.min) / (slider.max - slider.min) * 100) + '%');
  render();
}

/* --------------------------------------------------------------------------
   12. Ripple on click
   -------------------------------------------------------------------------- */
function ripple () {
  if (reduced) return;
  document.addEventListener('pointerdown', e => {
    const t = e.target.closest('.btn');
    if (!t) return;
    const r = t.getBoundingClientRect();
    const s = document.createElement('span');
    const size = Math.max(r.width, r.height) * 2;
    Object.assign(s.style, {
      position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
      width: size + 'px', height: size + 'px',
      left: (e.clientX - r.left - size / 2) + 'px',
      top:  (e.clientY - r.top  - size / 2) + 'px',
      background: 'radial-gradient(circle, rgba(255,255,255,.45), transparent 62%)',
      transform: 'scale(0)', opacity: '1',
      transition: 'transform .6s cubic-bezier(.16,1,.3,1), opacity .6s'
    });
    t.appendChild(s);
    requestAnimationFrame(() => { s.style.transform = 'scale(1)'; s.style.opacity = '0'; });
    setTimeout(() => s.remove(), 650);
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  preloader();
  cursor();
  particles();
  scrollUi();
  reveals();
  scramble();
  tilt();
  parallax();
  mobileMenu();
  calculator();
  ripple();
});
})();
