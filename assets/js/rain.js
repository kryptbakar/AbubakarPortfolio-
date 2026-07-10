/* ============================================================================
   Muhammad Abubakar — Portfolio · weather layer
   A cinematic, living thunderstorm you can toggle from the nav.

   When enabled:
     1. the sky darkens and heavy clouds slowly gather and descend overhead
     2. distant sheet-lightning flickers, thunder rolls in from far away
     3. rain fades in and the storm settles into an endless ebb-and-flow of
        squalls — gusting rain, close forked strikes that light the whole scene
        (and the portrait), droplets running down the "glass", and thunder that
        cracks then rolls for a long time with a real reverb tail

   Zero dependencies. Canvas 2D visuals + WebAudio for a looping rain bed and
   synthesized thunder (crack + long rolling rumble + sub-bass + convolution
   reverb, delayed by distance). prefers-reduced-motion safe (no strobing / no
   audio), photosensitivity-limited flashes, tab-hidden aware, DPR-capped,
   lighter on mobile, and a mute control. Acid-green identity throughout.
   ========================================================================= */
(() => {
  "use strict";

  const btn = document.getElementById("weatherToggle");
  if (!btn) return;

  const ACCENT   = "#c9f24e";
  const reduced  = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse   = matchMedia("(pointer: coarse)").matches;
  const STORE_KEY = "abubakar:weather";
  const MUTE_KEY  = "abubakar:weather:mute";
  const VOLUME    = 0.85;

  /* ── DOM: sky + color grade + canvas + mute button ────────────── */
  const sky = el("div", "rain-sky");
  const grade = el("div", "rain-grade");
  const canvas = el("canvas", "rain-canvas");
  const mute = document.createElement("button");
  mute.className = "weather-mute";
  mute.type = "button";
  mute.setAttribute("aria-label", "Mute storm audio");
  mute.setAttribute("aria-pressed", "false");
  mute.setAttribute("title", "Mute storm audio");
  mute.innerHTML =
    '<svg class="wm-ic wm-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a4 4 0 0 1 0 7"/><path d="M18.5 6a7 7 0 0 1 0 12"/></svg>' +
    '<svg class="wm-ic wm-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><line x1="16" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="16" y2="15"/></svg>';
  document.body.appendChild(grade);
  document.body.appendChild(sky);
  document.body.appendChild(canvas);
  document.body.appendChild(mute);
  const ctx = canvas.getContext("2d");
  const portrait = document.querySelector(".hero__portrait img");

  function el(tag, cls) { const n = document.createElement(tag); n.className = cls; n.setAttribute("aria-hidden", "true"); return n; }

  /* ── sizing (DPR-aware, capped; handles mobile URL-bar resize) ── */
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildClouds();
    computeCaps();
  }

  /* ── timing — a slower, more deliberate build ─────────────────── */
  const STORM_LEAD = 1200;   // ms before the first distant flicker
  const RAIN_DELAY = 4200;   // ms before rain begins (clouds gather first)
  const RAIN_RAMP  = 5200;   // ms for the first downpour to build

  const rnd  = (a, b) => a + Math.random() * (b - a);
  const clmp = (v, a, b) => Math.max(a, Math.min(b, v));

  let MAX_DROPS = 180;
  function computeCaps() {
    MAX_DROPS = Math.round((W * H) / 12500);   // fewer, livelier streaks
    if (coarse) MAX_DROPS = Math.round(MAX_DROPS * 0.6);
    MAX_DROPS = clmp(MAX_DROPS, 55, 300);
  }

  /* ── clouds: dark masses that descend into view as they gather ── */
  let clouds = [];
  function buildClouds() {
    const n = Math.max(14, Math.round(W / 95));
    clouds = [];
    for (let i = 0; i < n; i++) {
      const r = rnd(H * 0.15, H * 0.38);
      const yTo = rnd(-0.14, 0.30) * H;
      clouds.push({
        x: rnd(-0.05, 1.05) * W,
        yTo, yFrom: yTo - rnd(40, 120),
        r, drift: rnd(5, 16) * (Math.random() < 0.5 ? -1 : 1),
        bob: rnd(0, Math.PI * 2), bobAmp: rnd(4, 14),
        tone: rnd(20, 40),
      });
    }
  }

  /* ── raindrops (recycled pool, depth-bucketed for batched drawing) */
  const NB = 5;
  const drops = [];
  const seg = Array.from({ length: NB }, () => []);   // reused coord scratch
  const bAlpha = [0.12, 0.20, 0.30, 0.40, 0.52];
  const bWidth = [0.6, 0.9, 1.2, 1.6, 2.1];
  function spawnDrop(fromTop) {
    const depth = Math.random();
    return {
      x: rnd(-0.12, 1.12) * W,
      y: fromTop ? rnd(-H * 0.6, -20) : rnd(-40, H),
      depth, b: Math.min(NB - 1, (depth * NB) | 0),
      len: rnd(12, 22) + depth * 36,
      speed: rnd(760, 1000) + depth * 1150,
      ph: rnd(0, 6.28),                 // flutter phase — each drop sways on its own
      sway: rnd(10, 26),
    };
  }

  /* ── near-camera foreground streaks (depth + drama) ───────────── */
  const fg = [];
  function buildFg() {
    fg.length = 0;
    const n = coarse ? 6 : 12;
    for (let i = 0; i < n; i++) fg.push(spawnFg(true));
  }
  function spawnFg(rndY) {
    return { x: rnd(-0.1, 1.1) * W, y: rndY ? rnd(-H, 0) : rnd(-H * 0.4, -40),
      len: rnd(60, 150), speed: rnd(2200, 3200), w: rnd(2.2, 4.5), a: rnd(0.05, 0.14) };
  }

  /* ── rain on the "glass": droplets that cling then run down ────── */
  const glass = [];
  const GMAX = coarse ? 14 : 26;
  function spawnGlassStatic() {
    return { x: rnd(0, W), y: rnd(0, H * 0.9), r: rnd(3.5, 9), vy: 0,
      state: "cling", hold: rnd(0.4, 3.5), wob: rnd(0, 6.28), trail: 0 };
  }

  /* ── splashes across a staggered impact band + puddle line ────── */
  const splashes = [];
  function addSplash(x, y, depth) {
    const big = Math.random() < 0.12;
    splashes.push({ x, y, r: 1, maxR: (big ? rnd(14, 22) : rnd(5, 12)) + depth * 8, a: 0.30 + depth * 0.32 });
    if (depth > 0.6 && splashes.length < 460) {
      const n = big ? 4 : 2;
      for (let i = 0; i < n; i++) splashes.push({ x, y, vx: rnd(-55, 55), vy: rnd(-170, -70), bounce: true, r: rnd(0.8, 1.7), a: 0.55 });
    }
  }

  /* ── lightning (with photosensitivity limiter) ────────────────── */
  let flash = 0, flashHue = 0, nextStrike = Infinity, shake = 0;
  const bolts = [];
  const flashTimes = [];         // timestamps, to cap flashes/second
  const MIN_FLASH_GAP = 130;     // ms
  let lastFlash = -1e9;

  function igniteFlash(now, peak, warm) {
    if (now - lastFlash < MIN_FLASH_GAP) return false;
    // never more than 3 flashes inside any 1s window
    while (flashTimes.length && now - flashTimes[0] > 1000) flashTimes.shift();
    if (flashTimes.length >= 3) return false;
    flashTimes.push(now); lastFlash = now;
    flash = Math.max(flash, Math.min(peak, 1));
    flashHue = warm;
    return true;
  }

  function makeBolt(brightness) {
    const startX = rnd(0.12, 0.88) * W, startY = rnd(-0.02, 0.12) * H, endY = rnd(0.5, 0.9) * H;
    const pts = [{ x: startX, y: startY }];
    let x = startX, y = startY;
    const steps = Math.round(rnd(11, 18)), dy = (endY - startY) / steps;
    for (let i = 0; i < steps; i++) { x += rnd(-40, 40); y += dy * rnd(0.65, 1.35); pts.push({ x, y }); }
    const branches = [];
    for (let i = 2; i < pts.length - 1; i++) {
      if (Math.random() < 0.26) {
        const p = pts[i], bp = [{ x: p.x, y: p.y }]; let bx = p.x, by = p.y;
        const bs = Math.round(rnd(2, 5));
        for (let j = 0; j < bs; j++) { bx += rnd(-46, 46); by += rnd(20, 52); bp.push({ x: bx, y: by }); }
        branches.push(bp);
      }
    }
    return { pts, branches, life: 1, bright: brightness };
  }

  function scheduleStrike(now, stormWave) { nextStrike = now + rnd(1500, 5200) * (1.55 - stormWave); }

  function strike(now, stormWave) {
    if (reduced) return;
    let distance = Math.pow(Math.random(), 0.6);
    if (Math.random() < 0.16 + stormWave * 0.12) distance = rnd(0, 0.28);
    const close = distance < 0.5;
    const peak = clmp((1 - distance) * rnd(0.7, 1) + 0.14, 0.14, 1);
    const lit = igniteFlash(now, peak, distance > 0.55 ? 0.4 : 0);
    if (lit) {
      if (close && bolts.length < 5) {
        bolts.push(makeBolt(1 - distance * 0.7));
        if (distance < 0.22 && Math.random() < 0.6) bolts.push(makeBolt(1 - distance));
      }
      if (distance < 0.2) shake = Math.max(shake, (1 - distance) * 8);
    }
    thunder(distance, rnd(0.85, 1.15));
    if (Math.random() < 0.35) {
      const extra = Math.round(rnd(1, 2));
      for (let i = 0; i < extra; i++) {
        setTimeout(() => {
          if (!enabled) return;
          const t2 = performance.now();
          const lit2 = igniteFlash(t2, peak * rnd(0.5, 0.85), distance > 0.5 ? 0.4 : 0);
          if (lit2 && close && bolts.length < 5 && Math.random() < 0.5) bolts.push(makeBolt(1 - distance * 0.8));
          thunder(clmp(distance + rnd(-0.05, 0.12), 0, 1), rnd(0.5, 0.85));
        }, rnd(220, 900) * (i + 1));
      }
    }
    scheduleStrike(now, stormWave);
  }

  /* ── audio: rain bed + long, rolling, reverberant thunder ─────── */
  let actx = null, busComp = null, masterMix = null, reverbBus = null, IR = null;
  let rainSrc = null, rainGain = null, rainFilter = null, rainStopT = 0;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (_) {}

  function ensureAudio() {
    if (actx) return true;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      busComp = actx.createDynamicsCompressor();
      busComp.threshold.value = -16; busComp.knee.value = 24; busComp.ratio.value = 8;
      busComp.attack.value = 0.003; busComp.release.value = 0.4;
      busComp.connect(actx.destination);
      masterMix = actx.createGain();
      masterMix.gain.value = muted ? 0 : VOLUME;
      masterMix.connect(busComp);
      // long, diffuse impulse so thunder rolls and lingers
      IR = makeIR(5.5, 2.2);
      reverbBus = actx.createConvolver(); reverbBus.buffer = IR;
      const rg = actx.createGain(); rg.gain.value = 0.9;
      reverbBus.connect(rg); rg.connect(masterMix);
      return true;
    } catch (_) { actx = null; return false; }
  }
  function makeIR(seconds, decay) {
    const rate = actx.sampleRate, len = Math.floor(rate * seconds), buf = actx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function noiseBuffer(dur) {
    const len = Math.max(1, Math.floor(actx.sampleRate * dur)), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function startRainBed() {
    if (reduced || !ensureAudio() || rainSrc) return;
    rainSrc = actx.createBufferSource(); rainSrc.buffer = noiseBuffer(2.2); rainSrc.loop = true;
    rainFilter = actx.createBiquadFilter(); rainFilter.type = "bandpass"; rainFilter.frequency.value = 1600; rainFilter.Q.value = 0.35;
    const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
    rainGain = actx.createGain(); rainGain.gain.value = 0.0001;
    rainSrc.connect(rainFilter); rainFilter.connect(lp); lp.connect(rainGain); rainGain.connect(masterMix);
    rainSrc.start();
  }
  function stopRainBed() {
    if (!rainSrc) return;
    const s = rainSrc; rainSrc = null;
    try { rainGain.gain.setTargetAtTime(0.0001, actx.currentTime, 0.5); s.stop(actx.currentTime + 1.8); } catch (_) {}
  }

  function thunder(distance, mag) {
    if (reduced || !ensureAudio()) return;
    if (actx.state === "suspended") actx.resume();
    const now = actx.currentTime;
    const delay = 0.04 + distance * distance * 5.5;
    const t = now + delay;
    // long tails — thunder that keeps rumbling well after the flash
    const dur = 4.5 + (1 - distance) * 5.5 + Math.random() * 3;
    const vol = clmp((0.22 + (1 - distance) * 0.95) * mag, 0, 1.1);

    const out = actx.createGain(); out.gain.value = vol;
    out.connect(masterMix); out.connect(reverbBus);

    // (no sharp crack — just the deep rolling rumble the storm rides on)
    for (let k = 0; k < 3; k++) {               // 3 overlapping rolling beds
      const off = k * rnd(0.15, 0.7), bd = Math.max(0.8, dur - off);
      const ns = actx.createBufferSource(); ns.buffer = noiseBuffer(bd);
      const lp = actx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(clmp(760 - distance * 340 - k * 120, 100, 900), t + off);
      lp.frequency.exponentialRampToValueAtTime(52, t + off + bd);
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.8 * (1 - 0.28 * k), t + off + 0.07 + distance * 0.35);
      let tt = t + off + 0.2;
      while (tt < t + off + bd - 0.4) { g.gain.exponentialRampToValueAtTime(clmp(rnd(0.1, 0.95) * (1 - 0.35 * k), 0.02, 1), tt); tt += rnd(0.16, 0.6); }
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + bd);
      ns.connect(lp); lp.connect(g); g.connect(out);
      ns.start(t + off); ns.stop(t + off + bd);
    }

    const sd = Math.min(3.2, dur);              // sub-bass swell
    const osc = actx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(rnd(48, 58), t);
    osc.frequency.exponentialRampToValueAtTime(24, t + sd);
    const og = actx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime((1 - distance) * 0.7 + 0.05, t + 0.14);
    og.gain.exponentialRampToValueAtTime(0.0001, t + sd);
    osc.connect(og); og.connect(out);
    osc.start(t); osc.stop(t + sd + 0.05);
  }

  function applyMute() {
    mute.setAttribute("aria-pressed", muted ? "true" : "false");
    mute.setAttribute("aria-label", muted ? "Unmute storm audio" : "Mute storm audio");
    if (masterMix && actx) masterMix.gain.setTargetAtTime(muted ? 0.0001 : VOLUME, actx.currentTime, 0.08);
  }

  /* ── state ────────────────────────────────────────────────────── */
  let enabled = false, rafId = 0, last = 0, startTime = 0;
  let cloud = 0, rain = 0, stormWave = 0.5, squall = 0, gustSign = 1, nextSquall = 0, wind = 0;

  function loop(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000; last = ts;
    if (dt > 0.05) dt = 0.05;
    const now = ts, elapsed = now - startTime, T = elapsed / 1000;

    if (enabled) {
      if (!nextSquall) nextSquall = now + rnd(4000, 12000);
      if (now > nextSquall) { squall = Math.max(squall, rnd(0.5, 1)); gustSign = Math.random() < 0.5 ? -1 : 1; nextSquall = now + rnd(12000, 28000); }
    }
    squall = Math.max(0, squall - dt * 0.07);
    stormWave = clmp(0.46 + 0.3 * Math.sin(T * 0.05) + 0.15 * Math.sin(T * 0.021 + 1) + squall * 0.4, 0, 1);

    const targetCloud = enabled ? 1 : 0;
    let rampGate = 0;
    if (enabled && elapsed > RAIN_DELAY) rampGate = Math.min(1, (elapsed - RAIN_DELAY) / RAIN_RAMP);
    const targetRain = enabled ? rampGate * clmp(0.42 + 0.6 * stormWave, 0, 1) : 0;

    // clouds gather slowly; rain responds a touch quicker
    cloud += (targetCloud - cloud) * (enabled ? 0.5 : 1.5) * dt;
    rain  += (targetRain  - rain)  * (enabled ? 1.1 : 2.4) * dt;
    cloud = clmp(cloud, 0, 1); rain = clmp(rain, 0, 1);

    // gustier, more visible wind — bigger swings plus a faster shimmer
    wind = (Math.sin(T * 0.12) * 135 + Math.sin(T * 0.045 + 2) * 105 + Math.sin(T * 0.55) * 34) * (1 + squall * 1.4) + squall * 210 * gustSign;

    if (enabled && !reduced) {
      if (nextStrike === Infinity && elapsed > STORM_LEAD) scheduleStrike(now, stormWave);
      if (now >= nextStrike) strike(now, stormWave);
    }
    flash = Math.max(0, flash - dt * 3.1);
    shake = Math.max(0, shake - dt * 22);

    // rain audio level tracks intensity + heavier hiss during squalls
    if (rainGain && actx) {
      const target = (muted ? 0 : 1) * (0.02 + rain * 0.13);
      rainGain.gain.setTargetAtTime(Math.max(0.0001, target), actx.currentTime, 0.25);
      rainFilter.frequency.setTargetAtTime(1200 + rain * 1500, actx.currentTime, 0.4);
    }

    // portrait catches the lightning
    if (portrait) portrait.style.filter = flash > 0.03 ? `brightness(${1 + flash * 0.7}) contrast(${1 + flash * 0.12})` : "";

    draw(dt, T);

    if (enabled || cloud > 0.01 || rain > 0.01 || flash > 0.01 || splashes.length) {
      rafId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      canvas.classList.remove("is-on");
      if (portrait) portrait.style.filter = "";
      rafId = 0; last = 0;
    }
  }

  function draw(dt, T) {
    ctx.clearRect(-12, -12, W + 24, H + 24);
    ctx.save();
    if (shake > 0.1) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));

    /* storm ceiling */
    if (cloud > 0.01) {
      const ceil = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      ceil.addColorStop(0, `rgba(6,8,13,${0.55 * cloud})`);
      ceil.addColorStop(1, "rgba(6,8,13,0)");
      ctx.fillStyle = ceil; ctx.fillRect(0, 0, W, H * 0.6);
    }

    /* clouds — descend into view while gathering, lit from within on flash */
    if (cloud > 0.01) {
      for (const c of clouds) {
        c.x += c.drift * dt;
        if (c.x < -c.r) c.x = W + c.r;
        if (c.x > W + c.r) c.x = -c.r;
        const baseY = c.yFrom + (c.yTo - c.yFrom) * cloud;
        const cy = baseY + Math.sin(T * 0.3 + c.bob) * c.bobAmp;
        const g = ctx.createRadialGradient(c.x, cy, 0, c.x, cy, c.r);
        const t = c.tone, litc = flash * (flashHue > 0.2 ? 80 : 140);
        g.addColorStop(0,    `rgba(${t + litc},${t + 6 + litc * 0.9},${t + 14 + litc * 0.55},${0.30 * cloud})`);
        g.addColorStop(0.45, `rgba(${t},${t + 4},${t + 12},${0.34 * cloud})`);
        g.addColorStop(1,    "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, cy, c.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* ground mist */
    if (rain > 0.1) {
      const mg = ctx.createLinearGradient(0, H, 0, H * 0.72);
      mg.addColorStop(0, `rgba(150,170,200,${0.10 * rain})`);
      mg.addColorStop(1, "rgba(150,170,200,0)");
      ctx.fillStyle = mg; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    }

    /* rain — depth-bucketed, one stroke per bucket */
    if (rain > 0.005) {
      const want = Math.floor(MAX_DROPS * rain);
      let added = 0;
      while (drops.length < want && added < 16) { drops.push(spawnDrop(true)); added++; }
      for (let i = 0; i < NB; i++) seg[i].length = 0;

      const groundY = H * 0.985;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        // wind + a gentle per-drop flutter so each streak wavers on its own
        const flutter = Math.sin(T * 3 + d.ph + d.y * 0.012) * d.sway * d.depth;
        const vx = wind * (0.35 + d.depth * 0.95) + flutter;
        d.x += vx * dt; d.y += d.speed * dt;
        const dxn = (vx / d.speed) * d.len;
        const s = seg[d.b]; s.push(d.x, d.y, d.x - dxn, d.y - d.len);
        if (d.y >= groundY) {
          // staggered impact band so splashes aren't a flat line
          const band = groundY - rnd(0, H * 0.05) * (1 - d.depth);
          if (d.depth > 0.32 && splashes.length < 440 && Math.random() < 0.9) addSplash(d.x, band, d.depth);
          if (drops.length <= want) Object.assign(d, spawnDrop(true));
          else { drops.splice(i, 1); i--; }
        }
      }
      const fade = 0.45 + rain * 0.55;
      for (let b = 0; b < NB; b++) {
        const s = seg[b]; if (!s.length) continue;
        ctx.strokeStyle = `rgba(198,214,246,${bAlpha[b] * fade})`;
        ctx.lineWidth = bWidth[b]; ctx.lineCap = "round"; ctx.beginPath();
        for (let i = 0; i < s.length; i += 4) { ctx.moveTo(s[i], s[i + 1]); ctx.lineTo(s[i + 2], s[i + 3]); }
        ctx.stroke();
      }

      /* foreground streaks */
      for (let i = 0; i < fg.length; i++) {
        const f = fg[i], vx = wind * 1.4;
        f.x += vx * dt; f.y += f.speed * dt;
        const dxn = (vx / f.speed) * f.len;
        const grd = ctx.createLinearGradient(f.x, f.y, f.x - dxn, f.y - f.len);
        grd.addColorStop(0, `rgba(210,224,250,${f.a * rain})`);
        grd.addColorStop(1, "rgba(210,224,250,0)");
        ctx.strokeStyle = grd; ctx.lineWidth = f.w;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - dxn, f.y - f.len); ctx.stroke();
        if (f.y - f.len > H) Object.assign(f, spawnFg(false));
      }
    } else if (drops.length) {
      drops.length = 0;
    }

    /* rain on the glass */
    if (rain > 0.12) {
      while (glass.length < GMAX && Math.random() < 0.25) glass.push(spawnGlassStatic());
      for (let i = 0; i < glass.length; i++) {
        const gd = glass[i];
        if (gd.state === "cling") {
          gd.hold -= dt;
          if (gd.hold <= 0 && (gd.r > 4.2 || Math.random() < 0.01)) gd.state = "run";
        } else {
          gd.vy = Math.min(gd.vy + 320 * dt, 260 + gd.r * 18);
          gd.y += gd.vy * dt;
          gd.x += Math.sin(gd.y * 0.06 + gd.wob) * 12 * dt;
          gd.trail += gd.vy * dt;
          if (gd.trail > rnd(10, 24) && glass.length < GMAX + 20) {
            gd.trail = 0; glass.push({ x: gd.x + rnd(-1, 1), y: gd.y - gd.r, r: gd.r * rnd(0.25, 0.5), vy: 0, state: "cling", hold: 99, wob: 0, trail: 0, resid: true });
          }
        }
        drawGlassDrop(gd);
        if (gd.y - gd.r > H) { glass.splice(i, 1); i--; }
      }
      // as the rain eases, let clinging drops evaporate
      if (rain < 0.2 && glass.length && Math.random() < 0.2) glass.pop();
    } else if (glass.length) {
      glass.length = 0;
    }

    /* splashes + faint puddle reflection */
    if (splashes.length) {
      for (let i = 0; i < splashes.length; i++) {
        const s = splashes[i];
        if (s.bounce) {
          s.vy += 560 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a -= dt * 1.6;
          ctx.fillStyle = `rgba(206,220,248,${Math.max(0, s.a)})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
          if (s.a <= 0) { splashes.splice(i, 1); i--; }
        } else {
          s.r += (s.maxR - s.r) * dt * 6; s.a -= dt * 1.9;
          ctx.strokeStyle = `rgba(200,216,246,${Math.max(0, s.a)})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
          if (s.a <= 0) { splashes.splice(i, 1); i--; }
        }
      }
    }
    if (flash > 0.04 && rain > 0.15) {   // lightning reflecting off the wet floor
      ctx.globalCompositeOperation = "lighter";
      const pg = ctx.createLinearGradient(0, H, 0, H * 0.9);
      pg.addColorStop(0, `rgba(150,175,120,${0.12 * flash * rain})`);
      pg.addColorStop(1, "rgba(150,175,120,0)");
      ctx.fillStyle = pg; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.globalCompositeOperation = "source-over";
    }

    /* lightning bolts */
    if (bolts.length) {
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let i = 0; i < bolts.length; i++) {
        const b = bolts[i]; b.life -= dt * 3.0;
        if (b.life <= 0) { bolts.splice(i, 1); i--; continue; }
        const a = Math.max(0, b.life) * b.bright;
        ctx.shadowColor = ACCENT; ctx.shadowBlur = 30;
        ctx.strokeStyle = `rgba(201,242,78,${0.55 * a})`; ctx.lineWidth = 3.6;
        strokePath(b.pts); for (const br of b.branches) strokePath(br);
        ctx.shadowBlur = 9;
        ctx.strokeStyle = `rgba(246,255,236,${0.96 * a})`; ctx.lineWidth = 1.5;
        strokePath(b.pts); for (const br of b.branches) strokePath(br);
      }
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-over";
    }

    /* full-scene flash */
    if (flash > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, 0, 0, H), warm = flashHue;
      const rr = 150 + warm * 40, gg = 175 - warm * 30, bb = 130 - warm * 40;
      g.addColorStop(0,   `rgba(${rr},${gg},${bb},${0.18 * flash})`);
      g.addColorStop(0.5, `rgba(${rr - 30},${gg - 25},${bb - 20},${0.10 * flash})`);
      g.addColorStop(1,   "rgba(90,120,90,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function drawGlassDrop(gd) {
    const r = gd.r;
    const running = gd.state === "run";
    const stretch = running ? clmp(1 + gd.vy / 340, 1, 1.7) : 1;   // teardrop when sliding
    const gl = 0.28 + flash * 0.5;                                  // extra glint on lightning

    // wet streak trailing above a sliding drop
    if (running) {
      const tl = 20 + gd.vy * 0.06;
      const tg = ctx.createLinearGradient(gd.x, gd.y - r, gd.x, gd.y - r - tl);
      tg.addColorStop(0, `rgba(198,216,246,${0.10 + flash * 0.14})`);
      tg.addColorStop(1, "rgba(198,216,246,0)");
      ctx.fillStyle = tg;
      ctx.fillRect(gd.x - r * 0.42, gd.y - r - tl, r * 0.84, tl);
    }

    ctx.save();
    ctx.translate(gd.x, gd.y);
    ctx.scale(1, stretch);

    // 1) lens body — near-transparent centre (page shows through), darker rim
    const body = ctx.createRadialGradient(-r * 0.28, -r * 0.34, r * 0.05, 0, 0, r);
    body.addColorStop(0,    "rgba(228,240,255,0.05)");
    body.addColorStop(0.62, "rgba(175,195,225,0.05)");
    body.addColorStop(0.86, "rgba(120,140,175,0.13)");
    body.addColorStop(1,    "rgba(70,88,120,0.24)");      // refractive edge
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    // 2) bright crescent low in the drop — light focused through the lens
    const foc = ctx.createRadialGradient(0, r * 0.34, 0, 0, r * 0.34, r * 0.9);
    foc.addColorStop(0, `rgba(244,250,255,${gl})`);
    foc.addColorStop(0.7, `rgba(210,228,250,${gl * 0.35})`);
    foc.addColorStop(1, "rgba(210,228,250,0)");
    ctx.fillStyle = foc;
    ctx.beginPath(); ctx.arc(0, r * 0.18, r * 0.9, 0, Math.PI * 2); ctx.fill();

    // 3) thin dark rim up top for that meniscus edge
    ctx.lineWidth = Math.max(0.6, r * 0.12);
    ctx.strokeStyle = "rgba(16,22,34,0.28)";
    ctx.beginPath(); ctx.arc(0, 0, r * 0.96, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();

    ctx.restore();

    // 4) crisp specular highlight (drawn unscaled so it stays a sharp glare)
    ctx.fillStyle = `rgba(255,255,255,${0.7 + flash * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(gd.x - r * 0.34, gd.y - r * 0.42 * stretch, Math.max(0.7, r * 0.2), Math.max(0.5, r * 0.28), -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function strokePath(pts) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  /* ── enable / disable ─────────────────────────────────────────── */
  function enable() {
    if (enabled) return;
    enabled = true;
    startTime = performance.now();
    nextStrike = Infinity; nextSquall = 0; squall = 0;
    buildFg(); glass.length = 0;
    btn.setAttribute("aria-pressed", "true");
    sky.classList.add("is-on"); grade.classList.add("is-on"); canvas.classList.add("is-on");
    mute.classList.add("is-on");
    document.body.classList.add("storm-active");
    try { localStorage.setItem(STORE_KEY, "1"); } catch (_) {}
    if (ensureAudio() && actx.state === "suspended") actx.resume();
    applyMute(); startRainBed();
    if (!rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    btn.setAttribute("aria-pressed", "false");
    sky.classList.remove("is-on"); grade.classList.remove("is-on"); mute.classList.remove("is-on");
    document.body.classList.remove("storm-active");
    nextStrike = Infinity; bolts.length = 0;
    stopRainBed();
    try { localStorage.setItem(STORE_KEY, "0"); } catch (_) {}
    if (!rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  }

  function toggle() { enabled ? disable() : enable(); }

  /* ── wiring ───────────────────────────────────────────────────── */
  resize();
  window.addEventListener("resize", debounce(resize, 200));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", debounce(resize, 200));
  window.addEventListener("orientationchange", () => setTimeout(resize, 250));
  btn.addEventListener("click", toggle);
  mute.addEventListener("click", () => { muted = !muted; try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {} applyMute(); });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); toggle(); }
    else if ((e.key === "m" || e.key === "M") && enabled) { e.preventDefault(); muted = !muted; try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {} applyMute(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; last = 0; } if (actx && actx.state === "running") actx.suspend(); }
    else { if (actx && enabled) actx.resume(); if ((enabled || cloud > 0.01 || rain > 0.01) && !rafId) { last = 0; rafId = requestAnimationFrame(loop); } }
  });

  try { if (localStorage.getItem(STORE_KEY) === "1") enable(); } catch (_) {}

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
})();
