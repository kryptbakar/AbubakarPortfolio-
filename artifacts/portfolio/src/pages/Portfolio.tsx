import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// ─── Data ────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: "01", year: "2025",
    title: "Secure DevSecOps\nCI/CD Pipeline",
    category: "AppSec · Automation",
    tags: ["GitHub Actions", "Bandit SAST", "pip-audit SCA", "Python"],
    body: "Fail-fast security gates in GitHub Actions blocking secrets, SQLi patterns, and vulnerable dependencies. Packaged as a reusable template — downstream repos inherit the same security posture with zero setup.",
    bg: "radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.04) 0%, transparent 65%)",
  },
  {
    id: "02", year: "2025",
    title: "Phantom\nIdentity",
    category: "Browser Privacy · Extension",
    tags: ["JavaScript", "Manifest V3", "WebGL", "Canvas API"],
    body: "Manifest V3 extension defeating passive fingerprint tracking by spoofing Canvas, WebGL, Navigator, Screen, and timezone attributes per session. In-extension entropy dashboard. Zero outbound telemetry.",
    bg: "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.04) 0%, transparent 65%)",
  },
  {
    id: "03", year: "2024",
    title: "Bakri\nPay",
    category: "Secure Banking · Flask",
    tags: ["Flask", "Python", "OWASP Top 10", "Burp Suite", "PostgreSQL"],
    body: "Full-stack banking app with rules-based fraud detection. OWASP Top 10 mapped controls — bcrypt/Argon2 hashing, CSRF tokens, parameterized queries. Validated end-to-end via Burp Suite assessment.",
    bg: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)",
  },
  {
    id: "04", year: "2024",
    title: "DQN Adaptive\nNoise Allocation",
    category: "Wireless Security · RL",
    tags: ["TensorFlow", "DQN", "MISO", "Rayleigh Fading"],
    body: "+0.299 bits/s/Hz secrecy gain over fixed allocation at low SNR. DQN agent trained on a MISO wiretap channel with MRT beamforming, artificial noise injection, and imperfect CSI.",
    bg: "radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 65%)",
  },
  {
    id: "05", year: "2024",
    title: "AI Intrusion\nDetection System",
    category: "ML · Cybersecurity",
    tags: ["CatBoost", "LOF", "scikit-learn", "1.6M samples"],
    body: "Hybrid CatBoost + LOF detector pairing supervised classification with unsupervised novelty detection. Catches zero-day attack patterns missed by pure supervised models. Trained in ~7.5 min.",
    bg: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 65%)",
  },
];

const MISSION_WORDS = [
  { text: "Securing", highlight: false },
  { text: "systems,", highlight: false },
  { text: "hardening", highlight: true },
  { text: "pipelines,", highlight: false },
  { text: "and", highlight: false },
  { text: "protecting", highlight: true },
  { text: "the", highlight: false },
  { text: "future", highlight: false },
  { text: "—", highlight: false },
  { text: "one", highlight: false },
  { text: "commit", highlight: true },
  { text: "at", highlight: false },
  { text: "a", highlight: false },
  { text: "time.", highlight: false },
];

const SKILLS = [
  { label: "Security", items: ["Application Security", "Penetration Testing", "OWASP Top 10", "Threat Modeling", "SAST / SCA", "DevSecOps"] },
  { label: "Tools", items: ["Burp Suite", "Nmap", "Metasploit", "Wireshark", "Bandit", "GitHub Actions", "Kali Linux"] },
  { label: "Programming", items: ["Python", "JavaScript", "C++", "SQL", "Bash"] },
  { label: "Frameworks", items: ["Flask", "React", "REST APIs", "NIST CSF", "ISO 27001", "Secure SDLC"] },
  { label: "ML / Data", items: ["TensorFlow", "CatBoost", "scikit-learn", "Pandas", "PostgreSQL"] },
];

const EXPERIENCE = [
  {
    role: "Software QA Intern — Security Testing",
    company: "Thingtrax", location: "Lahore", period: "Jun – Aug 2025",
    bullets: [
      "Security-focused test cases across 4 production releases — auth-flow validation, input fuzzing, dependency-vulnerability checks.",
      "Digitization workflow cutting document retrieval from ~15 min to under 5 sec.",
    ],
  },
  {
    role: "Secure Software Developer Intern",
    company: "Thingtrax", location: "Lahore", period: "Jun – Aug 2024",
    bullets: [
      "Built auth, catalog, and checkout flows for an industry-sponsored e-commerce platform with input validation and parameterized queries.",
      "Shipped 50+ UI screens informed by 200+ user interviews. Improved delivery cadence ~15%.",
    ],
  },
];

