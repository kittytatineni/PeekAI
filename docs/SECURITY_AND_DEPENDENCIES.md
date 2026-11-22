# Dependency security review — 21 November 2026

## Evidence and status

On Windows, `npm ci` installed 471 packages and `npm audit` reported **20 unresolved findings: 9 moderate, 10 high, 1 critical**. `npm audit fix --dry-run` did not apply any changes. No `npm audit fix` or `npm audit fix --force` was applied. These findings are **not remediated**. An audit finding is not proof of exploitability in this particular deployment, but it must not be represented as secure.

| Dependency chain | Reported concern | Current decision |
|---|---|---|
| electron-builder 24 / app-builder-lib / builder-util / tar | Critical tar archive path traversal and high-severity build/update dependencies | Defer breaking electron-builder 26 migration until separately tested |
| Electron 30 / extract-zip | High-severity Electron and archive extraction advisories | Defer breaking Electron major upgrade; avoid distributing prototype to untrusted users |
| Vite 5 / esbuild | Moderate development-server request exposure | Restrict dev server to localhost; avoid exposing to networks |
| minimatch / glob / TypeScript ESLint chain | Moderate glob-processing advisories | Reassess after non-breaking updates on a test branch |

The exact advisory list and resolved dependency tree should be regenerated with `npm audit --json` at review time. Do not equate a finding count with 20 independent exploitable bugs.

## Verification and remaining issues

- `npm ci`: successful.
- Vite frontend, Electron main and preload: compiled successfully.
- Windows Electron packaging: **failed** because 7-Zip could not create symbolic links while extracting electron-builder's `winCodeSign` tools (`A required privilege is not held by the client`). This is an OS permissions/packaging issue, not a successful installer build. Test Windows Developer Mode or elevated PowerShell separately.
- No security penetration testing, production deployment review, or signed Windows installer verification has been performed.
- `backend/ai/llm.py` currently logs raw model responses at warning level. Avoid sensitive/student content in evaluation inputs, restrict logs, and remove raw-response logging before real-user deployment.

## Risk acceptance for academic demonstration

The current dependency lockfile is intentionally frozen to preserve the reproducible demo. The prototype should run only with synthetic or authorised, non-sensitive content, on a trusted local machine. Do not publicly distribute the desktop installer or accept private student data until applicable vulnerabilities, logging, authentication and storage risks have been reviewed. A future upgrade should be isolated on a branch and validated with `npm ci`, tests, build, desktop smoke test and repeat audit. This is a **time-limited, documented risk acceptance**, not a vulnerability fix.
