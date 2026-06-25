/* ============================================================================
   Muhammad Abubakar — Portfolio · 3D project stage (WebGL / Three.js)
   ----------------------------------------------------------------------------
   A curved video-wall carousel in a wireframe-grid space, with bloom +
   chromatic aberration. Progressive enhancement: mounts only on capable
   desktops; any failure quietly falls back to the CSS/GSAP showcase.
   Scroll position is fed in from main.js via the "work:progress" event.
   ========================================================================= */

(async () => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
  if (reduced || !desktop || !window.gsap) return;

  // WebGL support probe
  try {
    const test = document.createElement("canvas");
    if (!(test.getContext("webgl2") || test.getContext("webgl"))) return;
  } catch (_) { return; }

  let THREE;
  try { THREE = await import("three"); } catch (_) { return; }

  const pin = document.querySelector("#workPin");
  const track = document.querySelector("#workTrack");
  if (!pin || !track) return;

  // ── read project data from the existing DOM panels (single source) ──────
  const HIGHLIGHTS = [
    "On-prem · explainable risk",
    "+0.299 bits/s/Hz secrecy",
    "Zero outbound telemetry",
    "Fail-fast SAST + SCA gates",
    "OWASP Top 10 hardened",
    "1.6M samples · ~7.5 min",
  ];
  const projects = [...track.querySelectorAll(".panel")].map((p, i) => {
    const titleEl = p.querySelector(".panel__title");
    const title = titleEl
      ? titleEl.innerHTML.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim()
      : "Project";
    return {
      num: (p.querySelector(".panel__meta span")?.textContent || String(i + 1).padStart(2, "0")).trim(),
      title,
      sub: (p.querySelector(".panel__sub")?.textContent || "").trim(),
      tags: [...p.querySelectorAll(".panel__tags li")].map((li) => li.textContent.trim()),
      url: p.querySelector(".panel__link")?.href || "#",
      highlight: HIGHLIGHTS[i] || "",
    };
  });
  if (!projects.length) return;

  try {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
    await build();
  } catch (e) {
    console.error("[stage3d] init failed, using fallback:", e);
    document.documentElement.classList.remove("webgl-work");
    document.querySelector(".stage3d")?.remove();
  }

  // ── procedural "dashboard" texture for a project ────────────────────
  function dashboardCanvas(p, idx) {
    const W = 1280, H = 720;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const ACCENT = "#c9f24e", BONE = "#f2efe6", MUT = "rgba(242,239,230,0.5)";

    // background gradient
    const bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0c0c11"); bg.addColorStop(1, "#070709");
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    // survey grid
    x.strokeStyle = "rgba(242,239,230,0.045)"; x.lineWidth = 1;
    for (let gx = 64; gx < W; gx += 64) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 64; gy < H; gy += 64) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
    // accent glow behind the title
    const gl = x.createRadialGradient(340, 320, 20, 340, 320, 460);
    gl.addColorStop(0, "rgba(201,242,78,0.16)"); gl.addColorStop(1, "transparent");
    x.fillStyle = gl; x.fillRect(0, 0, W, H);
    // watermark numeral
    x.fillStyle = "rgba(242,239,230,0.05)"; x.textAlign = "right"; x.textBaseline = "alphabetic";
    x.font = "800 560px Syne, sans-serif"; x.fillText(p.num, W - 28, H + 84);
    // corner frame
    x.strokeStyle = ACCENT; x.lineWidth = 3;
    const m = 40, t = 28;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([px, py, dx, dy]) => {
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + dx * t, py); x.moveTo(px, py); x.lineTo(px, py + dy * t); x.stroke();
    });
    // telemetry top bar
    x.textBaseline = "middle"; x.textAlign = "left";
    x.fillStyle = ACCENT; x.beginPath(); x.arc(62, 70, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = MUT; x.font = "500 21px 'JetBrains Mono', monospace";
    x.fillText("SECURE  //  " + (p.sub || "").toUpperCase(), 84, 72);
    x.textAlign = "right"; x.fillStyle = BONE;
    x.fillText(p.num + " / " + String(projects.length).padStart(2, "0"), W - 58, 72);
    x.strokeStyle = "rgba(242,239,230,0.12)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(60, 108); x.lineTo(W - 58, 108); x.stroke();
    // title (softened just below the bloom knee so post-bloom can't smear the
    // glyphs together — keeps the Syne "Q" in "DQN" legible)
    x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#e7e4db";
    x.font = "800 100px Syne, sans-serif";
    wrap(x, p.title.toUpperCase(), 60, 256, 770, 92);
    // highlight metric pill
    x.font = "500 30px 'JetBrains Mono', monospace"; x.textBaseline = "middle";
    const hw = x.measureText(p.highlight).width;
    x.fillStyle = "rgba(201,242,78,0.12)"; roundRect(x, 60, 452, hw + 46, 52, 9); x.fill();
    x.fillStyle = ACCENT; x.fillText(p.highlight, 83, 480);
    // signal chart
    let seed = idx * 17 + 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    x.strokeStyle = ACCENT; x.lineWidth = 3; x.beginPath();
    const cx0 = 740, cw = 470, cy0 = 250, ch = 180;
    for (let i = 0; i <= 48; i++) {
      const xx = cx0 + (cw * i) / 48;
      const yy = cy0 + ch / 2 - Math.sin(i * 0.45 + idx) * (ch / 2) * (0.35 + 0.65 * rnd());
      i ? x.lineTo(xx, yy) : x.moveTo(xx, yy);
    }
    x.globalAlpha = 0.9; x.stroke(); x.globalAlpha = 1;
    x.fillStyle = "rgba(242,239,230,0.22)";
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.arc(cx0 + (cw * i) / 8, cy0 + ch + 34, 2.5, 0, 6.283); x.fill(); }
    // tags
    x.fillStyle = MUT; x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.font = "500 23px 'JetBrains Mono', monospace";
    x.fillText(p.tags.slice(0, 4).join("   ·   "), 60, H - 56);
    return c;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrap(ctx, text, x0, y0, maxW, lh) {
    const words = text.split(" "); let line = "", y = y0;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x0, y); line = w; y += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x0, y);
  }

  // ── curved screen geometry (wraps toward the viewer) ────────────────────
  function curved(w, h, R, seg = 48) {
    const g = new THREE.PlaneGeometry(w, h, seg, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), ang = px / R;
      pos.setX(i, R * Math.sin(ang));
      pos.setZ(i, R * Math.cos(ang) - R);
    }
    pos.needsUpdate = true; g.computeVertexNormals();
    return g;
  }

  // ── build the whole scene ──────────────────────────────────────
  async function build() {
    // overlay shell
    const stage = document.createElement("div");
    stage.className = "stage3d";
    stage.innerHTML =
      '<canvas class="stage3d__canvas"></canvas>' +
      '<div class="stage3d__ui">' +
        '<div class="stage3d__caption"><div class="s-num mono"></div><h3 class="s-title"></h3><div class="s-tags mono"></div></div>' +
        '<div class="stage3d__quat mono"><div class="s-quat-head">MainLogo Quaternion</div>' +
          '<div class="s-quat-vals"><span>.00</span><span>.00</span><span>.00</span><span>.00</span></div>' +
          '<div class="s-quat-reset">⟳ Reset Quaternion</div></div>' +
        '<div class="stage3d__hint mono"><span class="s-dot"></span> Scroll to travel · click to open</div>' +
      "</div>";
    document.body.appendChild(stage);
    document.documentElement.classList.add("webgl-work");

    const canvas = stage.querySelector(".stage3d__canvas");
    const capNum = stage.querySelector(".s-num");
    const capTitle = stage.querySelector(".s-title");
    const capTags = stage.querySelector(".s-tags");
    const quatVals = stage.querySelectorAll(".s-quat-vals span");

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.03);

    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    // wireframe-grid environment (floor / ceiling / back)
    const gridA = 0x1c3b4a, gridB = 0x13262f;
    const floor = new THREE.GridHelper(140, 70, gridA, gridB); floor.position.y = -5.2; scene.add(floor);
    const ceil = new THREE.GridHelper(140, 70, gridA, gridB); ceil.position.y = 5.2; scene.add(ceil);
    const backWall = new THREE.GridHelper(140, 70, gridA, gridB);
    backWall.rotation.x = Math.PI / 2; backWall.position.z = -16; scene.add(backWall);

    // screens
    const geo = curved(7.2, 4.05, 7.2);
    const group = new THREE.Group(); scene.add(group);
    const screens = projects.map((p, idx) => {
      let map = null;
      try {
        map = new THREE.CanvasTexture(dashboardCanvas(p, idx));
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
      } catch (_) {}
      const mat = new THREE.MeshBasicMaterial({
        map, color: map ? 0xffffff : 0x141821, transparent: true,
        side: THREE.DoubleSide, toneMapped: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // thin accent frame
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xc9f24e, transparent: true, opacity: 0.35 })
      );
      mesh.add(edge);
      mesh.userData = { url: p.url, edge };
      group.add(mesh);
      return mesh;
    });

    // post-processing (optional; degrade to plain render on failure)
    let composer = null;
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { RGBShiftShader }, { OutputPass }] =
        await Promise.all([
          import("three/addons/postprocessing/EffectComposer.js"),
          import("three/addons/postprocessing/RenderPass.js"),
          import("three/addons/postprocessing/UnrealBloomPass.js"),
          import("three/addons/postprocessing/ShaderPass.js"),
          import("three/addons/shaders/RGBShiftShader.js"),
          import("three/addons/postprocessing/OutputPass.js"),
        ]);
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      // restrained post: subtle glow + a whisper of aberration (keeps text crisp)
      const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.30, 0.28, 0.85);
      composer.addPass(bloom);
      const rgb = new ShaderPass(RGBShiftShader); rgb.uniforms.amount.value = 0.0006; composer.addPass(rgb);
      composer.addPass(new OutputPass());
      composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      composer.setSize(innerWidth, innerHeight);
    } catch (_) { composer = null; }

    // state
    const N = screens.length;
    const SPACING = 8.3, DEPTH = 2.2, ANGLE = 0.5;
    let t = 0, target = 0, active = -1;
    const mouse = { x: 0, y: 0 };
    const clock = new THREE.Clock();
    let running = false, raf = 0;

    function layout(time) {
      for (let i = 0; i < N; i++) {
        const m = screens[i], rel = i - t, a = Math.abs(rel);
        m.position.x = rel * SPACING;
        m.position.z = -a * DEPTH;
        m.position.y = 0;
        const rotY = THREE.MathUtils.clamp(-rel * ANGLE, -1.1, 1.1);
        let rx = 0, rz = 0;
        if (Math.round(t) === i) {                       // lively idle wobble on the focused screen
          rx = Math.sin(time * 0.8) * 0.05;
          rz = Math.cos(time * 0.6) * 0.04;
          m.position.y = Math.sin(time * 1.1) * 0.06;
        }
        m.rotation.set(rx, rotY, rz);
        const s = 1 - Math.min(a * 0.05, 0.25); m.scale.setScalar(s);
        m.material.opacity = THREE.MathUtils.clamp(1.25 - a * 0.45, 0, 1);
        m.userData.edge.material.opacity = Math.round(t) === i ? 0.5 : 0.12;
        m.visible = m.material.opacity > 0.02;
      }
    }

    function updateOverlay() {
      const idx = THREE.MathUtils.clamp(Math.round(t), 0, N - 1);
      if (idx !== active) {
        active = idx; const p = projects[idx];
        capNum.textContent = p.num + " / " + String(N).padStart(2, "0");
        capTitle.textContent = p.title;
        capTags.textContent = p.tags.slice(0, 4).join("  ·  ");
      }
      const q = screens[idx].quaternion;
      const f = (v) => (v < 0 ? "" : " ") + v.toFixed(2);
      quatVals[0].textContent = f(q.x); quatVals[1].textContent = f(q.y);
      quatVals[2].textContent = f(q.z); quatVals[3].textContent = f(q.w);
    }

    function frame() {
      if (!running) return;
      const time = clock.getElapsedTime();
      t += (target - t) * 0.08;
      layout(time);
      // the whole carousel leans gently toward the cursor — parallax depth
      group.rotation.y += (mouse.x * 0.10 - group.rotation.y) * 0.04;
      group.rotation.x += (-mouse.y * 0.06 - group.rotation.x) * 0.04;
      camera.position.x += (mouse.x * 1.4 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.9 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      updateOverlay();
      composer ? composer.render() : renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function startLoop() { if (!running) { running = true; clock.getDelta(); raf = requestAnimationFrame(frame); } }
    function stopLoop() { running = false; cancelAnimationFrame(raf); }

    // scroll → carousel (progress dispatched by main.js)
    window.addEventListener("work:progress", (e) => {
      const pr = Math.max(0, Math.min(1, e.detail?.progress ?? 0));
      target = pr * (N - 1);
    });

    // show whenever EITHER the pin is active OR the section is in view
    // (two independent signals → robust even if one misfires for a pinned el)
    let stIn = false, ioIn = false;
    function refreshActive() {
      const on = stIn || ioIn;
      if (on) { stage.classList.add("is-active"); startLoop(); }
      else { stage.classList.remove("is-active"); stopLoop(); }
    }
    window.addEventListener("work:active", (e) => { stIn = !!(e.detail && e.detail.active); refreshActive(); });
    window.addEventListener("work:progress", () => { if (!stIn) { stIn = true; refreshActive(); } });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { ioIn = en.isIntersecting; refreshActive(); }, { threshold: 0.01 }).observe(pin);
    } else { stIn = true; refreshActive(); }

    // interaction
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let downX = 0, downY = 0;
    canvas.addEventListener("pointermove", (ev) => {
      mouse.x = (ev.clientX / innerWidth - 0.5) * 2;
      mouse.y = -(ev.clientY / innerHeight - 0.5) * 2;
      ptr.x = (ev.clientX / innerWidth) * 2 - 1;
      ptr.y = -(ev.clientY / innerHeight) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      canvas.style.cursor = ray.intersectObjects(screens, false).length ? "pointer" : "grab";
    });
    canvas.addEventListener("pointerdown", (ev) => { downX = ev.clientX; downY = ev.clientY; });
    canvas.addEventListener("click", (ev) => {
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return; // ignore drags
      ptr.x = (ev.clientX / innerWidth) * 2 - 1;
      ptr.y = -(ev.clientY / innerHeight) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(screens, false)[0];
      const mesh = hit ? hit.object : screens[Math.round(t)];
      const url = mesh?.userData?.url;
      if (url && url !== "#") window.open(url, "_blank", "noopener");
    });

    // resize
    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      composer && composer.setSize(innerWidth, innerHeight);
    });

    layout(0); updateOverlay();
  }
})();
