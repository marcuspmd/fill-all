# Modules — Fill All

This document is a high-level map of the main repository modules and what they currently do.

---

## Application surfaces

### `src/background/`

Central service-worker code.

Key responsibilities:

- register message handlers
- route commands from popup, options, DevTools, and content script
- coordinate storage-backed actions
- manage demo-flow operations and replay status
- support stream-id requests for tab-capture recording

Important files:

- `service-worker.ts`
- `handler-registry.ts`
- `context-menu.ts`
- `broadcast.ts`

### `src/background/handlers/`

Domain-specific message handlers.

Current handler families include:

- rules
- storage
- cache
- learning
- dataset
- demo

---

### `src/content/`

The page runtime.

The content script currently handles:

- field detection
- form filling
- contextual AI filling
- field highlighting and feedback
- DOM watcher state
- recording browser interactions
- replaying demo steps inside the page

Main entry point:

- `content-script.ts`

---

### `src/popup/`

The popup is intentionally minimal.

Current user actions:

- Fill All
- Fill Contextual AI
- Fill Only Empty
- Settings

Relevant files include:

- `popup.ts`
- `popup-ai-context-modal.ts`
- `popup-messaging.ts`

---

### `src/options/`

The options page is the configuration center.

Current tabs/modules:

- `settings-section.ts`
- `rules-section.ts`
- `forms-section.ts`
- `cache-section.ts`
- `dataset-section.ts`
- `log-section.ts`

The options page initializes these modules from `options.ts`.

---

### `src/devtools/`

Advanced tooling integrated into Chrome DevTools.

Current tabs:

- actions
- fields
- forms
- record
- demo
- log

Important files:

- `devtools.ts`
- `panel.ts`
- `panel-state.ts`
- `panel-messaging.ts`
- `panel-utils.ts`

Key tab modules:

- `tabs/actions-tab.tsx`
- `tabs/fields-tab.tsx`
- `tabs/forms-tab.tsx`
- `tabs/record-tab.tsx`
- `tabs/demo-tab.tsx`
- `tabs/log-tab.tsx`

---

## Core libraries

### `src/lib/ai/`

AI and ML support code.

Highlights:

- Chrome Built-in AI integration
- TensorFlow.js classifier support
- learning store
- runtime model training and loading

Representative files:

- `chrome-ai.ts`
- `learning-store.ts`
- `runtime-trainer.ts`
- `tensorflow-generator.ts`

---

### `src/lib/form/`

Form detection and filling engine.

Key responsibilities:

- detect fields on the page
- extract labels, selectors, and signals
- classify fields through the detection pipeline
- resolve values from rules, templates, AI, or generators
- fill fields and dispatch input/change/blur events
- manage DOM watcher behavior
- render visual helpers such as overlays and field icons

Important files:

- `form-detector.ts`
- `form-filler.ts`
- `dom-watcher.ts`
- `field-icon.ts`
- `field-overlay.ts`

---

### `src/lib/form/detectors/`

Classification pipeline and strategies.

Important files:

- `pipeline.ts`
- `detector.interface.ts`
- `classifiers.ts`
- `strategies/*.ts`

Built-in classifier families include:

- HTML/native type detection
- keyword-based classification
- TensorFlow-based classification
- Chrome AI-based classification
- HTML fallback classification

---

### `src/lib/form/extractors/`

Utilities that convert DOM elements into structured field signals.

Main responsibilities:

- find the best label candidate
- generate stable selectors
- build normalized signal text
- process structural metadata used by classifiers

---

### `src/lib/form/adapters/`

Support for custom UI component libraries.

The repository currently includes adapters for:

- Select2
- multiple Ant Design components

These adapters allow detection and filling logic to work with non-native form widgets.

---

### `src/lib/generators/`

Pure synchronous data generators.

Current categories include:

- documents
- names
- contact data
- addresses
- dates
- finance
- generic text and authentication values
- adaptive generation constrained by field attributes

Representative files:

- `cpf.ts`
- `cnpj.ts`
- `rg.ts`
- `name.ts`
- `address.ts`
- `date.ts`
- `finance.ts`
- `misc.ts`
- `adaptive.ts`
- `index.ts`

---

### `src/lib/dataset/`

Training, evaluation, and runtime dataset support.

Includes:

- built-in training data
- validation data
- test data
- runtime dataset CRUD
- augmentation and health-check helpers
- field dictionary and dataset integration helpers

---

### `src/lib/storage/`

Typed wrappers around `chrome.storage.local`.

Current storage areas include:

- rules
- forms
- settings
- ignored fields
- field-detection cache

Atomic writes should go through `updateStorageAtomically()`.

---

### `src/lib/rules/`

Rule resolution logic based on URL patterns and selectors.

This module decides when a field should use:

- a fixed value
- a generator
- a site-specific override

---

### `src/lib/messaging/`

Message validation and parsing.

Two-layer approach:

- full Zod validation for critical or non-hot-path flows
- lightweight validators for the content script hot path

---

### `src/lib/logger/`

Centralized logging utilities.

Features include:

- namespaced loggers
- runtime configuration
- shared log viewer support
- export-friendly structured entries

---

### `src/lib/demo/`

Demo generation, replay, and recording support.

Current capabilities include:

- deterministic demo flows
- replay orchestration
- navigation-aware replay helpers
- cursor overlays
- recording conversion
- screen-recording support for replay videos
- storage and schema helpers for demo flows

This is one of the biggest areas that older documentation under-described.

---

### `src/lib/e2e-export/`

Utilities for exporting recorded interactions into runnable test scripts.

Current concerns include:

- action capture
- action recording
- assertion generation
- smart selectors
- framework-specific generator registry

---

### `src/lib/shared/`

Shared utilities used across multiple subsystems.

Examples:

- n-gram helpers
- feature/signal text builders
- field type catalog helpers

---

### `src/lib/ui/`

Reusable UI rendering helpers and shared components.

Used by popup, options, DevTools, and in-page experiences.

---

### `src/lib/url/`

URL matching helpers for safe pattern resolution.

---

### `src/lib/chrome/`

Chrome API wrappers, including active-tab messaging helpers.

---

## Types and schemas

### `src/types/`

Shared TypeScript contracts for the whole repository.

Includes:

- `FieldType`
- `FormField`
- `FieldRule`
- `SavedForm`
- `Settings`
- extension message types
- UI and repository interfaces

---

## Practical reading order

If you are new to the codebase, a useful read order is:

1. `README.md`
2. `docs-md/architecture.md`
3. `src/background/service-worker.ts`
4. `src/content/content-script.ts`
5. `src/lib/form/form-filler.ts`
6. `src/devtools/panel.ts`
7. `src/devtools/tabs/record-tab.tsx`
8. `src/devtools/tabs/demo-tab.tsx`

That path takes you from the public product story into the code that does the real work.
