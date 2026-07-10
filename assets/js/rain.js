/* ============================================================================
   Muhammad Abubakar — Portfolio · weather layer
   A cinematic rain / thunderstorm you can toggle from the nav.

   Sequence when enabled:
     1. the sky darkens and clouds drift in, slowly gathering overhead
     2. distant lightning starts to flicker — the storm builds tension
     3. rain fades in and ramps up to a full downpour with splashes + gusts

   Zero dependencies. Pure Canvas 2D (far lighter than WebGL for thousands of
   streaks). Respects prefers-reduced-motion (no strobing lightning) and pauses
   when the tab is hidden. Shares the site's dark + acid-green identity.
   ========================================================================= */
(() => {
  "use strict";

  const btn = document.getElementById("weatherToggle");
  if (!btn) return;

  const ACCENT   = "#c9f24e";                 // portfolio acid-green
  const reduced  = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse   = matchMedia("(pointer: coarse)").matches;
  const STORE_KEY = "abubakar:weather";

  /* ── DOM: sky mood layer + drawing canvas ─────────────────────── */
  const sky = document.createElement("div");
  sky.className = "rain-sky";
  sky.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "rain-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(sky);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  /* ── sizing (DPR-aware, capped for perf) ──────────────────────── */
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildClouds();
    computeCaps();
  }

  /* ── tunables ─────────────────────────────────────────────────── */
  const RAIN_DELAY = 2100;   // ms after enable before drops begin
  const RAIN_RAMP  = 3600;   // ms to reach a full downpour
  const STORM_LEAD = 1300;   // ms after enable before first lightning flickers

  let MAX_DROPS = 260;
  function computeCaps() {
    const area = W * H;
    MAX_DROPS = Math.round(area / 6800);
    if (coarse) MAX_DROPS = Math.round(MAX_DROPS * 0.58);
    MAX_DROPS = Math.max(100, Math.min(MAX_DROPS, 520));
  }

  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ── clouds: soft dark blobs forming a band across the top ────── */
  let clouds = [];
  function buildClouds() {
    const n = Math.max(9, Math.round(W / 150));
    clouds = [];
    for (let i = 0; i < n; i++) {
      const r = rnd(H * 0.16, H * 0.32);
      clouds.push({
        x: rnd(-0.05, 1.05) * W,
        y: rnd(-0.10, 0.22) * H,
        r,
        drift: rnd(4, 12) * (Math.random() < 0.5 ? -1 : 1), // px/s
        tone: rnd(16, 30),                                   // base charcoal
      });
    }
  }

  /* ── raindrops (recycled pool with parallax depth) ────────────── */
  const drops = [];
  function spawnDrop(fromTop) {
    const depth = Math.random();            // 0 far … 1 near
    return {
      x: rnd(-0.1, 1.1) * W,
      y: fromTop ? rnd(-H * 0.5, -20) : rnd(-40, H),
      depth,
      len: rnd(10, 20) + depth * 26,
      speed: (rnd(760, 980) + depth * 900), // px/s
      w: 0.6 + depth * 1.4,
      a: 0.10 + depth * 0.42,
    };
  }

  /* ── splashes at the waterline ────────────────────────────────── */
  const splashes = [];
  function addSplash(x, y, depth) {
    splashes.push({ x, y, r: 1, maxR: rnd(6, 12) + depth * 8, a: 0.35 + depth * 0.3 });
    // a couple of tiny bounce droplets for the nearer drops
    if (depth > 0.62 && splashes.length < 400) {
      for (let i = 0; i < 2; i++) {
        splashes.push({
          x, y, vx: rnd(-40, 40), vy: rnd(-140, -60),
          bounce: true, r: rnd(0.8, 1.6), a: 0.5,
        });
      }
    }
  }

  /* ── lightning ────────────────────────────────────────────────── */
  let flash = 0;              // 0..1 screen brightness
  let nextStrike = Infinity;
  const bolts = [];          // active bolt polylines (fade out)

  function scheduleStrike(now, buildup) {
    // frequent while the storm is building, calmer once it's steady
    const base = buildup ? rnd(900, 2200) : rnd(4500, 11000);
    nextStrike = now + base;
  }

  function makeBolt() {
    const startX = rnd(0.15, 0.85) * W;
    const startY = rnd(0, 0.14) * H;
    const endY   = rnd(0.55, 0.85) * H;
    const pts = [{ x: startX, y: startY }];
    let x = startX, y = startY;
    const steps = Math.round(rnd(9, 15));
    const dy = (endY - startY) / steps;
    for (let i = 0; i < steps; i++) {
      x += rnd(-34, 34);
      y += dy * rnd(0.7, 1.3);
      pts.push({ x, y });
    }
    // side branches for a forked look
    const branches = [];
    for (let i = 2; i < pts.length - 1; i++) {
      if (Math.random() < 0.22) {
        const p = pts[i];
        const bp = [{ x: p.x, y: p.y }];
        let bx = p.x, by = p.y;
        const bs = Math.round(rnd(2, 4));
        for (let j = 0; j < bs; j++) {
          bx += rnd(-40, 40); by += rnd(18, 46);
          bp.push({ x: bx, y: by });
        }
        branches.push(bp);
      }
    }
    return { pts, branches, life: 1 };
  }

  function strike(now, buildup) {
    if (reduced) return;                 // no strobing under reduced-motion
    bolts.push(makeBolt());
    flash = Math.min(1, flash + rnd(0.55, 0.9));
    thunder(buildup ? 0.6 : 1);
    // occasional quick double-flash
    if (Math.random() < 0.4) setTimeout(() => { if (enabled) { flash = Math.min(1, flash + 0.4); if (bolts.length < 4) bolts.push(makeBolt()); } }, rnd(70, 150));
    scheduleStrike(now, buildup);
  }

  /* ── thunder: gentle synthesized rumble (WebAudio, low volume) ── */
  let actx = null;
  function thunder(strength) {
    if (reduced) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t0 = actx.currentTime + rnd(0.15, 0.5);      // slight delay after the flash
      const dur = rnd(1.4, 2.6);
      // filtered noise burst
      const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const env = Math.pow(1 - i / data.length, 2);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const src = actx.createBufferSource(); src.buffer = buf;
      const lp = actx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(420, t0);
      lp.frequency.exponentialRampToValueAtTime(90, t0 + dur);
      const g = actx.createGain();
      const peak = 0.16 * strength;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(lp); lp.connect(g); g.connect(actx.destination);
      src.start(t0); src.stop(t0 + dur);
    } catch (_) { /* audio optional — never block the visuals */ }
  }

  /* ── state ────────────────────────────────────────────────────── */
  let enabled = false;
  let rafId = 0;
  let last = 0;
  let startTime = 0;
  let cloud = 0;   // current cloud opacity 0..1
  let rain = 0;    // current rain intensity 0..1
  let wind = 0;    // px/s horizontal drift
  let windT = 0;

  function loop(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;            // clamp after tab-switch stalls
    const now = ts;
    const elapsed = now - startTime;

    /* targets */
    const targetCloud = enabled ? 1 : 0;
    let targetRain = 0;
    if (enabled && elapsed > RAIN_DELAY) targetRain = Math.min(1, (elapsed - RAIN_DELAY) / RAIN_RAMP);

    cloud += (targetCloud - cloud) * (enabled ? 0.9 : 1.4) * dt;
    rain  += (targetRain  - rain)  * (enabled ? 0.9 : 2.2) * dt;
    cloud = Math.max(0, Math.min(1, cloud));
    rain  = Math.max(0, Math.min(1, rain));

    /* wind: slow gusts that swing the rain angle */
    windT += dt;
    wind = Math.sin(windT * 0.35) * 140 + Math.sin(windT * 0.13) * 90;

    /* lightning schedule */
    if (enabled && !reduced) {
      if (nextStrike === Infinity && elapsed > STORM_LEAD) scheduleStrike(now, true);
      const buildup = elapsed < RAIN_DELAY + RAIN_RAMP;
      if (now >= nextStrike) strike(now, buildup);
    }
    flash = Math.max(0, flash - dt * 3.2);

    draw(dt);

    // keep running while enabled, or until everything has faded out
    if (enabled || cloud > 0.01 || rain > 0.01 || flash > 0.01 || splashes.length) {
      rafId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      canvas.classList.remove("is-on");
      rafId = 0; last = 0;
    }
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);

    /* ── clouds ── */
    if (cloud > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      for (const c of clouds) {
        c.x += c.drift * dt;
        if (c.x < -c.r) c.x = W + c.r;
        if (c.x > W + c.r) c.x = -c.r;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        const t = c.tone;
        const rim = flash * 0.9;   // storm-lit underside
        g.addColorStop(0,   `rgba(${t + rim * 90},${t + 6 + rim * 100},${t + 14 + rim * 60},${0.42 * cloud})`);
        g.addColorStop(0.55,`rgba(${t - 4},${t},${t + 10},${0.26 * cloud})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* ── rain ── */
    if (rain > 0.005) {
      const want = Math.floor(MAX_DROPS * rain);
      let added = 0;
      while (drops.length < want && added < 14) { drops.push(spawnDrop(true)); added++; }

      const groundY = H * 0.985;
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const vx = wind * (0.4 + d.depth * 0.9);
        d.x += vx * dt;
        d.y += d.speed * dt;

        const dxn = (vx / d.speed) * d.len;   // streak lean matches velocity
        ctx.strokeStyle = `rgba(198,214,246,${d.a * (0.5 + rain * 0.5)})`;
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - dxn, d.y - d.len);
        ctx.stroke();

        if (d.y >= groundY) {
          if (d.depth > 0.35 && splashes.length < 380 && Math.random() < 0.9) addSplash(d.x, groundY, d.depth);
          // recycle only while it's still raining, else let the pool drain
          if (drops.length <= want) { const nd2 = spawnDrop(true); d.x = nd2.x; d.y = nd2.y; d.depth = nd2.depth; d.len = nd2.len; d.speed = nd2.speed; d.w = nd2.w; d.a = nd2.a; }
          else { drops.splice(i, 1); i--; }
        }
      }
      ctx.restore();
    } else if (drops.length) {
      drops.length = 0;
    }

    /* ── splashes ── */
    if (splashes.length) {
      ctx.save();
      for (let i = 0; i < splashes.length; i++) {
        const s = splashes[i];
        if (s.bounce) {
          s.vy += 520 * dt;
          s.x += s.vx * dt; s.y += s.vy * dt;
          s.a -= dt * 1.6;
          ctx.fillStyle = `rgba(206,220,248,${Math.max(0, s.a)})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
          if (s.a <= 0) { splashes.splice(i, 1); i--; }
        } else {
          s.r += (s.maxR - s.r) * dt * 6;
          s.a -= dt * 1.8;
          ctx.strokeStyle = `rgba(200,216,246,${Math.max(0, s.a)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
          if (s.a <= 0) { splashes.splice(i, 1); i--; }
        }
      }
      ctx.restore();
    }

    /* ── lightning bolts ── */
    if (bolts.length) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let i = 0; i < bolts.length; i++) {
        const b = bolts[i];
        b.life -= dt * 3.4;
        if (b.life <= 0) { bolts.splice(i, 1); i--; continue; }
        const a = Math.max(0, b.life);
        // outer acid-green glow
        ctx.shadowColor = ACCENT; ctx.shadowBlur = 26;
        ctx.strokeStyle = `rgba(201,242,78,${0.55 * a})`;
        ctx.lineWidth = 3.4;
        strokePath(b.pts);
        for (const br of b.branches) strokePath(br);
        // hot white core
        ctx.shadowBlur = 8;
        ctx.strokeStyle = `rgba(245,255,235,${0.95 * a})`;
        ctx.lineWidth = 1.4;
        strokePath(b.pts);
        for (const br of b.branches) strokePath(br);
      }
      ctx.restore();
    }

    /* ── flash wash ── */
    if (flash > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(150,180,120,${0.16 * flash})`);
      g.addColorStop(0.5, `rgba(120,150,110,${0.09 * flash})`);
      g.addColorStop(1, "rgba(90,120,90,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function strokePath(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  /* ── enable / disable ─────────────────────────────────────────── */
  function enable() {
    if (enabled) return;
    enabled = true;
    startTime = performance.now();
    nextStrike = Infinity;
    btn.setAttribute("aria-pressed", "true");
    sky.classList.add("is-on");
    canvas.classList.add("is-on");
    try { localStorage.setItem(STORE_KEY, "1"); } catch (_) {}
    if (actx && actx.state === "suspended") actx.resume();
    if (!rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    btn.setAttribute("aria-pressed", "false");
    sky.classList.remove("is-on");
    nextStrike = Infinity;
    bolts.length = 0;
    try { localStorage.setItem(STORE_KEY, "0"); } catch (_) {}
    // loop keeps running until clouds/rain fade, then clears itself
    if (!rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  }

  function toggle() { enabled ? disable() : enable(); }

  /* ── wiring ───────────────────────────────────────────────────── */
  resize();
  window.addEventListener("resize", debounce(resize, 200));
  btn.addEventListener("click", toggle);

  // keyboard shortcut: press "R" (not while typing) to toggle the rain
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); toggle(); }
  });

  // pause the animation loop while the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; last = 0; } }
    else if ((enabled || cloud > 0.01 || rain > 0.01) && !rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  });

  // restore last choice
  try { if (localStorage.getItem(STORE_KEY) === "1") enable(); } catch (_) {}

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
})();
