# Security Policy

## Supported Versions

The project is maintained on the `master` branch.

| Version | Supported |
| --- | --- |
| `master` | ✅ |
| Older snapshots, forks, and custom builds | ❌ |

## Reporting a Vulnerability

Please do **not** open a public issue for security vulnerabilities.

Preferred reporting order:

1. Use GitHub's **Report a vulnerability** / Security Advisory flow for this repository: <https://github.com/marcuspmd/fill-all/security/advisories/new>.
2. If the private advisory flow is not available in the repository UI, contact the maintainer privately through GitHub: <https://github.com/marcuspmd>.
3. Include `fill-all` in the report title and provide enough detail to reproduce and assess the issue.

Useful details to include:

- affected version, branch, or commit
- impacted extension surface (`background`, `content`, `popup`, `options`, `devtools`, storage, messaging, etc.)
- clear reproduction steps or proof of concept
- expected impact and any required permissions
- screenshots, logs, or a minimal demo page when relevant

## Response Expectations

Best effort process:

- initial acknowledgement as soon as the report is reviewed
- triage and severity assessment after reproduction
- fix planning and coordinated disclosure when the issue is confirmed

Response times may vary because this is an open-source project maintained on a best-effort basis.

## Disclosure Guidelines

- Please allow time for triage and a fix before public disclosure.
- Avoid publishing exploit details, proof-of-concept code, or reproduction steps in public issues or discussions.
- Once resolved, the fix can be disclosed through the normal repository history, release notes, or advisory flow.

## Scope Notes

Reports are especially helpful for issues involving:

- extension permissions and over-broad access
- content script or messaging trust boundaries
- unsafe DOM injection or XSS vectors
- storage of sensitive data
- CSP or Manifest V3 policy bypasses
- AI, export, recording, replay, or file-import flows that could lead to code injection or privilege escalation

General support questions, setup issues, and feature requests should go through the normal repository issue flow.