## Review

**Actionable findings:** No issues found.

- **Correct:** `index.ts:4–12` defers registration until `session_start`, excludes every non-RPC mode, and exactly preserves the supplied server configuration.
- **Correct:** Installed Pi declarations support the mode check and late registration (`dist/core/extensions/types.d.ts:212–217,1337–1351`). Both referenced Markdown documents were read completely.
- **Correct:** `package.json:17–19` exposes the extension directly. No unnecessary dependencies, subprocess management, or configuration writes.
- **Correct:** README preserves the existing agent and documents built-in MCP prerequisites, configuration precedence, and the accepted all-RPC limitation (`README.md:6,20,48–53`).

### Coverage

`tests/extension.test.mjs:30–59` covers exact RPC registration, TUI/print/JSON exclusion, and discovery without registration. Parent reports five passing tests; execution was prohibited during this review.

Tests mock Pi’s API: actual loading, connection, reload, and cleanup remain unverified. No installation, settings changes, process launches, or source edits occurred. No Git baseline exists; all four files were reviewed as additions.

**Merge verdict: OK** for the reviewed additions; live integration remains unverified.