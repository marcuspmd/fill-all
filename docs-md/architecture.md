# Architecture — Fill All

## Overview

Fill All follows the standard Chrome extension execution model for Manifest V3, with each runtime context handling a specific responsibility and communicating through message passing.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Chrome Browser                             │
│                                                                     │
│  Popup / Options / DevTools                                         │
│            │                                                        │
│            ▼                                                        │
│     Background Service Worker                                       │
│            │                                                        │
│            ▼                                                        │
│       Content Script                                                │
│            │                                                        │
│   ┌────────┼────────┬───────────────┬──────────────┬─────────────┐  │
│   ▼        ▼        ▼               ▼              ▼             ▼  │
│ Storage   Rules   AI modules   Form pipeline   Recording       Demo │
└─────────────────────────────────────────────────────────────────────┘
```

## Runtime contexts

### Background service worker

The background service worker is the central coordinator. It does **not** touch the DOM.

Current responsibilities include:

- routing extension messages to domain handlers
- registering context-menu actions
- reacting to keyboard shortcuts
- coordinating storage-backed operations
- broadcasting messages when needed
- handling demo-flow CRUD and replay orchestration
- providing tab-capture stream identifiers for replay video recording

### Content script

The content script runs inside the page and owns all DOM work.

Responsibilities include:

- detecting form fields and extracting metadata
- classifying fields through the detection pipeline
- filling values and dispatching native events
- watching dynamic DOM changes in SPAs
- rendering in-page feedback such as icons, overlays, and panels
- recording page interactions for later export or replay
- executing replay steps from the demo tooling

This is a hot path, so performance-sensitive flows use lightweight validation instead of full Zod parsing.

### Popup

The popup is intentionally compact. It currently offers four actions:

- Fill All
- Fill Contextual AI
- Fill Only Empty
- Settings

The contextual AI entry point can collect optional text, CSV, image, and PDF context before sending a fill request.

### Options page

The options page is the configuration hub. Current tabs:

- settings
- rules
- forms
- cache
- dataset
- log

This is where users configure pipeline behavior, rules, saved forms, training data, and logging-related settings.

### DevTools panel

The DevTools panel is the advanced developer surface. Current tabs:

- actions
- fields
- forms
- record
- demo
- log

The record and demo tabs are now a major part of the product surface, not side experiments.

## Communication model

All contexts communicate through Chrome extension messaging.

```text
Popup ── sendMessage ──▶ Background
Options ── sendMessage ──▶ Background
DevTools ── sendMessage ──▶ Background / inspected tab
Background ── tabs.sendMessage ──▶ Content Script
Content Script ── sendMessage ──▶ Background
```

### Typical fill flow

```text
1. User triggers Fill All or Contextual AI
2. Popup or DevTools sends a message
3. Background routes it to the active tab
4. Content script detects eligible fields
5. Value resolution runs in priority order
6. The content script fills fields and dispatches events
7. Optional caches, logs, and learned entries are updated
```

## Value resolution order

At runtime, Fill All resolves values using a priority stack.

1. ignored field → skip
2. fixed rule value
3. saved form/template value
4. contextual AI or Chrome AI value when requested and available
5. TensorFlow.js classification + generator
6. default generator fallback

This ordering keeps deterministic user configuration above AI or ML-generated values.

## Detection pipeline

The field-detection pipeline is immutable and composable. It can be reordered or customized without mutating the original pipeline instance.

Default stages include:

1. HTML/native type detection
2. keyword-based classification
3. TensorFlow.js classification
4. Chrome AI classification
5. HTML fallback classification

The pipeline returns both the chosen result and trace information about how the decision was made.

## Contextual AI filling

The contextual AI path differs from field-by-field generation.

Current behavior:

- gathers a batch of eligible fields
- builds structured descriptors for the full form
- accepts optional text, CSV, image, and PDF-derived image context
- requests a cohesive set of values for the form as a whole
- falls back to the classic `fillAllFields()` path if AI is unavailable or returns no usable result

This gives better cross-field consistency for identities, addresses, and related form data.

## Recording and demo architecture

Recording and demo tooling spans multiple layers.

### Recording

- the content script observes and records user interactions
- DevTools displays and edits recorded steps live
- exported scripts are generated from normalized step data
- optional AI optimization can refine exported output

### Demo flows

- recordings can be converted into demo flows
- demo flows are persisted and reloaded via storage-backed handlers
- replay supports pause, resume, stop, speed presets, and progress reporting
- steps can include captions, assertions, waits, and visual effects
- replay videos are recorded locally using `chrome.tabCapture` and `MediaRecorder`

## Storage model

Fill All stores its data in `chrome.storage.local`.

Common storage categories include:

- settings
- rules
- saved forms
- ignored fields
- detection cache
- learned entries
- runtime dataset and model metadata
- demo flows and related replay artifacts

Concurrent updates should go through `updateStorageAtomically()` to avoid race conditions.

## Validation strategy

The project uses a two-layer validation model.

| Layer | Used in | Approach |
|---|---|---|
| full validation | background, options, critical flows | Zod schemas + `safeParse()` |
| light validation | content-script hot paths | `typeof`-style guards |

This balances correctness with runtime cost.

## Design conventions

### Detectors and classifiers

- implemented as immutable objects, not classes
- return `null` when confidence is insufficient
- expose a `.name` and `.detect()` contract

### Generators

- pure synchronous functions
- return strings
- do not throw for normal validation problems

### Logging

- use `createLogger("Namespace")`
- avoid direct `console.log` usage in repository code

## Why the extra permissions exist

The current permission set reflects real features in the codebase.

- `tabCapture` supports replay video recording
- `webNavigation` supports navigation-aware replay and recording behavior
- `tabs`, `activeTab`, and `scripting` support cross-context coordination on the active page

## Summary

The architecture is intentionally layered:

- **background** coordinates
- **content** manipulates the page
- **popup** triggers fast actions
- **options** configures behavior
- **DevTools** exposes advanced inspection, recording, export, and demo workflows

That separation keeps the extension maintainable while allowing advanced developer workflows to grow without turning the popup into a tiny chaos machine.
