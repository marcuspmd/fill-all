# AI Pipeline — Fill All

This document describes the current detection, AI, and machine-learning pipeline used by Fill All.

---

## High-level model

Fill All does not rely on a single strategy. It combines deterministic rules, structural detection, ML classification, and optional AI-assisted generation.

The current stack includes:

- rules and saved templates
- HTML and keyword-based heuristics
- TensorFlow.js classification
- Chrome Built-in AI / Gemini Nano classification and generation
- adaptive generators as fallback output providers

## Two distinct AI-related flows

### 1. Field classification pipeline

Used during standard form detection and filling.

Typical order:

1. HTML/native type classifier
2. keyword classifier
3. TensorFlow.js classifier
4. Chrome AI classifier
5. HTML fallback classifier

This path determines **what a field is**.

### 2. Contextual AI fill

Used when the user explicitly chooses contextual AI fill.

This path determines **what values should be generated for the full form**.

Unlike the standard flow, it can process the form as a batch and keep values coherent across related fields.

---

## Detection pipeline behavior

The detection pipeline is immutable. Customization returns a new pipeline instance instead of mutating the existing one.

Examples of supported customization patterns:

- reorder classifiers
- remove specific classifiers
- inject additional classifiers

That keeps the pipeline predictable and easy to test.

## Built-in classifier stages

### HTML/native type classifier

- fast
- deterministic
- highest-confidence source for native types

### Keyword classifier

- uses field signals such as label, name, id, placeholder, and autocomplete
- handles common localized patterns well

### TensorFlow.js classifier

- browser-side MLP model
- works offline
- can use runtime-trained data in addition to bundled assets

### Chrome AI classifier

- uses Chrome Built-in AI / Gemini Nano when available
- supports richer semantic interpretation
- typically acts later in the pipeline because it is more expensive than structural heuristics

### HTML fallback classifier

- last-resort path
- ensures the pipeline can still return a usable guess in weak-signal scenarios

---

## TensorFlow.js pipeline

### Input signals

The ML pipeline is fed by normalized form-field metadata, including combinations of:

- label text
- `name`
- `id`
- placeholder
- autocomplete hints
- input type
- structural metadata such as `required` or `pattern`

### Feature representation

The codebase uses structured signals and n-gram style processing to convert field metadata into model-friendly vectors.

Important ideas:

- normalized text
- weighted signal tiers
- metadata tokens
- trigram/vectorized representations

### Runtime model behavior

The project supports both:

- a bundled model shipped with the extension
- a runtime-trained model persisted locally in browser storage

Runtime-trained models can take precedence when present.

### Learning loop

Fill All also maintains learned entries from user activity and rules. Those entries can improve classification and can feed retraining workflows.

---

## Chrome Built-in AI

### What it is used for

Chrome AI is currently used in two ways:

- field-level classification/generation support
- contextual whole-form filling when the user explicitly requests it

### Availability model

Chrome AI features depend on the user’s Chrome version and local model availability. The extension must handle unavailability gracefully.

The current code does that by falling back to the standard non-AI filling path when AI is not available or returns no useful output.

---

## Contextual AI fill in practice

The contextual AI flow is one of the biggest differences between the older docs and the current code.

### Current inputs supported by the popup

The popup can collect optional context from:

- free text
- CSV uploads
- image uploads
- PDF uploads converted into page images

### Current runtime behavior

The `fillContextualAI` path currently:

- detects eligible fields
- skips ignored fields
- respects settings like empty-only behavior where applicable
- builds structured field descriptors for the full form
- sends one batched request for the form rather than isolated requests per field
- uses optional multimodal context when provided
- falls back to the regular fill pipeline if nothing useful is returned

This improves consistency for related values such as:

- full name + email
- address + ZIP code + city
- company + role + department

---

## Value resolution priority

Even with AI available, Fill All still preserves deterministic user-configured behavior.

Priority order:

1. ignored field
2. fixed rule value
3. saved form/template value
4. AI-assisted value generation when explicitly requested or configured
5. TensorFlow.js classification + generator
6. default generator fallback

This matters because the product is not "AI-only"; it is a hybrid automation tool.

---

## Training and evaluation data

The repository includes dedicated dataset modules for:

- training data
- validation data
- test data
- runtime dataset entries curated by the user

Related helpers also support:

- augmentation
- dataset health checks
- integration between learned entries and runtime datasets

---

## Practical implications for contributors

When changing AI or ML behavior:

- keep the pipeline immutable
- do not force a classifier result when confidence is weak
- prefer `null` over low-confidence noise
- preserve local-only behavior where possible
- update tests and docs together when adding new AI entry points or datasets

## Summary

Fill All’s AI pipeline is best understood as a layered decision system:

- rules and templates first
- heuristics next
- ML and AI where they add value
- generators as the reliable output engine

That hybrid design is what makes the extension practical instead of magical-in-a-slide-deck-only.
