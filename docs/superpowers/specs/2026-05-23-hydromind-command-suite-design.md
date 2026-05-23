# HydroMind Command Suite Redesign

Date: 2026-05-23
Project: `hydromind-studio`
Scope: Professional UI/product redesign and focused feature expansion for the existing React + Vite + Electron app.

## Goal

HydroMind Studio should move from a cinematic flood-risk dashboard toward a credible command workbench for flood scenario rehearsal and AI-supported dispatch decisions.

The current implementation already has useful pieces:

- `src/App.tsx` owns scenario orchestration, AI generation, imports, exports, simulation, and snapshots.
- `src/domain/hydro.ts` provides deterministic basin state, risk scoring, actions, timeline, import parsing, and briefing export.
- Panel components split the major surfaces: map, mission summary, controls, timeline, nodes, and AI briefing.
- `src/styles/tokens.css` and `src/App.css` provide an existing tokenized visual system.
- Zustand persistence in `src/stores/useAppStore.ts` already stores language, API key, and snapshots.

The redesign should keep those strengths but make the app feel more like a professional operations tool: clearer hierarchy, stronger workflow, less decorative glow, and more decision evidence.

## Product Direction

Primary direction: Professional Flood Command Suite.

The application should read as a serious operational prototype suitable for a competition demo and repeated use by emergency-management users. It should still look premium, but the premium quality should come from data clarity, polished controls, stable layout, and measured motion rather than spectacle.

## Visual Language

The visual system should become quieter and more structured.

- Replace the tall hero-first composition with a persistent app shell.
- Keep the satellite/map asset as a useful domain signal, not as a dark decorative background for the entire page.
- Reduce radial glows, large blur effects, and animated emphasis that do not communicate state.
- Use risk colors only for risk meaning: red/orange/yellow/green should map to alert severity, node score, action urgency, or threshold status.
- Keep cyan/blue as the neutral system accent, but reduce one-note blue dominance by adding neutral slate surfaces and restrained green/yellow/orange semantic accents.
- Use smaller, denser application typography. Large type is reserved for top-level risk and major map state, not every panel heading.
- Keep repeated item cards at 8px radius unless the existing panel container needs slightly larger rounding.
- Add consistent focus states and hover behavior for controls, snapshot rows, nodes, and action items.

## Information Architecture

The revised app shell should have four main regions:

1. Header
   - Brand, current mission time, language toggle, alert state, and primary run status.
   - Keep it compact and persistent.

2. Left mode rail
   - Icon navigation for the major work modes.
   - Initial implementation can keep all modes on the same page but use the rail as a structural anchor.
   - Suggested modes: Monitor, Scenario, Briefing, Exports.

3. Main command canvas
   - Basin map is the primary view.
   - Add a KPI strip directly above or over the map: risk score, peak window, storage pressure, max node.
   - Keep node markers and river overlay, but make markers easier to scan and tooltips less decorative.

4. Right decision rail
   - Priority action.
   - Risk-driver breakdown.
   - Scenario comparison summary when a comparison snapshot is selected.
   - AI/source status.

Lower analysis sections should remain available below the command canvas:

- Scenario controls.
- Forecast timeline.
- Critical node list.
- AI briefing.

## Feature Additions

### Scenario Comparison

Use the existing `snapshots` and currently unused `compareSnapshot` store field.

Behavior:

- User can select one saved snapshot as the comparison baseline.
- The UI shows deltas for risk score, peak window, storage pressure, and max node risk.
- Comparison is read-only and can be cleared.
- If no snapshot exists, the comparison UI should not add noise.

Implementation surface:

- Extend `ControlDeck` or create a focused `ScenarioComparePanel`.
- Use existing `ScenarioSnapshot` type.
- Add shared comparison helpers in a new `src/domain/compare.ts` so `hydro.ts` stays focused on basin-state calculation.

### Risk Driver Breakdown

Show why the current risk score is high.

Behavior:

- Display ranked drivers from scenario parameters.
- Drivers should be deterministic and explainable: storm intensity, reservoir level, soil saturation, gate constraint, pump readiness, forecast horizon.
- Each driver should have label, value, contribution/weight, and status.

Implementation surface:

- Add a `RiskDriver` type.
- Add `computeRiskDrivers(scenario)` next to basin-state logic or derive it inside `computeBasinState`.
- Render in the right decision rail.

### Action Readiness

Turn `state.actions` from plain recommendations into an operational queue.

Behavior:

- Each action shows urgency, expected impact, and a readiness/status control.
- Status values: planned, staged, sent, verified.
- Status should be local UI state, not part of the domain risk calculation for this iteration.

Implementation surface:

- Add action status state to `useAppStore.ts`.
- Use action title or generated action id as a stable key.
- Render in the decision rail and AI briefing action list.

### Simulation Controls

The current simulation loop uses a fixed 1500ms cadence while the store already has `simulationSpeed`.

Behavior:

- Add a simulation speed control: 0.5x, 1x, 2x, 4x.
- Make run/pause state obvious in the header and controls.
- Keep simulation bounded and predictable enough for demos.

Implementation surface:

