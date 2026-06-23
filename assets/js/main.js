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

  /* ── live clock (Asia/Karachi · UTC+5) ──────────────────────────────── */
  function initClock() {
    const el = $("#clock");
    if (!el) return;
    const tick = () => {
      const now = new Date();
      const pkt = new Date(now.getTime() + (now.getTimezoneOffset() + 300) * 60000);
      const p = (n) => String(n).padStart(2, "0");
      el.textContent = `${p(pkt.getHours())}:${p(pkt.getMinutes())}:${p(pkt.getSeconds())} PKT`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── smooth scroll ──────────────────────────────────────────────────── */
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

  /* ── custom cursor ──────────────────────────────────────────────────── */
  function initCursor() {
    const cur = $(".cursor");
    if (!cur || !fine || !hasGSAP) return;
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

  /* ── magnetic elements ──────────────────────────────────────────────── */
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

  /* ── scramble-on-hover links ────────────────────────────────────────── */
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

  /* ── hero flow-field canvas ─────────────────────────────────────────── */
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

  /* ── velocity-reactive marquees ─────────────────────────────────────── */
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

  /* ── split-line reveals ─────────────────────────────────────────────── */
  function splitLines(el) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="split-line"><span>${p}</span></span>`).join("");
  }

  /* ── all scroll-driven setup ────────────────────────────────────────── */
  function buildScroll() {
    if (!motion) return;

    // hero parallax
    gsap.to(".hero__center", { yPercent: -12, opacity: 0.18, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__canvas", { opacity: 0, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });

    // split headings
    $$("[data-split]").forEach((el) => {
      splitLines(el);
      gsap.fromTo(el.querySelectorAll(".split-line > span"), { yPercent: 110 }, {
        yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12,
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

    initWork();
  }

  /* ── horizontal pinned work ─────────────────────────────────────────── */
  function initWork() {
    const pin = $("#workPin"), track = $("#workTrack");
    if (!pin || !track) return;
    const counter = $("#workCounter"), progress = $("#workProgress");
    const total = $$(".panel", track).length;
    const mm = matchMedia("(min-width: 1024px) and (pointer: fine)");
    let tween = null;

    const dist = () => Math.max(0, track.scrollWidth - innerWidth);

    function teardown() {
      document.documentElement.classList.remove("work-horizontal");
      if (tween) { if (tween.scrollTrigger) tween.scrollTrigger.kill(); tween.kill(); tween = null; }
      gsap.set(track, { x: 0 });
    }
    function build() {
      teardown();
      if (reduced || !mm.matches) return;
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
          },
        },
      });
    }
    build();
    mm.addEventListener("change", () => { build(); ScrollTrigger.refresh(); });
  }

  /* ── hero intro ─────────────────────────────────────────────────────── */
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

  /* ── nav + utilities ────────────────────────────────────────────────── */
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

  /* ── preloader ──────────────────────────────────────────────────────── */
  function runLoader(done) {
    const loader = $("#loader");
    if (!motion || !loader) { if (loader) loader.style.display = "none"; done(); return; }
    const fill = $("#loaderFill"), pct = $("#loaderPct");
    const words = $$(".loader__word [data-word]");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: done });
    words.forEach((wd, i) => {
      tl.fromTo(wd, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 }, i * 0.32 + 0.1);
      if (i < words.length - 1) tl.to(wd, { yPercent: -100, opacity: 0, duration: 0.4 }, i * 0.32 + 0.42);
    });
    const c = { v: 0 };
    tl.to(c, { v: 100, duration: 1.9, ease: "power2.inOut", onUpdate: () => {
      const v = Math.round(c.v);
      if (pct) pct.textContent = v;
      if (fill) fill.style.width = v + "%";
    } }, 0);
    tl.to(".loader__inner", { opacity: 0, duration: 0.4 }, "+=0.1");
    tl.to(loader, { yPercent: -100, duration: 1.0, ease: "power4.inOut" }, "-=0.1");
  }

  /* ── boot ───────────────────────────────────────────────────────────── */
  function start() {
    document.body.classList.remove("is-loading");
    initSmooth();
    buildScroll();
    heroIntro();
    if (hasGSAP) {
      ScrollTrigger.refresh();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
      window.addEventListener("load", () => ScrollTrigger.refresh());
    }
  }

  // independent of the loader
  initClock();
  initCursor();
  initMagnetic();
  initScramble();
  initFlow();
  initMarquees();
  initNav();

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
