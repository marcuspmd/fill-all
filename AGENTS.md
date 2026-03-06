# AGENTS.md — Fill All Chrome Extension

Fill All is a Manifest V3 Chrome extension for smart form filling, contextual AI-assisted filling, recording, E2E export, and demo replay.

This file is a practical contributor reference for humans and coding agents working inside the repository.

---

## Project snapshot

- **Product**: Chrome extension for filling forms with AI, rules, templates, and generators
- **Language**: TypeScript in strict mode
- **Build tool**: Vite + `@crxjs/vite-plugin`
- **UI runtime**: Preact-based components plus DOM-rendered extension surfaces
- **Validation**: Zod v4 for critical paths, light validators for hot paths
- **ML stack**: TensorFlow.js + Chrome Built-in AI / Gemini Nano integration
- **Minimum Chrome**: 128

## Verified scripts

### Build and development

```bash
npm install
npm run dev
npm run build
npm run clean
npm run type-check
npm run train:model
npm run import:rules
```

### Testing and validation

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:coverage
npm run test:all
npm run coverage:merge
npm run coverage:all
npm run validate
npm run validate:quick
npm run validate:full
npm run health
npm run health:save
npm run health:compare
```

Load the built extension from `dist/` in `chrome://extensions/` with Developer mode enabled.

---

## Test layout

```text
src/
  lib/
    <module>/
      __tests__/
        *.test.ts
        e2e/
          *.test.e2e.ts
```

### Naming rules

| Kind | Suffix | Tool |
|---|---|---|
| Unit | `.test.ts` | Vitest |
| End-to-end | `.test.e2e.ts` | Playwright |

### Coverage notes

- unit coverage: `.coverage/unit/`
- E2E coverage: `.coverage/e2e/`
- merged output: `coverage/`
- E2E tests that need coverage should import `test` from `@/__tests__/e2e/fixtures`

---

## Architectural map

```text
Popup / Options / DevTools
          │
          ▼
Background Service Worker
          │
          ▼
Content Script
          │
 ┌────────┼────────┬──────────────┬───────────────┬───────────┐
 ▼        ▼        ▼              ▼               ▼           ▼
Storage  Rules   AI modules   Form detection   Recording    Demo replay
```

### Execution contexts

#### Background

The service worker is the routing hub. It coordinates messaging, storage access, context-menu actions, keyboard shortcuts, replay orchestration, and demo-related stream requests.

#### Content script

The content script owns DOM interaction. It detects fields, fills values, watches dynamic pages, records page interactions, and executes replay steps.

#### Popup

The popup is intentionally minimal and currently exposes four actions:

- Fill All
- Fill Contextual AI
- Fill Only Empty
- Settings

#### Options page

The options page is the main configuration UI. Current tabs:

- settings
- rules
- forms
- cache
- dataset
- log

#### DevTools panel

The DevTools panel is the advanced tooling surface. Current tabs:

- actions
- fields
- forms
- record
- demo
- log

---

## Major repository areas

### `src/background/`

- `service-worker.ts`: central message entry point
- `handler-registry.ts`: domain dispatch
- `handlers/`: rules, storage, cache, learning, dataset, demo, and related operations

### `src/content/`

- `content-script.ts`: page runtime for detection, filling, recording, replay, watcher state, and in-page feedback

### `src/popup/`

- popup UI and contextual AI input modal

### `src/options/`

- tabbed configuration page for settings, rules, forms, cache, dataset, and log views

### `src/devtools/`

- DevTools entry points, shared panel state, tab modules for actions, fields, forms, record, demo, and log

### `src/lib/`

Key libraries include:

- `ai/`
- `form/`
- `generators/`
- `dataset/`
- `storage/`
- `rules/`
- `messaging/`
- `logger/`
- `demo/`
- `e2e-export/`

---

## Coding conventions

### Imports

- prefer `@/*` imports over granular aliases
- use named exports only
- use barrel exports for larger module families when appropriate

### Naming

| Category | Convention | Examples |
|---|---|---|
| detectors/classifiers | immutable `const` objects | `htmlTypeDetector`, `tensorflowClassifier` |
| functions | `verbNoun` | `detectAllFields()`, `generateCpf()` |
| storage helpers | `get*`, `save*`, `delete*`, `*ForUrl` | `getRulesForUrl()` |
| types | `PascalCase` | `FormField`, `FieldRule` |
| constants | `UPPER_SNAKE_CASE` | `DEFAULT_PIPELINE` |
| parsers | `parse*Payload()` | `parseRulePayload()` |

### Error handling

- do not throw from storage helpers, parsers, or generators
- use `safeParse()` for Zod parsers and return `null` on failure
- wrap async flows in `try/catch` with contextual logger messages

### Validation model

| Layer | Where | Strategy |
|---|---|---|
| full validation | background, options, critical paths | Zod schemas + `safeParse()` |
| light validation | content-script hot paths | `typeof` and lightweight checks |

### Logging

- use `createLogger("Namespace")`
- do not write directly with `console.log`

### Storage

- use `chrome.storage.local`
- prefer `updateStorageAtomically()` for concurrent writes

### Zod note

Use `z.uuid()` instead of `z.string().uuid()`.

---

## Filling priority

Current value resolution order is:

1. ignored field → skip
2. fixed rule value
3. saved form/template
4. contextual AI or Chrome AI path when requested and available
5. TensorFlow classification + generator
6. default generator fallback

## Demo and recording capabilities

Current codebase capabilities include:

- recording browser interactions from DevTools
- pausing, resuming, stopping, and clearing recordings
- editing recorded steps inline
- exporting scripts for multiple test frameworks
- optional AI optimization for generated scripts
- converting recordings into saved demo flows
- replaying demos with progress updates
- step-level effects, captions, assertions, and seeded generation
- recording replay video with tab capture

---

## Working guidelines for contributors and agents

- keep changes small and focused
- preserve existing public APIs unless the task requires otherwise
- add or update tests when behavior changes
- prefer read-first investigation before editing
- avoid introducing direct DOM work into the background context
- treat the content script as a hot path: performance matters
- when documenting behavior, prefer what the code currently does over older markdown claims

For more detail, use the docs in `docs-md/` as the source of project-level documentation.
