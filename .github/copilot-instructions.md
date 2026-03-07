## Copilot / AI Agent Instructions for docker-swarm-dashboard

Purpose: Give an AI coding agent the minimal, concrete context to be productive immediately: architecture overview, key files, developer workflows, conventions and known gotchas.


**Project Purpose**

This project implements a lightweight dashboard for Docker Swarm clusters. It is designed to give operators and developers a quick overview of services, nodes, tasks, stacks and logs, to display live state updates via websockets, and to allow simple management actions within the cluster. The project aims to produce a small, lean image (< 25 MB) suitable for production use inside secure networks; it is not intended to be publicly exposed. See `README.md` for additional details and deployment examples.


- Big picture
  - This repository contains a React frontend (`app-src/`) and a Go backend (`server-src/`). The frontend is developed with Webpack and React (React 19) and uses `jotai` + `atomWithHash` for lightweight state and URL‑hash persistence. The backend is a Go service that interacts with Docker APIs and exposes HTTP endpoints and websockets (`server-src/*.go`).
  - Frontend dev run uses a local mock API (`app-src/mock/api/api-mock.mjs`) started by `yarn start` via `start-api-mock` on port `3001`. The dev frontend server runs on port `3000` (see `app-src/package.json` scripts). The CI starts both together (`yarn run start`).

- Key files & where to look first
  - `app-src/package.json` — scripts, Cypress commands, dependencies (use `yarn`). Important scripts: `start`, `start-dev-server`, `start-api-mock`, `cy:run`.
  - `app-src/src/` — React components. Settings UI: `app-src/src/components/settings/SettingsComponent.js` and state persistence in `app-src/src/common/store/atoms.js` (uses `atomWithHash`).
  - `app-src/src/components/` — organised in **feature folders**: `layout/`, `dashboard/`, `services/`, `nodes/`, `tasks/`, `stacks/`, `ports/`, `logs/`, `settings/`, `shared/`, `timeline/`, `misc/`. See "Frontend folder structure" below for the full map.
  - `app-src/src/common/` — organised into `constants/`, `hooks/`, `utils/` and `store/`. Legacy shim files at the old top-level paths re-export from the new locations (marked `@deprecated`).
  - `app-src/cypress/e2e/` — E2E specs (notably `settings.cy.js` which is currently fragile). Dumps and screenshots useful for debugging live failures are in `app-src/cypress/dumps/` and `app-src/cypress/screenshots/`.
  - `server-src/` — Go HTTP handlers (snake_case file names, e.g. `docker_nodes_handler.go`) and unit tests. `server-src/go.mod` shows Docker‑related dependencies (`github.com/docker/docker`) and gorilla packages.
  - `server-src/internal/` — extracted Go sub-packages: `internal/docker` (Docker client wrapper) and `internal/version` (version checker with caching).
  - `.github/workflows/cypress.yml` — CI flow for running Cypress; note the `Update browserslist` step which has caused `npm` peer‑dependency issues in the past.
  - `.devcontainer/` — devcontainer config; `devcontainer.json` and `init.sh` contain development‑only setup (bash completions added here). Prefer modifying `init.sh` or `postCreateCommand` for developer-only changes instead of the application `Dockerfile`.

- Architecture & data flows (concise)
  - Frontend ←→ Backend: Frontend calls either a mock API (`start-api-mock` port 3001) or real Go backend. Websocket connections are used for live timeline/log updates (see `server-src/*websocket*`).
  - Persistence: UI settings use Jotai atoms persisted via `atomWithHash` to keep state in the URL hash (search for `atomWithHash` in `app-src/src`). This matters for E2E tests (they must set the hash or trigger the view atom to open Settings reliably).

- Developer workflows & exact commands
  - Start frontend + mock API (interactive):
    - cd into workspace root: `cd app-src && yarn start` (this runs `start-api-mock` and `start-dev-server` concurrently and opens the app).
  - Run unit tests (JS): `cd app-src && yarn test`.
  - Run Cypress headless (single spec): `cd app-src && yarn run cy:run --spec cypress/e2e/settings.cy.js --browser electron`.
  - Run Cypress full suite (headless): `cd app-src && yarn run cy:run --browser electron`.
  - Run Go tests: `cd server-src && go test ./...`.
  - Build frontend production bundle: `cd app-src && yarn build`.

