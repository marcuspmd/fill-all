# Privacy Policy — Fill All

**Last updated:** February 2026

## Summary

Fill All is designed to run locally in the browser. Its built-in filling, AI, recording, and demo workflows do not rely on a project-owned backend service.

The extension operates with:

- `chrome.storage.local`
- browser-side field detection and filling
- TensorFlow.js running on-device
- Chrome Built-in AI / Gemini Nano when available locally in Chrome

## Data stored locally

The extension may store the following information **locally on the user’s device**:

- extension settings and preferences
- user-defined fill rules
- saved forms and templates
- ignored field definitions
- field-detection cache entries
- learned entries used for local ML improvements
- runtime dataset additions
- runtime-trained TensorFlow model metadata and weights
- recordings, demo flows, and replay artifacts
- locally generated logs, depending on user settings

These items are stored in Chrome extension storage and are not intended to be sent to a Fill All backend service, because the project does not ship with one.

## What Fill All does not collect by default

The repository does not include built-in analytics or telemetry that sends data to external servers.

By default, the extension does not intentionally collect or transmit:

- browsing history as an external analytics feed
- user-typed form values to third-party servers
- geolocation data
- remote telemetry about extension usage

## AI usage

Fill All currently supports two local AI and ML paths.

### TensorFlow.js

- runs in the browser
- uses local extension assets and storage-backed runtime data

### Chrome Built-in AI / Gemini Nano

- relies on the browser’s on-device AI capabilities
- is used locally when the browser environment supports it

The extension is designed around local processing and local fallbacks.

## Permissions and why they exist

| Permission | Purpose |
|---|---|
| `storage` | Save settings, rules, forms, logs, caches, datasets, recordings, and demo data locally |
| `activeTab` | Operate on the current tab the user is interacting with |
| `scripting` | Coordinate page-level execution where needed |
| `contextMenus` | Add extension actions to the right-click menu |
| `tabs` | Route messages and inspect the active tab context |
| `tabCapture` | Record replay videos from demo flows |
| `webNavigation` | Support navigation-aware recording and replay flows |

Host permissions:

- `https://*/*`
- `http://*/*`

These are used so the extension can run on pages where the user chooses to use Fill All.

## User control

Users can control or remove local data by:

- deleting rules
- deleting saved forms
- clearing caches
- clearing learned data or datasets where supported
- removing or reloading the extension from Chrome

## Third-party services

The project does not include a project-owned remote API for form filling or analytics. If future integrations add optional remote services, this policy should be updated before release.

## Contact

For questions or issues related to privacy, use the project issues page:

<https://github.com/marcuspmd/fill-all/issues>
