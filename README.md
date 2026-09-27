# Study Railway

A calm, local-only study timer and planner. Subjects become railway lines, goals become stations, and each focus session moves your train a little further.

## Start locally

Use Node.js 22.12+ (or a compatible newer release).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173. No keys, account, backend, or remote assets are needed. Fonts, scenery, and audio all live in the application. The server is needed to serve the app; there is no service worker or installable offline PWA in this MVP.

```sh
npm run build       # TypeScript check and production build
npm run preview     # Serve the production build
npm test            # Timer, persistence, and state tests
npm run test:e2e    # Chrome workflow, accessibility, and screenshot checks
```

Browser tests use an installed Google Chrome. To use Playwright's bundled Chromium instead, remove `channel: 'chrome'` from `playwright.config.ts`, then run `npx playwright install chromium`.

## Use your railway

- Pick a subject and a station, choose 25/5, 50/10, or your own duration, then begin.
- Pause, resume, cancel, or complete a session. **Complete** records actual elapsed focus time and credits one session; **cancel** records nothing unless the deadline has already elapsed. A break never adds study time.
- Completed focus sessions offer a break without starting it automatically. The timer survives reload and accounts for background-tab delays; closing the browser does not pause it.
- Add, rename, recolor, or delete lines. Add, edit, reorder, and manually complete stations in Study planner. Reaching a station's target completes it automatically. Plan edits are disabled during an active or paused session.
- The journal retains completed sessions even when their subject or station is deleted. Today’s totals use your device’s local calendar date.
- Drag the 3D scene to orbit, scroll to zoom, and right-drag to pan. Buttons zoom/reset the camera. Switch lighting or choose 2D anytime. Small screens and unavailable WebGL use 2D automatically.
- Nature sounds synthesize quiet wind/water with Web Audio, after you explicitly turn them on. They stop when the timer panel is unmounted and never autoplay on reload.

## Local data and recovery

Dexie stores the journey in IndexedDB as one atomic snapshot containing subjects, stations, settings, sessions, and the active timer. A temporary localStorage recovery snapshot protects changes if a reload happens before the asynchronous IndexedDB transaction commits. It is removed after a successful save. Errors expose a retry control; no data is sent to any server.

Only one tab edits at a time in browsers that support Web Locks. Close the first tab to continue in another. Browsers without Web Locks should use one tab. Clearing this site's browser data deletes the journal. This MVP has no backup/export or cross-device synchronization.

## Implementation

`src/lib/model.ts` contains timer and progress rules; `src/store` coordinates state and saving; `src/db` owns IndexedDB. Semantic HTML controls are independent from the lazy-loaded R3F/Drei/Three scene. GSAP handles brief entrance transitions; reduced-motion preferences disable ornamental motion and train interpolation. All scenery is generated with geometry, so no image or model downloads are required.

The optional 3D chunk is large because it includes the Three.js renderer. It is loaded separately from the application and never requested on the default mobile/2D path. Build size warnings for this chunk are expected.

References used for implementation: [React Three Fiber installation and React compatibility](https://r3f.docs.pmnd.rs/getting-started/installation), [Dexie transaction semantics](https://dexie.org/docs/Dexie/Dexie.transaction%28%29).
