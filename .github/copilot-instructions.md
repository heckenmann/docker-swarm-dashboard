## Copilot / AI Agent Instructions for docker-swarm-dashboard

**Project purpose:** Lightweight Docker Swarm dashboard. Target image size < 25 MB. Not intended for public exposure. See `README.md` for details.

---

## 1. Project Overview

### Architecture
- React frontend (`app-src/`) + Go backend (`server-src/`)
- Frontend: React 19, Webpack, Jotai (`atomWithHash` for URL-hash state)
- Backend: Docker SDK and gorilla/websocket
- Mock API (`app-src/mock/api/api-mock.mjs`) runs on port 3001
- Dev server runs on port 3000

### Runtime Requirements
- **Node.js:** >= 22.0.0
- **Go:** 1.25
- **Package manager:** yarn (required, not npm)

### Key Entry Points
- `app-src/package.json` — all scripts and dependencies (use `yarn`)
- `app-src/src/common/store/atoms/index.js` — all Jotai atom definitions
- `server-src/main.go` — HTTP router and Docker client wiring
- `.github/workflows/` — CI; run `grep '^name:' .github/workflows/*.yml` for all workflow names

---

## 2. Developer Commands

### Frontend Development (app-src directory)
```bash
# Start development environment (mock API + dev server + open browser)
cd app-src && yarn start

# Start servers without opening browser
cd app-src && yarn start:servers

# Production build
cd app-src && yarn build

# Asset downloads (postinstall)
node download-files.js
```

### Backend Development (server-src directory)
```bash
# Production build
cd server-src && go build -o docker-swarm-dashboard

# Docker build (from root directory)
docker build -t ghcr.io/heckenmann/docker-swarm-dashboard:local .
```

### Testing

#### Frontend Unit Tests (app-src directory)
```bash
# Run all tests
cd app-src && yarn test

# Run with coverage
cd app-src && yarn test:coverage

# Run a single test file
cd app-src && yarn test tests/unit/path/to/test-file.test.js

# Run tests matching a pattern
cd app-src && yarn test --testNamePattern="pattern"

# Watch mode
cd app-src && yarn jest --watch
cd app-src && yarn jest --watch tests/unit/path/to/test-file.test.js
```

#### Frontend E2E Tests (app-src directory)
```bash
# Run all Cypress tests
cd app-src && yarn run cy:run --browser electron

# Run specific test
cd app-src && yarn run cy:run --spec cypress/e2e/<spec>.cy.js --browser electron

# Open Cypress UI
cd app-src && yarn cy:open

# Run in headless mode (CI)
cd app-src && yarn dev:cy:run
```

#### Backend Tests (server-src directory)
```bash
# Run all Go tests
cd server-src && go test ./...

# Run with coverage
cd server-src && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out | tail -n1

# Run with race detector
cd server-src && go test -race ./...

# View coverage report
go tool cover -func=coverage.out
go tool cover -html=coverage.out   # Opens HTML coverage report in browser
```

### Linting and Formatting (app-src directory)
```bash
# JavaScript/JSX linting
cd app-src && yarn lint
cd app-src && yarn lint --fix

# CSS linting
cd app-src && yarn lint:css
cd app-src && yarn lint:css --fix

# Formatting
cd app-src && yarn format
cd app-src && yarn format:check
```

### Configuration Files
- **ESLint:** `app-src/eslint.config.cjs`
- **Stylelint:** `app-src/.stylelintrc.json` (extends stylelint-config-standard, stylelint-config-twbs-bootstrap)
- **Prettier:** `app-src/.prettierrc` (singleQuote, no semi, tabWidth 2, printWidth 80)
- **Jest:** `app-src/jest.config.cjs` (90% coverage threshold)
- **Babel:** `app-src/babel.config.json` (@babel/preset-env, @babel/preset-react)

### Backend Linting (server-src directory)
```bash
# Go linting (using golangci-lint if installed)
golangci-lint run

# Go vet (built-in Go tool)
go vet ./...
```

