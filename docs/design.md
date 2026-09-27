
# Study Railway design

Build the supplied local-only study planner using React, TypeScript, Vite, R3F/Three/Drei, Zustand, Dexie, GSAP, and Web Audio. No remote assets or services at runtime.

## Experience

A warm-paper dashboard with a forest-green sidebar, subject lines, a scenic miniature railway, a focus timer, a station itinerary, and daily progress. Fraunces headings and DM Sans UI are bundled locally. Desktop has a sidebar and map/timer columns; mobile uses a readable 2D route and stacked controls. Navigation switches between the railway, full planner, and session journal.

## Architecture and decisions

Zustand holds an immutable domain snapshot. Dexie stores that snapshot atomically; serialized writes prevent old updates overwriting newer ones. IndexedDB errors remain visible and can be retried. Seed only an absent database, never an intentionally empty plan. Active timer state survives reload. Only one tab may edit at a time when Web Locks are supported, avoiding last-writer-wins loss.

Timer state uses a persisted deadline, accumulated elapsed time, and a paused state. Completion atomically updates station and history, and clears the active session. Manual completion records actual elapsed time. A completed focus session offers a break, never starts it automatically. Breaks never count as study sessions. Changing selection and editing the plan are locked during an active timer so session ownership cannot drift. Durations range from 1–180 focus minutes and 1–60 break minutes.

One reusable low-poly scene combines an island, curved rails, station buildings, a lake, trees, and a moving train, with forest/mountains/village/coast variants. Canvas is lazy-loaded. A permanent 2D itinerary provides every essential interaction; small screens and WebGL failures default to 2D. Reduced motion stops ornamental animation and train interpolation. Browser-native dialog provides focus containment and Escape handling. No fake study history is seeded.

## Verification

Domain tests cover wall-clock drift, pause/resume, ownership, exactly-once completion, cancellation, validation, deletion, local-day totals, persistence, empty-data reload and failure recovery. Browser tests exercise planning, focus/break controls, persistence, responsive behavior and accessibility. Production build and desktop/mobile visual inspection complete the work.