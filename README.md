# Muhammad Abubakar — Portfolio

A bespoke, award-grade personal portfolio for a final-year Cyber Security
engineer. Dark editorial aesthetic, kinetic oversized typography, buttery
smooth scrolling, a pinned horizontal work showcase, a custom magnetic
cursor, generative project visuals, and film-grain texture.

**Live:** https://kryptbakar.github.io/Portfolio-/ &nbsp;·&nbsp; *(enable Pages once — see below)*

---

## Stack

Dependency-free, build-free, hand-crafted:

- **HTML + CSS + vanilla JavaScript** — no framework, no bundler.
- **[GSAP](https://gsap.com/) + ScrollTrigger** — scroll-driven reveals, pin, parallax.
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scrolling, synced to the GSAP ticker.
- **Google Fonts** — Syne (display), Fraunces (italic accents), Space Grotesk (body), JetBrains Mono (labels).
- Self-animating **SVG** project posters (one per flagship project, themed to its domain).

All third-party libraries load from CDN, so there is nothing to install.

## Structure

```
index.html              # all markup + content
assets/
  css/style.css         # design system + responsive + reduced-motion
  js/main.js            # cursor, magnetic, flow-field, reveals, pinned work, marquees
  img/
    favicon.svg
    og.svg              # social preview
    work/*.svg          # six generative project visuals
.github/workflows/deploy-pages.yml
```

## Run locally

No build step — serve the folder with any static server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy (GitHub Pages)

This repo ships a Pages workflow that publishes `index.html` + `assets/` on
every push to `main`.

1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually) — the site deploys to
   `https://kryptbakar.github.io/Portfolio-/`.

## Accessibility & performance

- Respects `prefers-reduced-motion` (disables the loader, canvas, and motion).
- Degrades gracefully if JavaScript or a CDN is unavailable (content stays visible).
- Animates only `transform` / `opacity`; the hero canvas pauses when off-screen.
- Keyboard skip-link, semantic landmarks, and descriptive image alt text.

---

© Muhammad Abubakar — BS Cyber Security, GIKI · Lahore, Pakistan.
