## Copilot / AI Agent Instructions for docker-swarm-dashboard

**Project purpose:** Lightweight Docker Swarm dashboard. Target image size < 25 MB. Not intended for public exposure. See `README.md` for details.


- Big picture
  - React frontend (`app-src/`) + Go backend (`server-src/`). Frontend uses React 19, Webpack, Jotai (`atomWithHash` for URL-hash state). Backend uses Docker SDK and gorilla/websocket.
  - Mock API (`app-src/mock/api/api-mock.mjs`) runs on port 3001; dev server on port 3000. `yarn start` starts both.

- Key entry points
  - `app-src/package.json` — all scripts and dependencies (use `yarn`)
  - `app-src/src/common/store/atoms.js` — all Jotai atom definitions
  - `server-src/main.go` — HTTP router and Docker client wiring
  - `.github/workflows/` — CI; run `grep '^name:' .github/workflows/*.yml` for all workflow names

---

**Developer commands**

```bash
# Frontend dev
cd app-src && yarn start

# JS unit tests + coverage
cd app-src && yarn test
cd app-src && yarn test:coverage

# Linters
cd app-src && yarn lint && yarn run lint:css

# Cypress
cd app-src && yarn run cy:run --browser electron
cd app-src && yarn run cy:run --spec cypress/e2e/<spec>.cy.js --browser electron

# Go tests + coverage
cd server-src && go test ./...
cd server-src && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out | tail -n1
```

---

**Conventions**

- **Coverage gate: 90%** for both JS and Go. Never lower the threshold — add tests instead.
- **No commit without:** JS tests + coverage ✅, Cypress ✅, linters ✅.
- **No direct push to `master`** — use feature/fix/chore branches and PRs.
- **No `git commit` / `git push`** unless the user explicitly asks.
- **Never relax CI thresholds** without maintainer approval.
- **No mocks/test files in production paths.** Pre-commit check:
  ```bash
  git diff --name-only --cached | grep -E '(^server-src/.*_test\.go$|^app-src/.*(_test\.js$|__mocks__/|/mock/))' \
    && (echo "ERROR: staged changes contain tests or mocks in production paths" >&2; exit 1) \
    || echo "OK"
  ```
- **File moves:** always `git mv`, never plain `mv` + delete.
- **Devcontainer changes:** prefer `.devcontainer/init.sh` / `postCreateCommand` over editing the application `Dockerfile`.
- **JSDoc:** keep `@param` / `@returns` comments current on all exported functions and components.
- **UI styling:** Bootstrap utility classes first; custom CSS only as last resort.
- **`postinstall` downloads assets** via `node download-files.js` — offline builds will fail without them.

---

**Non-obvious gotchas**

- **Cypress: never pipe/grep output.** Run `yarn run cy:run --browser electron` unfiltered. All results and failure details are in the final summary table — read it once.
- **Nav link selectors:** `showNavLabelsAtom` defaults to `false`, so text labels are hidden. `cy.contains('a', 'Dashboard')` will time out. Use `cy.get('a[aria-label="Dashboard"]')`. All main nav links in `DashboardNavbar.js` have `aria-label` set.
- **FilterComponent selectors:** uses icon-only toggle buttons + a `Form.Control`, no `Form.Select`. Old selectors (`select.flex-grow-1.form-select`, `input.flex-grow-1.form-control`, `input[placeholder="Filter services by service name"]`) no longer exist. Use `button[aria-label="Filter by service"]`, `button[aria-label="Filter by stack"]`, `input[aria-label="Filter by service name"]`, `input[aria-label="Filter by stack name"]`.
- **Stack names in Cypress:** rendered in `.card-header strong`, not `h5`. Use `cy.contains('.card-header strong', 'dsd')`.
- **`atomWithHash` in E2E tests:** derived atoms are not auto-populated from `Provider initialValues`. Set the URL hash directly or navigate via UI.
- **Combined test file ordering (`*.combined.test.js`):** `require()` modules that use real jotai exports *before* modules with top-level `jest.mock('jotai', ...)` — mock hoisting contaminates later requires.
- **`jest.spyOn` target:** spy on the module the component actually imports from, not a re-export shim — spying on a shim fails with "Cannot redefine property".
- **Re-export shims:** when moving a file, leave a `@deprecated` re-export shim at the old path until all consumers are updated.
- **Import depth after moves:** moving a file one level deeper changes `../common/` to `../../common/`. Update all relative imports and test references.
- **Go `internal/` packages:** only importable within `server-src/`. Tests for `internal/` logic must live in the `internal/` sub-package, not `package main`.
- **Go coverage aggregate:** `go test -coverprofile` covers only one package. Use `go test ./... -coverprofile=coverage.out` for the total. `internal/docker` may show 0% — acceptable, it contains only trivial wrappers.
- **Browserslist CI:** `npx update-browserslist-db@latest` causes ERESOLVE peer errors. Workaround: `NPM_CONFIG_LEGACY_PEER_DEPS=true npx update-browserslist-db@latest`.
- **`ci-frontend.yml`** contains both the Jest coverage job *and* the ESLint + Stylelint job — there is no separate lint workflow for the frontend.
