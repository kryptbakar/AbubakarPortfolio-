/* ============================================================================
   Muhammad Abubakar — Portfolio · interaction layer
   Vanilla JS · GSAP + ScrollTrigger + Lenis. Degrades gracefully.
   ========================================================================= */
(() => {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const reduced  = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine     = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP  = typeof window.gsap !== "undefined";
  const hasLenis = typeof window.Lenis !== "undefined";
  const motion   = hasGSAP && !reduced;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (!hasGSAP) document.documentElement.classList.add("no-gsap");
  document.body.classList.add("is-loading");

  let lenis = null;

  /* ── live clock (Asia/Karachi · UTC+5) ─────────────────────── */
  function initClock() {
    const els = $$("[data-clock]");
    if (!els.length) return;
    const tick = () => {
      const now = new Date();
      const pkt = new Date(now.getTime() + (now.getTimezoneOffset() + 300) * 60000);
      const p = (n) => String(n).padStart(2, "0");
      const s = `${p(pkt.getHours())}:${p(pkt.getMinutes())}:${p(pkt.getSeconds())} PKT`;
      els.forEach((el) => (el.textContent = s));
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── hero rotating discipline ─────────────────────────────── */
  function initRoles() {
    const el = $("#heroRotate");
    if (!el || reduced) return;
    const roles = ["Application Security", "DevSecOps Automation", "Penetration Testing", "ML-Driven Defense", "Threat Modeling"];
    let i = 0;
    setInterval(() => {
      el.classList.add("is-out");
      setTimeout(() => { i = (i + 1) % roles.length; el.textContent = roles[i]; el.classList.remove("is-out"); }, 420);
    }, 2600);
  }

  /* ── smooth scroll ────────────────────────────────────── */
  function initSmooth() {
    if (!hasLenis || !hasGSAP || reduced) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: 0 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  /* ── custom cursor ────────────────────────────────────── */
  function initCursor() {
    const cur = $(".cursor");
    if (!cur || !fine || !hasGSAP) return;
    document.documentElement.classList.add("has-cursor");
    // contextual labels
    $$(".panel__link").forEach((e) => e.setAttribute("data-cursor-label", "OPEN"));
    $$(".archive__row a").forEach((e) => e.setAttribute("data-cursor-label", "VIEW"));
    $$(".contact__email").forEach((e) => e.setAttribute("data-cursor-label", "MAIL"));
    $$('a[href$=".pdf"]').forEach((e) => e.setAttribute("data-cursor-label", "PDF"));
    const dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3" });
    window.addEventListener("mousemove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });

    $$("a, button, [data-cursor]").forEach((el) => {
      const type = el.dataset.cursor || "link";
      const text = el.dataset.cursorLabel;
      el.addEventListener("mouseenter", () => {
        cur.classList.add("is-hover");
        if (type === "drag") cur.classList.add("is-drag");
        if (text) { label.textContent = text; cur.classList.add("is-label"); }
      });
      el.addEventListener("mouseleave", () => cur.classList.remove("is-hover", "is-drag", "is-label"));
    });
    window.addEventListener("mouseleave", () => gsap.to(cur, { opacity: 0, duration: 0.3 }));
    window.addEventListener("mouseenter", () => gsap.to(cur, { opacity: 1, duration: 0.3 }));
  }

  /* ── magnetic elements ─────────────────────────────────── */
  function initMagnetic() {
    if (!fine || !hasGSAP) return;
    $$("[data-magnetic]").forEach((el) => {
      const xT = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.45)" });
      const yT = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.45)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xT((e.clientX - (r.left + r.width / 2)) * 0.38);
        yT((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener("mouseleave", () => { xT(0); yT(0); });
    });
  }

  /* ── scramble-on-hover links ────────────────────────────── */
  function initScramble() {
    if (!fine) return;
    const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#%&";
    $$("[data-scramble]").forEach((el) => {
      const orig = el.textContent;
      let id = null;
      el.addEventListener("mouseenter", () => {
        let f = 0; clearInterval(id);
        id = setInterval(() => {
          el.textContent = orig.split("").map((c, i) =>
            c === " " ? " " : i < f ? c : CH[(Math.random() * CH.length) | 0]).join("");
          if (f >= orig.length) { clearInterval(id); el.textContent = orig; }
          f += 0.5;
        }, 26);
      });
      el.addEventListener("mouseleave", () => { clearInterval(id); el.textContent = orig; });
    });
  }

  /* ── hero flow-field canvas ──────────────────────────────── */
  function initFlow() {
    const canvas = $("#flow");
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w, h, dpr, parts = [], raf = null, running = true, t = 0;
    const noise = (x, y, tt) =>
      Math.sin(x * 0.0016 + tt) * Math.cos(y * 0.0016 - tt * 0.8) + Math.sin((x + y) * 0.0011 + tt * 0.5);
    const mk = () => ({ x: Math.random() * w, y: Math.random() * h, a: Math.random() < 0.12 });

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const density = innerWidth < 768 ? 16000 : 9000;
      parts = Array.from({ length: Math.min(260, Math.floor((innerWidth * innerHeight) / density)) }, mk);
      ctx.fillStyle = "#0a0a0c"; ctx.fillRect(0, 0, w, h);
    }
    function frame() {
      if (!running) return;
      t += 0.0008;
      ctx.fillStyle = "rgba(10,10,12,0.10)";
      ctx.fillRect(0, 0, w, h);
      for (const p of parts) {
        const ang = noise(p.x, p.y, t) * Math.PI;
        const nx = p.x + Math.cos(ang) * 1.4 * dpr;
        const ny = p.y + Math.sin(ang) * 1.4 * dpr;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
        ctx.strokeStyle = p.a ? "rgba(201,242,78,0.34)" : "rgba(242,239,230,0.11)";
        ctx.lineWidth = (p.a ? 1.1 : 0.8) * dpr;
        ctx.stroke();
        p.x = nx; p.y = ny;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) { p.x = Math.random() * w; p.y = Math.random() * h; }
      }
      raf = requestAnimationFrame(frame);
    }
    resize();
    frame();
    window.addEventListener("resize", debounce(resize, 200));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        running = e.isIntersecting;
        if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
        else cancelAnimationFrame(raf);
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ── approach: animated security pipeline ───────────────────── */
  function initApproachPipeline() {
    const section = document.getElementById("approach");
    if (!section || reduced) return;
    const canvas = section.querySelector(".approach__canvas");
    const steps = $$(".approach__step", section);
    if (!canvas || !steps.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const RAW = [224, 86, 63], LIME = [201, 242, 78], N = steps.length;
    let w = 1, h = 1, dpr = 1, gates = [], started = false, raf = 0, flow = 0;
    const P = { x: 0, level: 0 };
    let mode = "travel", seg = 0, from = 0, to = 0, segStart = 0, activeIdx = -1;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      if (r.width < 2) return;
      w = canvas.width = Math.round(r.width * dpr);
      h = canvas.height = Math.round(r.height * dpr);
      gates = [];
      for (let i = 0; i < N; i++) gates.push({ x: ((i + 0.5) / N) * w, hit: 0 });
    }
    function setActive(i) { if (i === activeIdx) return; clearActive(); activeIdx = i; if (steps[i]) steps[i].classList.add("is-active"); }
    function clearActive() { if (activeIdx >= 0 && steps[activeIdx]) steps[activeIdx].classList.remove("is-active"); activeIdx = -1; }
    function startCycle(now) { seg = 0; mode = "travel"; segStart = now; P.level = 0; from = -0.1 * w; to = gates.length ? gates[0].x : w; P.x = from; }

    function update(now) {
      flow += 0.02;
      if (!gates.length) { layout(); return; }
      for (const g of gates) g.hit *= 0.92;
      if (mode === "travel") {
        const u = Math.min(1, (now - segStart) / 1.1);
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        P.x = from + (to - from) * e;
        if (u >= 1) {
          if (seg < N) { mode = "dwell"; segStart = now; gates[seg].hit = 1; P.level = seg + 1; setActive(seg); }
          else startCycle(now);
        }
      } else if (now - segStart >= 0.6) {
        seg++; mode = "travel"; segStart = now; from = P.x;
        to = seg < N ? gates[seg].x : 1.1 * w;
        if (seg >= N) clearActive();
      }
    }
    function col(t) { return `rgb(${Math.round(RAW[0] + (LIME[0] - RAW[0]) * t)},${Math.round(RAW[1] + (LIME[1] - RAW[1]) * t)},${Math.round(RAW[2] + (LIME[2] - RAW[2]) * t)})`; }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const y = h * 0.5, gh = h * 0.32;
      ctx.strokeStyle = "rgba(242,239,230,0.12)"; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.strokeStyle = "rgba(201,242,78,0.3)"; ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([6 * dpr, 14 * dpr]); ctx.lineDashOffset = -flow * 30 * dpr;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Math.max(0, P.x), y); ctx.stroke();
      ctx.setLineDash([]);
      gates.forEach((g, i) => {
        const lit = i < P.level || g.hit > 0.05, bw = 10 * dpr;
        ctx.strokeStyle = lit ? "rgba(201,242,78,0.85)" : "rgba(242,239,230,0.25)"; ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(g.x - bw, y - gh); ctx.lineTo(g.x, y - gh); ctx.lineTo(g.x, y + gh); ctx.lineTo(g.x - bw, y + gh);
        ctx.moveTo(g.x + bw, y - gh); ctx.lineTo(g.x, y - gh); ctx.moveTo(g.x + bw, y + gh); ctx.lineTo(g.x, y + gh);
        ctx.stroke();
        if (g.hit > 0.05) { ctx.strokeStyle = `rgba(201,242,78,${g.hit * 0.7})`; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(g.x, y, (14 + (1 - g.hit) * 26) * dpr, 0, 6.283); ctx.stroke(); }
        ctx.fillStyle = lit ? "rgba(201,242,78,0.9)" : "rgba(242,239,230,0.3)"; ctx.font = `${9 * dpr}px 'JetBrains Mono',monospace`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText(String(i + 1).padStart(2, "0"), g.x, y - gh - 8 * dpr);
      });
      ctx.fillStyle = "rgba(201,242,78,0.10)"; ctx.beginPath(); ctx.arc(P.x, y, 22 * dpr, 0, 6.283); ctx.fill();
      for (let k = 0; k < P.level; k++) { ctx.strokeStyle = `rgba(201,242,78,${0.5 - k * 0.09})`; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(P.x, y, (12 + k * 7) * dpr, 0, 6.283); ctx.stroke(); }
      ctx.save(); ctx.translate(P.x, y); ctx.rotate(flow * 0.5);
      const s = 7 * dpr; ctx.fillStyle = col(P.level / N);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function frame(ts) { if (!started) return; update(ts / 1000); draw(); raf = requestAnimationFrame(frame); }

    layout();
    window.addEventListener("resize", debounce(layout, 200));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !started) { started = true; layout(); startCycle(performance.now() / 1000); raf = requestAnimationFrame(frame); }
        else if (!en.isIntersecting && started) { started = false; cancelAnimationFrame(raf); clearActive(); }
      }, { threshold: 0.2 }).observe(canvas);
    } else { started = true; layout(); startCycle(performance.now() / 1000); raf = requestAnimationFrame(frame); }
  }

  /* ── skills knowledge graph (interactive canvas) ────────────────── */
  function initSkillsGraph() {
    const section = document.getElementById("skills");
    if (!section || reduced || !fine) return;
    const canvas = section.querySelector(".skills__canvas");
    const cells = $$(".skills__cell", section);
    if (!canvas || !cells.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    document.documentElement.classList.add("skills-graph");

    const ACCENT = "#c9f24e", BONE = "rgba(242,239,230,";
    const cats = cells.map((c) => ({
      label: (c.querySelector(".skills__label")?.textContent || "").trim(),
      items: $$("li", c).map((li) => li.textContent.trim()),
    }));

    const nodes = [];
    const core = { kind: "core", label: "ABUBAKAR", x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 8, parent: -1, cat: -1, phase: 0 };
    nodes.push(core);
    const hubIdx = [];
    cats.forEach((cat, ci) => {
      hubIdx[ci] = nodes.push({ kind: "hub", label: cat.label, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 5, parent: 0, cat: ci, phase: Math.random() * 6.28 }) - 1;
      cat.items.forEach((it) =>
        nodes.push({ kind: "skill", label: it, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, r: 3, parent: hubIdx[ci], cat: ci, phase: Math.random() * 6.28 }));
    });

    let w = 1, h = 1, dpr = 1, cx = 0, cy = 0, R = 1, started = false, raf = 0, t = 0;
    const mouse = { x: -1e5, y: -1e5 };
    let drag = null, hover = null;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.round(rect.width * dpr));
      h = canvas.height = Math.max(1, Math.round(rect.height * dpr));
      cx = w / 2; cy = h / 2; R = Math.min(w, h);
      core.hx = cx; core.hy = cy; core.r = R * 0.013;
      const n = cats.length;
      cats.forEach((cat, ci) => {
        const a = (ci / n) * Math.PI * 2 - Math.PI / 2;
        const hub = nodes[hubIdx[ci]];
        hub.hx = cx + Math.cos(a) * R * 0.30; hub.hy = cy + Math.sin(a) * R * 0.30; hub.r = R * 0.0085;
        const sk = nodes.filter((x) => x.kind === "skill" && x.cat === ci);
        sk.forEach((s, si) => {
          const aa = a + (si - (sk.length - 1) / 2) * 0.32, rr = R * 0.44;
          s.hx = cx + Math.cos(aa) * rr; s.hy = cy + Math.sin(aa) * rr; s.r = R * 0.005;
        });
      });
    }
    function reset() { for (const n of nodes) { n.x = cx + (Math.random() - 0.5) * 30; n.y = cy + (Math.random() - 0.5) * 30; n.vx = n.vy = 0; } }

    function step() {
      t += 0.01;
      for (const n of nodes) {
        if (n === drag) continue;
        const bob = n.kind === "core" ? 0 : 5 * dpr;
        n.vx += (n.hx + Math.cos(t + n.phase) * bob - n.x) * 0.026;
        n.vy += (n.hy + Math.sin(t * 0.9 + n.phase) * bob - n.y) * 0.026;
      }
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy, m = a.r + b.r + 15 * dpr;
        if (d2 < m * m && d2 > 0.01) {
          const d = Math.sqrt(d2), f = (m - d) / d * 0.5; dx *= f; dy *= f;
          if (a !== drag) { a.vx -= dx; a.vy -= dy; }
          if (b !== drag) { b.vx += dx; b.vy += dy; }
        }
      }
      for (const n of nodes) {
        if (n === drag) { n.x = mouse.x; n.y = mouse.y; n.vx = n.vy = 0; continue; }
        n.vx = Math.max(-25, Math.min(25, n.vx * 0.85)); n.vy = Math.max(-25, Math.min(25, n.vy * 0.85));
        n.x += n.vx; n.y += n.vy;
      }
    }
    function rel(n) {
      if (!hover) return true;
      if (n === hover || n === core || hover.kind === "core") return true;
      if (hover.kind === "hub") return n.parent === hubIdx[hover.cat];
      if (hover.kind === "skill") return n === nodes[hover.parent];
      return false;
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        if (n.parent < 0) continue;
        const p = nodes[n.parent], hot = hover && rel(n) && rel(p);
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = hot ? "rgba(201,242,78,0.45)" : BONE + "0.07)";
        ctx.lineWidth = (hot ? 1.3 : 0.6) * dpr; ctx.stroke();
      }
      for (const n of nodes) {
        const on = !hover || rel(n), big = n === hover;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (big ? 1.7 : 1), 0, 6.283);
        if (n.kind === "core") ctx.fillStyle = ACCENT;
        else if (n.kind === "hub") ctx.fillStyle = on ? ACCENT : "rgba(201,242,78,0.45)";
        else ctx.fillStyle = big ? ACCENT : BONE + (on ? "0.8)" : "0.16)");
        ctx.fill();
        if (n.kind !== "skill" || (hover && rel(n))) {
          ctx.font = `${(n.kind === "core" ? 11 : n.kind === "hub" ? 10 : 9) * dpr}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = n.kind === "skill" ? BONE + "0.9)" : ACCENT;
          ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText(n.label, n.x + n.r * (big ? 1.7 : 1) + 6 * dpr, n.y);
        }
      }
    }
    function frame() { if (!started) return; step(); draw(); raf = requestAnimationFrame(frame); }
    function pick(mx, my) { let best = null, bd = 20 * dpr; for (const n of nodes) { const d = Math.hypot(n.x - mx, n.y - my) - n.r; if (d < bd) { bd = d; best = n; } } return best; }
    const pos = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; };

    canvas.addEventListener("pointermove", (e) => { pos(e); if (!drag) { hover = pick(mouse.x, mouse.y); canvas.style.cursor = hover ? "grab" : "default"; } });
    canvas.addEventListener("pointerdown", (e) => { pos(e); drag = pick(mouse.x, mouse.y); if (drag) { canvas.style.cursor = "grabbing"; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} } });
    const up = () => { drag = null; canvas.style.cursor = hover ? "grab" : "default"; };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", () => { if (!drag) hover = null; });

    layout();
    window.addEventListener("resize", debounce(layout, 200));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !started) { started = true; reset(); raf = requestAnimationFrame(frame); }
        else if (!en.isIntersecting && started) { started = false; cancelAnimationFrame(raf); }
      }, { threshold: 0.12 }).observe(canvas);
    } else { started = true; reset(); raf = requestAnimationFrame(frame); }
  }

  /* ── velocity-reactive marquees ───────────────────────────── */
  function initMarquees() {
    if (!motion) return;
    const make = (el, dur) => {
      if (!el) return null;
      el.innerHTML += el.innerHTML; // seamless loop
      const tw = gsap.to(el, { xPercent: -50, duration: dur, ease: "none", repeat: -1 });
      return tw;
    };
    const tweens = [make($("#marquee"), 28), make($("#certs"), 24)].filter(Boolean);
    if (!lenis || !tweens.length) return;
    const skewT = $$("#marquee, #certs").map((el) => gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3" }));
    const reset = debounce(() => { tweens.forEach((tw) => tw.timeScale(1)); skewT.forEach((s) => s(0)); }, 180);
    lenis.on("scroll", ({ velocity }) => {
      const v = clamp(velocity, -60, 60);
      const dir = v >= 0 ? 1 : -1;
      tweens.forEach((tw) => tw.timeScale(dir * (1 + Math.min(Math.abs(v) / 6, 6))));
      skewT.forEach((s) => s(clamp(v * 0.32, -10, 10)));
      reset();
    });
  }

  /* ── word-level split (preserves <em> markup) ─────────────────── */
  function splitWords(el) {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((l) => `<span class="split-line"><span class="split-inner">${l}</span></span>`)
      .join("");
    el.querySelectorAll(".split-inner").forEach(wrapWords);
  }
  function wrapWords(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((tok) => {
          if (tok === "") return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          const w = document.createElement("span"); w.className = "word";
          const inner = document.createElement("span"); inner.textContent = tok;
          w.appendChild(inner); frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        wrapWords(child);
      }
    });
  }

  /* ── all scroll-driven setup ────────────────────────────── */
  function buildScroll() {
    if (!motion) return;

    // hero parallax
    gsap.to(".hero__lead", { yPercent: -16, opacity: 0.2, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__portrait", { yPercent: 8, opacity: 0.25, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__canvas", { opacity: 0, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });

    // split headings (word-level reveal)
    $$("[data-split]").forEach((el) => {
      splitWords(el);
      gsap.fromTo(el.querySelectorAll(".word > span"), { yPercent: 115 }, {
        yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.045,
        scrollTrigger: { trigger: el, start: "top 84%" },
      });
    });

    // generic fade-ups
    $$("[data-fade]").forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.95, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    // manifesto word illumination
    const words = $$("#manifesto .w");
    if (words.length) {
      gsap.to(words, { opacity: 1, ease: "none", stagger: 0.5,
        scrollTrigger: { trigger: "#manifesto", start: "top 78%", end: "bottom 52%", scrub: 0.6 } });
    }

    // count-ups
    $$(".count").forEach((el) => {
      const to = parseFloat(el.dataset.count) || 0;
      const dec = parseInt(el.dataset.dec || "0", 10);
      const suf = el.dataset.suffix || "";
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.6, ease: "power2.out",
          onUpdate: () => { el.textContent = o.v.toFixed(dec) + suf; },
          onComplete: () => { el.textContent = to.toFixed(dec) + suf; } });
      }});
    });

    // experience git-graph line draws as you scroll
    const expList = $(".exp__list");
    if (expList) ScrollTrigger.create({
      trigger: "#experience", start: "top 72%", end: "bottom 62%", scrub: true,
      onUpdate: (self) => expList.style.setProperty("--draw", self.progress.toFixed(3)),
    });

    initWork();
  }

  /* ── horizontal pinned work + scroll-coupled depth ───────────────── */
  function initWork() {
    const pin = $("#workPin"), track = $("#workTrack");
    if (!pin || !track) return;
    const counter = $("#workCounter"), progress = $("#workProgress");
    const panels = $$(".panel", track);
    const total = panels.length;
    const mm = matchMedia("(min-width: 1024px) and (pointer: fine)");
    let tween = null, extra = [];

    const dist = () => Math.max(0, track.scrollWidth - innerWidth);

    function teardown() {
      document.documentElement.classList.remove("work-horizontal");
      if (tween) { if (tween.scrollTrigger) tween.scrollTrigger.kill(); tween.kill(); tween = null; }
      extra.forEach((t) => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
      extra = [];
      gsap.set(track, { x: 0 });
      gsap.set(track.querySelectorAll(".panel__visual"), { clearProps: "transform" });
      gsap.set(track.querySelectorAll(".panel__body > *"), { clearProps: "opacity,transform" });
    }

    function build() {
      teardown();

      // mobile / tablet: simple vertical reveals
      if (!mm.matches) {
        panels.forEach((p) => {
          const body = p.querySelector(".panel__body");
          if (body) extra.push(gsap.from(body.children, {
            y: 40, opacity: 0, duration: 0.7, stagger: 0.05, ease: "power3.out",
            scrollTrigger: { trigger: p, start: "top 82%" },
          }));
        });
        return;
      }

      // desktop: pinned horizontal track
      document.documentElement.classList.add("work-horizontal");
      tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: pin, start: "top top", end: () => "+=" + dist(),
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => {
            if (progress) progress.style.transform = `scaleX(${self.progress})`;
            if (counter) {
              const i = Math.min(total, Math.round(self.progress * (total - 1)) + 1);
              counter.textContent = String(i).padStart(2, "0") + " / " + String(total).padStart(2, "0");
            }
            window.dispatchEvent(new CustomEvent("work:progress", { detail: { progress: self.progress } }));
          },
          onToggle: (self) => window.dispatchEvent(new CustomEvent("work:active", { detail: { active: self.isActive } })),
        },
      });

      // depth: visuals parallax + text stagger, driven by the horizontal scroll
      panels.forEach((p) => {
        const vis = p.querySelector(".panel__visual");
        const body = p.querySelector(".panel__body");
        if (vis) extra.push(gsap.fromTo(vis, { xPercent: 7 }, {
          xPercent: -7, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        }));
        if (body) extra.push(gsap.from(body.children, {
          y: 55, opacity: 0, stagger: 0.05, ease: "power3.out",
          scrollTrigger: { trigger: p, containerAnimation: tween, start: "left 85%", end: "left 38%", scrub: true },
        }));
      });
    }

    build();
    mm.addEventListener("change", () => { build(); ScrollTrigger.refresh(); });
  }

  /* ── hero intro ──────────────────────────────────────── */
  function heroIntro() {
    if (!motion) {
      gsap && gsap.set && gsap.set(".hero__title .line__in", { yPercent: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".hero__title .line__in", { yPercent: 110 }, { yPercent: 0, duration: 1.15, stagger: 0.12 }, 0)
      .from(".nav", { yPercent: -100, opacity: 0, duration: 0.9 }, 0.1)
      .from(".hero__top > *", { y: -14, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.35)
      .from('[data-hero="over"]', { y: 18, opacity: 0, duration: 0.8 }, 0.45)
      .from('[data-hero="tag"]', { y: 24, opacity: 0, duration: 0.9 }, 0.7)
      .from('[data-hero="cue"]', { opacity: 0, duration: 0.8, stagger: 0.1 }, 0.95);
  }

  /* ── nav + utilities ──────────────────────────────────── */
  function initNav() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        scrollTo(t);
      });
    });
    const toTop = $("#toTop");
    if (toTop) toTop.addEventListener("click", () => scrollTo(0));

    const copy = $("#copyEmail");
    if (copy) copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("abubakaramirwork@gmail.com");
        copy.classList.add("is-copied");
        copy.querySelector("span").textContent = "Copied ✓";
        setTimeout(() => { copy.classList.remove("is-copied"); copy.querySelector("span").textContent = "Copy"; }, 1800);
      } catch (_) { /* clipboard blocked — email link still works */ }
    });
  }

  /* ── scroll progress bar ────────────────────────────────── */
  function initScrollProgress() {
    const bar = $("#scrollProgress");
    if (!bar || !motion) return;
    const fill = bar.firstElementChild;
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => {
      fill.style.transform = "scaleX(" + self.progress.toFixed(4) + ")";
    } });
  }

  /* ── cursor spotlight on cards & buttons ────────────────────── */
  function initSpotlight() {
    if (!fine) return;
    $$(".skills__cell, .idcard, .contact__copy, .footer__top, .archive__row a").forEach((el) => {
      el.setAttribute("data-spotlight", "");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      }, { passive: true });
    });
  }

  /* ── 3D tilt on the profile card ──────────────────────────── */
  function initTilt() {
    if (!fine || !hasGSAP) return;
    $$(".idcard").forEach((el) => {
      gsap.set(el, { transformPerspective: 900, transformOrigin: "center" });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - (r.left + r.width / 2)) / r.width) * 9);
        rx((-(e.clientY - (r.top + r.height / 2)) / r.height) * 9);
      });
      el.addEventListener("mouseleave", () => { rx(0); ry(0); });
    });
  }

  /* ── giant ghost numerals behind each project ─────────────────── */
  function initGhost() {
    $$(".panel").forEach((p) => {
      const meta = p.querySelector(".panel__meta span");
      if (!meta) return;
      const g = document.createElement("span");
      g.className = "panel__ghost";
      g.setAttribute("aria-hidden", "true");
      g.textContent = meta.textContent.trim();
      p.appendChild(g);
    });
  }

  /* ── scroll-spy: highlight the active nav link ─────────────────── */
  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    const nav = {}; $$(".nav__links a").forEach((a) => { const id = (a.getAttribute("href") || "").replace(/^#/, ""); if (id) nav[id] = a; });
    const rail = {}; $$(".rail__item").forEach((a) => { if (a.dataset.rail) rail[a.dataset.rail] = a; });
    const ids = ["hero", "about", "approach", "work", "archive", "skills", "experience", "contact"];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        if (nav[id]) { Object.values(nav).forEach((l) => l.classList.remove("is-active")); nav[id].classList.add("is-active"); }
        if (rail[id]) { Object.values(rail).forEach((l) => l.classList.remove("is-active")); rail[id].classList.add("is-active"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ── about: profile terminal (types on scroll) ────────────────── */
  function initTerminal() {
    const term = document.querySelector("[data-term]");
    if (!term) return;
    const types = $$(".term__type", term);
    const outs = $$(".term__out", term);
    if (reduced || !types.length) return; // static fallback: commands + outputs already visible
    types.forEach((t) => (t.textContent = ""));
    outs.forEach((o) => { o.style.opacity = "0"; o.style.transition = "opacity 0.4s var(--ease)"; });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const typeInto = (el, text) => new Promise((res) => {
      el.classList.add("is-caret"); let i = 0;
      const id = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(id); el.classList.remove("is-caret"); res(); } }, 36);
    });
    let started = false;
    const run = async () => {
      for (let i = 0; i < types.length; i++) {
        await typeInto(types[i], types[i].dataset.type || "");
        if (outs[i]) outs[i].style.opacity = "1";
        await wait(240);
      }
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; io.disconnect(); run(); } }, { threshold: 0.3 });
      io.observe(term);
    } else { run(); }
  }

  /* ── contact: secure-channel reveal (decrypts the email on view) ───── */
  function initContactReveal() {
    const section = document.getElementById("contact");
    const email = document.getElementById("emailLink");
    const channel = document.getElementById("contactChannel");
    const cText = document.getElementById("channelText");
    if (!section) return;
    const target = email ? email.textContent.trim() : "";
    const secure = () => { if (cText) cText.textContent = "encrypted channel established · ready to connect"; if (channel) channel.classList.add("is-secure"); };
    if (reduced || !("IntersectionObserver" in window)) { secure(); return; }
    const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@._-";
    let done = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done) return; done = true; io.disconnect();
      if (cText) cText.textContent = "establishing secure channel…";
      if (!email || !target) { secure(); return; }
      let frame = 0; const total = 26;
      const id = setInterval(() => {
        email.textContent = target.split("").map((c, i) => (c === "@" || c === "." || i < (frame / total) * target.length) ? c : CH[(Math.random() * CH.length) | 0]).join("");
        if (frame++ >= total) { clearInterval(id); email.textContent = target; secure(); }
      }, 38);
    }, { threshold: 0.3 });
    io.observe(section);
  }

  /* ── archive hover preview (animated dashboard popup) ───────────── */
  function drawArchiveCard(canvas, d, seed) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = 480, H = 300;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const x = canvas.getContext("2d"); if (!x) return; x.scale(dpr, dpr);
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0c0c11"); bg.addColorStop(1, "#070709");
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(242,239,230,0.05)"; x.lineWidth = 1;
    for (let gx = 32; gx < W; gx += 32) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 32; gy < H; gy += 32) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
    const gl = x.createRadialGradient(120, 120, 10, 120, 120, 220); gl.addColorStop(0, "rgba(201,242,78,0.14)"); gl.addColorStop(1, "transparent"); x.fillStyle = gl; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#c9f24e"; x.lineWidth = 2; const m = 16, tk = 14;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([px, py, dx, dy]) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px + dx * tk, py); x.moveTo(px, py); x.lineTo(px, py + dy * tk); x.stroke(); });
    x.textBaseline = "middle"; x.textAlign = "left";
    x.fillStyle = "#c9f24e"; x.beginPath(); x.arc(30, 32, 4, 0, 6.283); x.fill();
    x.fillStyle = "rgba(242,239,230,0.5)"; x.font = "500 11px 'JetBrains Mono',monospace"; x.fillText("SECURE // " + (d.cat || "").toUpperCase(), 42, 33);
    x.textAlign = "right"; x.fillStyle = "#f2efe6"; x.fillText(d.idx + " / 14", W - 22, 33);
    x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#f2efe6"; x.font = "800 38px Syne, sans-serif";
    let line = "", yy = 108; const words = (d.title || "").toUpperCase().split(" "), maxw = W - 150;
    for (const wd of words) { const test = line ? line + " " + wd : wd; if (x.measureText(test).width > maxw && line) { x.fillText(line, 24, yy); line = wd; yy += 38; } else line = test; } if (line) x.fillText(line, 24, yy);
    let s = seed * 13 + 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    x.strokeStyle = "#c9f24e"; x.lineWidth = 2; x.beginPath();
    const cx0 = W - 175, cw = 150, cy0 = 135, ch = 58;
    for (let i = 0; i <= 30; i++) { const xx = cx0 + cw * i / 30, vy = cy0 + ch / 2 - Math.sin(i * 0.5 + seed) * (ch / 2) * (0.4 + 0.6 * rnd()); i ? x.lineTo(xx, vy) : x.moveTo(xx, vy); }
    x.globalAlpha = 0.85; x.stroke(); x.globalAlpha = 1;
    x.fillStyle = "rgba(242,239,230,0.5)"; x.font = "500 12px 'JetBrains Mono',monospace"; x.fillText(d.tags || "", 24, H - 44);
    x.fillStyle = "#c9f24e"; x.fillText("OPEN ↗", 24, H - 20);
    x.textAlign = "right"; x.fillStyle = "rgba(242,239,230,0.4)"; x.fillText(d.year || "", W - 22, H - 20);
  }
  function initArchivePreview() {
    if (!fine) return;
    const rows = $$(".archive__row a");
    if (!rows.length) return;
    const pop = document.createElement("div"); pop.className = "archive__preview"; pop.setAttribute("aria-hidden", "true");
    const canvas = document.createElement("canvas"); pop.appendChild(canvas);
    document.body.appendChild(pop);
    const xT = hasGSAP ? gsap.quickTo(pop, "x", { duration: 0.4, ease: "power3" }) : null;
    const yT = hasGSAP ? gsap.quickTo(pop, "y", { duration: 0.4, ease: "power3" }) : null;
    const wdt = () => pop.offsetWidth || 400, hgt = () => pop.offsetHeight || 250;
    const move = (e) => {
      let px = e.clientX + 28; if (px + wdt() > innerWidth - 12) px = e.clientX - 28 - wdt();
      const py = clamp(e.clientY - hgt() / 2, 12, innerHeight - hgt() - 12);
      if (xT) { xT(px); yT(py); } else { pop.style.left = px + "px"; pop.style.top = py + "px"; }
    };
    rows.forEach((a, i) => {
      const data = {
        idx: (a.querySelector(".archive__idx")?.textContent || "").trim(),
        title: (a.querySelector(".archive__title")?.textContent || "Project").trim(),
        cat: (a.querySelector(".archive__cat")?.textContent || "").trim(),
        tags: (a.querySelector(".archive__tags")?.textContent || "").trim(),
        year: (a.querySelector(".archive__year")?.textContent || "").trim(),
      };
      a.addEventListener("pointerenter", (e) => {
        drawArchiveCard(canvas, data, parseInt(data.idx, 10) || i + 1);
        pop.classList.add("is-on"); move(e);
        if (hasGSAP && !reduced) gsap.fromTo(pop, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
        else pop.style.opacity = "1";
      });
      a.addEventListener("pointermove", move);
      a.addEventListener("pointerleave", () => {
        pop.classList.remove("is-on");
        if (hasGSAP && !reduced) gsap.to(pop, { opacity: 0, scale: 0.94, duration: 0.25 }); else pop.style.opacity = "0";
      });
    });
  }

  /* ── command palette (⌘K) ────────────────────────────────── */
  function initCommandPalette() {
    const root = document.createElement("div");
    root.className = "cmdk"; root.setAttribute("hidden", "");
    root.innerHTML =
      '<div class="cmdk__backdrop" data-close></div>' +
      '<div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="Command menu">' +
        '<div class="cmdk__bar"><span class="cmdk__prompt mono">&gt;_</span>' +
        '<input class="cmdk__input" type="text" placeholder="Type a command or search…" aria-label="Command search" />' +
        '<span class="cmdk__esc mono">ESC</span></div>' +
        '<ul class="cmdk__list" role="listbox"></ul>' +
        '<div class="cmdk__foot mono"><span>↑ ↓ navigate</span><span>↵ select</span><span>esc close</span></div>' +
      "</div>";
    document.body.appendChild(root);
    const input = root.querySelector(".cmdk__input");
    const list = root.querySelector(".cmdk__list");

    const EMAIL = "abubakaramirwork@gmail.com";
    const toast = (msg) => {
      const t = document.createElement("div"); t.className = "cmdk-toast mono"; t.textContent = msg;
      document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("is-on"));
      setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 320); }, 1500);
    };
    const goto = (id) => () => { const t = document.querySelector(id); if (t) scrollTo(t); };
    const open = (url) => () => window.open(url, "_blank", "noopener");

    const cmds = [
      { label: "Selected Work", hint: "Section", kw: "projects 3d portfolio", run: goto("#work") },
      { label: "About", hint: "Section", kw: "bio manifesto story", run: goto("#about") },
      { label: "Approach", hint: "Section", kw: "methodology pipeline", run: goto("#approach") },
      { label: "Capabilities", hint: "Section", kw: "skills graph stack", run: goto("#skills") },
      { label: "Archive", hint: "Section", kw: "more projects repos", run: goto("#archive") },
      { label: "Experience", hint: "Section", kw: "work history thingtrax", run: goto("#experience") },
      { label: "Contact", hint: "Section", kw: "email reach hire", run: goto("#contact") },
    ];
    $$("#workTrack .panel").forEach((p) => {
      const title = (p.querySelector(".panel__title")?.innerHTML || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
      const url = p.querySelector(".panel__link")?.href;
      if (url && title) cmds.push({ label: "Open " + title + " repo", hint: "GitHub", kw: "project code repo", run: open(url) });
    });
    cmds.push(
      { label: "Copy email address", hint: "Action", kw: "contact mail", run: async () => { try { await navigator.clipboard.writeText(EMAIL); toast("Email copied ✓"); } catch (_) { location.href = "mailto:" + EMAIL; } } },
      { label: "Send an email", hint: "mailto", kw: "contact hire reach", run: () => { location.href = "mailto:" + EMAIL; } },
      { label: "Download CV / résumé", hint: "PDF", kw: "resume cv", run: () => { const a = document.createElement("a"); a.href = "assets/Muhammad-Abubakar-CV.pdf"; a.download = ""; document.body.appendChild(a); a.click(); a.remove(); } },
      { label: "Open GitHub", hint: "↗", kw: "code kryptbakar", run: open("https://github.com/kryptbakar") },
      { label: "Open LinkedIn", hint: "↗", kw: "connect", run: open("https://www.linkedin.com/in/muhammad-abubakar-28b4a2312/") },
      { label: "sudo hire-me", hint: "☺", kw: "job available recruit", run: () => { location.href = "mailto:" + EMAIL + "?subject=Let%27s%20work%20together"; } }
    );

    let filtered = cmds.slice(), sel = 0, isOpen = false;
    const score = (c, q) => {
      const s = (c.label + " " + c.kw).toLowerCase();
      if (!q) return 1;
      if (s.includes(q)) return 2;
      let i = 0; for (const ch of s) { if (ch === q[i]) i++; if (i === q.length) return 1; }
      return 0;
    };
    const render = () => {
      list.innerHTML = filtered.length
        ? filtered.map((c, i) => `<li class="cmdk__item${i === sel ? " is-sel" : ""}" role="option" data-i="${i}"><span class="cmdk__label">${c.label}</span><span class="cmdk__hint mono">${c.hint}</span></li>`).join("")
        : '<li class="cmdk__empty mono">No matches</li>';
    };
    const refilter = () => {
      const q = input.value.trim().toLowerCase();
      filtered = cmds.map((c) => [score(c, q), c]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]).map((x) => x[1]);
      sel = 0; render();
    };
    const show = () => { isOpen = true; root.removeAttribute("hidden"); requestAnimationFrame(() => root.classList.add("is-open")); input.value = ""; filtered = cmds.slice(); sel = 0; render(); setTimeout(() => input.focus(), 40); if (lenis) lenis.stop(); };
    const hide = () => { isOpen = false; root.classList.remove("is-open"); if (lenis) lenis.start(); setTimeout(() => root.setAttribute("hidden", ""), 300); };
    const exec = () => { const c = filtered[sel]; hide(); if (c) setTimeout(c.run, 90); };
    const ensureVis = () => { const el = list.children[sel]; if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" }); };

    input.addEventListener("input", refilter);
    list.addEventListener("mousemove", (e) => { const li = e.target.closest(".cmdk__item"); if (li) { sel = +li.dataset.i; render(); } });
    list.addEventListener("click", (e) => { const li = e.target.closest(".cmdk__item"); if (li) { sel = +li.dataset.i; exec(); } });
    root.querySelector("[data-close]").addEventListener("click", hide);
    const chip = document.querySelector(".nav__cmdk");
    if (chip) chip.addEventListener("click", () => (isOpen ? hide() : show()));
    document.addEventListener("keydown", (e) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); isOpen ? hide() : show(); return; }
      if (!isOpen) return;
      if (e.key === "Escape") { e.preventDefault(); hide(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(filtered.length - 1, sel + 1); render(); ensureVis(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); ensureVis(); }
      else if (e.key === "Enter") { e.preventDefault(); exec(); }
    });
  }

  /* ── preloader ────────────────────────────────────────── */
  function runLoader(done) {
    const loader = $("#loader");
    if (!motion || !loader) { if (loader) loader.style.display = "none"; done(); return; }
    const fill = $("#loaderFill"), pct = $("#loaderPct"), state = $("#loaderState");
    const lines = $$("#bootLog .boot__line"), grant = $("#bootGrant");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: done });
    if (lines.length) tl.from(lines, { opacity: 0, x: -12, duration: 0.4, stagger: 0.16 }, 0.1);
    const c = { v: 0 };
    tl.to(c, { v: 100, duration: 1.9, ease: "power2.inOut", onUpdate: () => {
      const v = Math.round(c.v);
      if (pct) pct.textContent = v;
      if (fill) fill.style.width = v + "%";
      if (state) state.textContent = v < 100 ? "MOUNTING" : "READY";
      lines.forEach((ln) => {
        if (v >= +ln.dataset.at && !ln.classList.contains("is-ok")) {
          ln.classList.add("is-ok");
          const s = ln.querySelector(".boot__stat"); if (s) s.textContent = "[ OK ]";
        }
      });
    } }, 0);
    if (grant) tl.to(grant, { opacity: 1, duration: 0.4 }, "-=0.1");
    tl.to(".loader__inner", { opacity: 0, duration: 0.45 }, "+=0.3");
    tl.to(loader, { yPercent: -100, duration: 1.0, ease: "power4.inOut" }, "-=0.05");
  }

  /* ── boot ────────────────────────────────────────────── */
  function start() {
    document.body.classList.remove("is-loading");
    initSmooth();
    buildScroll();
    initScrollProgress();
    heroIntro();
    if (hasGSAP) {
      ScrollTrigger.refresh();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
      window.addEventListener("load", () => ScrollTrigger.refresh());
    }
  }

  // independent of the loader
  initClock();
  initRoles();
  initCursor();
  initMagnetic();
  initScramble();
  initFlow();
  initMarquees();
  initNav();
  initGhost();
  initSpotlight();
  initTilt();
  initScrollSpy();
  initSkillsGraph();
  initApproachPipeline();
  initCommandPalette();
  initTerminal();
  initArchivePreview();
  initContactReveal();

  runLoader(start);

  // safety net: never let a failed CDN trap the page behind the loader
  setTimeout(() => {
    const l = $("#loader");
    if (l && getComputedStyle(l).display !== "none" && !l.style.transform) {
      l.style.display = "none";
      document.body.classList.remove("is-loading");
      if (!motion) { document.documentElement.classList.add("no-gsap"); }
    }
  }, 7000);
})();
