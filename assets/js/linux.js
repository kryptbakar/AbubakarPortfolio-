/* ============================================================================
   Abubakar Linux — OS-themed alternate portfolio view.
   Vanilla JS. Lazily builds a full desktop environment on first toggle:
   animated wallpaper, boot splash, draggable/resizable windows, a dock,
   and an interactive terminal. Degrades gracefully; leaves the main site alone.
   ========================================================================= */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DATA = {
    user: "abubakar",
    host: "abubakar-linux",
    distro: "Abubakar Linux 26.04 LTS (Krypt)",
    email: "abubakaramirwork@gmail.com",
    github: "https://github.com/kryptbakar",
    linkedin: "https://www.linkedin.com/in/muhammad-abubakar-28b4a2312/",
    phone: "+92 339 4959692",
    projects: [
      { no: "01", t: "VYREX", d: "Air-gapped SOC with exploit-aware risk scoring and a governed agentic AI analyst — nothing leaves the building.", tags: ["FastAPI","Go","XGBoost","SHAP","Docker"], url: "https://github.com/kryptbakar/FYP" },
      { no: "02", t: "DQN Noise Allocation", d: "Deep Q-Network splitting power between signal and artificial jamming noise on a MISO wiretap channel. +0.299 bits/s/Hz secrecy.", tags: ["TensorFlow","DQN","MISO","NumPy"], url: "https://github.com/kryptbakar/DQN-Enhanced-Adaptive-Artificial-Noise-Power-Allocation" },
      { no: "03", t: "Phantom Identity", d: "Manifest V3 extension defeating passive fingerprinting — spoofs Canvas, WebGL, Navigator per-session with zero telemetry.", tags: ["JavaScript","MV3","Canvas","WebGL"], url: "https://github.com/kryptbakar/Phantom-Identity" },
      { no: "04", t: "DevSecOps Pipeline", d: "Fail-fast CI/CD security gates — pytest, Bandit (SAST), pip-audit (SCA) — packaged as a reusable workflow template.", tags: ["GitHub Actions","Bandit","pip-audit","OWASP"], url: "https://github.com/kryptbakar/Secure-DevSecOps-CI-CD-Pipeline-Implementation" },
      { no: "05", t: "Bakri Pay", d: "Hardened full-stack banking platform — session auth, fraud detection, OWASP Top 10 controls, Burp-validated.", tags: ["Flask","OWASP","Burp Suite","PostgreSQL"], url: "https://github.com/kryptbakar/Bakri-Pay-Secure-Banking-Application-" },
      { no: "06", t: "AI Intrusion Detection", d: "Hybrid CatBoost + Local Outlier Factor detector trained on 1.6M samples in ~7.5 min, tuned for recall.", tags: ["CatBoost","LOF","scikit-learn","Streamlit"], url: "https://github.com/kryptbakar/AI-Integrated-Intrusion-Detection-System" },
    ],
    skills: {
      Security: ["Application Security","Penetration Testing","Threat Modeling","OWASP Top 10","SAST / SCA","Zero Trust","IDS / IPS","Incident Response"],
      Tooling: ["Burp Suite","Nmap","Metasploit","Wireshark","Bandit","GitHub Actions","Prometheus","Kali Linux"],
      Engineering: ["Python","C++","JavaScript","SQL / Bash","Flask","React / Next.js","REST APIs"],
      "ML / Data": ["TensorFlow","scikit-learn","CatBoost","Pandas","PostgreSQL"],
      Systems: ["Linux — Kali / Ubuntu / RHEL","Windows Server","Docker","Cisco Packet Tracer"],
    },
  };

  /* ── tiny inline-SVG icon set ─────────────────────────────────── */
  const I = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2 3 6.5v6c0 5 3.8 8.3 9 9.5 5.2-1.2 9-4.5 9-9.5v-6L12 2Z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="#c9f24e" stroke-width="1.6"><rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m6.5 9 3 3-3 3M12.5 15h5"/></svg>',
    files: '<svg viewBox="0 0 24 24" fill="none" stroke="#7cf2c8" stroke-width="1.6"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.4h5.8A2.5 2.5 0 0 1 19 9.9V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="#c9f24e" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="#c9f24e" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    skills: '<svg viewBox="0 0 24 24" fill="none" stroke="#7cf2c8" stroke-width="1.6"><path d="M12 2v20M2 12h20" opacity=".4"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2" fill="#c9f24e" stroke="none"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="#c9f24e" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>',
    browser: '<svg viewBox="0 0 24 24" fill="none" stroke="#7cf2c8" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2.5h8L19 7v13.5A1.5 1.5 0 0 1 17.5 22h-11A1.5 1.5 0 0 1 5 20.5v-16A1.5 1.5 0 0 1 6.5 3"/><path d="M14 2.5V7h5"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.4h5.8A2.5 2.5 0 0 1 19 9.9V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.1 10.1 0 0 0 22 12.3C22 6.6 17.5 2 12 2Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9V9Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4.5h3.5l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5V20a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 2.5 6.1 1.5 1.5 0 0 1 4 4.5Z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2.5h8L19 7v13.5A1.5 1.5 0 0 1 17.5 22h-11A1.5 1.5 0 0 1 5 20.5v-16A1.5 1.5 0 0 1 6.5 3"/><path d="M8.5 13h7M8.5 16.5h7M8.5 9.5h3"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8 15.5a5 5 0 0 1 8 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
    battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="17" height="8" rx="2"/><path d="M22 11v2"/><rect x="4" y="10" width="11" height="4" rx="1" fill="#c9f24e" stroke="none"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9.5h3L11 6v12l-4-3.5H4v-5Z"/><path d="M15 9a4 4 0 0 1 0 6"/></svg>',
    power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v9M6.5 7a8 8 0 1 0 11 0"/></svg>',
  };

  let root = null, zTop = 30, built = false;
  const win = {}; // id -> element

  /* ── boot ─────────────────────────────────────────────────────── */
  function build() {
    if (built) return;
    built = true;
    root = document.createElement("div");
    root.id = "abubakarOS";
    root.setAttribute("role", "application");
    root.setAttribute("aria-label", "Abubakar Linux desktop");
    root.innerHTML = shell();
    document.body.appendChild(root);
    wire();
  }

  function shell() {
    return `
      <div class="os-wallpaper"></div>
      <div class="os-grain"></div>

      <div class="os-boot" id="osBoot">
        <div class="os-boot__inner">
          <div class="os-boot__logo">${I.logo.replace('<svg','<svg class="os-boot__mark"')}<span>Abubakar <b>Linux</b></span></div>
          <div class="os-boot__tag">Krypt · secure by design</div>
          <div class="os-boot__log" id="osBootLog"></div>
          <div class="os-boot__bar"><i id="osBootBar"></i></div>
          <div class="os-boot__hint" id="osBootHint">booting kernel…</div>
        </div>
      </div>

      <div class="os-desktop" id="osDesktop">
        <div class="os-topbar">
          <div class="os-topbar__l">
            <span class="os-topbar__brand">${I.logo} Abubakar&nbsp;Linux</span>
            <span class="os-topbar__menu" data-open="about">About</span>
            <span class="os-topbar__menu" data-open="projects">Projects</span>
            <span class="os-topbar__menu" data-open="terminal">Terminal</span>
            <span class="os-topbar__menu" data-open="contact">Contact</span>
          </div>
          <div class="os-topbar__r">
            <span class="os-tray">${I.wifi}${I.vol}${I.battery}</span>
            <span id="osClock">--:--</span>
            <span class="os-topbar__exit" id="osExit">${I.power} Exit to site</span>
          </div>
        </div>

        <div class="os-icons" id="osIcons"></div>
        <div class="os-dock" id="osDock"></div>

        <div class="os-toast" id="osToast">
          <h5>Welcome to <b>Abubakar Linux</b></h5>
          <p>A portfolio that boots like an OS. Double-click a desktop icon or tap the dock. Try the <b>Terminal</b> — type <b>help</b>.</p>
        </div>
      </div>`;
  }

  const APPS = [
    { id: "about",    label: "About Me",  icon: I.user,    file: "README.txt" },
    { id: "projects", label: "Projects",  icon: I.grid,    file: "projects/" },
    { id: "files",    label: "Files",     icon: I.files,   file: "home/" },
    { id: "terminal", label: "Terminal",  icon: I.terminal,file: "bash" },
    { id: "skills",   label: "Skills",    icon: I.skills,  file: "skills.md" },
    { id: "contact",  label: "Contact",   icon: I.mail,    file: "contact.vcf" },
    { id: "browser",  label: "Browser",   icon: I.browser, file: "github" },
  ];

  function wire() {
    // desktop icons
    const iconWrap = root.querySelector("#osIcons");
    APPS.forEach((a) => {
      const el = document.createElement("div");
      el.className = "os-dicon"; el.tabIndex = 0;
      el.innerHTML = `<div class="os-dicon__img">${a.icon}</div><div class="os-dicon__label">${a.file}</div>`;
      let last = 0;
      el.addEventListener("click", () => {
        root.querySelectorAll(".os-dicon").forEach((d) => d.classList.remove("is-sel"));
        el.classList.add("is-sel");
        const now = Date.now();
        if (now - last < 400) openApp(a.id);
        last = now;
      });
      el.addEventListener("dblclick", () => openApp(a.id));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") openApp(a.id); });
      iconWrap.appendChild(el);
    });

    // dock
    const dock = root.querySelector("#osDock");
    APPS.forEach((a, i) => {
      if (i === 4) dock.insertAdjacentHTML("beforeend", '<span class="os-dock__sep"></span>');
      const el = document.createElement("div");
      el.className = "os-dockitem"; el.dataset.app = a.id; el.tabIndex = 0;
      el.innerHTML = `${a.icon}<span class="os-dockitem__tip">${a.label}</span><span class="os-dockitem__run"></span>`;
      el.addEventListener("click", () => openApp(a.id));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") openApp(a.id); });
      dock.appendChild(el);
    });

    // top menus
    root.querySelectorAll("[data-open]").forEach((m) =>
      m.addEventListener("click", () => openApp(m.dataset.open)));

    root.querySelector("#osExit").addEventListener("click", exit);

    // clock
    const clock = root.querySelector("#osClock");
    const tick = () => {
      const n = new Date();
      const pkt = new Date(n.getTime() + (n.getTimezoneOffset() + 300) * 60000);
      const p = (x) => String(x).padStart(2, "0");
      clock.textContent = `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][pkt.getDay()]} ${p(pkt.getHours())}:${p(pkt.getMinutes())}`;
    };
    tick(); setInterval(tick, 1000 * 15);

    // esc closes top window
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root.classList.contains("is-on")) {
        const open = Object.values(win).filter((w) => w && w.classList.contains("is-open") && !w.classList.contains("is-min"));
        if (open.length) { open.sort((a, b) => b.style.zIndex - a.style.zIndex); closeWin(open[0].dataset.app); }
      }
    });
  }

  /* ── boot sequence ────────────────────────────────────────────── */
  function runBoot() {
    const boot = root.querySelector("#osBoot");
    const log = root.querySelector("#osBootLog");
    const bar = root.querySelector("#osBootBar");
    const hint = root.querySelector("#osBootHint");
    const desktop = root.querySelector("#osDesktop");

    if (reduced) {
      boot.classList.add("is-gone"); desktop.classList.add("is-ready");
      setTimeout(showToast, 400); return;
    }

    const lines = [
      "[<span class='ok'>  OK  </span>] Reached target <b>Cryptographic Core</b>",
      "[<span class='ok'>  OK  </span>] Started <b>Zero-Trust Network Mesh</b>",
      "[<span class='ok'>  OK  </span>] Mounted <b>/dev/secure</b> (encrypted)",
      "[<span class='ok'>  OK  </span>] Started <b>Vulnerability Intel Feed</b>",
      "[<span class='ok'>  OK  </span>] Loaded <b>Agentic Analyst</b> daemon",
      "[<span class='ok'>  OK  </span>] Reached target <b>Graphical Desktop</b>",
      "Welcome to <b>Abubakar Linux 26.04 LTS</b> — access granted.",
    ];
    let i = 0, pct = 0;
    hint.textContent = "initializing secure boot…";
    const step = () => {
      if (i < lines.length) {
        const d = document.createElement("div");
        d.innerHTML = lines[i]; log.appendChild(d);
        log.scrollTop = log.scrollHeight; i++;
      }
      pct = Math.min(100, pct + 14 + Math.random() * 8);
      bar.style.width = pct + "%";
      if (pct < 100) setTimeout(step, 210 + Math.random() * 160);
      else {
        hint.textContent = "starting session…";
        setTimeout(() => {
          boot.classList.add("is-gone");
          desktop.classList.add("is-ready");
          setTimeout(showToast, 500);
        }, 500);
      }
    };
    setTimeout(step, 350);
  }

  function showToast() {
    const t = root.querySelector("#osToast");
    if (!t) return;
    t.classList.add("is-on");
    setTimeout(() => t.classList.remove("is-on"), 7000);
  }

  /* ── window management ────────────────────────────────────────── */
  function focusWin(w) {
    Object.values(win).forEach((x) => x && x.classList.remove("is-active"));
    w.classList.add("is-active");
    w.style.zIndex = ++zTop;
  }

  function openApp(id) {
    const app = APPS.find((a) => a.id === id);
    if (!app) return;
    let w = win[id];
    if (w) {
      w.classList.remove("is-min");
      requestAnimationFrame(() => w.classList.add("is-open"));
      focusWin(w);
      markDock(id, true);
      return;
    }
    w = document.createElement("div");
    w.className = "os-window"; w.dataset.app = id;
    const geo = defaultGeo(id);
    Object.assign(w.style, geo);
    w.innerHTML = `
      <div class="os-titlebar">
        <div class="os-traffic">
          <button class="c" data-act="close" aria-label="Close"></button>
          <button class="m" data-act="min" aria-label="Minimize"></button>
          <button class="x" data-act="max" aria-label="Maximize"></button>
        </div>
        <span class="os-title">${app.icon} ${app.label}</span>
      </div>
      <div class="os-win-body">${content(id)}</div>
      <div class="os-resize"></div>`;
    root.querySelector("#osDesktop").appendChild(w);
    win[id] = w;

    // controls
    w.querySelector('[data-act="close"]').addEventListener("click", () => closeWin(id));
    w.querySelector('[data-act="min"]').addEventListener("click", () => { w.classList.remove("is-open"); w.classList.add("is-min"); markDock(id, true); });
    w.querySelector('[data-act="max"]').addEventListener("click", () => toggleMax(w));
    w.addEventListener("mousedown", () => focusWin(w), true);
    w.addEventListener("touchstart", () => focusWin(w), { capture: true, passive: true });
    makeDraggable(w);
    makeResizable(w);
    afterOpen(id, w);

    focusWin(w);
    markDock(id, true);
    requestAnimationFrame(() => w.classList.add("is-open"));
  }

  function closeWin(id) {
    const w = win[id]; if (!w) return;
    w.classList.remove("is-open");
    markDock(id, false);
    setTimeout(() => { w.remove(); delete win[id]; }, 280);
  }

  function markDock(id, on) {
    const d = root.querySelector(`.os-dockitem[data-app="${id}"]`);
    if (d) d.classList.toggle("is-running", on);
  }

  function toggleMax(w) {
    if (w.classList.contains("is-max")) {
      w.classList.remove("is-max");
      Object.assign(w.style, w._restore || {});
    } else {
      w._restore = { left: w.style.left, top: w.style.top, width: w.style.width, height: w.style.height };
      w.classList.add("is-max");
      Object.assign(w.style, { left: "0px", top: "34px", width: "100%", height: "calc(100% - 34px)" });
    }
  }

  function defaultGeo(id) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const mobile = vw < 640;
    const sizes = {
      about:    [640, 440], projects: [720, 520], files: [640, 420],
      terminal: [620, 420], skills:   [640, 460], contact: [520, 380], browser: [720, 500],
    };
    let [w, h] = sizes[id] || [560, 400];
    w = Math.min(w, vw - 40); h = Math.min(h, vh - 90);
    const n = Object.keys(win).length;
    let left = Math.max(20, (vw - w) / 2 + (n * 26) - 40);
    let top = Math.max(52, (vh - h) / 2 - 20 + (n * 22));
    if (mobile) { w = vw - 20; h = vh - 120; left = 10; top = 44; }
    return { width: w + "px", height: h + "px", left: left + "px", top: top + "px" };
  }

  /* ── drag / resize ────────────────────────────────────────────── */
  function makeDraggable(w) {
    const bar = w.querySelector(".os-titlebar");
    let sx, sy, ox, oy, drag = false;
    const down = (e) => {
      if (e.target.closest(".os-traffic")) return;
      if (w.classList.contains("is-max")) return;
      drag = true;
      const p = pt(e); sx = p.x; sy = p.y;
      ox = parseFloat(w.style.left); oy = parseFloat(w.style.top);
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false }); document.addEventListener("touchend", up);
      e.preventDefault();
    };
    const move = (e) => {
      if (!drag) return;
      const p = pt(e);
      let nx = ox + (p.x - sx), ny = oy + (p.y - sy);
      ny = Math.max(34, ny);
      nx = Math.max(-w.offsetWidth + 80, Math.min(window.innerWidth - 80, nx));
      w.style.left = nx + "px"; w.style.top = ny + "px";
      if (e.cancelable) e.preventDefault();
    };
    const up = () => {
      drag = false;
      document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up);
    };
    bar.addEventListener("mousedown", down);
    bar.addEventListener("touchstart", down, { passive: false });
    bar.addEventListener("dblclick", (e) => { if (!e.target.closest(".os-traffic")) toggleMax(w); });
  }

  function makeResizable(w) {
    const h = w.querySelector(".os-resize");
    let sx, sy, ow, oh, rz = false;
    const down = (e) => {
      rz = true; const p = pt(e); sx = p.x; sy = p.y;
      ow = w.offsetWidth; oh = w.offsetHeight;
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      document.addEventListener("touchmove", move, { passive: false }); document.addEventListener("touchend", up);
      e.preventDefault(); e.stopPropagation();
    };
    const move = (e) => {
      if (!rz) return; const p = pt(e);
      w.style.width = Math.max(300, ow + (p.x - sx)) + "px";
      w.style.height = Math.max(200, oh + (p.y - sy)) + "px";
      if (e.cancelable) e.preventDefault();
    };
    const up = () => { rz = false;
      document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up); };
    h.addEventListener("mousedown", down);
    h.addEventListener("touchstart", down, { passive: false });
  }
  const pt = (e) => e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

  /* ── window content ───────────────────────────────────────────── */
  function esc(s){ return String(s).replace(/[&<>"]/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  function content(id) {
    switch (id) {
      case "about": return aboutHTML();
      case "projects": return projectsHTML();
      case "files": return filesHTML();
      case "terminal": return `<div class="os-term" id="osTermBody"></div>`;
      case "skills": return skillsHTML();
      case "contact": return contactHTML();
      case "browser": return browserHTML();
      default: return "";
    }
  }

  function aboutHTML() {
    return `<div class="os-about">
      <div>
        <div class="os-about__card"><img src="assets/img/portrait.webp" alt="Muhammad Abubakar" loading="lazy"/></div>
        <ul class="os-about__stats">
          <li><span>CGPA</span><b>3.3</b></li>
          <li><span>Honors</span><b>2×</b></li>
          <li><span>Builds</span><b>6+</b></li>
          <li><span>Interns</span><b>2</b></li>
        </ul>
      </div>
      <div>
        <div class="os-sub">// whoami</div>
        <h2 class="os-h">Muhammad <em>Abubakar</em></h2>
        <div class="os-sub" style="margin-top:.4rem">Cyber Security Engineer · GIKI · Lahore, PK</div>
        <p class="os-p">Final-year <b>BS Cyber Security</b> at GIKI, focused on application security, DevSecOps, and ML-driven defense. I engineer security into every layer — from the physical wire to the web: modeling adversaries, gating pipelines, and turning raw threat into hardened systems.</p>
        <p class="os-p">2× security internships @ <b>Thingtrax</b> · 2× Dean's Honor List · open to <b>2027 roles</b>.</p>
        <div style="margin-top:.4rem">
          <span class="os-chip">AppSec</span><span class="os-chip">DevSecOps</span><span class="os-chip">Threat Modeling</span><span class="os-chip">ML Security</span><span class="os-chip">Zero Trust</span>
        </div>
      </div>
    </div>`;
  }

  function projectsHTML() {
    const cards = DATA.projects.map((p) => `
      <a class="os-proj" href="${p.url}" target="_blank" rel="noopener">
        <span class="os-proj__arrow">↗</span>
        <div class="os-proj__no">${p.no}</div>
        <div class="os-proj__t">${esc(p.t)}</div>
        <div class="os-proj__d">${esc(p.d)}</div>
        <div class="os-proj__tags">${p.tags.map((t)=>`<span>${esc(t)}</span>`).join("")}</div>
      </a>`).join("");
    return `<div class="os-projects">${cards}</div>`;
  }

  function filesHTML() {
    const rows = DATA.projects.map((p) => `
      <a class="os-filerow" href="${p.url}" target="_blank" rel="noopener">
        ${I.folder}<span>${esc(p.t.replace(/\s+/g,"-").toLowerCase())}</span>
        <span class="os-filerow__meta">${p.tags[0]}</span>
        <span class="os-filerow__meta">dir</span>
      </a>`).join("");
    const files = [
      ["README.txt","about","4 KB"],["skills.md","skills","2 KB"],["contact.vcf","contact","1 KB"],["resume.pdf","cv","260 KB"],
    ].map(([f,act,sz]) => `
      <div class="os-filerow" data-file="${act}">${I.file.replace('currentColor','#c9f24e')}<span>${f}</span>
        <span class="os-filerow__meta">file</span><span class="os-filerow__meta">${sz}</span></div>`).join("");
    return `<div class="os-files">
      <div class="os-files__side">
        <h4>Favorites</h4>
        <a class="is-on">${I.user} Home</a>
        <a data-open="projects">${I.grid} Projects</a>
        <a data-open="terminal">${I.terminal} Terminal</a>
        <h4>Locations</h4>
        <a data-open="browser">${I.browser} GitHub</a>
      </div>
      <div class="os-files__main">
        ${files}${rows}
      </div>
    </div>`;
  }

  function skillsHTML() {
    const blocks = Object.entries(DATA.skills).map(([k, v]) => `
      <div style="margin-bottom:1.2rem">
        <div class="os-sub" style="margin-bottom:.6rem">${esc(k)}</div>
        <div>${v.map((s)=>`<span class="os-chip">${esc(s)}</span>`).join("")}</div>
      </div>`).join("");
    return `<div class="os-pad">
      <div class="os-sub">// capabilities</div>
      <h2 class="os-h">Toolkit &amp; <em>Skills</em></h2>
      <div style="margin-top:1.2rem">${blocks}</div>
    </div>`;
  }

  function contactHTML() {
    return `<div class="os-contact">
      <div class="os-sub">// let's talk</div>
      <p class="os-p" style="margin-bottom:.2rem">Open to 2027 roles — let's build something secure.</p>
      <a class="os-contact__mail" data-mail>${DATA.email}</a>
      <div class="os-contact__socials">
        <a href="${DATA.github}" target="_blank" rel="noopener">${I.github} GitHub</a>
        <a href="${DATA.linkedin}" target="_blank" rel="noopener">${I.linkedin} LinkedIn</a>
        <a href="tel:${DATA.phone.replace(/\s/g,"")}">${I.phone} ${DATA.phone}</a>
        <a href="assets/Muhammad-Abubakar-CV.pdf" download>${I.doc} Résumé</a>
      </div>
    </div>`;
  }

  function browserHTML() {
    const cards = DATA.projects.map((p)=>`
      <a class="os-proj" href="${p.url}" target="_blank" rel="noopener" style="display:block;text-decoration:none">
        <div class="os-proj__no">github.com/kryptbakar</div>
        <div class="os-proj__t">${esc(p.t)}</div>
        <div class="os-proj__d">${esc(p.d)}</div>
      </a>`).join("");
    return `<div class="os-browser">
      <div class="os-browser__bar">
        <div class="os-traffic"><button class="c"></button><button class="m"></button><button class="x"></button></div>
        <div class="os-browser__url">${I.logo.replace('<svg','<svg style="width:12px;height:12px"')} github.com/kryptbakar</div>
      </div>
      <div class="os-browser__view">
        <div class="os-pad">
          <div class="os-sub">// public repositories</div>
          <h2 class="os-h">kryptbakar <em>/ work</em></h2>
          <p class="os-p">Everything else lives on GitHub. Opens in a new tab.</p>
          <div class="os-projects" style="padding:0">${cards}</div>
        </div>
      </div>
    </div>`;
  }

  /* ── per-window post-open behavior ────────────────────────────── */
  function afterOpen(id, w) {
    // clickable file rows / side links inside Files
    w.querySelectorAll("[data-open]").forEach((el)=>el.addEventListener("click",(e)=>{ e.preventDefault(); openApp(el.dataset.open); }));
    w.querySelectorAll("[data-file]").forEach((el)=>el.addEventListener("click",()=>{
      const map = { about:"about", skills:"skills", contact:"contact", cv:null };
      if (el.dataset.file === "cv") { window.open("assets/Muhammad-Abubakar-CV.pdf","_blank"); return; }
      if (map[el.dataset.file]) openApp(map[el.dataset.file]);
    }));
    const mail = w.querySelector("[data-mail]");
    if (mail) mail.addEventListener("click", () => {
      navigator.clipboard && navigator.clipboard.writeText(DATA.email).catch(()=>{});
      window.location.href = "mailto:" + DATA.email;
    });
    if (id === "terminal") initTerminal(w.querySelector("#osTermBody"));
  }

  /* ── interactive terminal ─────────────────────────────────────── */
  function initTerminal(body) {
    const hist = [];
    let hi = 0;
    const prompt = `<span class="os-term__prompt">${DATA.user}@${DATA.host}</span><span class="dim">:</span><span class="p2" style="color:var(--os-accent-2)">~</span><span class="dim">$</span>`;

    const print = (html, cls="") => {
      const d = document.createElement("div");
      d.className = "os-term__line " + cls; d.innerHTML = html; body.appendChild(d);
    };
    const banner = () => {
      print(`<span class="c">Abubakar Linux 26.04 LTS</span> — type <span class="g">help</span> for commands, <span class="g">neofetch</span> for system info.`);
      print(`&nbsp;`);
    };

    const commands = {
      help: () => `Available commands:
  <span class="g">help</span>        this message
  <span class="g">about</span>       who is Abubakar
  <span class="g">whoami</span>      short bio
  <span class="g">projects</span>    list selected work
  <span class="g">skills</span>      capabilities
  <span class="g">experience</span>  work history
  <span class="g">contact</span>     how to reach me
  <span class="g">neofetch</span>    system info
  <span class="g">social</span>      links
  <span class="g">open</span> &lt;app&gt;  launch about|projects|skills|contact|files|browser
  <span class="g">sudo</span>        try it
  <span class="g">clear</span>       clear the screen
  <span class="g">exit</span>        back to the classic site`,
      about: () => `<b class="c">Muhammad Abubakar</b> — Cyber Security Engineer @ GIKI, Lahore PK.
Final-year BS Cyber Security. AppSec · DevSecOps · ML-driven defense.
2× internships @ Thingtrax · 2× Dean's Honor List · CGPA 3.3/4.00.
Open to 2027 roles.`,
      whoami: () => `${DATA.user} — building security into every layer, one commit at a time.`,
      projects: () => DATA.projects.map((p)=>`  <span class="w">${p.no}</span>  <span class="c">${p.t.padEnd(22)}</span> <span class="dim">${p.tags.slice(0,3).join(", ")}</span>`).join("\n") + `\n\ntype <span class="g">open projects</span> for the visual grid.`,
      skills: () => Object.entries(DATA.skills).map(([k,v])=>`<span class="w">${k}:</span> ${v.join(", ")}`).join("\n"),
      experience: () => `<span class="c">Jun–Aug 2025</span>  Software QA Intern (Security) — Thingtrax
<span class="c">Jun–Aug 2024</span>  Secure Software Developer Intern — Thingtrax
<span class="c">2025–2026</span>    Applied Security Research — GIKI (RL wiretap secrecy)`,
      contact: () => `email:    <span class="c">${DATA.email}</span>
github:   <span class="c">${DATA.github}</span>
linkedin: <span class="c">${DATA.linkedin}</span>
phone:    <span class="c">${DATA.phone}</span>`,
      social: () => `github    ${DATA.github}\nlinkedin  ${DATA.linkedin}`,
      neofetch: () => neofetch(),
      sudo: () => `<span class="w">[sudo]</span> password for ${DATA.user}: <span class="dim">****</span>\n<span class="c">Nice try.</span> This portfolio runs on trust, not root. 🙂`,
      ls: () => `<span class="c">README.txt</span>  <span class="c">skills.md</span>  <span class="c">contact.vcf</span>  <span class="m">projects/</span>  <span class="m">.secrets/</span>`,
      "cat readme.txt": () => commands.about(),
      "cd .secrets": () => `<span class="w">permission denied</span> — some things stay air-gapped.`,
      date: () => new Date().toString(),
      echo: (a) => a.join(" "),
    };

    const run = (raw) => {
      const line = raw.trim();
      print(`${prompt} ${esc(raw)}`);
      if (!line) return;
      hist.push(line); hi = hist.length;
      const lc = line.toLowerCase();
      const parts = line.split(/\s+/);
      const cmd = parts[0].toLowerCase();

      if (lc === "clear" || lc === "cls") { body.innerHTML = ""; drawInput(); return; }
      if (lc === "exit" || lc === "logout") { print(`logging out…`); setTimeout(exit, 500); return; }
      if (cmd === "open") {
        const t = (parts[1]||"").toLowerCase();
        if (APPS.find((a)=>a.id===t)) { print(`opening <span class="g">${t}</span>…`); openApp(t); }
        else print(`<span class="w">open:</span> unknown app '${esc(parts[1]||"")}'. try about|projects|skills|contact|files|browser`);
        return;
      }
      if (cmd === "echo") { print(esc(commands.echo(parts.slice(1)))); return; }
      if (commands[lc]) { print(commands[lc]()); return; }
      if (commands[cmd]) { print(commands[cmd]()); return; }
      print(`<span class="w">command not found:</span> ${esc(cmd)} — type <span class="g">help</span>`);
    };

    let inputRow;
    const drawInput = () => {
      inputRow = document.createElement("div");
      inputRow.className = "os-term__in";
      inputRow.innerHTML = `${prompt}&nbsp;<input class="os-term__cmd" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="terminal input"/>`;
      body.appendChild(inputRow);
      const input = inputRow.querySelector("input");
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const v = input.value; inputRow.remove();
          run(v); drawInput();
          body.scrollTop = body.scrollHeight;
        } else if (e.key === "ArrowUp") {
          if (hi > 0) { hi--; input.value = hist[hi] || ""; e.preventDefault(); }
        } else if (e.key === "ArrowDown") {
          if (hi < hist.length) { hi++; input.value = hist[hi] || ""; }
        } else if (e.key === "Tab") {
          e.preventDefault();
          const m = Object.keys(commands).concat(["clear","exit","open"]).find((c)=>c.startsWith(input.value.toLowerCase()));
          if (m) input.value = m;
        }
      });
      input.focus();
    };

    body.addEventListener("click", () => { const i = inputRow && inputRow.querySelector("input"); if (i) i.focus(); });
    banner(); drawInput();
  }

  function neofetch() {
    const art =
`<span class="g">        .--.
       |o_o |
       |:_/ |
      //   \\ \\
     (|     | )
    /'\\_   _/\`\\
    \\___)=(___/</span>`;
    const info =
`<b>${DATA.user}</b>@<b>${DATA.host}</b>
-----------------
<b>OS</b>:      Abubakar Linux 26.04 LTS x86_64
<b>Kernel</b>:  6.6-krypt-hardened
<b>Uptime</b>:  final year, still shipping
<b>Shell</b>:   bash 5.2 · zsh-secure
<b>DE</b>:      KryptDE (acid theme)
<b>Focus</b>:   AppSec · DevSecOps · ML Security
<b>CPU</b>:     Threat Modeler @ 3.3 GPA
<b>Memory</b>:  6+ security builds cached
<b>Host</b>:    GIKI · Lahore, PK`;
    return `<div class="os-neofetch"><pre>${art}</pre><div class="os-neofetch__info">${info}</div></div>`;
  }

  /* ── enter / exit ─────────────────────────────────────────────── */
  let firstBoot = true;
  function enter() {
    build();
    document.documentElement.classList.add("os-active");
    requestAnimationFrame(() => root.classList.add("is-on"));
    if (firstBoot) { firstBoot = false; setTimeout(runBoot, 100); }
    try { history.replaceState(null, "", "#os"); } catch (_) {}
    const btn = document.getElementById("osToggle");
    if (btn) btn.setAttribute("aria-pressed", "true");
  }
  function exit() {
    if (!root) return;
    root.classList.remove("is-on");
    document.documentElement.classList.remove("os-active");
    try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (_) {}
    const btn = document.getElementById("osToggle");
    if (btn) btn.setAttribute("aria-pressed", "false");
  }

  /* ── toggle button wiring ─────────────────────────────────────── */
  function boot() {
    const btn = document.getElementById("osToggle");
    if (btn) btn.addEventListener("click", () => {
      if (root && root.classList.contains("is-on")) exit(); else enter();
    });
    // deep-link: /#os boots straight into the OS
    if (location.hash === "#os") setTimeout(enter, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