---

## 3. Code Style Guidelines

### Imports Organization
1. Standard library packages
2. Third-party packages
3. Internal packages

Within each group, sort alphabetically.

### Frontend (JavaScript/React)

#### General Rules
- Use functional components with hooks
- Prefer functional programming patterns
- Use Jotai for state management
- Follow React 19 best practices
- Use PropTypes for component props validation

#### Naming Conventions
- Component names: PascalCase
- Variables/functions: camelCase
- Constants: UPPER_CASE_WITH_UNDERSCORES
- Files: kebab-case (.js, .jsx)
- Test files: *.test.js or *.combined.test.js

#### Imports
- Relative imports for local files
- Absolute imports for external libraries
- Import React at the top of JSX files
- Group imports logically with blank lines between groups

#### Error Handling
- Always handle promise rejections
- Use try/catch with async/await
- Use ErrorBoundary components for UI errors
- Log errors appropriately but avoid exposing sensitive information

### Backend (Go)

#### General Rules
- Follow idiomatic Go patterns
- Use Go modules for dependency management
- Prefer explicit error handling over panics
- Use context.Context for request-scoped values and cancellation

#### Naming Conventions
- Package names: lowercase, single word preferred
- Public functions/types: PascalCase
- Private functions/variables: camelCase with lowercase first letter
- Acronyms: Prefer IDs over Ids, HTTP over Http

#### Error Handling
- Always check errors
- Wrap errors with context where appropriate
- Don't ignore errors with `_`
- Return errors early (avoid deep nesting)

### Styling
- Use Bootstrap utility classes first
- Custom CSS only as last resort
- Mobile-first responsive design
- Dark mode support through CSS variables

### Testing Contracts
1. **Coverage gate: 90%** for both JS and Go
2. **Settings page test contract:** For every setting row in `SettingsComponent` (`app-src/src/components/settings/SettingsComponent.jsx`), `tests/unit/components/DashboardSettingsComponent.combined.test.js` must contain:
   - Initial state: checkbox/input renders correctly for each meaningful atom value
   - Toggle both directions: clicking/changing calls the atom setter correctly
   - Reset: "Reset to defaults" test asserts every setter is called with default value
   - Individual row tests are in `tests/unit/components/settings/rows/`
3. **Settings effect test contract:** For every setting atom, there must be a test verifying the rendered output changes correctly:
   - `tableSizeAtom` → table has `table-sm` class when `'sm'` and not when `'lg'`
   - `showNamesButtonsAtom` → action buttons in `EntityName` are shown/hidden
   - `showNavLabelsAtom` → nav link text labels visible/hidden in `DashboardNavbar`
   - `maxContentWidthAtom` → `.container-fluid` vs `.container` in `DashboardNavbar`
   - `isDarkModeAtom` → `currentVariantAtom`/`currentVariantClassesAtom` correctly derived

### Documentation
- All commit messages, code comments, JSDoc, and documentation in English only
- Keep JSDoc @param/@returns comments current on all exported functions/components
- Add comments for non-obvious implementation details
- Update or remove outdated and redundant comments

---

## 4. Conventions

- **Language: English only.** All commit messages, code comments, JSDoc, documentation, and PR descriptions must be written in English. No exceptions.
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
- **CSS Modularization:** Prefer component-specific `.css` files (e.g., `DSDCard.css`) over global `App.css`.
- **DSDCard:** Always use the `body` prop for table content to ensure the `.card-body` wrapper (and thus proper padding/background) is rendered.
- **Table Layout & Density:**
    - Header height is fixed at **28px** for high data density.
    - Entity names (Services, Nodes, Stacks) must have `white-space: nowrap`.
    - Dashboard headers use a `service-name-container` for a "flag effect" (overflow without wrapping).
    - The last column in dashboard headers must use `colSpan={2}` to merge with the filler column for layout stability.
- **`postinstall` downloads assets** via `node download-files.js` — offline builds will fail without them.

