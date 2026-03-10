# Contributing — Fill All

Thanks for contributing to Fill All. This guide covers the current development workflow, repository conventions, and what to validate before opening a pull request.

---

## Requirements

- Node.js 18+
- npm 9+
- Google Chrome 128+
- Chrome 131+ if you want to exercise Chrome Built-in AI features locally

## Setup

```bash
git clone https://github.com/marcuspmd/fill-all.git
cd fill-all
npm install
npm run build
```

Then load `dist/` in `chrome://extensions/` with Developer mode enabled.

## Common commands

### Development

| Command | Purpose |
|---|---|
| `npm run dev` | Vite development build |
| `npm run build` | Production build |
| `npm run clean` | Remove `dist/` |
| `npm run type-check` | TypeScript validation |
| `npm run train:model` | Train the TensorFlow model |
| `npm run import:rules` | Import rules into the runtime dataset |

### Testing and validation

| Command | Purpose |
|---|---|
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Run unit tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright in UI mode |
| `npm run test:e2e:coverage` | Run instrumented E2E coverage flow |
| `npm run test:all` | Run unit and E2E tests sequentially |
| `npm run validate` | Validate types, unit tests, and build |
| `npm run validate:quick` | Faster validation pass |
| `npm run validate:full` | Validate types, unit, build, and E2E |

---

## Repository structure

```text
src/
├── background/      # Service worker and handlers
├── content/         # Content script runtime
├── popup/           # Minimal popup UI
├── options/         # Main configuration page
├── devtools/        # DevTools panel and advanced workflows
├── lib/             # Core libraries
└── types/           # Shared contracts
```

Useful library areas under `src/lib/`:

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

## Project conventions

### TypeScript and exports

- strict TypeScript only
- avoid implicit `any`
- use named exports only
- prefer `@/*` imports

### Naming

| Category | Convention | Example |
|---|---|---|
| functions | `verbNoun` | `detectAllFields()` |
| detector objects | immutable `const` object | `htmlTypeDetector` |
| storage helpers | `get*`, `save*`, `delete*` | `saveRule()` |
| parsers | `parse*Payload()` | `parseRulePayload()` |
| constants | `UPPER_SNAKE_CASE` | `STORAGE_KEYS` |
| types | `PascalCase` | `FormField` |

### Error handling

- do not throw from storage helpers, parsers, or generators
- for Zod parsing, use `safeParse()` and return `null` on failure
- wrap async logic in `try/catch` and log context with `createLogger()`

### Validation layers

| Layer | Where to use |
|---|---|
| full Zod validation | background, options, critical paths |
| light validation | content-script hot paths |

### Logging

Use `createLogger("Namespace")`. Avoid direct `console.log` in project code.

### Zod note

Use `z.uuid()` instead of `z.string().uuid()`.

---

## Working in key areas

### Adding a new generator

1. add a new file under `src/lib/generators/`
2. export named `generate*()` helpers
3. register the generator in the central registry
4. update field-type metadata if needed
5. add unit tests

### Adding a new classifier or detector

1. implement it as an immutable object, not a class
2. return `null` when confidence is insufficient
3. register it through the classifier pipeline setup
4. update tests for ordering, fallback, and confidence behavior

The detection strategy can be tuned from the settings page:

![Detection Strategy Settings](images/settings_detection_strategy.png)

### Working on rules

Rules can be configured from three surfaces:

1. **Options page** — bulk management and import/export
2. **Field icons on the page** — quick per-field rules without leaving the site
3. **DevTools panel** — inline editing during development sessions

![Rules in Options](images/settings_rules.png)

![Configure Rule from Field Icon](images/form_icons_configure_rules.png)

![Edit Rules in DevTools](images/devtools_edit_rules.png)

### Working on recording and E2E export

The recording workflow runs from the DevTools panel. Recordings can be exported to Playwright, Cypress, or Pest/Dusk-style test scripts, with optional AI optimization.

| Recording | Export Tests |
|:---:|:---:|
| ![Recording](images/devtools_recording.png) | ![Export Test](images/devtools_record_export_test.png) |

### Working on demo flows

Demo flows are created from recordings and can be replayed with visual effects, captions, and assertions.

| Demo Edit | Add Effect | Record to Demo |
|:---:|:---:|:---:|
| ![Demo Edit](images/devtools_demo_edit.png) | ![Add Effect](images/devtools_demo_edit_add_effect.png) | ![Record to Demo](images/devtools_record_to_demo.png) |

### Working on content-script behavior

Remember that the content script is a hot path.

- avoid unnecessary heavy validation
- be careful with DOM traversals
- keep replay and watcher behavior efficient

### Working on DevTools tooling

The DevTools surface now includes recording and demo workflows. Changes here should consider:

- shared panel state
- live updates from the inspected tab
- replay progress events
- export and recording UX

---

## Testing expectations

### Unit tests

- use Vitest
- file suffix: `.test.ts`
- place tests close to the module area or under the expected project structure

### E2E tests

- use Playwright
- file suffix: `.test.e2e.ts`
- use the project fixtures when E2E coverage is required

Before submitting a PR, run at least:

```bash
npm run type-check
npm test
npm run build
```

For behavior changes in recording, replay, demo, or form-filling flows, run the relevant E2E coverage too.

## Pull-request guidance

Please aim for:

- focused branches
- small, reviewable commits
- updated tests when behavior changes
- updated docs when product behavior or developer workflow changes

If the change significantly alters architecture or workflows, document the reasoning in the PR description.

## Debugging tips

- background: inspect the extension service worker from `chrome://extensions/`
- content script: inspect the page and switch to the extension execution context if needed
- DevTools panel: open the Fill All panel directly in Chrome DevTools

## AI-related setup note

Chrome Built-in AI support depends on the local browser environment. If those features are unavailable, the repository should still behave correctly via non-AI and TensorFlow-backed fallbacks.

That fallback behavior is intentional and should stay healthy.
