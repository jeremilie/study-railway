# Study Railway Implementation Plan

**Goal:** Deliver the supplied browser-only study railway MVP.
**Architecture:** Persistent Zustand domain state, accessible React controls, lazily loaded procedural 3D scenery.
**Spec:** docs/design.md and the user's pasted brief.
**Tech stack:** React 19, TypeScript, Vite, R3F 9, Three, Drei, Dexie, Zustand, GSAP, Web Audio.

## Global constraints

All data stays on this device; no APIs, accounts or backend. Respect reduced motion. Essential controls work without WebGL. Preserve user history on plan deletion. Avoid adding artificial history.

## Review focus

Background-tab timer completion; duplicate completion; reload while paused/running; empty planner after deletion; IndexedDB failure; keyboard dialogs; tiny screens and unavailable WebGL.

## Tasks

- [ ] 1. Scaffold and domain tests. Files: package/config, types/study.ts, lib/model.test.ts. Verify timer and data contracts fail before implementing.
- [ ] 2. Domain and persistence. Files: lib/model.ts, db/db.ts, store/useStudyStore.ts. Expose snapshot commands; test completion, deletion, validation, persistence. Run npm test.
- [ ] 3. Accessible shell and planner. Files: app/App.tsx, components/{Sidebar,TimerPanel,RouteMap2D,PlanEditors,DailyProgress,SessionHistory}.tsx, styles/global.css. All essential flows work in 2D; native dialogs and semantic buttons.
- [ ] 4. Scenic railway. Files: components/{ScenicRailwayScene,NatureBiome}.tsx and lib/routes.ts. Test via real browser: camera controls, station selection, biome changes, reduced motion, fallback.
- [ ] 5. Browser verification, review, fixes and handoff. Files: e2e/app.spec.ts, README.md. Run npm test, npm run build, npm run test:e2e. Inspect desktop/mobile screenshots and resolve material findings.

## Execution notes

The user explicitly requested implementation and clarification only for material product changes. Proceed through reversible implementation without extra approval gates. This is an empty directory, not a Git repository, so Git worktree/commit-dependent skill scripts do not apply. Execute coherently in place and keep progress here. No implementation architecture conflict with the brief.