- Wire `simulationSpeed` into `App.tsx` simulation interval.
- Expose `setSimulationSpeed` through `ControlDeck`.
- Add labels in `src/utils/i18n.ts`.

### AI Briefing Upgrade

The AI panel should feel like an analyst tool.

Behavior:

- Show local vs remote mode clearly.
- Add briefing template options: command summary, executive memo, field checklist.
- Add copy-to-clipboard and export controls.
- Show evidence chips from current risk drivers and top nodes.
- Keep remote failure fallback, but show a clear non-blocking warning when remote generation fails.

Implementation surface:

- Extend `AiBriefingPanel`.
- Extend `createAiBriefing` request with a `template` field so local and remote briefing generation use the same template selection.
- Keep markdown rendering through `BriefingRenderer`.

## Component Plan

Current files should be evolved as follows:

- `src/App.tsx`
  - Stay as orchestration, but reduce render complexity by introducing an app-shell component and derived view models.
  - Keep import/export/generate handlers here unless they become reusable.

- `src/components/layout/Topbar.tsx`
  - Become compact command header.
  - Add simulation status and clearer alert metadata.

- New `src/components/layout/ModeRail.tsx`
  - Render stable icon rail.
  - Initial version can be visual/navigation scaffolding without route changes.

- New `src/components/layout/CommandShell.tsx`
  - Own high-level page layout: header, rail, main canvas, decision rail, lower panels.

- `src/components/panels/BasinMapPanel.tsx`
  - Include KPI strip and map-toolbar actions.

- `src/components/map/BasinMap.tsx`
  - Keep SVG overlay and image foundation.
  - Reduce decorative animation, improve labels, and keep hover tooltips readable.

- New `src/components/panels/DecisionRail.tsx`
  - Priority action, drivers, comparison delta, action queue.

- `src/components/panels/ControlDeck.tsx`
  - Reorganize into scenario presets, parameter controls, simulation controls, imports/exports, snapshots, and comparison selector.

- `src/components/panels/TimelinePanel.tsx`
  - Keep Recharts graph.
  - Remove redundant native bar chart unless it serves a separate purpose, because the current panel shows both a line/area chart and a bar fallback at the same time.

- `src/components/panels/AiBriefingPanel.tsx`
  - Add template mode, copy/export actions, and evidence chips.
  - Replace emoji eye toggle with a Lucide icon.

- `src/styles/tokens.css`
  - Normalize surfaces, semantic colors, panel radii, shadow levels, and focus rings.

- `src/App.css`
  - Reorganize styles by shell, layout, map, controls, rail, charts, AI, and responsive rules.
  - Remove decorative comments only if they get in the way; otherwise keep sectioning.

## Data And State

Extend state conservatively.

Store additions:

- `compareSnapshot: ScenarioSnapshot | null` should become active in the UI.
- `simulationSpeed` should be wired to the simulation interval.
- `actionStatuses: Record<string, ActionStatus>` for local action readiness.
- `briefingTemplate` stored globally so export and generation controls stay consistent.

Domain additions:

- `RiskDriver` and `computeRiskDrivers`.
- `ScenarioDelta` and `computeScenarioDelta` if comparison logic is shared across panels.

The deterministic risk model should remain simple and testable. New UI features should explain current scoring rather than pretending to be validated hydrological science.

## Error Handling

- Import errors keep current toast/error path.
- Remote AI failures should show local briefing plus an explicit warning.
- Clipboard/export failures should show an error toast.
- Snapshot compare should handle deleted or missing snapshots by clearing the comparison.
- Empty or unavailable data should render a restrained empty state instead of hiding whole sections unpredictably.

## Accessibility And Responsive Behavior

- All icon-only buttons need text labels through `aria-label` or visible tooltips.
- Keyboard focus should be visible across buttons, file inputs, rail items, sliders, snapshot actions, and AI controls.
- Mobile layout should collapse rail/header gracefully and avoid text overlap.
- Charts and map should have accessible labels and not depend solely on color.
- Avoid viewport-scaled fonts; use stable token sizes with responsive layout changes.

## Testing And Verification

Required checks after implementation:

- `npm run test`
- `npm run build`
- Browser visual checks at desktop and mobile widths.
- Verify no obvious text overflow in buttons, KPI cards, node list, AI controls, and snapshot rows.
- Verify import JSON/CSV, export markdown, export JSON, save/load/delete snapshot, compare snapshot, simulation speed, language toggle, and AI local generation.

## Out Of Scope

- Real hydrological calibration.
- GIS integration or live telemetry ingestion.
- User accounts, cloud sync, or server-side persistence.
- Replacing the current deterministic AI fallback with a full agent workflow.
- Full route-based navigation; the mode rail will be structural in this iteration.

## Success Criteria

The redesign is successful if:

- The first screen immediately communicates a professional flood command product.
- Users can understand what changed, why the score is high, and what action is recommended.
- Scenario comparison and simulation controls make the app feel operational, not static.
- The AI panel feels like a useful briefing assistant with evidence, templates, and export controls.
- The code remains organized around current domain, store, layout, panel, and UI boundaries.