- Project‑specific conventions / gotchas
  - Use `yarn` for frontend dev tasks; CI may use `npx`/`npm` for some update commands. Node engine requirement is >=22 (see `app-src/package.json` `engines`).
  - E2E stability: Many tests rely on hash‑based navigation and `atomWithHash`. Prefer deterministic navigation in tests: either set the URL hash directly and dispatch `hashchange` or use well‑scoped `aria-label` selectors (e.g., `input[aria-label="Toggle dark mode"]`).
  - UI styling: Prefer standard Bootstrap CSS classes and utility classes where possible. Avoid creating new global CSS rules unless necessary; keep component‑scoped styles minimal and colocated. This helps maintain consistent visuals and makes selectors in E2E tests more stable.
   - UI styling: Use standard Bootstrap CSS classes and utility classes by default; this is the preferred and expected approach. Creating new custom CSS rules (especially global rules) is allowed only as a last resort — prefer Bootstrap utilities and component-scoped styles to keep visuals consistent and tests stable. Avoid global CSS unless absolutely necessary, and document any exceptions in the PR description.
  - JSDoc: Every JavaScript file should include up-to-date JSDoc comments for exported functions, components and non-trivial logic. Keep `@param`, `@returns` and brief descriptions current to help code readers and automated tools. Example:
    ```js
    /**
     * Render the settings toggle for dark mode.
     * @param {boolean} isDarkMode - current dark mode state
     * @param {(b:boolean)=>void} setIsDarkMode - setter
     */
    function DarkModeToggle(isDarkMode, setIsDarkMode) { /* ... */ }
    ```
  - Browserslist update CI issue: `npx update-browserslist-db@latest` has caused `ERESOLVE` peer errors; a known workaround is to run the update with `NPM_CONFIG_LEGACY_PEER_DEPS=true` in the workflow.
  - Devcontainer changes should prefer `.devcontainer/init.sh` and `postCreateCommand` rather than changing the application `Dockerfile` (this repo separates app image vs devcontainer image concerns).
  - Tests and scripts may rely on files downloaded via `postinstall` (`node download-files.js` in `app-src/package.json`) — be aware when reproducing build issues offline.

- Integration points / external deps to be aware of
  - Docker: Go code depends on Docker client libs (`github.com/docker/docker`) — local dev may not need Docker daemon for unit tests, but integration features do.
  - Websockets: timeline/log endpoints use gorilla/websocket; tests that rely on live updates may need mock data or the mock API running.
  - Cypress: tests use Cypress v15; CI runs against Electron/Firefox/Chromium via a matrix in `.github/workflows/cypress.yml`.

- What the agent should do first when a new issue/PR appears
  1. Reproduce locally: run `cd app-src && yarn start` and open the app, or run the failing Cypress spec headless as shown above. Collect screenshots/dumps from `app-src/cypress/screenshots` and `app-src/cypress/dumps`.
 2. Narrow scope: if the problem is in the frontend, look at `app-src/src/components/*`; if backend, search `server-src` handlers and tests. Grep for `TODO`/`FIXME` or related test names.
 3. Make the smallest change that fixes the issue, run unit and e2e locally, and propose a PR with a clear commit message and test additions if applicable.

**Change impact & tests**

When modifying existing code, always perform an impact analysis across the repository:

- Determine which other files (modules, components, handlers, tests) reference or depend on the changed code and update them as needed. Use `grep`, the IDE's "find references" and the test files under `app-src/cypress/e2e` and `server-src/*_test.go` to discover dependencies.
- After making cross-file updates, run the full local test suite (JS unit tests, ESLint, Stylelint, Cypress, Go tests) as described in the "Before commit" section.
- If tests fail, do not assume they are incorrect: investigate whether the failure indicates a real regression or whether the tests need to be updated to reflect intended behavior changes. For failing tests:
  - Reproduce the failing test locally and inspect assertions and mocked inputs.
  - If the new code intentionally changes behavior, update the test assertions to match the new contract and add documentation in the PR describing the reason.
  - If the failure is a regression, fix the code (or relevant dependent files) so tests pass.

Document the impact analysis and test decisions in the PR description so reviewers can follow the reasoning.

