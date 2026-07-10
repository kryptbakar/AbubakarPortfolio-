/* ============================================================================
   Mobile navigation drawer. Collapses the crowded nav into a clean hamburger
   + slide-in menu, and routes its actions to the real controls (OS mode, rain,
   recon, encrypt, command palette). Vanilla, self-contained.
   ========================================================================= */
(() => {
  "use strict";
  window.Abubakar = window.Abubakar || {};

  const burger = document.getElementById("navBurger");
  const menu = document.getElementById("mobileMenu");
  if (!burger || !menu) return;

  const html = document.documentElement;
  let open = false;

  function setOpen(v) {
    open = v;
    menu.classList.toggle("is-open", v);
    menu.setAttribute("aria-hidden", v ? "false" : "true");
    burger.setAttribute("aria-expanded", v ? "true" : "false");
    html.classList.toggle("mmenu-open", v);
    document.body.classList.toggle("mmenu-lock", v);
  }
  const close = () => setOpen(false);

  burger.addEventListener("click", () => setOpen(!open));
  menu.querySelectorAll("[data-mclose]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) close(); });
  window.addEventListener("resize", () => { if (open && window.innerWidth > 820) close(); });

  // in-page links: close, then smooth-scroll to the section
  menu.querySelectorAll("[data-mgoto]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      close();
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 260);
    });
  });

  // feature launchers
  const run = {
    os:      () => document.getElementById("osToggle")?.click(),
    rain:    () => document.getElementById("weatherToggle")?.click(),
    recon:   () => window.Abubakar.openRecon && window.Abubakar.openRecon(),
    encrypt: () => window.Abubakar.openEncrypt && window.Abubakar.openEncrypt(),
    cmdk:    () => document.querySelector(".nav__cmdk")?.click(),
  };
  menu.querySelectorAll("[data-mact]").forEach((b) => {
    b.addEventListener("click", () => {
      const act = b.getAttribute("data-mact");
      close();
      setTimeout(() => run[act] && run[act](), 280);
    });
  });
})();
