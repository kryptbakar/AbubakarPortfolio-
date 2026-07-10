/* ============================================================================
   Encrypt-to-contact — a contact form that does real cryptography.

   The visitor's message is encrypted in their browser to Abubakar's public key
   using hybrid encryption (RSA-OAEP-3072 wrapping a one-time AES-256-GCM key)
   via the native Web Crypto API — no libraries, nothing sent anywhere. They get
   an ASCII-armored ciphertext to copy or email. Only Abubakar's private key can
   read it (see tools/decrypt.html). The medium is the message: applied crypto.
   ========================================================================= */
(() => {
  "use strict";
  window.Abubakar = window.Abubakar || {};

  // Abubakar's RSA-OAEP (SHA-256) public key, SPKI/base64. Public by design.
  const PUB_SPKI_B64 =
    "MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAk52JBg9el2nMPtKfuXnXidlePEN9crmhHl1JlBg0n7mYJ056TenEpewQoaao2GdmcmAmuYYZaygR4/i6UNH69VldKCa68rXh1+1GHaqq8zqKQt9NMagXAtly0PEB5KLzQZ8Z88xSFV4ER3y+rx/36oJq9HMQFwX2ccluk/1OFJS2aHXasTOZRJ6H0Gdlwth3SeqIvDrhJbP47jQGUb4Duc6Te5iMgNAa+lcFA3LHnrmgTpE5MLCa+LW0ADhdPiYlZFpZLFamu6Mss2b61l+VhBtQ4YRK2FwzE+hlz85+sGynauHPtLTkCDj1JFE64je+nysspyrpfP00+RQCs9BxoE0QZ30y9tLd76XKOb53DJ4rWVq96adhxexcm2rdW0qBHjof2POzVSD+/HEpBZfAdTLl+FnTfGn/Q0jD3YF+gkKAFx5+mejgDvlApxIiYGRf2S2D/fdMI0UqCK9rlO8pDcamzXn6avCcSHbBTXdooTEOTstg+lZ/fnpkg+lHs6KpAgMBAAE=";
  const RECIPIENT = "abubakaramirwork@gmail.com";

  let root, msgEl, nameEl, replyEl, outEl, outWrap, statusEl, encBtn, built = false, opened = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── crypto helpers ───────────────────────────────────────────── */
  const b64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  function importPub() {
    return crypto.subtle.importKey("spki", fromB64(PUB_SPKI_B64), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  }
  async function encryptMessage(payload) {
    const pub = await importPub();
    const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(JSON.stringify(payload)));
    const rawKey = await crypto.subtle.exportKey("raw", aesKey);
    const encKey = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pub, rawKey);
    const container = { v: 1, alg: "RSA-OAEP-3072 + AES-256-GCM", k: b64(encKey), iv: b64(iv), ct: b64(ct) };
    return armor(btoa(JSON.stringify(container)));
  }
  function armor(b64str) {
    const wrapped = b64str.replace(/(.{64})/g, "$1\n");
    return "-----BEGIN ABUBAKAR SECURE MESSAGE-----\n" + wrapped + "\n-----END ABUBAKAR SECURE MESSAGE-----";
  }

  /* ── DOM ──────────────────────────────────────────────────────── */
  function build() {
    if (built) return; built = true;
    root = document.createElement("div");
    root.className = "enc";
    root.setAttribute("hidden", "");
    root.innerHTML =
      '<div class="enc__backdrop" data-eclose></div>' +
      '<div class="enc__panel" role="dialog" aria-modal="true" aria-label="Send an encrypted message">' +
        '<header class="enc__head">' +
          '<div><span class="enc__kicker mono">// END-TO-END ENCRYPTED</span>' +
          '<h2 class="enc__title">Send me an encrypted message</h2></div>' +
          '<button class="enc__close" type="button" data-eclose aria-label="Close">✕</button>' +
        '</header>' +
        '<p class="enc__intro">Type below. It\'s encrypted <b>in your browser</b> to my public key with RSA-OAEP-3072 + AES-256-GCM — only my private key can read it. Nothing is uploaded.</p>' +
        '<div class="enc__form">' +
          '<div class="enc__two">' +
            '<label class="enc__field"><span class="mono">Your name <i>optional</i></span><input id="encName" type="text" autocomplete="name" placeholder="Jane Recruiter" /></label>' +
            '<label class="enc__field"><span class="mono">Reply-to <i>optional</i></span><input id="encReply" type="email" autocomplete="email" placeholder="you@company.com" /></label>' +
          '</div>' +
          '<label class="enc__field"><span class="mono">Message</span><textarea id="encMsg" rows="5" placeholder="Say hello, share a role, or leave a note only Abubakar can decrypt…"></textarea></label>' +
          '<button class="enc__go" id="encGo" type="button"><span class="enc__go-txt">Encrypt message</span><span class="enc__lock" aria-hidden="true">🔒</span></button>' +
          '<p class="enc__status mono" id="encStatus" aria-live="polite"></p>' +
        '</div>' +
        '<div class="enc__out" id="encOut" hidden>' +
          '<div class="enc__out-head mono"><span class="enc__ok">✓ Ciphertext ready — unreadable without my key</span></div>' +
          '<textarea class="enc__cipher mono" id="encCipher" readonly rows="6" aria-label="Encrypted message"></textarea>' +
          '<div class="enc__actions">' +
            '<button class="enc__act enc__act--primary" id="encCopy" type="button">Copy ciphertext</button>' +
            '<button class="enc__act" id="encMail" type="button">Email it to me ↗</button>' +
            '<button class="enc__act" id="encReset" type="button">Write another</button>' +
          '</div>' +
          '<p class="enc__note mono">Prefer plain email? <a href="mailto:' + RECIPIENT + '">' + RECIPIENT + '</a></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    msgEl = root.querySelector("#encMsg");
    nameEl = root.querySelector("#encName");
    replyEl = root.querySelector("#encReply");
    outEl = root.querySelector("#encCipher");
    outWrap = root.querySelector("#encOut");
    statusEl = root.querySelector("#encStatus");
    encBtn = root.querySelector("#encGo");

    root.querySelectorAll("[data-eclose]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && opened) close(); });
    encBtn.addEventListener("click", run);
    root.querySelector("#encCopy").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(outEl.value); e.target.textContent = "Copied ✓"; setTimeout(() => (e.target.textContent = "Copy ciphertext"), 1400); } catch (_) { outEl.select(); }
    });
    root.querySelector("#encMail").addEventListener("click", () => {
      const body = encodeURIComponent(outEl.value);
      const subj = encodeURIComponent("Encrypted message via portfolio");
      window.location.href = "mailto:" + RECIPIENT + "?subject=" + subj + "&body=" + body;
    });
    root.querySelector("#encReset").addEventListener("click", () => { outWrap.hidden = true; msgEl.value = ""; statusEl.textContent = ""; encBtn.disabled = false; msgEl.focus(); });
  }

  async function run() {
    const message = msgEl.value.trim();
    if (!message) { statusEl.textContent = "› write a message first"; statusEl.className = "enc__status mono is-warn"; msgEl.focus(); return; }
    if (!window.crypto || !crypto.subtle) { statusEl.textContent = "› this browser lacks Web Crypto — use plain email"; statusEl.className = "enc__status mono is-warn"; return; }
    encBtn.disabled = true;
    root.classList.add("is-working");
    const steps = ["deriving one-time AES-256 key…", "sealing message (AES-GCM)…", "wrapping key to RSA-OAEP-3072…", "armoring ciphertext…"];
    for (let i = 0; i < steps.length; i++) { statusEl.textContent = "› " + steps[i]; statusEl.className = "enc__status mono"; if (!reduced) await wait(230); }
    try {
      const payload = { name: nameEl.value.trim() || null, replyTo: replyEl.value.trim() || null, message, sentAt: new Date().toISOString() };
      const armored = await encryptMessage(payload);
      outEl.value = armored;
      outWrap.hidden = false;
      statusEl.textContent = "› encrypted · " + armored.length + " chars · 0 bytes sent";
      statusEl.className = "enc__status mono is-ok";
      root.classList.remove("is-working");
      outWrap.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    } catch (err) {
      root.classList.remove("is-working");
      statusEl.textContent = "› encryption failed: " + (err && err.message ? err.message : err);
      statusEl.className = "enc__status mono is-warn";
      encBtn.disabled = false;
    }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function open() { build(); if (opened) return; opened = true; root.removeAttribute("hidden"); requestAnimationFrame(() => root.classList.add("is-open")); document.body.classList.add("mmenu-lock"); setTimeout(() => msgEl.focus(), 120); }
  function close() { if (!opened) return; opened = false; root.classList.remove("is-open"); document.body.classList.remove("mmenu-lock"); setTimeout(() => root.setAttribute("hidden", ""), 320); }

  window.Abubakar.openEncrypt = open;

  // wire the contact-section button if present
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.getElementById("encryptContactBtn");
    if (b) b.addEventListener("click", open);
  });
  const cbtn = document.getElementById("encryptContactBtn");
  if (cbtn) cbtn.addEventListener("click", open);
})();