- Examples to reference while editing tests or code
  - Settings toggle selector: `input[aria-label="Toggle dark mode"]` (used in `app-src/src/components/SettingsComponent.js`).
  - E2E helper wrapper: `app-src/cypress/e2e/spec.cy.js` defines visit helpers and shared timeouts.
  - CI browserslist step: `.github/workflows/cypress.yml` — consider `NPM_CONFIG_LEGACY_PEER_DEPS=true npx update-browserslist-db@latest` if CI fails with peer errors.

---

**Frontend folder structure**

Components live in feature-based sub-folders under `app-src/src/components/`:

```
components/
  layout/       – ContentRouter, DashboardNavbar, LoadingBar, LoadingComponent
  dashboard/    – DashboardComponent, DashboardVerticalComponent, DashboardSettingsComponent
  services/     – DetailsServiceComponent, ServiceMetricsComponent, ServiceStatusBadge
    details/    – ServiceTasksTab
  nodes/        – NodesComponent, DetailsNodeComponent, NodeMetricsComponent
    details/    – NodeTasksTab
    metrics/    – NodeCpuSection, NodeDiskIOSection, NodeFilesystemNetworkSection,
                  NodeInfoHeader, NodeMemorySection, NodeSystemSection
  tasks/        – TasksComponent, DetailsTaskComponent
    details/    – TaskInfoTable, TaskMetricsContent
  stacks/       – StacksComponent
  ports/        – PortsComponent
  logs/         – LogsComponent, LogsActiveControls, LogsOutput, LogsSetupForm, SinceInput, logsUtils
  settings/     – SettingsComponent
  shared/       – FilterComponent, JsonTable, SortableHeader, WelcomeMessageComponent
    names/      – EntityName, NameActions, NodeName, ServiceName, StackName
  timeline/     – TimelineComponent
  misc/         – AboutComponent, DebugComponent, VersionUpdateComponent
```

Shared utilities are in `app-src/src/common/`:

```
common/
  constants/    – dockerTaskStates.js, navigationConstants.js, DefaultDateTimeFormat.js
  hooks/        – useEntityActions.js
  utils/        – chartUtils.js, formatUtils.js, sortUtils.js, taskStateUtils.js, utils.js
  store/        – atoms.js (Jotai atom definitions)
  actions/      – entityActions.js (@deprecated re-export shim)
```

Static assets (images, SVGs) are in `app-src/src/assets/` (downloaded via `postinstall` / `download-files.js`).

**Backend folder structure**

Go source files in `server-src/` use **snake_case** naming:

```
server-src/
  main.go                             – entry point, HTTP router, Docker client wiring
  docker_nodes_handler.go             – /docker/nodes endpoint
  docker_services_handler.go          – /docker/services endpoint
  docker_service_logs_handler.go      – /docker/logs (websocket)
  docker_tasks_handler.go             – /docker/tasks endpoint
  …                                   – other handlers follow the same pattern
  services_helper.go                  – shared helpers (e.g. extractReplicationFromService)
  version_handler.go                  – /version endpoint (delegates to internal/version)
  version_checker.go                  – thin shim, see internal/version/checker.go
  internal/
    docker/
      client.go                       – GetCli / SetCli / ResetCli (Docker SDK wrapper)
    version/
      checker.go                      – CheckVersion with cache, semver comparison
      checker_test.go                 – full coverage tests for version logic
```

Naming convention: `<domain>_<resource>_handler.go` for handlers, `<domain>_<resource>_handler_test.go` for tests. All test files sit next to their source in the same directory.

**Migration & refactoring patterns**

- **Re-export shims for backwards compatibility**: When moving a module to a new path, the old file is replaced with a `@deprecated` re-export shim (e.g. `export * from '../hooks/useEntityActions'`). This keeps existing imports working while consumers are migrated. Remove shims once all references point directly to the new paths.
- **Always use `git mv`**: When moving or renaming files, always use `git mv` so git tracks the operation as a rename. Never use plain `mv`/`cp` followed by manual delete — this loses git history and makes reviews harder.
- **Import depth changes**: Moving a component one level deeper (e.g. `components/X.js` → `components/feature/X.js`) means its relative imports to `common/` change from `../common/` to `../../common/`. Update all relative imports inside the moved file. Also update any test files that reference the moved component.
- **Combined test file ordering**: The project uses `*.combined.test.js` files that `require()` multiple test modules. **Order matters**: modules that import real library exports (e.g. `createStore` from `jotai`) must be required **before** modules with top-level `jest.mock('jotai', ...)`, because `jest.mock` hoisting contaminates the module registry for all subsequent `require()` calls in the same file.
- **jest.spyOn must target the actual module**: When a component imports from path A, spying on a re-export shim at path B will fail with "Cannot redefine property". Always `require()` the same module the component under test actually imports from.

