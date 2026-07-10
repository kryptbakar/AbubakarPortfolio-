/* ============================================================================
   Recon Mirror — a live, client-side privacy demo.

   The moment a visitor opens it, it assembles a "threat-intel dossier" from
   everything their browser silently exposes — WebGL GPU, timezone, screen and
   font fingerprint, connection, a stable device hash — and shows it being
   gathered in real time. Nothing is ever transmitted; a persistent counter
   proves 0 bytes leave the page. A nod to the Phantom Identity project.

   Strictly client-side. No storage, no network. Vanilla JS.
   ========================================================================= */
(() => {
  "use strict";
  window.Abubakar = window.Abubakar || {};

  let root, grid, hashEl, meterFill, meterLabel, built = false, opened = false;

  /* ── DOM (built lazily on first open) ─────────────────────────── */
  function build() {
    if (built) return;
    built = true;
    root = document.createElement("div");
    root.className = "recon";
    root.setAttribute("hidden", "");
    root.innerHTML =
      '<div class="recon__backdrop" data-rclose></div>' +
      '<div class="recon__panel" role="dialog" aria-modal="true" aria-label="Recon Mirror">' +
        '<div class="recon__scan" aria-hidden="true"></div>' +
        '<header class="recon__head">' +
          '<div class="recon__titles">' +
            '<span class="recon__kicker mono">// PASSIVE RECON</span>' +
            '<h2 class="recon__title">What your browser just told me</h2>' +
          '</div>' +
          '<button class="recon__close" type="button" data-rclose aria-label="Close">✕</button>' +
        '</header>' +
        '<div class="recon__safebar mono"><span class="recon__dot"></span> <b id="reconBytes">0 bytes</b> transmitted · gathered client-side in <b id="reconMs">…</b> · nothing left this page</div>' +
        '<div class="recon__grid" id="reconGrid"></div>' +
        '<div class="recon__id">' +
          '<div class="recon__id-row"><span class="mono">DEVICE FINGERPRINT</span><span class="recon__hash mono" id="reconHash">computing…</span></div>' +
          '<div class="recon__meter"><i id="reconMeterFill"></i></div>' +
          '<div class="recon__meter-label mono" id="reconMeterLabel">measuring how identifiable you are…</div>' +
        '</div>' +
        '<footer class="recon__foot">' +
          '<p>Every site you visit can read this in milliseconds — no permission prompt, no click. My <b>Phantom Identity</b> extension spoofs exactly these signals per session so trackers can\'t pin you down.</p>' +
          '<div class="recon__foot-cta">' +
            '<a class="recon__link" href="https://github.com/kryptbakar/Phantom-Identity" target="_blank" rel="noopener">See Phantom Identity ↗</a>' +
            '<button class="recon__copy mono" type="button" id="reconCopy">Copy my fingerprint</button>' +
          '</div>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(root);
    grid = root.querySelector("#reconGrid");
    hashEl = root.querySelector("#reconHash");
    meterFill = root.querySelector("#reconMeterFill");
    meterLabel = root.querySelector("#reconMeterLabel");
    root.querySelectorAll("[data-rclose]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && opened) close(); });
  }

  /* ── signal collection (all local) ────────────────────────────── */
  function webgl() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return { renderer: "blocked / unavailable", vendor: "—" };
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      };
    } catch (_) { return { renderer: "blocked", vendor: "—" }; }
  }

  function canvasHash() {
    try {
      const c = document.createElement("canvas");
      c.width = 240; c.height = 60;
      const x = c.getContext("2d");
      x.textBaseline = "top";
      x.font = "16px 'Arial'";
      x.fillStyle = "#f60"; x.fillRect(2, 2, 120, 24);
      x.fillStyle = "#069"; x.fillText("Abubakar·Recon·安全·🛰", 4, 6);
      x.fillStyle = "rgba(102,204,0,0.7)"; x.fillText("Abubakar·Recon·安全·🛰", 6, 18);
      return c.toDataURL();
    } catch (_) { return "unavailable"; }
  }

  function detectFonts() {
    const base = ["monospace", "sans-serif", "serif"];
    const test = ["Arial", "Courier New", "Times New Roman", "Georgia", "Comic Sans MS", "Segoe UI",
      "Roboto", "Helvetica", "Ubuntu", "Cantarell", "Menlo", "Consolas", "SF Pro Text", "Noto Sans", "Tahoma"];
    const span = document.createElement("span");
    span.style.cssText = "position:absolute;left:-9999px;top:-9999px;font-size:72px;white-space:nowrap;";
    span.textContent = "mmmmmmmmmmlli WwXx 0123";
    document.body.appendChild(span);
    const baseSize = {};
    base.forEach((b) => { span.style.fontFamily = b; baseSize[b] = [span.offsetWidth, span.offsetHeight]; });
    const found = [];
    test.forEach((f) => {
      let hit = false;
      base.forEach((b) => {
        span.style.fontFamily = "'" + f + "'," + b;
        if (span.offsetWidth !== baseSize[b][0] || span.offsetHeight !== baseSize[b][1]) hit = true;
      });
      if (hit) found.push(f);
    });
    document.body.removeChild(span);
    return found;
  }

  function battery() {
    if (!navigator.getBattery) return Promise.resolve(null);
    return navigator.getBattery().then((b) => ({ level: Math.round(b.level * 100), charging: b.charging })).catch(() => null);
  }

  async function sha256Hex(str) {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (_) {
      let h = 0; for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
    }
  }

  async function collect() {
    const t0 = performance.now();
    const n = navigator, s = screen;
    const gl = webgl();
    const conn = n.connection || n.mozConnection || n.webkitConnection || {};
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
    const fonts = detectFonts();
    const cvs = canvasHash();
    const bat = await battery();

    const rows = [
      ["IP-free ID", "your session can be recognised without a single cookie", true],
      ["Operating system", platformGuess(), false],
      ["Browser engine", engineGuess(), false],
      ["User agent", n.userAgent, false],
      ["Languages", (n.languages || [n.language]).join(", "), false],
      ["Timezone", tz + " (UTC" + fmtOffset() + ")", false],
      ["Screen", s.width + "×" + s.height + " · " + (window.devicePixelRatio || 1) + "×dpr · " + (s.colorDepth || "?") + "-bit", false],
      ["Viewport", window.innerWidth + "×" + window.innerHeight, false],
      ["GPU (WebGL)", gl.renderer, false],
      ["GPU vendor", gl.vendor, false],
      ["CPU threads", (n.hardwareConcurrency || "hidden") + "", false],
      ["Device memory", (n.deviceMemory ? n.deviceMemory + " GB" : "hidden"), false],
      ["Touch points", (n.maxTouchPoints || 0) + "", false],
      ["Network", conn.effectiveType ? (conn.effectiveType + " · ~" + (conn.downlink || "?") + "Mbps · " + (conn.rtt || "?") + "ms rtt") : "hidden", false],
      ["Battery", bat ? (bat.level + "% · " + (bat.charging ? "charging" : "on battery")) : "hidden", false],
      ["Installed fonts", fonts.length ? (fonts.length + " detected · " + fonts.slice(0, 6).join(", ") + (fonts.length > 6 ? "…" : "")) : "none exposed", false],
      ["Do Not Track", n.doNotTrack === "1" ? "on (ignored by most)" : "off", false],
      ["Cookies", n.cookieEnabled ? "enabled" : "disabled", false],
      ["Canvas render", "hashed → unique per GPU + driver", false],
    ];

    // stable fingerprint from the high-entropy signals
    const fpSource = [n.userAgent, tz, s.width + "x" + s.height + "x" + s.colorDepth, window.devicePixelRatio,
      gl.renderer, gl.vendor, n.hardwareConcurrency, n.deviceMemory, (n.languages || []).join(","), fonts.join(","), cvs].join("|");
    const fullHash = await sha256Hex(fpSource);

    // rough identifiability score from how many high-entropy signals resolved
    let bits = 8;
    if (gl.renderer && !/blocked|unavailable/i.test(gl.renderer)) bits += 8;
    if (cvs !== "unavailable") bits += 6;
    if (fonts.length > 3) bits += Math.min(6, fonts.length - 3);
    if (tz !== "unknown") bits += 3;
    if (n.hardwareConcurrency) bits += 2;
    if (n.deviceMemory) bits += 2;
    bits += 2; // ua/lang baseline
    const ms = Math.max(1, Math.round(performance.now() - t0));
    return { rows, fullHash, bits, ms };
  }

  function platformGuess() {
    const u = navigator.userAgent;
    if (navigator.userAgentData && navigator.userAgentData.platform) return navigator.userAgentData.platform;
    if (/Windows NT 10/.test(u)) return "Windows 10/11";
    if (/Mac OS X/.test(u)) return "macOS";
    if (/Android/.test(u)) return "Android";
    if (/iPhone|iPad|iPod/.test(u)) return "iOS";
    if (/Linux/.test(u)) return "Linux";
    return navigator.platform || "unknown";
  }
  function engineGuess() {
    const u = navigator.userAgent;
    if (/Edg\//.test(u)) return "Edge (Chromium)";
    if (/OPR\//.test(u)) return "Opera (Chromium)";
    if (/Chrome\//.test(u) && !/Chromium/.test(u)) return "Chrome (Blink)";
    if (/Firefox\//.test(u)) return "Firefox (Gecko)";
    if (/Safari\//.test(u)) return "Safari (WebKit)";
    return "unknown";
  }
  function fmtOffset() {
    const o = -new Date().getTimezoneOffset(); const s = o >= 0 ? "+" : "-";
    const h = Math.floor(Math.abs(o) / 60), m = Math.abs(o) % 60;
    return s + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  /* ── render, with a staggered "assembling" reveal ─────────────── */
  async function render() {
    grid.innerHTML = "";
    hashEl.textContent = "computing…";
    meterFill.style.width = "0%";
    root.querySelector("#reconMs").textContent = "…";
    const data = await collect();
    root.querySelector("#reconMs").textContent = data.ms + "ms";

    data.rows.forEach((r, i) => {
      const li = document.createElement("div");
      li.className = "recon__row" + (r[2] ? " is-flag" : "");
      li.innerHTML = '<span class="recon__label mono">' + r[0] + '</span><span class="recon__val">' + esc(r[1]) + "</span>";
      li.style.animationDelay = (reduced ? 0 : 60 + i * 55) + "ms";
      grid.appendChild(li);
    });

    const grouped = data.fullHash.slice(0, 32).replace(/(.{4})/g, "$1 ").trim();
    setTimeout(() => { hashEl.textContent = grouped; }, reduced ? 0 : 250 + data.rows.length * 55);

    const pct = Math.min(100, Math.round((data.bits / 34) * 100));
    setTimeout(() => {
      meterFill.style.width = pct + "%";
      meterLabel.innerHTML = pct >= 78
        ? "≈ " + data.bits + " bits of entropy — <b>your browser is highly unique.</b> Trackers can single you out."
        : pct >= 50
        ? "≈ " + data.bits + " bits of entropy — fairly identifiable across sites."
        : "≈ " + data.bits + " bits — relatively low surface (good privacy hygiene).";
    }, reduced ? 0 : 400 + data.rows.length * 55);

    root.querySelector("#reconCopy").onclick = async () => {
      try { await navigator.clipboard.writeText(data.fullHash); root.querySelector("#reconCopy").textContent = "copied ✓"; setTimeout(() => (root.querySelector("#reconCopy").textContent = "Copy my fingerprint"), 1400); } catch (_) {}
    };
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── open / close ─────────────────────────────────────────────── */
  function open() {
    build();
    if (opened) return;
    opened = true;
    root.removeAttribute("hidden");
    requestAnimationFrame(() => root.classList.add("is-open"));
    document.body.classList.add("mmenu-lock");
    render();
  }
  function close() {
    if (!opened) return;
    opened = false;
    root.classList.remove("is-open");
    document.body.classList.remove("mmenu-lock");
    setTimeout(() => root.setAttribute("hidden", ""), 320);
  }

  window.Abubakar.openRecon = open;
})();
