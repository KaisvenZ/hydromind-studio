# HydroMind Studio

A cross-platform desktop-ready flood-risk digital twin for vibecoding competitions.

## What it shows

- Cinematic basin command deck with local satellite and aerial media.
- Scenario sliders for rainfall, reservoir level, soil saturation, gate opening, pump readiness, and forecast window.
- Risk scoring, node-level exposure, forecast hydrograph, and dispatch actions.
- JSON/CSV scenario import and Markdown dispatch report export.
- AI briefing with deterministic local mode by default and optional OpenAI Responses API mode when a key is entered.

## Run locally

```bash
npm install
npm run dev
```

## Run as desktop app

```bash
npm run desktop:dev
```

## Verify and build

```bash
npm run test -- --run
npm run build
npm run desktop:pack
```

`desktop:pack` creates an unpacked app in `release/`. `desktop:dist` builds distributable artifacts for the current platform and keeps Windows/Linux targets configured for compatible builders.