**Known gotchas discovered during refactoring**

- **Prettier vs long import lines**: When a refactoring changes import paths to be longer, Prettier may require line-breaking the import. Run `yarn lint` after any path changes and fix formatting errors before committing.
- **LogsComponent re-export path**: `LogsComponent.js` re-exports `isValidSince` from `./logsUtils`. If the logs files are rearranged, this relative path must be updated — it previously pointed at `./logs/logsUtils` which was invalid after the merge into the `logs/` folder.
- **Go internal/ package access**: Only code within the `server-src/` module can import `internal/` packages. The main package delegates to `internal/docker` and `internal/version` via thin wrapper functions. Test helpers that previously tested unexported functions in `package main` (e.g. `getLocalVersion`, `getCacheTimeout`) must be moved into the corresponding `internal/` package test files.
- **Go coverage across sub-packages**: `go test -coverprofile` only covers the package being tested. Use `go test ./... -coverprofile=coverage.out` and check `go tool cover -func=coverage.out | tail -1` for the aggregate. The `internal/docker` package may show 0% (no test files) — this is acceptable as it contains only trivial getter/setter wrappers.

---

**Before commit (recommended)**

Run these checks locally before creating a PR to reduce CI noise and catch regressions early:

- JS unit tests + ESLint + Stylelint:
```bash
cd app-src && yarn test && yarn lint && yarn run lint:css
```
- Cypress (single spec or full suite):
```bash
# single spec (faster during dev)
cd app-src && yarn run cy:run --spec cypress/e2e/settings.cy.js --browser electron
# full suite (CI‑equivalent)
cd app-src && yarn run cy:run --browser electron
```
- Go tests:
```bash
cd server-src && go test ./...
```

These commands are recommended but may be adapted for fast iteration (run only the relevant subset while working on small changes).

**Test coverage requirement**

Ensure test coverage does not drop below 90% for JavaScript code and for server code. Run the coverage reports locally and verify the overall coverage metric before creating a PR:

JS coverage:
```bash
cd app-src && yarn test:coverage
```

Go (server) coverage (example):
```bash
cd server-src && go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out | tail -n1
# the last line shows the total coverage percentage (e.g. "total: (statements) 92.3%")
```

If coverage is below 90% for either the frontend or server code, add or fix tests before opening the PR; CI enforces this threshold.

If anything in this summary is unclear or you want the agent to follow a stricter pull‑request template (reproduce → patch → local tests → CI run → PR), say so and I will add a short task template to this file.

**Additional agent guidance**

- **Branch naming**: prefer `feature/<short-desc>`, `fix/<short-desc>` or `chore/<area>` for new work. Avoid committing directly on `master`/`main`.
- **Pull Request template (agent checklist)**: include a short reproduction, a one‑line summary of changes, which tests were run locally, coverage results, and any backward‑compatibility considerations. Example checklist:
  - Reproduced issue locally: yes/no
  - Changes made: brief summary
  - Unit tests: `cd app-src && yarn test` ✅
  - Coverage: `cd app-src && yarn test:coverage` (report attached) ✅
  - Linters: `cd app-src && yarn lint && yarn run lint:css` and `cd server-src && golangci-lint run ./...` ✅
  - E2E (if applicable): `cd app-src && yarn run cy:run --spec <spec> --browser electron` ✅
- **Local test commands (quick reference)**:
  - Start dev app + mock API: `cd app-src && yarn start`
  - Unit tests: `cd app-src && yarn test`
  - Coverage: `cd app-src && yarn test:coverage`
  - Cypress (single spec): `cd app-src && yarn run cy:run --spec cypress/e2e/settings.cy.js --browser electron`
  - Go tests: `cd server-src && go test ./...`
