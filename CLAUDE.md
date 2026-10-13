# Freecloud Macro Recorder

Chrome Manifest V3 extension that records and replays web tasks.

## Commands

- `npm run build` — type-check + production build to `dist/`
- `npm test` — run all unit tests (vitest)
- `npm run lint` — eslint check
- `npm run dev` — vite dev server with HMR

## Architecture

- `src/background/` — Service worker: CDP network capture, timeline aggregation, playback orchestration, storage
- `src/content/recorder/` — Content script recording: event listeners (capture phase), selector generation (SelectorChain), MutationObserver, preconditions
- `src/content/player/` — Content script playback: step interpreter, human simulation (typing delays, click randomization), CAPTCHA detection/handling, wait-for conditions
- `src/popup/` — Preact popup UI: record controls, macro library, detail view with timeline visualization
- `src/shared/` — Types (discriminated union messages, timeline events with BaseEvent), message bus, constants, utilities

## Key Patterns

- **SelectorChain**: Multiple selector strategies per element, ordered by confidence. Playback tries each until one resolves.
- **CDP timing**: `getResponseBody` after `Network.loadingFinished`, not `responseReceived`.
- **React inputs**: Use native property descriptor setter (`HTMLInputElement.prototype.value.set`) for framework-compatible value setting.
- **Service worker keepalive**: Port connection + `chrome.alarms` + periodic flush to `chrome.storage.session`.
- **Message passing**: Async handlers must `return true` from `onMessage` to keep channel open.

## Conventions

- TypeScript strict mode, zero production dependencies
- Capture-phase event listeners to work with frameworks that stopPropagation
- Test environment: vitest + jsdom + chrome API mocks in `tests/setup.ts`
