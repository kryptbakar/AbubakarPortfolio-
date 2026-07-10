/* ============================================================================
   Feature dock — an always-visible launcher on the main page so the
   interactive features are one tap away instead of buried in a menu.
   Icon + label per action, live active-state for the toggles, auto-hides at
   the footer. Vanilla, self-contained.
   ========================================================================= */
(() => {
  "use strict";
  window.Abubakar = window.Abubakar || {};

  const IC = {
    os:      '<svg class="dock__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="14" rx="2"/><path d="M6.5 9l2.5 2.5L6.5 14"/><line x1="11.5" y1="14" x2="15.5" y2="14"/></svg>',
    rain:    '<svg class="dock__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 14.5a4 4 0 0 1 .4-7.98 5 5 0 0 1 9.53-1.1A3.6 3.6 0 0 1 17.5 14.5z"/><line x1="8" y1="17" x2="7" y2="20"/><line x1="12" y1="17" x2="11" y2="20"/><line x1="16" y1="17" x2="15" y2="20"/></svg>',
    recon:   '<svg class="dock__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8"/><path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8"/><path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16"/><path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><circle cx="12" cy="12" r="2.4"/></svg>',
    encrypt: '<svg class="dock__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15" r="1.1"/></svg>',
    cmdk:    '<svg class="dock__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H9zm0 0V9m0 0h6M9 9v6m6-8.5A2.5 2.5 0 1 1 17.5 9H15zm0 0V9m0 0v6m0 0v.5A2.5 2.5 0 1 0 17.5 15H15zm0 0H9m0 0v.5A2.5 2.5 0 1 1 6.5 15H9z"/></svg>',
  };

  const items = [
    { id: "os",      lbl: "Linux",   icon: IC.os,      run: () => document.getElementById("osToggle")?.click(),      watch: "osToggle" },
    { id: "rain",    lbl: "Rain",    icon: IC.rain,    run: () => document.getElementById("weatherToggle")?.click(), watch: "weatherToggle" },
    { id: "recon",   lbl: "Recon",   icon: IC.recon,   run: () => window.Abubakar.openRecon && window.Abubakar.openRecon() },
    { id: "encrypt", lbl: "Encrypt", icon: IC.encrypt, run: () => window.Abubakar.openEncrypt && window.Abubakar.openEncrypt() },
    { id: "cmdk",    lbl: "Command", icon: IC.cmdk,    run: () => document.querySelector(".nav__cmdk")?.click() },
  ];

  const dock = document.createElement("nav");
  dock.className = "dock";
  dock.setAttribute("aria-label", "Interactive features");
  items.forEach((it) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dock__btn";
    b.dataset.dock = it.id;
    b.setAttribute("aria-label", it.lbl);
    b.innerHTML = it.icon + '<span class="dock__lbl">' + it.lbl + "</span>";
    b.addEventListener("click", it.run);
    dock.appendChild(b);
    // reflect toggle state (rain / os) live, however it was triggered
    if (it.watch) {
      const src = document.getElementById(it.watch);
      if (src) {
        const sync = () => b.classList.toggle("is-active", src.getAttribute("aria-pressed") === "true");
        new MutationObserver(sync).observe(src, { attributes: true, attributeFilter: ["aria-pressed"] });
        sync();
      }
    }
  });
  document.body.appendChild(dock);

  // fade out over the footer so it never covers the sign-off
  const footer = document.querySelector(".footer");
  if (footer && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => dock.classList.toggle("is-hidden", e.isIntersecting && e.intersectionRatio > 0.12)), { threshold: [0, 0.12, 0.3] }).observe(footer);
  }
})();