- **Cypress tips**: prefer deterministic navigation (set URL hash or use `atomWithHash`), use `aria-label` selectors when possible, and collect screenshots/dumps on CI failures (`app-src/cypress/screenshots` and `app-src/cypress/dumps`).
- **Dependency updates**: use `yarn upgrade-interactive --latest` and run the full test matrix afterwards. For the `update-browserslist-db` CI step, prefer `NPM_CONFIG_LEGACY_PEER_DEPS=true npx update-browserslist-db@latest` to avoid peer dependency failures.
- **Secrets & config**: Never commit secrets or credentials. Use environment variables, `.env` files ignored by git, or your CI secret store. Document required env vars in the PR if any change depends on them.
- **Flaky tests**: when a test is flaky, reproduce locally, add deterministic selectors or timeouts, and record failure artifacts. Avoid broad test changes — prefer targeted fixes.
- **Coverage & commit rule reminder**: The agent must not alter CI thresholds. Always reach the coverage gates locally before committing and record the commands used in the PR description.

**Agent conduct**

Do not run `git commit` or `git push` unless the user explicitly requests it. Avoid repeatedly prompting the user to commit or push; suggestions about committing or pushing should be occasional and only when clearly helpful.

Do not push changes directly to the `master` branch. Create a feature branch and open a pull request for review; the `master` branch is protected and requires CI/status checks.

**Commit Policy (required)**

- **Do not change test thresholds**: The agent must never independently modify or relax CI/test thresholds (for example, coverage percentages or branch thresholds). Any change to CI-enforced quality gates requires explicit approval from a repository maintainer.
- **Coverage must be achieved and verified before committing**: After making code changes, the agent MUST run the coverage and verify that the JavaScript and Go coverage meet the repository thresholds (see "Test coverage requirement"). If coverage falls below the required threshold, the agent must add or update tests to bring coverage back up — do not change thresholds.
- **Checks to run before commit**: Before creating a commit the agent MUST run the following and ensure they pass:
  - JavaScript unit tests and coverage: `cd app-src && yarn test && yarn test:coverage`
  - Cypress tests (single spec or full suite as appropriate): `cd app-src && yarn run cy:run --spec <spec> --browser electron` or `cd app-src && yarn run cy:run --browser electron`
  - Linters: `cd app-src && yarn lint && yarn run lint:css` and `cd server-src && golangci-lint run ./...`
- **Commit gating**: Only create a commit after all the above checks succeed. If any check fails, fix the failure (tests, lint errors or missing coverage) and re-run the checks; do not commit until all pass.
 - **Commit gating**: Only create a commit after all the above checks succeed. If any check fails, fix the failure (tests, lint errors or missing coverage) and re-run the checks; do not commit until all pass.

**No mocks or tests in production code**

- **Rule:** Do not commit mocks, test-specific helpers, or test files into production package paths or into files that are shipped with production builds. Tests and mocks must remain in test directories or in clearly marked fixtures that are excluded from production artifacts.
- **Mandatory pre-commit check:** Before creating any commit, run a check to ensure no staged files introduce test files or mock directories into production code. Example (run from repository root):

```bash
# Fail if any staged file looks like a Go test or is inside known mock folders
git diff --name-only --cached | grep -E '(^server-src/.*_test\.go$|^app-src/.*(_test\.js$|__mocks__/|/mock/))' && (
  echo "ERROR: staged changes contain tests or mocks in production paths" >&2; exit 1
) || echo "No tests/mocks detected in staged production paths"
```

- **If the check fails:** do not commit. Move test files into appropriate test-only locations, exclude them from production bundles, or open a PR describing the exception and obtain explicit maintainer approval.

**Research before changes**

Before implementing any change in the codebase, always consult the current official documentation of the relevant libraries and frameworks to determine the best and most up-to-date approach. Document the specific sources and versions consulted (links and short notes) in the PR description or the change summary. Examples of high‑value sources to check for this project:

- React / React docs (for component patterns, hooks, concurrency behavior)
- Jotai / `atomWithHash` docs (for state persistence and hash strategies)
- Cypress docs (for recommended navigation and retry patterns)
- Webpack / Babel docs (when changing build config)
- `github.com/docker/docker` and gorilla/websocket docs (for server integration changes)

If an alternative library feature/API provides a safer, more performant, or simpler solution than a local custom implementation, prefer the documented API and note the rationale in the PR.