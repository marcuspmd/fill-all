# Roadmap — Fill All

This roadmap reflects the current repository state more accurately than the older version. It separates work that is already shipped in code from areas that still look like strong future candidates.

---

## Already shipped

### Internationalization

Shipped capabilities include:

- locale files for English, Portuguese (Brazil), and Spanish
- UI language support through the project i18n layer

### Fill-only-empty mode

Implemented and exposed through the popup and runtime fill flow.

### Rule UX improvements

Implemented enhancements include:

- field-level rule editing support
- generator-aware previews
- smarter suggestions and quality-of-life interactions

### DOM watcher improvements

Current code supports watcher-focused behavior such as:

- handling dynamic pages and SPAs
- configurable behavior through settings
- synchronized watcher state across surfaces

### Logging improvements

Current repository capabilities include:

- centralized logging
- log viewing in extension surfaces
- filtering and export-oriented support

### AI feedback and fallback behavior

Implemented behavior includes:

- visible AI-related user feedback
- graceful fallback when AI is unavailable or times out

### Contextual AI filling

This is now **implemented**, not just planned.

Current shipped behavior includes:

- contextual fill trigger from the popup
- optional text context
- CSV uploads
- image uploads
- PDF uploads converted into images
- full-form batched generation with fallback to the regular pipeline

### E2E export and interaction recording

Shipped capabilities include:

- recording interaction flows
- pausing, resuming, stopping, and clearing recordings
- inline step editing
- framework export for Playwright, Cypress, and Pest/Dusk-style outputs
- optional AI optimization for generated scripts

### Demo generation and replay

Shipped capabilities include:

- converting recordings into saved demo flows
- replaying flows with progress tracking
- pause, resume, and stop controls
- step editing
- captions, assertions, waits, and visual effects
- replay video recording through tab capture

### Test coverage foundation

The repository already includes both unit and E2E testing infrastructure with coverage workflows.

---

## Strong next candidates

These areas are not claims of missing implementation so much as likely directions for refinement.

### Better documentation polish

- keep all docs aligned with shipped features
- rename legacy Portuguese doc filenames where helpful
- add more screenshots or short walkthroughs for recording and demo flows

### Demo and export ergonomics

- more replay templates
- richer export customization presets
- easier sharing or packaging of saved demo flows

### AI workflow refinement

- better prompt tuning for contextual form fills
- richer structured inputs for business or domain-specific forms
- stronger observability around AI fallback decisions

### Detection quality improvements

- broaden difficult field coverage
- improve confidence handling for ambiguous fields
- expand adapters for additional component libraries

### Testing depth

- increase E2E coverage for record/demo workflows
- add more regression cases for contextual AI and multimodal inputs

---

## Maintenance rule for this roadmap

When a feature is already present in code, document it as shipped. Do not leave working features sitting in the "planned" bucket like forgotten luggage at the airport.