---

## 7. Error Investigation & Verification Workflow

When an issue is reported or a test fails, follow this hierarchical investigation strategy:

- **Targeted Execution:** Whenever possible, execute tests specifically for the affected component or package (e.g., `yarn test path/to/file.test.js` or `go test ./path/to/pkg`) to speed up feedback loops.
- **Full Suite:** Only run the entire test suite as a final verification step before committing changes.

1.  **Code Analysis:** First, attempt to identify the cause by analyzing the source code and logic.
2.  **Unit Testing:** If the cause is not obvious, attempt to reproduce the issue using unit tests (Jest for frontend, `go test` for backend).
3.  **Cypress E2E Testing:** If unit tests are insufficient (e.g., for layout or integration issues), use Cypress to reproduce the failure.
4.  **DOM Analysis:** Within a Cypress test, analyze the rendered HTML/DOM to identify structural or state-related anomalies.
5.  **Visual Analysis (Screenshots):** If the issue is visual or cannot be identified through DOM analysis, generate and analyze a Cypress screenshot to visually diagnose the problem.

---

## 8. Non-obvious Gotchas

- **Cypress: never pipe/grep output.** Run `yarn run cy:run --browser electron` unfiltered. All results and failure details are in the final summary table — read it once.
- **Nav link selectors:** `showNavLabelsAtom` defaults to `false`, so text labels are hidden. `cy.contains('a', 'Dashboard')` will time out. Use `cy.get('a[aria-label="Dashboard"]')`. All main nav links in `DashboardNavbar.js` have `aria-label` set.
- **FilterComponent selectors:** uses icon-only toggle buttons + a `Form.Control`, no `Form.Select`. Old selectors (`select.flex-grow-1.form-select`, `input.flex-grow-1.form-control`, `input[placeholder="Filter services by service name"]`) no longer exist. Use `button[aria-label="Filter by service"]`, `button[aria-label="Filter by stack"]`, `input[aria-label="Filter by service name"]`, `input[aria-label="Filter by stack name"]`.
- **Stack names in Cypress:** rendered in `.card-header strong`, not `h5`. Use `cy.contains('.card-header strong', 'dsd')`.
- **`atomWithHash` in E2E tests:** derived atoms are not auto-populated from `Provider initialValues`. Set the URL hash directly or navigate via UI.
- **Table Structure Verification:** When verifying that header and body columns match, tests must sum the `colspan` attributes of header cells rather than just counting `th` elements.
- **Flex-Nowrap for Icons:** Entity names (Nodes/Services) with icons (stars, search, etc.) must be wrapped in a `d-flex flex-nowrap` container to prevent icons from jumping to the next line.
- **Combined test file ordering (`*.combined.test.js`):** `require()` modules that use real jotai exports *before* modules with top-level `jest.mock('jotai', ...)` — mock hoisting contaminates later requires.
- **`jest.spyOn` target:** spy on the module the component actually imports from, not a re-export shim — spying on a shim fails with "Cannot redefine property".
- **Re-export shims:** when moving a file, leave a `@deprecated` re-export shim at the old path until all consumers are updated.
- **Import depth after moves:** moving a file one level deeper changes `../common/` to `../../common/`. Update all relative imports and test references.
- **Go `internal/` packages:** only importable within `server-src/`. Tests for `internal/` logic must live in the `internal/` sub-package, not `package main`.
- **Go coverage aggregate:** `go test -coverprofile` covers only one package. Use `go test ./... -coverprofile=coverage.out` for the total. `internal/docker` may show 0% — acceptable, it contains only trivial wrappers.
- **Browserslist CI:** `npx update-browserslist-db@latest` causes ERESOLVE peer errors. Workaround: `NPM_CONFIG_LEGACY_PEER_DEPS=true npx update-browserslist-db@latest`.
- **`ci-frontend.yml`** contains both the Jest coverage job *and* the ESLint + Stylelint job — there is no separate lint workflow for the frontend.
