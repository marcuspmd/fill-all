---
title: "Fill All — AI-Powered Form Filler That Builds Community Around Brazilian Devs & QAs"
published: false
description: "An open-source Chrome Extension that auto-fills forms with AI (Gemini Nano + TensorFlow.js) and valid Brazilian data generators — built for the dev & QA community."
tags: devchallenge, community, opensource, ai
cover_image: https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/popup.png
---

*This is a submission for the [DEV Weekend Challenge: Community](https://dev.to/challenges/weekend-2026-02-28)*

## The Community

**Fill All** was built for developers and QA engineers who spend their days filling out forms with **locally valid data** during testing and development. Every timezone, every locale, every country has its own data formats — CPF, CNPJ, RG, ID numbers, postal codes, phone numbers with regional codes — and most form-fillers don't understand them.

Standard auto-fill tools generate random strings or default to a single region's formats. Developers and QA engineers end up manually calculating valid check digits, hunting for correct postal code ranges, or switching between multiple generator websites. This happens dozens of times per sprint, across different environments and locales.

Fill All gives you a **single, privacy-first tool** that understands data validation natively — whatever your region — and goes further by using **on-device AI** to intelligently classify form fields without ever sending data to external servers.

The project is fully **open source (MIT)** and welcomes contributions from the dev and QA community.

## What I Built

**Fill All** is a Chrome Extension (Manifest V3) that automatically fills web forms using a combination of:

- 🤖 **Chrome Built-in AI (Gemini Nano)** — local LLM that classifies fields contextually
- 🧠 **TensorFlow.js** — a custom-trained MLP classifier that runs entirely in the browser
- � **Locale-aware data generators** — CPF, CNPJ, RG, CNH, PIS, CEP, phone numbers, PIX keys, credit cards, and more — all with valid check digits and regional formatting
- 📏 **Configurable rules engine** — set fixed values or specific generators per URL pattern + CSS selector
- 💾 **Saved form templates** — fill once, reuse across sessions
- 🔍 **Smart field detection pipeline** — HTML type → Keyword → TensorFlow → Chrome AI, composable and immutable
- 🎯 **E2E script export** — generates ready-to-use Playwright, Cypress, or Pest/Dusk test scripts from filled forms

### Key Features Built This Weekend

| Feature | Description |
|---------|-------------|
| **i18n** | Full internationalization — PT-BR, English, Spanish |
| **Fill Emptys Mode** | Only fills blank fields, preserving user-entered data |
| **Improved Rule UX** | Live preview, auto-suggested generators, keyboard shortcuts |
| **Enhanced DOM Watcher** | Configurable debounce, Shadow DOM support, smart refill for SPAs |
| **Advanced Logging** | Timestamped, filterable, exportable logs with audit trail |
| **AI Feedback** | Visual badges on AI-filled fields, configurable timeout, graceful fallback |
| **E2E Script Export** | Record interactions → export as Playwright/Cypress/Pest test code |
| **Comprehensive Tests** | 70+ test files with Vitest + Playwright, merged coverage reports |

### How It Works (Priority Pipeline)

```
User triggers fill → Background routes → Content Script detects fields
                                              │
                                    For each field:
                                    1. Ignored?      → Skip
                                    2. Fixed value?  → Use rule value
                                    3. Saved form?   → Use template
                                    4. Chrome AI?    → Gemini Nano (local)
                                    5. TensorFlow?   → Classify + Generate
                                    6. Fallback      → Default generator
                                              │
                                    Fill + dispatch events
                                    (input/change/blur)
```

### Privacy First

**Zero data leaves the device.** No external APIs, no telemetry, no analytics. Both AI models (Gemini Nano and TensorFlow.js) run 100% locally. All user data is stored in `chrome.storage.local` only.

## Demo

### Quick Start Video

{% youtube wdaN6umPc5w %}

### Real-World Usage Example

[Watch real-world usage example on Loom →](https://www.loom.com/share/3b725143febc4bbc803f7959b76222f4)

### Screenshots

#### Popup — Quick Actions & Generators

![Popup](https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/popup.png)

### DevTools Panel — Real-Time Field Inspection

![DevTools](https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/painel_devtools_form.png)

### Options Page — Full Configuration

| Settings | Saved Forms | Training Dataset |
|:---:|:---:|:---:|
| ![Settings](https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/config_general.png) | ![Forms](https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/config_form.png) | ![Dataset](https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/config_dataset.png) |

### Add Rules Directly From Fields

![Add Rule](https://raw.githubusercontent.com/marcuspmd/fill-all/master/docs-md/images/page_add_rules.png)

## Code

{% github marcuspmd/fill-all %}

## How I Built It

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build** | Vite 7.3 + @crxjs/vite-plugin | Modern bundling with HMR |
| **Language** | TypeScript ES2022 (strict) | Full type safety |
| **Native AI** | Chrome Prompt API (Gemini Nano) | Local LLM classification |
| **ML** | TensorFlow.js 4.22 | Client-side field classifier |
| **Validation** | Zod v4 | Schema validation (two-layer: full Zod + light typeof) |
| **Data** | @faker-js/faker | Realistic data generation |
| **Storage** | Chrome Storage API (local) | Local-only persistence |
| **Testing** | Vitest + Playwright | Unit + E2E with merged coverage |
| **Extension** | Manifest V3 | Modern Chrome extension standard |

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Popup UI   │────▶│    Background     │◀────│  Content Script  │
│             │     │  (Service Worker) │     │  (DOM + Forms)   │
└─────────────┘     └────────┬─────────┘     └────────┬─────────┘
                             │                        │
┌─────────────┐    ┌─────────┼─────────┐    ┌─────────┼─────────┐
│  Options    │    │         │         │    │         │         │
│   Page      │    ▼         ▼         ▼    ▼         ▼         │
└─────────────┘  Storage   Rules    AI    Form     DOM        │
                   │       Engine  Modules Detector Watcher     │
┌─────────────┐    │                │                           │
│  DevTools   │    │       ┌────────┴────────┐                  │
│   Panel     │    │       ▼                 ▼                  │
└─────────────┘    │   Chrome AI      TensorFlow.js             │
                   │  (Gemini Nano)    (Classifier)             │
                   │       │                 │                  │
                   │       └──► Learning ◄───┘                  │
                   │            Store                           │
                   └────────────────────────────────────────────┘
```

### Design Decisions

- **Immutable detection pipeline** — classifiers are chained via `DetectionPipeline` that returns new instances on every transformation (`.with()`, `.without()`, `.withOrder()`). This makes the pipeline composable, testable, and free from side effects.

- **Two-layer validation** — Full Zod schemas for background/options (correctness first), lightweight `typeof` checks in the content script (performance first on the hot path).

- **Atomic storage updates** — `updateStorageAtomically()` uses a per-key write queue with pure updater functions `(current: T) => T` to prevent race conditions.

- **Continuous learning loop** — Chrome AI predictions feed into a learning store (max 500 entries, FIFO). TensorFlow.js can retrain in-browser using these entries, creating a self-improving cycle.

- **Adapters pattern** — UI component libraries (Ant Design, Select2) have dedicated adapters so the form filler handles custom selects, datepickers, and cascaders correctly.

- **E2E export via Strategy pattern** — each framework (Playwright, Cypress, Pest) has its own code generator, registered in a strategy registry. Adding a new framework means adding one file.

### What I Learned

Building a Chrome extension that bridges **on-device AI with practical developer tools** taught me that the real power of Gemini Nano isn't in replacing server-side AI — it's in enabling **privacy-respecting intelligence** for tools that handle sensitive data (like form fillers). The continuous learning loop between Chrome AI and TensorFlow.js creates a system that gets smarter over time without ever leaving the user's machine.

---

**Fill All** is open source and welcomes contributions. If you're tired of manually generating valid test data or filling the same form for the hundredth time — this one's for you.

{% github marcuspmd/fill-all %}
