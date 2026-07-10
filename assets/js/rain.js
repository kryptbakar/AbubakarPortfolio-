/* ============================================================================
   Muhammad Abubakar — Portfolio · weather layer
   A cinematic, living thunderstorm you can toggle from the nav.

   When enabled:
     1. the sky darkens and heavy clouds churn in overhead
     2. distant sheet-lightning starts to flicker, thunder rolls in the distance
     3. rain fades in and the storm settles into an endless ebb-and-flow of
        squalls — gusting rain, close forked strikes that light the whole scene,
        and thunder that cracks then rolls with a real reverb tail

   Zero dependencies. Pure Canvas 2D for the visuals + WebAudio for synthesized
   thunder (crack + rolling rumble + sub-bass + convolution reverb, delayed by
   distance so far strikes rumble seconds after the flash).

   Respects prefers-reduced-motion (no strobing / no thunder), pauses when the
   tab is hidden, DPR-capped, and lighter on mobile. Acid-green identity.
   ========================================================================= */
(() => {
  "use strict";

  const btn = document.getElementById("weatherToggle");
  if (!btn) return;

  const ACCENT   = "#c9f24e";                 // portfolio acid-green
  const reduced  = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse   = matchMedia("(pointer: coarse)").matches;
  const STORE_KEY = "abubakar:weather";
  const VOLUME    = 0.85;                      // master thunder loudness

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

  /* ── timing ───────────────────────────────────────────────────── */
  const STORM_LEAD = 800;    // ms before the first distant flicker
  const RAIN_DELAY = 1700;   // ms before rain begins
  const RAIN_RAMP  = 4200;   // ms for the first downpour to build

  const rnd  = (a, b) => a + Math.random() * (b - a);
  const clmp = (v, a, b) => Math.max(a, Math.min(b, v));

  let MAX_DROPS = 320;
  function computeCaps() {
    MAX_DROPS = Math.round((W * H) / 6000);
    if (coarse) MAX_DROPS = Math.round(MAX_DROPS * 0.55);
    MAX_DROPS = clmp(MAX_DROPS, 110, 640);
  }

  /* ── clouds: churning dark band, lit from within by lightning ─── */
  let clouds = [];
  function buildClouds() {
    const n = Math.max(11, Math.round(W / 120));
    clouds = [];
    for (let i = 0; i < n; i++) {
      const r = rnd(H * 0.16, H * 0.36);
      clouds.push({
        x: rnd(-0.05, 1.05) * W,
        y: rnd(-0.12, 0.30) * H,
        r,
        drift: rnd(5, 16) * (Math.random() < 0.5 ? -1 : 1),
        bob: rnd(0, Math.PI * 2),
        bobAmp: rnd(4, 14),
        tone: rnd(14, 28),
      });
    }
  }

  /* ── raindrops (recycled pool, parallax depth) ────────────────── */
  const drops = [];
  function spawnDrop(fromTop) {
    const depth = Math.random();
    return {
      x: rnd(-0.12, 1.12) * W,
      y: fromTop ? rnd(-H * 0.6, -20) : rnd(-40, H),
      depth,
      len: rnd(9, 18) + depth * 30,
      speed: rnd(820, 1040) + depth * 1050,
      w: 0.55 + depth * 1.6,
      a: 0.09 + depth * 0.44,
    };
  }

  /* ── near-camera streaks: a few big, fast, soft foreground drops ─ */
  const fg = [];
  function buildFg() {
    fg.length = 0;
    const n = coarse ? 6 : 12;
    for (let i = 0; i < n; i++) fg.push(spawnFg(true));
  }
  function spawnFg(rndY) {
    return {
      x: rnd(-0.1, 1.1) * W,
      y: rndY ? rnd(-H, 0) : rnd(-H * 0.4, -40),
      len: rnd(60, 150),
      speed: rnd(2200, 3200),
      w: rnd(2.2, 4.5),
      a: rnd(0.05, 0.14),
    };
  }

  /* ── splashes at the waterline ────────────────────────────────── */
  const splashes = [];
  function addSplash(x, y, depth) {
    const big = Math.random() < 0.12;
    splashes.push({ x, y, r: 1, maxR: (big ? rnd(14, 22) : rnd(5, 12)) + depth * 8, a: 0.30 + depth * 0.32 });
    if (depth > 0.6 && splashes.length < 460) {
      const n = big ? 4 : 2;
      for (let i = 0; i < n; i++) {
        splashes.push({ x, y, vx: rnd(-55, 55), vy: rnd(-170, -70), bounce: true, r: rnd(0.8, 1.7), a: 0.55 });
      }
    }
  }

  /* ── lightning ────────────────────────────────────────────────── */
  let flash = 0;             // 0..1 sky brightness
  let flashHue = 0;          // 0 = cold white-green, 1 = warm
  let nextStrike = Infinity;
  const bolts = [];
  let shake = 0;             // canvas-only camera shake

  function igniteFlash(peak, warm) {
    flash = Math.max(flash, peak);
    flashHue = warm;
    // quick flicker re-bumps for a real strobe feel
    const bumps = Math.random() < 0.6 ? Math.round(rnd(1, 3)) : 0;
    for (let i = 0; i < bumps; i++) {
      setTimeout(() => { if (enabled) flash = Math.max(flash, peak * rnd(0.4, 0.85)); }, rnd(45, 190));
    }
  }

  function makeBolt(brightness) {
    const startX = rnd(0.12, 0.88) * W;
    const startY = rnd(-0.02, 0.12) * H;
    const endY   = rnd(0.5, 0.9) * H;
    const pts = [{ x: startX, y: startY }];
    let x = startX, y = startY;
    const steps = Math.round(rnd(11, 18));
    const dy = (endY - startY) / steps;
    for (let i = 0; i < steps; i++) {
      x += rnd(-40, 40);
      y += dy * rnd(0.65, 1.35);
      pts.push({ x, y });
    }
    const branches = [];
    for (let i = 2; i < pts.length - 1; i++) {
      if (Math.random() < 0.26) {
        const p = pts[i];
        const bp = [{ x: p.x, y: p.y }];
        let bx = p.x, by = p.y;
        const bs = Math.round(rnd(2, 5));
        for (let j = 0; j < bs; j++) { bx += rnd(-46, 46); by += rnd(20, 52); bp.push({ x: bx, y: by }); }
        branches.push(bp);
      }
    }
    return { pts, branches, life: 1, bright: brightness };
  }

  function scheduleStrike(now, stormWave) {
    // more frequent while the storm is intense; always some distant activity
    const gap = rnd(1500, 5200) * (1.55 - stormWave);
    nextStrike = now + gap;
  }

  function strike(now, stormWave) {
    if (reduced) return;
    // distance 0 = right overhead, 1 = far away. Bias toward distant, with the
    // occasional close, scene-lighting strike (the "shock" moments).
    let distance = Math.pow(Math.random(), 0.6);
    if (Math.random() < 0.16 + stormWave * 0.12) distance = rnd(0, 0.28);

    const close = distance < 0.5;
    const peak  = clmp((1 - distance) * rnd(0.7, 1) + 0.14, 0.14, 1);
    igniteFlash(peak, distance > 0.55 ? 0.4 : 0);

    if (close && bolts.length < 5) {
      const b = makeBolt(1 - distance * 0.7);
      bolts.push(b);
      // a forked companion for the very close ones
      if (distance < 0.22 && Math.random() < 0.6) bolts.push(makeBolt(1 - distance));
    }
    if (distance < 0.2) shake = Math.max(shake, (1 - distance) * 8);

    thunder(distance, rnd(0.85, 1.15));

    // clustered aftershocks — storms rarely flash just once
    if (Math.random() < 0.35) {
      const extra = Math.round(rnd(1, 2));
      for (let i = 0; i < extra; i++) {
        setTimeout(() => {
          if (!enabled) return;
          igniteFlash(peak * rnd(0.5, 0.85), distance > 0.5 ? 0.4 : 0);
          if (close && bolts.length < 5 && Math.random() < 0.5) bolts.push(makeBolt(1 - distance * 0.8));
          thunder(clmp(distance + rnd(-0.05, 0.12), 0, 1), rnd(0.5, 0.85));
        }, rnd(220, 900) * (i + 1));
      }
    }
    scheduleStrike(now, stormWave);
  }

  /* ── audio: realistic synthesized thunder ─────────────────────── */
  let actx = null, busComp = null, reverbBus = null, IR = null;

  function ensureAudio() {
    if (actx) return true;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      // gentle limiter so close cracks stay punchy without clipping
      busComp = actx.createDynamicsCompressor();
      busComp.threshold.value = -16; busComp.knee.value = 24;
      busComp.ratio.value = 8; busComp.attack.value = 0.003; busComp.release.value = 0.4;
      busComp.connect(actx.destination);
      // convolution reverb from a synthetic decaying-noise impulse — the tail
      // is what makes thunder feel like it's rolling across a real sky
      IR = makeIR(3.4, 2.4);
      reverbBus = actx.createConvolver(); reverbBus.buffer = IR;
      const rg = actx.createGain(); rg.gain.value = 0.85;
      reverbBus.connect(rg); rg.connect(busComp);
      return true;
    } catch (_) { actx = null; return false; }
  }

  function makeIR(seconds, decay) {
    const rate = actx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = actx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function noiseBuffer(dur) {
    const len = Math.max(1, Math.floor(actx.sampleRate * dur));
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function thunder(distance, mag) {
    if (reduced || !ensureAudio()) return;
    if (actx.state === "suspended") actx.resume();
    const now = actx.currentTime;
    const delay = 0.04 + distance * distance * 5.2;         // sound lags the flash
    const t = now + delay;
    const dur = 2.4 + (1 - distance) * 3.6 + Math.random() * 1.8;
    const vol = clmp(VOLUME * (0.22 + (1 - distance) * 0.95) * mag, 0, 1.1);

    const out = actx.createGain(); out.gain.value = vol;
    out.connect(busComp); out.connect(reverbBus);

    /* 1 — initial crack (only the closer strikes): sharp bright transient */
    if (distance < 0.5) {
      const cd = 0.2;
      const cs = actx.createBufferSource(); cs.buffer = noiseBuffer(cd);
      const hp = actx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 850;
      const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = rnd(1400, 2200); bp.Q.value = 0.7;
      const cg = actx.createGain();
      cg.gain.setValueAtTime(0.0001, t);
      cg.gain.exponentialRampToValueAtTime((1 - distance) * 1.1, t + 0.006);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + cd);
      cs.connect(hp); hp.connect(bp); bp.connect(cg); cg.connect(out);
      cs.start(t); cs.stop(t + cd);
    }

    /* 2 — rolling rumble: two overlapping noise beds, lowpass sweeping down,
           with irregular gain swells so the thunder "rolls" instead of fading */
    for (let k = 0; k < 2; k++) {
      const off = k * rnd(0.12, 0.55);
      const bd = Math.max(0.6, dur - off);
      const ns = actx.createBufferSource(); ns.buffer = noiseBuffer(bd);
      const lp = actx.createBiquadFilter(); lp.type = "lowpass";
      const startF = clmp(760 - distance * 340 - k * 120, 110, 900);
      lp.frequency.setValueAtTime(startF, t + off);
      lp.frequency.exponentialRampToValueAtTime(58, t + off + bd);
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.85 * (1 - 0.3 * k), t + off + 0.07 + distance * 0.35);
      let tt = t + off + 0.2;
      while (tt < t + off + bd - 0.35) {
        const lvl = clmp(rnd(0.12, 0.95) * (1 - 0.4 * k), 0.02, 1);
        g.gain.exponentialRampToValueAtTime(lvl, tt);
        tt += rnd(0.14, 0.5);
      }
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + bd);
      ns.connect(lp); lp.connect(g); g.connect(out);
      ns.start(t + off); ns.stop(t + off + bd);
    }

    /* 3 — sub-bass swell: the chest-thump of a nearby strike */
    const sd = Math.min(2.8, dur);
    const osc = actx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(rnd(48, 58), t);
    osc.frequency.exponentialRampToValueAtTime(26, t + sd);
    const og = actx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime((1 - distance) * 0.7 + 0.05, t + 0.14);
    og.gain.exponentialRampToValueAtTime(0.0001, t + sd);
    osc.connect(og); og.connect(out);
    osc.start(t); osc.stop(t + sd + 0.05);
  }

  /* ── state ────────────────────────────────────────────────────── */
  let enabled = false;
  let rafId = 0, last = 0, startTime = 0;
  let cloud = 0, rain = 0;              // eased current values
  let stormWave = 0.5, squall = 0, gustSign = 1, nextSquall = 0;
  let wind = 0;

  function loop(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000; last = ts;
    if (dt > 0.05) dt = 0.05;
    const now = ts;
    const elapsed = now - startTime;
    const T = elapsed / 1000;

    /* storm intensity — a slow swell plus random squalls, never constant */
    if (enabled) {
      if (!nextSquall) nextSquall = now + rnd(4000, 12000);
      if (now > nextSquall) { squall = Math.max(squall, rnd(0.5, 1)); gustSign = Math.random() < 0.5 ? -1 : 1; nextSquall = now + rnd(12000, 28000); }
    }
    squall = Math.max(0, squall - dt * 0.07);
    stormWave = clmp(0.46 + 0.3 * Math.sin(T * 0.05) + 0.15 * Math.sin(T * 0.021 + 1) + squall * 0.4, 0, 1);

    /* targets */
    const targetCloud = enabled ? 1 : 0;
    let rampGate = 0;
    if (enabled && elapsed > RAIN_DELAY) rampGate = Math.min(1, (elapsed - RAIN_DELAY) / RAIN_RAMP);
    const targetRain = enabled ? rampGate * clmp(0.42 + 0.6 * stormWave, 0, 1) : 0;

    cloud += (targetCloud - cloud) * (enabled ? 0.9 : 1.5) * dt;
    rain  += (targetRain  - rain)  * (enabled ? 1.1 : 2.4) * dt;
    cloud = clmp(cloud, 0, 1); rain = clmp(rain, 0, 1);

    /* gusting wind — stronger and leaning during squalls */
    wind = (Math.sin(T * 0.08) * 90 + Math.sin(T * 0.031 + 2) * 70) * (1 + squall * 1.3) + squall * 150 * gustSign;

    /* lightning schedule (keeps going for the life of the storm) */
    if (enabled && !reduced) {
      if (nextStrike === Infinity && elapsed > STORM_LEAD) scheduleStrike(now, stormWave);
      if (now >= nextStrike) strike(now, stormWave);
    }
    flash = Math.max(0, flash - dt * 3.1);
    shake = Math.max(0, shake - dt * 22);

    draw(dt, T);

    if (enabled || cloud > 0.01 || rain > 0.01 || flash > 0.01 || splashes.length) {
      rafId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      canvas.classList.remove("is-on");
      rafId = 0; last = 0;
    }
  }

  function draw(dt, T) {
    ctx.clearRect(-12, -12, W + 24, H + 24);
    ctx.save();
    if (shake > 0.1) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));

    /* ── storm ceiling: a heavy dark gradient pouring down from the top ── */
    if (cloud > 0.01) {
      const ceil = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      ceil.addColorStop(0, `rgba(6,8,13,${0.5 * cloud})`);
      ceil.addColorStop(1, "rgba(6,8,13,0)");
      ctx.fillStyle = ceil;
      ctx.fillRect(0, 0, W, H * 0.6);
    }

    /* ── clouds ── */
    if (cloud > 0.01) {
      for (const c of clouds) {
        c.x += c.drift * dt;
        if (c.x < -c.r) c.x = W + c.r;
        if (c.x > W + c.r) c.x = -c.r;
        const cy = c.y + Math.sin(T * 0.3 + c.bob) * c.bobAmp;
        const g = ctx.createRadialGradient(c.x, cy, 0, c.x, cy, c.r);
        const t = c.tone;
        const lit = flash * (flashHue > 0.2 ? 70 : 120);   // lightning glows inside the cloud
        g.addColorStop(0,    `rgba(${t + lit},${t + 6 + lit * 0.9},${t + 14 + lit * 0.55},${0.44 * cloud})`);
        g.addColorStop(0.55, `rgba(${t - 4},${t},${t + 10},${0.28 * cloud})`);
        g.addColorStop(1,    "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c.x, cy, c.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* ── ground mist rising with the rain ── */
    if (rain > 0.1) {
      const mg = ctx.createLinearGradient(0, H, 0, H * 0.72);
      const ma = 0.10 * rain;
      mg.addColorStop(0, `rgba(150,170,200,${ma})`);
      mg.addColorStop(1, "rgba(150,170,200,0)");
      ctx.fillStyle = mg;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
    }

    /* ── rain ── */
    if (rain > 0.005) {
      const want = Math.floor(MAX_DROPS * rain);
      let added = 0;
      while (drops.length < want && added < 16) { drops.push(spawnDrop(true)); added++; }

      const groundY = H * 0.985;
      ctx.lineCap = "round";
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const vx = wind * (0.35 + d.depth * 0.95);
        d.x += vx * dt;
        d.y += d.speed * dt;
        const dxn = (vx / d.speed) * d.len;
        ctx.strokeStyle = `rgba(198,214,246,${d.a * (0.45 + rain * 0.55)})`;
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - dxn, d.y - d.len);
        ctx.stroke();

        if (d.y >= groundY) {
          if (d.depth > 0.32 && splashes.length < 440 && Math.random() < 0.92) addSplash(d.x, groundY, d.depth);
          if (drops.length <= want) { const n = spawnDrop(true); Object.assign(d, n); }
          else { drops.splice(i, 1); i--; }
        }
      }

      /* near-camera streaks for depth + drama */
      for (let i = 0; i < fg.length; i++) {
        const f = fg[i];
        const vx = wind * 1.4;
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

    /* ── splashes ── */
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

    /* ── lightning bolts ── */
    if (bolts.length) {
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let i = 0; i < bolts.length; i++) {
        const b = bolts[i];
        b.life -= dt * 3.0;
        if (b.life <= 0) { bolts.splice(i, 1); i--; continue; }
        const a = Math.max(0, b.life) * b.bright;
        ctx.shadowColor = ACCENT; ctx.shadowBlur = 30;
        ctx.strokeStyle = `rgba(201,242,78,${0.55 * a})`; ctx.lineWidth = 3.6;
        strokePath(b.pts); for (const br of b.branches) strokePath(br);
        ctx.shadowBlur = 9;
        ctx.strokeStyle = `rgba(246,255,236,${0.96 * a})`; ctx.lineWidth = 1.5;
        strokePath(b.pts); for (const br of b.branches) strokePath(br);
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }

    /* ── flash wash over the whole scene ── */
    if (flash > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const warm = flashHue;
      const rr = 150 + warm * 40, gg = 175 - warm * 30, bb = 130 - warm * 40;
      g.addColorStop(0,   `rgba(${rr},${gg},${bb},${0.18 * flash})`);
      g.addColorStop(0.5, `rgba(${rr - 30},${gg - 25},${bb - 20},${0.10 * flash})`);
      g.addColorStop(1,   "rgba(90,120,90,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
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
    nextStrike = Infinity; nextSquall = 0; squall = 0;
    buildFg();
    btn.setAttribute("aria-pressed", "true");
    sky.classList.add("is-on");
    canvas.classList.add("is-on");
    try { localStorage.setItem(STORE_KEY, "1"); } catch (_) {}
    ensureAudio(); if (actx && actx.state === "suspended") actx.resume();
    if (!rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    btn.setAttribute("aria-pressed", "false");
    sky.classList.remove("is-on");
    nextStrike = Infinity; bolts.length = 0;
    try { localStorage.setItem(STORE_KEY, "0"); } catch (_) {}
    if (!rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  }

  function toggle() { enabled ? disable() : enable(); }

  /* ── wiring ───────────────────────────────────────────────────── */
  resize();
  window.addEventListener("resize", debounce(resize, 200));
  btn.addEventListener("click", toggle);

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); toggle(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; last = 0; } }
    else if ((enabled || cloud > 0.01 || rain > 0.01) && !rafId) { last = 0; rafId = requestAnimationFrame(loop); }
  });

  try { if (localStorage.getItem(STORE_KEY) === "1") enable(); } catch (_) {}

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
})();
