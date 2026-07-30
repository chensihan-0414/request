# Step 1 — Custom Prefab House (static site)

Pure HTML/CSS/JS, no build step, no framework. Three files:
`index.html`, `style.css`, `script.js`.

## Deploy to Vercel

1. Push this folder to a GitHub repo (just these 3 files at the repo root,
   or in a subfolder — either works).
2. On [vercel.com](https://vercel.com), **Add New → Project**, import that
   repo.
3. Framework preset: choose **"Other"** (or leave auto-detect — Vercel
   correctly serves plain static files with no config needed).
4. Deploy. Done — no environment variables, no build command required.

You can also drag-and-drop this folder straight into Vercel's dashboard
for a one-off deploy without GitHub.

## What's implemented

- Market/positioning cards — data-driven from the `MARKETS` array in
  `script.js`; add a country by adding one object to that array, no HTML
  changes needed
- Language switcher — 中文 / English, toggles all `data-i18n` elements
- Quick Start module form — steppers for bedroom/bathroom counts, toggles
  for kitchen/living room/porch/loft, live "X / 6" counter
- Submit — builds the same `{ moduleId, quantity }[]` structure the
  backend's `generateArrangement()` expects (see `buildModuleRequest()` in
  `script.js`), including the same auto-add rules (utility always added,
  hallway-connector added when bathroom + kitchen are both selected) and
  the same 6-module limit check
- Recent projects — saved to `localStorage` in the visitor's own browser
  (this is a static site with no backend/database, so there's no shared
  project list across devices — see [Connecting to Step 2](#connecting-to-step-2)
  below for what would need to change to make this shared)

## Connecting to Step 2

This site only handles Step 1. To hand off to the real Pascal editor
(Step 2/3, from the earlier `step1-step3-integration.patch`), set
`STEP2_URL` at the top of `script.js` to wherever that app ends up
deployed, e.g.:

```js
const STEP2_URL = 'https://your-pascal-fork.vercel.app/step1';
```

Once set, a "Continue building →" button appears after a successful
generate, carrying the structured request as a URL query parameter. Left
empty (the default), the site still works completely on its own — it just
shows the generated JSON inline instead.

Note: the actual Pascal editor fork (from the earlier patch) is a
Next.js app and cannot be deployed as plain static files the way this
Step 1 site can — it needs a Node-capable host (Vercel supports this too,
just as a separate project with its own build step, not this one).