// ─── Animated dot-wave canvas ─────────────────────────────────────────────────

function DotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.006;
      const spacing = 52;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dx = (x / canvas.width) - 0.5;
          const dy = (y / canvas.height) - 0.5;
          const dist = Math.sqrt(dx * dx + dy * dy) * 2;
          const wave = Math.sin(dist * 5 - t * 2.5) * 0.5 + 0.5;
          const size = 0.9 + wave * 0.9;
          const alpha = 0.045 + wave * 0.07;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className="dot-canvas"
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Text scramble link ───────────────────────────────────────────────────────

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#&";

function scramble(el: HTMLElement, text: string) {
  let frame = 0;
  const total = Math.floor(480 / 28);
  const id = setInterval(() => {
    el.textContent = text.split("").map((ch, i) => {
      if (ch === " ") return " ";
      if (i < (frame / total) * text.length) return ch;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join("");
    frame++;
    if (frame > total) { el.textContent = text; clearInterval(id); }
  }, 28);
  return () => { el.textContent = text; clearInterval(id); };
}

function SLink({ href, children, className, target, rel }: {
  href: string; children: string; className?: string; target?: string; rel?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const cancel = useRef<() => void>();
  const go = useCallback(() => { if (ref.current) { cancel.current?.(); cancel.current = scramble(ref.current, children); } }, [children]);
  const stop = useCallback(() => { cancel.current?.(); }, []);
  return <a ref={ref} href={href} className={className} target={target} rel={rel} onMouseEnter={go} onMouseLeave={stop}>{children}</a>;
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function Loader({ onDone }: { onDone: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const pct = useRef(0);

  useEffect(() => {
    const tick = setInterval(() => {
      pct.current += Math.random() * 10 + 5;
      if (pct.current >= 100) {
        pct.current = 100;
        clearInterval(tick);
        if (fillRef.current) fillRef.current.style.width = "100%";
        setTimeout(() => {
          gsap.to(overlayRef.current, {
            yPercent: -100, duration: 1.15, ease: "power4.inOut",
            onComplete: onDone,
          });
        }, 400);
      }
      if (fillRef.current) fillRef.current.style.width = pct.current + "%";
    }, 55);
    return () => clearInterval(tick);
  }, [onDone]);

  return (
    <div ref={overlayRef} style={{
      position: "fixed", inset: 0, background: "#000",
      zIndex: 9999, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "2.5rem",
    }}>
      <div style={{
        fontFamily: "'Syne',sans-serif", fontWeight: 800,
        fontSize: "clamp(2.5rem,8vw,6rem)", letterSpacing: "-0.04em",
        color: "#fff", lineHeight: 0.88, textAlign: "center",
      }}>
        M.<br />ABUBAKAR
      </div>
      <div style={{ width: 180, height: 1, background: "rgba(255,255,255,0.1)", position: "relative" }}>
        <div ref={fillRef} style={{ position: "absolute", inset: 0, background: "#fff", width: "0%", transition: "width .08s linear" }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
        Initializing
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Portfolio() {
  const [ready, setReady] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const cursorRing = useRef<HTMLDivElement>(null);
  const cursorDot  = useRef<HTMLDivElement>(null);
  const heroRef    = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const horizRef   = useRef<HTMLDivElement>(null);

  // ── Lenis ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    return () => { lenis.destroy(); };
  }, [ready]);

  // ── Cursor ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const ring = cursorRing.current;
    const dot  = cursorDot.current;
    if (!ring || !dot) return;
    if (window.matchMedia("(max-width:768px)").matches) return;

    const xR = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    const yR = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });
    const xD = gsap.quickTo(dot,  "x", { duration: 0.06, ease: "none" });
    const yD = gsap.quickTo(dot,  "y", { duration: 0.06, ease: "none" });

    const mv = (e: MouseEvent) => { xR(e.clientX); yR(e.clientY); xD(e.clientX); yD(e.clientY); };
    window.addEventListener("mousemove", mv);

    document.querySelectorAll("a, button, .proj-panel, .skill-cell").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hovering"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hovering"));
    });
    return () => window.removeEventListener("mousemove", mv);
  }, [ready]);

  // ── All GSAP animations ────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    // ── Hero name: per-line clip-path reveal (no DOM manipulation)
    gsap.fromTo(".hero-name-line",
      { yPercent: 110 },
      { yPercent: 0, stagger: 0.12, duration: 1.15, ease: "power4.out", delay: 0.25 }
    );
    gsap.fromTo(".hero-sub-row",   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.1,  ease: "power2.out" });
    gsap.fromTo(".hero-scroll-hint", { opacity: 0 },      { opacity: 1,         duration: 0.6, delay: 1.65, ease: "none" });

    if (reduced) return;

    // ── Hero parallax fade on scroll
    gsap.timeline({
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    })
      .to(".hero-name-block", { y: -80, opacity: 0.3 }, 0)
      .to(".dot-canvas",    { opacity: 0 }, 0)
      .to(".hero-sub-row",  { y: -40, opacity: 0 }, 0);

    // ── Horizontal scroll: projects ─────────────────────────────────────────
    const wrapper = document.querySelector("#horiz-wrapper") as HTMLElement;
    const track   = document.querySelector("#horiz-track")   as HTMLElement;
    if (wrapper && track) {
      const getScrollWidth = () => track.scrollWidth - wrapper.offsetWidth;

      const buildHoriz = () => {
        const sw = getScrollWidth();
        if (sw <= 0) return;
        gsap.to(track, {
          x: -sw,
          ease: "none",
          scrollTrigger: {
            id: "horiz",
            trigger: wrapper,
            pin: true,
            anticipatePin: 1,
            start: "top top",
            end: `+=${sw}`,
            scrub: 1.2,
            onUpdate: (self) => {
              const idx = Math.round(self.progress * (PROJECTS.length - 1));
              setActiveProject(idx);
            },
          },
        });
      };

      // Build after fonts load
      if (document.fonts?.ready) {
        document.fonts.ready.then(buildHoriz);
      } else {
        buildHoriz();
      }
    }

    // ── Mission: word illumination on scroll ────────────────────────────────
    const missionEl = missionRef.current;
    if (missionEl) {
      const words = missionEl.querySelectorAll<HTMLSpanElement>(".mission-word");
      gsap.timeline({
        scrollTrigger: {
          trigger: "#mission",
          start: "top top",
          end: `+=${window.innerHeight * 2.5}`,
          pin: true,
          scrub: 0.9,
        },
      }).to(words, {
        opacity: 1,
        color: "#ffffff",
        stagger: 0.12,
        ease: "none",
      });
    }

    // ── Experience cards
    gsap.fromTo(".exp-card",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.18, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: "#experience", start: "top 70%" } }
    );

    // ── Skill cells
    gsap.fromTo(".skill-cell",
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: "#skills", start: "top 72%" } }
    );

    // ── Vision section — inner spans slide up, outer clips
    gsap.fromTo(".vision-word-inner",
      { yPercent: 115 },
      { yPercent: 0, stagger: 0.1, duration: 1.0, ease: "power4.out",
        scrollTrigger: { trigger: "#vision", start: "top 65%" } }
    );

    // ── Contact
    gsap.fromTo(".contact-reveal",
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: "#contact", start: "top 72%" } }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [ready]);

  // ─────────────────────────────────────────────────────────────────────────
  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };
  const syne: React.CSSProperties = { fontFamily: "'Syne',sans-serif" };

  return (
    <>
      {!ready && <Loader onDone={() => setReady(true)} />}

      {/* Cursors */}
      <div ref={cursorRing} className="cursor-ring hidden md:block" />
      <div ref={cursorDot}  className="cursor-dot  hidden md:block" />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="site-nav">
        <a href="#hero" className="nav-logo" style={{ color: "#fff", textDecoration: "none" }}>
          M. Abubakar
        </a>
        <div className="nav-links">
          {["projects", "about", "skills", "contact"].map((s) => (
            <SLink key={s} href={`#${s}`} className="nav-link">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SLink>
          ))}
        </div>
        <SLink href="mailto:abubakaramirwork@gmail.com" className="nav-contact">
          Contact →
        </SLink>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} id="hero" style={{
        position: "relative", minHeight: "100svh",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", background: "#000",
      }}>
        <DotCanvas />
        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 2rem" }}>
          {/* Overline */}
          <p style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "2.5rem" }}>
            Cyber Security Engineer · GIKI · Lahore
          </p>

          {/* Name — each line has overflow:hidden wrapper + inner .hero-name-line for GSAP */}
          <div className="hero-name-block" style={{ marginBottom: "3rem" }}>
            {[
              { text: "MUHAMMAD", style: { color: "#fff" } },
              { text: "ABUBAKAR", style: { color: "transparent", WebkitTextStroke: "2px #fff" } },
            ].map(({ text, style }) => (
              <div key={text} style={{ overflow: "hidden", display: "block" }}>
                <div
                  className="hero-name-line"
                  style={{
                    ...syne, fontWeight: 800,
                    fontSize: "clamp(4rem, 14vw, 16rem)",
                    lineHeight: 0.86, letterSpacing: "-0.03em",
                    display: "block",
                    ...style,
                  }}
                >
                  {text}
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="hero-sub-row" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "2.5rem", flexWrap: "wrap",
          }}>
            {[["3.3 / 4.00", "GPA"], ["2×", "Dean's Honor List"], ["5", "Security Projects"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ ...syne, fontWeight: 700, fontSize: "1.4rem", color: "#fff" }}>{v}</div>
                <div style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint" style={{
          position: "absolute", bottom: "2.5rem", left: "2.5rem",
          display: "flex", alignItems: "center", gap: "0.75rem",
          ...mono, fontSize: "0.62rem", letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
        }}>
          <div style={{ width: 36, height: 1, background: "rgba(255,255,255,0.25)" }} />
          Scroll to explore →
        </div>

        {/* Top right label */}
        <div style={{
          position: "absolute", top: "6rem", right: "2.5rem",
          ...mono, fontSize: "0.62rem", letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.2)", lineHeight: 2, textTransform: "uppercase", textAlign: "right",
        }}>
          <div>©2025</div>
          <div>Portfolio</div>
        </div>
      </section>

      {/* ── HORIZONTAL PROJECT SCROLL ──────────────────────────────────────── */}
      <div id="horiz-wrapper" style={{ overflow: "hidden", background: "#000", position: "relative" }}>
        {/* Section header */}
        <div style={{
          position: "absolute", top: "2rem", left: "clamp(2rem,6vw,6rem)", zIndex: 10,
          ...mono, fontSize: "0.62rem", letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
          display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <span>Projects</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>
            {String(activeProject + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
          </span>
        </div>

        {/* Progress dots */}
        <div style={{
          position: "absolute", bottom: "2.5rem", left: "50%",
          transform: "translateX(-50%)", display: "flex", gap: "0.6rem", zIndex: 10,
        }}>
          {PROJECTS.map((_, i) => (
            <div key={i} style={{
              width: i === activeProject ? 24 : 6, height: 6,
              borderRadius: 3,
              background: i === activeProject ? "#fff" : "rgba(255,255,255,0.18)",
              transition: "width 0.4s ease, background 0.4s ease",
            }} />
          ))}
        </div>

        {/* Track */}
        <div
          id="horiz-track"
          ref={horizRef}
          style={{
            display: "flex", flexDirection: "row",
            willChange: "transform",
          }}
        >
          {PROJECTS.map((p, i) => (
            <div
              key={p.id}
              className="proj-panel"
              id={i === 0 ? "projects" : undefined}
              style={{
                width: "100vw", minWidth: "100vw", height: "100svh",
                flexShrink: 0, position: "relative",
                display: "flex", alignItems: "center",
                padding: "0 clamp(2rem,8vw,9rem)",
                background: `#000`,
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : undefined,
              }}
            >
              {/* Subtle radial bg */}
              <div style={{ position: "absolute", inset: 0, background: p.bg, pointerEvents: "none" }} />

              {/* Large ghost number */}
              <div style={{
                position: "absolute", right: "clamp(2rem,6vw,6rem)", bottom: "1.5rem",
                ...syne, fontWeight: 800,
                fontSize: "clamp(10rem,30vw,28rem)",
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.05)",
                lineHeight: 1, userSelect: "none", pointerEvents: "none",
                letterSpacing: "-0.05em",
              }}>
                {p.id}
              </div>

              {/* Content */}
              <div style={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
                  <span style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                    {p.id}
                  </span>
                  <div style={{ width: 30, height: 1, background: "rgba(255,255,255,0.2)" }} />
                  <span style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                    {p.year}
                  </span>
                </div>

                <h2 style={{
                  ...syne, fontWeight: 800,
                  fontSize: "clamp(2.4rem,6vw,6rem)",
                  letterSpacing: "-0.04em", lineHeight: 0.9,
                  color: "#fff", marginBottom: "2rem",
                  whiteSpace: "pre-line",
                }}>
                  {p.title}
                </h2>

                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: "0.9rem",
                  lineHeight: 1.75, color: "rgba(255,255,255,0.45)",
                  marginBottom: "2.5rem", maxWidth: 520,
                }}>
                  {p.body}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {p.tags.map((t) => (
                    <span key={t} style={{
                      ...mono, fontSize: "0.62rem", letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(255,255,255,0.14)",
                      padding: "0.3rem 0.7rem",
                      color: "rgba(255,255,255,0.4)",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: "2.5rem" }}>
                  <SLink
                    href="https://github.com/abubakar-amir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    View on GitHub →
                  </SLink>
                </div>
              </div>

              {/* Category top-right of panel */}
              <div style={{
                position: "absolute", top: "6rem", right: "clamp(2rem,6vw,6rem)",
                ...mono, fontSize: "0.6rem", letterSpacing: "0.18em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                textAlign: "right", lineHeight: 2,
              }}>
                {p.category.split(" · ").map((c) => <div key={c}>{c}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSION (pinned word illumination) ─────────────────────────────── */}
      <section ref={missionRef} id="mission" style={{
        minHeight: "100svh", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "0 clamp(2rem,8vw,9rem)",
      }}>
        <div id="about">
          <div style={{
            ...mono, fontSize: "0.6rem", letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
            marginBottom: "3rem",
          }}>
            // About
          </div>

          <p style={{
            ...syne, fontWeight: 700,
            fontSize: "clamp(1.8rem, 4.5vw, 5.5rem)",
            letterSpacing: "-0.03em", lineHeight: 1.1,
            maxWidth: "14em",
          }}>
            {MISSION_WORDS.map((w, i) => (
              <span key={i} className="mission-word" style={{
                display: "inline-block",
                marginRight: "0.3em",
                opacity: 0.12,
                color: w.highlight ? "rgba(255,255,255,1)" : "rgba(255,255,255,1)",
                fontStyle: w.highlight ? "italic" : "normal",
                transition: "color 0.3s",
              }}>
                {w.text}
              </span>
            ))}
          </p>

          {/* Bio sub-text */}
          <div style={{
            marginTop: "4rem",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem",
            maxWidth: 860,
          }}>
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: "0.88rem",
              lineHeight: 1.8, color: "rgba(255,255,255,0.4)",
            }}>
              Final-year Cyber Security undergraduate at{" "}
              <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>GIKI</span>{" "}
              specializing in Application Security and DevSecOps. Internship experience at Thingtrax in
              security testing and secure development.
            </p>
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: "0.88rem",
              lineHeight: 1.8, color: "rgba(255,255,255,0.4)",
            }}>
              Hands-on across threat modeling, SAST/SCA pipeline gating, OWASP-based hardening, and ML
              research in wireless security and intrusion detection.{" "}
              <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>2× Dean's Honor List.</span>{" "}
              CGPA 3.3 / 4.00.
            </p>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ─────────────────────────────────────────────────────── */}
      <section id="experience" style={{
        padding: "clamp(5rem,10vw,10rem) clamp(2rem,8vw,9rem)",
        borderTop: "1px solid rgba(255,255,255,0.08)", background: "#000",
      }}>
        <div style={{
          ...mono, fontSize: "0.6rem", letterSpacing: "0.22em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
          marginBottom: "4rem",
        }}>
          // Experience
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "4rem" }}>
          {EXPERIENCE.map((e, i) => (
            <div key={i} className="exp-card" style={{
              borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem",
            }}>
              <div style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", marginBottom: "1.25rem", textTransform: "uppercase" }}>
                {e.period}
              </div>
              <div style={{ ...syne, fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginBottom: "0.35rem", letterSpacing: "-0.01em" }}>
                {e.company}
              </div>
              <div style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: "1.75rem" }}>
                {e.role}
              </div>
              {e.bullets.map((b, j) => (
                <div key={j} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem", fontFamily: "'Inter',sans-serif", fontSize: "0.84rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: "rgba(255,255,255,0.18)", flexShrink: 0 }}>—</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── SKILLS ─────────────────────────────────────────────────────────── */}
      <section id="skills" style={{
        padding: "clamp(5rem,10vw,10rem) clamp(2rem,8vw,9rem)",
        borderTop: "1px solid rgba(255,255,255,0.08)", background: "#000",
      }}>
        <div style={{
          ...mono, fontSize: "0.6rem", letterSpacing: "0.22em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
          marginBottom: "4rem",
        }}>
          // Skills
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          {SKILLS.map((cat) => (
            <div key={cat.label} className="skill-cell" style={{
              padding: "2rem 1.75rem",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              transition: "background .3s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "1.25rem" }}>
                {cat.label}
              </div>
              {cat.items.map((item) => (
                <div key={item} style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", transition: "color .2s" }}>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── VISION ─────────────────────────────────────────────────────────── */}
      <section id="vision" style={{
        minHeight: "70vh", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "6rem clamp(2rem,8vw,9rem)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{ ...syne, fontWeight: 800, fontSize: "clamp(2rem,7.5vw,9rem)", letterSpacing: "-0.05em", lineHeight: 0.88 }}>
          {["Building", "security", "into"].map((w) => (
            <span key={w} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.25em", verticalAlign: "bottom" }}>
              <span className="vision-word-inner" style={{ display: "inline-block", color: "#fff" }}>{w}</span>
            </span>
          ))}
          {" "}
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
            <span className="vision-word-inner" style={{ display: "inline-block", color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,0.5)" }}>every</span>
          </span>
          {" "}
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
            <span className="vision-word-inner" style={{ display: "inline-block", color: "#fff" }}>layer.</span>
          </span>
        </div>
      </section>

      {/* ── CERTIFICATIONS marquee ─────────────────────────────────────────── */}
      <div className="cert-bar">
        <div className="cert-track">
          {["Google Cybersecurity Professional", "AI for Cyber Security — Macquarie", "Linux Essentials — LPI", "Cisco Networking Basics", "Cisco Intro to Cybersecurity",
            "Google Cybersecurity Professional", "AI for Cyber Security — Macquarie", "Linux Essentials — LPI", "Cisco Networking Basics", "Cisco Intro to Cybersecurity"].map((c, i) => (
            <span key={i} className={i % 1 === 0 ? "cert-item" : "cert-sep"}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── CONTACT ────────────────────────────────────────────────────────── */}
      <section id="contact" style={{
        padding: "clamp(6rem,12vw,14rem) clamp(2rem,8vw,9rem) 0",
        borderTop: "1px solid rgba(255,255,255,0.08)", background: "#000",
      }}>
        <div className="contact-reveal" style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "3rem" }}>
          // Contact
        </div>

        <div className="contact-reveal" style={{
          ...syne, fontWeight: 800,
          fontSize: "clamp(2rem,6vw,7rem)",
          letterSpacing: "-0.05em", lineHeight: 0.9,
          color: "#fff", marginBottom: "4rem",
        }}>
          Let's build<br />
          something<br />
          <span style={{ color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,0.4)" }}>
            remarkable.
          </span>
        </div>

        <div className="contact-reveal" style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "2rem", paddingBottom: "4rem" }}>
          <a href="mailto:abubakaramirwork@gmail.com" className="contact-email" data-testid="link-email">
            abubakaramirwork@gmail.com
          </a>
          <div style={{ display: "flex", gap: "2rem" }}>
            <SLink href="https://github.com/abubakar-amir" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub →</SLink>
            <SLink href="https://linkedin.com/in/abubakar-amir" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn →</SLink>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-left">
          <div>Muhammad Abubakar</div>
          <div>GIKI · Lahore, Pakistan</div>
          <div style={{ marginTop: "0.5rem" }}>BSc Cyber Security · 2023 – 2027</div>
        </div>
        <div className="footer-logo">M.A</div>
        <div className="footer-right">
          <SLink href="https://github.com/abubakar-amir" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</SLink>
          <SLink href="https://linkedin.com/in/abubakar-amir" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn</SLink>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.18)" }}>©2025</span>
        </div>
      </footer>
    </>
  );
}
