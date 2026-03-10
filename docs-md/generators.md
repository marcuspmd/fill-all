# Data Generators — Fill All

This document describes the generator system that powers most non-AI fallback values in Fill All.

---

## Core principles

Generators in this project are expected to be:

- **pure**
- **synchronous**
- **string-returning**
- **safe to call repeatedly**

For this repository, generators should not throw during normal operation. When something cannot be generated, use a safe fallback pattern.

## What generators are used for

Generators are the reliable value engine behind the extension.

They power:

- default field filling
- fallback behavior when AI is unavailable
- rule-based generator selection
- adaptive values constrained by HTML attributes

## Main categories

### Document generators

Current repository coverage includes Brazilian document-oriented values such as:

- CPF
- CNPJ
- RG
- CNH
- PIS
- passport-style identifiers

Where appropriate, generated values include valid check digits.

### Identity and contact generators

- full names
- first and last names
- company names
- emails
- phone numbers
- usernames
- passwords
- OTP and verification-code style values

### Address generators

- street names
- house numbers
- complements
- neighborhoods
- cities
- states
- countries
- CEP / ZIP code values
- full address compositions

### Date and finance generators

- generic dates
- birth dates
- future dates
- credit-card style values
- expiration dates
- CVV values
- PIX keys
- money-like values

### Generic text generators

- short text
- descriptions
- notes
- product names
- departments
- job titles
- websites
- coupons and SKUs

### Adaptive generation

The adaptive generator family can reshape output based on field constraints such as:

- `minlength`
- `maxlength`
- `min`
- `max`
- `pattern`

This is especially useful when a detected field type is correct but the target input has validation restrictions that a default value must respect.

---

## Registry model

Generator selection is not hardcoded in one giant conditional. The project uses a registry-driven model.

At a high level:

1. field-type metadata defines which generator key a field uses
2. generator factories map keys to implementation functions
3. a central map resolves `FieldType -> generator`
4. the runtime calls `generate(type, params)` or the equivalent factory path

This makes the generator layer easier to extend without rewriting the fill engine.

## Why this matters

The generator system is one of the project’s most stable foundations:

- it works offline
- it is deterministic enough for practical testing workflows
- it complements AI instead of depending on AI
- it handles region-specific validation details that generic form fillers often ignore

---

## Conventions for new generators

When adding a generator:

1. create a dedicated file under `src/lib/generators/`
2. export named `generate*()` functions
3. keep the implementation synchronous
4. avoid side effects
5. register the generator in the central registry
6. wire it to the relevant field-type definition
7. add or update tests

### Example workflow

Typical update path:

1. add `src/lib/generators/<new-file>.ts`
2. export `generateNewThing()`
3. update `src/lib/generators/index.ts`
4. update the appropriate field-type definition mapping
5. add unit tests under the module’s `__tests__` area

## Generator behavior expectations

### Formatting

Many generators may support both formatted and raw output. If a generator accepts a `formatted` option, document that clearly and keep the default behavior predictable.

### Localization

This project is intentionally strong on Brazilian data generation. New generators should preserve that localization quality where relevant.

### Validation friendliness

Prefer values that pass common client-side validators and masks. The goal is not just to generate random text; it is to generate values that are actually useful in form testing.

---

## Relationship with rules and AI

Generators are used in multiple fill paths:

- directly through rules
- after field classification
- as fallback when contextual AI or Chrome AI cannot provide a usable value

Rules can be configured to use a specific generator per field, either from the options page or directly from the inline field-icon controls on the page:

| Rules Settings | Field Icon Rule Configuration |
|:---:|:---:|
| ![Rules](images/settings_rules.png) | ![Configure Rule from Field Icon](images/form_icons_configure_rules.png) |

So while AI gets the shiny headlines, generators are still the workhorses doing real overtime.

## Summary

If you need dependable, local, test-friendly values, the generator layer is the backbone of Fill All. Extend it carefully, keep it pure, and add tests whenever you teach it a new trick.
