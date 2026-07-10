/* ============================================================================
   Breach the Vault — a hidden, three-stage CTF baked into the portfolio.

   Discovery: a styled console banner + a clue in robots.txt + a seed element in
   the DOM. Entry: command palette ("sudo unlock-vault"), the hash #vault, or
   typing "vault" anywhere. Stages are real and educational:
     1. RECON  — find a flag hidden in the page's DOM
     2. DECODE — recover a base64-encoded flag (base64 ≠ encryption)
     3. FORGE  — tamper an unverified JWT to escalate role → admin
   Clearing it unlocks a hidden reward. Progress persists in localStorage.
   Entirely client-side. Vanilla JS.
   ========================================================================= */
(() => {
  "use strict";
  window.Abubakar = window.Abubakar || {};

  const STAGE_KEY = "abubakar:vault:stage";
  const DONE_KEY = "abubakar:vault:done";
  const FLAG2 = "ABK{base64_is_reversible}";

  const b64urlEnc = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64urlDec = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return atob(s); };

  // stage 3 token — signature never verified (classic vuln)
  const TOKEN = b64urlEnc({ alg: "none", typ: "JWT" }) + "." + b64urlEnc({ sub: "visitor", role: "guest", iss: "abubakar.dev" }) + ".";

  const stages = [
    {
      name: "RECON",
      prompt: () => [
        ["STAGE 1 / 3 — RECON", "v-h"],
        ["A flag is hidden in this page's HTML. Find the element with", "v-d"],
        ["id <b>vault-seed</b> and read its <b>data-flag</b> attribute.", "v-d"],
        ["Open dev-tools → Elements, or view-source. Submit the flag.", "v-dim"],
      ],
      check: (v) => { const s = document.getElementById("vault-seed"); return !!s && v === (s.getAttribute("data-flag") || "").trim(); },
    },
    {
      name: "DECODE",
      prompt: () => [
        ["STAGE 2 / 3 — DECODE", "v-h"],
        ["Encoding is not encryption. Recover the plaintext flag:", "v-d"],
        [btoa(FLAG2), "v-code"],
        ["Decode it (base64) and submit the result.", "v-dim"],
      ],
      check: (v) => v === FLAG2,
    },
    {
      name: "FORGE",
      prompt: () => [
        ["STAGE 3 / 3 — FORGE", "v-h"],
        ["This app trusts a JWT's <b>role</b> claim but never verifies its", "v-d"],
        ["signature (alg: none). Here is your guest token:", "v-d"],
        [TOKEN, "v-code"],
        ["Forge a token where <b>role = admin</b> and submit it.", "v-dim"],
      ],
      check: (v) => {
        try {
          const parts = v.trim().split(".");
          if (parts.length < 2) return false;
          const payload = JSON.parse(b64urlDec(parts[1]));
          return payload && String(payload.role).toLowerCase() === "admin";
        } catch (_) { return false; }
      },
    },
  ];

  let root, screen, input, built = false, opened = false;

  function stage() { return Math.max(0, Math.min(stages.length, +(localStorage.getItem(STAGE_KEY) || 0))); }
  function setStage(n) { try { localStorage.setItem(STAGE_KEY, n); } catch (_) {} }
  function isDone() { try { return localStorage.getItem(DONE_KEY) === "1"; } catch (_) { return false; } }
  function setDone() { try { localStorage.setItem(DONE_KEY, "1"); } catch (_) {} document.documentElement.classList.add("vault-breached"); }

  function build() {
    if (built) return; built = true;
    root = document.createElement("div");
    root.className = "vault"; root.setAttribute("hidden", "");
    root.innerHTML =
      '<div class="vault__backdrop" data-vclose></div>' +
      '<div class="vault__win" role="dialog" aria-modal="true" aria-label="The Vault">' +
        '<div class="vault__bar"><span class="vault__dots"><i></i><i></i><i></i></span>' +
        '<span class="vault__ttl mono">root@abubakar: ~/vault</span>' +
        '<button class="vault__close" type="button" data-vclose aria-label="Close">✕</button></div>' +
        '<div class="vault__screen mono" id="vaultScreen" tabindex="0"></div>' +
        '<form class="vault__form"><span class="vault__ps1 mono">vault&nbsp;$</span>' +
        '<input class="vault__input mono" id="vaultInput" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Vault input" /></form>' +
      "</div>";
    document.body.appendChild(root);
    screen = root.querySelector("#vaultScreen");
    input = root.querySelector("#vaultInput");
    root.querySelectorAll("[data-vclose]").forEach((b) => b.addEventListener("click", close));
    root.querySelector(".vault__form").addEventListener("submit", (e) => { e.preventDefault(); submit(input.value); input.value = ""; });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && opened) close(); });
    screen.addEventListener("click", () => input.focus());
  }

  function line(text, cls) {
    const d = document.createElement("div");
    d.className = "vault__line" + (cls ? " " + cls : "");
    d.innerHTML = text;
    screen.appendChild(d);
    screen.scrollTop = screen.scrollHeight;
  }
  function printBlock(arr) { arr.forEach(([t, c]) => line(t, c)); }
  function blank() { line("&nbsp;", ""); }

  function showStage() {
    const s = stage();
    if (s >= stages.length || isDone()) return reward();
    printBlock(stages[s].prompt());
    blank();
  }

  function intro() {
    screen.innerHTML = "";
    printBlock([
      ["┌─ THE VAULT ───────────────────────────────", "v-h"],
      ["│ Three stages stand between you and what's", "v-d"],
      ["│ inside. Recon, decode, forge. Solve each and", "v-d"],
      ["│ submit the flag at the prompt.", "v-d"],
      ["│ Commands: <b>help</b> · <b>reset</b> · <b>clear</b>", "v-dim"],
      ["└───────────────────────────────────────────", "v-h"],
    ]);
    blank();
    showStage();
  }

  function submit(raw) {
    const v = (raw || "").trim();
    if (!v) return;
    line("vault $ " + escapeHtml(v), "v-echo");
    const cmd = v.toLowerCase();
    if (cmd === "help") { printBlock([["commands: help · reset · clear · hint", "v-dim"]]); blank(); return; }
    if (cmd === "clear") { screen.innerHTML = ""; showStage(); return; }
    if (cmd === "reset") { setStage(0); try { localStorage.removeItem(DONE_KEY); } catch (_) {} document.documentElement.classList.remove("vault-breached"); line("progress reset.", "v-warn"); blank(); intro(); return; }
    if (cmd === "hint") { hint(); return; }

    const s = stage();
    if (s >= stages.length || isDone()) return reward();
    if (stages[s].check(v)) {
      line("✓ ACCESS GRANTED — stage " + (s + 1) + " cleared", "v-ok");
      blank();
      setStage(s + 1);
      if (s + 1 >= stages.length) { setDone(); reward(); }
      else showStage();
    } else {
      line("✗ ACCESS DENIED — invalid flag", "v-warn");
      blank();
    }
  }

  function hint() {
    const s = stage();
    const hints = [
      "Elements panel → search for &quot;vault-seed&quot;. The flag is a data- attribute.",
      "atob('&lt;the string&gt;') in the console decodes base64.",
      "A JWT is base64url(header).base64url(payload).sig — change the payload's role, re-encode, keep going.",
    ];
    printBlock([[hints[Math.min(s, hints.length - 1)], "v-dim"]]);
    blank();
  }

  function reward() {
    printBlock([
      ["██  VAULT BREACHED  ██", "v-ok"],
      ["&nbsp;", ""],
      ["You didn't just look at the portfolio — you took it apart.", "v-d"],
      ["That's exactly the instinct I hire for.", "v-d"],
      ["&nbsp;", ""],
      ["flag &gt; <b>ABK{the_vault_is_open}</b>", "v-code"],
      ["&nbsp;", ""],
      ["Skip the queue. Email me with subject &quot;I breached the vault&quot;", "v-d"],
      ["and I'll reply first.", "v-d"],
    ]);
    blank();
    const cta = document.createElement("div");
    cta.className = "vault__cta";
    cta.innerHTML =
      '<a class="vault__btn" href="mailto:abubakaramirwork@gmail.com?subject=' + encodeURIComponent("I breached the vault") + '">Email Abubakar ↗</a>' +
      '<a class="vault__btn vault__btn--ghost" href="https://www.linkedin.com/in/muhammad-abubakar-28b4a2312/" target="_blank" rel="noopener">Connect on LinkedIn</a>';
    screen.appendChild(cta);
    screen.scrollTop = screen.scrollHeight;
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function open() {
    build();
    if (opened) return;
    opened = true;
    root.removeAttribute("hidden");
    requestAnimationFrame(() => root.classList.add("is-open"));
    document.body.classList.add("mmenu-lock");
    intro();
    setTimeout(() => input.focus(), 120);
  }
  function close() {
    if (!opened) return;
    opened = false;
    root.classList.remove("is-open");
    document.body.classList.remove("mmenu-lock");
    setTimeout(() => root.setAttribute("hidden", ""), 320);
  }

  window.Abubakar.openVault = open;

  /* ── discovery: console banner + hash + keyword ───────────────── */
  try {
    const A = "color:#c9f24e;font-weight:bold", D = "color:#8a8f98";
    console.log("%c▲ ABUBAKAR // You opened the console. Good instinct.", A);
    console.log("%cThere's a vault hidden in this site — 3 stages, all client-side.\nRun  sudo unlock-vault  from the command palette (Cmd/Ctrl+K),\nor just type  \"vault\"  anywhere on the page.", D);
    if (isDone()) document.documentElement.classList.add("vault-breached");
  } catch (_) {}

  if (location.hash === "#vault") setTimeout(open, 600);
  window.addEventListener("hashchange", () => { if (location.hash === "#vault") open(); });

  // type "vault" anywhere (not in a field) to open
  let buf = "";
  document.addEventListener("keydown", (e) => {
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (e.key && e.key.length === 1) { buf = (buf + e.key.toLowerCase()).slice(-5); if (buf === "vault") { buf = ""; open(); } }
  });
})();
