# Docker Swarm Dashboard - Frontend

React 19 frontend for the Docker Swarm dashboard. Uses Webpack, Jotai for state management, and Bootstrap for styling.

## Quick Start

```bash
# Install dependencies
yarn install

# Start development environment (mock API + dev server)
yarn start

# Open browser manually
open http://localhost:3000#base="http%3A%2F%2Flocalhost%3A3001%2F"
```

## Available Scripts

### Development
```bash
yarn start              # Mock API (3001) + dev server (3000) + auto-open browser
yarn start:servers      # Mock API + dev server without opening browser
yarn start-dev-server   # Dev server only
yarn start-api-mock     # Mock API only
```

### Testing
```bash
yarn test               # Run unit tests
yarn test:coverage      # Run tests with coverage report (90% threshold)
yarn cy:open            # Open Cypress UI for E2E tests
yarn cy:run             # Run Cypress E2E tests (headless)
yarn dev:cy:run         # Run Cypress in headless mode (CI)
```

### Linting & Formatting
```bash
yarn lint               # ESLint
yarn lint --fix         # ESLint with auto-fix
yarn lint:css           # Stylelint
yarn lint:css --fix     # Stylelint with auto-fix
yarn format             # Prettier (write)
yarn format:check       # Prettier (check only)
```

### Build
```bash
yarn build              # Production build to ./build
```

## Project Structure

```
app-src/
├── src/
│   ├── components/     # React components
│   ├── common/         # Shared utilities
│   │   └── store/
│   │       └── atoms/  # Jotai atoms (state management)
│   │           ├── index.js
│   │           ├── dashboardAtoms.js
│   │           ├── foundationAtoms.js
│   │           ├── logsAtoms.js
│   │           ├── navigationAtoms.js
│   │           ├── themeAtoms.js
│   │           └── uiAtoms.js
│   └── index.jsx       # Entry point
├── mock/api/           # Mock API for development
├── tests/unit/         # Unit tests (Jest)
├── cypress/e2e/        # E2E tests (Cypress)
├── public/             # Static assets
└── build/              # Production output (generated)
```

## Key Technologies

- **React 19** - UI framework
- **Jotai** - Atomic state management (with `atomWithHash` for URL state)
- **Bootstrap 5** - Styling (utility classes first)
- **ApexCharts** - Charts and graphs
- **Font Awesome** - Icons
- **Jest + Testing Library** - Unit testing
- **Cypress** - E2E testing
- **Webpack 5** - Build tool
- **ESLint + Prettier** - Code quality
- **Stylelint** - CSS linting

## State Management

State is managed with Jotai atoms. All atom definitions are in `src/common/store/atoms/`.

### URL Hash State
Some atoms use `atomWithHash` to persist state in the URL hash:
- Dashboard filters
- Table size
- Dark mode
- Navigation settings

### Example
```javascript
import { useAtom } from 'jotai'
import { isDarkModeAtom } from '../common/store/atoms'

function MyComponent() {
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom)
  // ...
}
```

## Testing

### Unit Tests
- Location: `tests/unit/`
- Framework: Jest + React Testing Library
- Coverage threshold: 90% (all categories)

```bash
# Run all tests
yarn test

# Run specific test file
yarn test tests/unit/components/MyComponent.test.js

# Run with coverage
yarn test:coverage
```

### E2E Tests
- Location: `cypress/e2e/`
- Framework: Cypress
- Browsers: electron, firefox, chromium, edge

```bash
# Open Cypress UI
yarn cy:open

# Run all tests (headless)
yarn cy:run --browser electron

# Run specific spec
yarn cy:run --spec cypress/e2e/my-test.cy.js --browser electron
```

### Test Contracts

#### Settings Component Tests
For every setting in `SettingsComponent.jsx`, tests must include:
1. Initial state verification
2. Toggle both directions
3. Reset to defaults

#### Settings Effect Tests
For every setting atom, verify the consuming component renders correctly.

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `webpack.config.js` | Webpack configuration |
| `babel.config.json` | Babel presets (@babel/preset-env, @babel/preset-react) |
| `jest.config.cjs` | Jest configuration (90% coverage threshold) |
| `eslint.config.cjs` | ESLint rules |
| `.stylelintrc.json` | Stylelint rules (extends bootstrap) |
| `.prettierrc` | Prettier (singleQuote, no semi, 2 spaces, 80 chars) |
| `setupTests.js` | Jest setup (polyfills, matchers) |

## Environment Variables

### Runtime (in browser)
- `REACT_APP_*` - Custom environment variables (build-time only)

### Development
- `BROWSER=none` - Disable auto-open browser
- `PORT` - Dev server port (default: 3000)

## Important Notes

1. **Yarn required** - Do not use npm
2. **Node >= 22.0.0** - Required engine version
3. **postinstall script** - Downloads assets via `node download-files.js`
4. **Bootstrap utilities first** - Custom CSS only as last resort
5. **English only** - All code comments and documentation in English
6. **90% coverage** - Minimum test coverage enforced

## Mock API

The mock API runs on port 3001 and provides test data for development:
- Location: `mock/api/api-mock.mjs`
- Start: `yarn start-api-mock`
- Health check: `http://localhost:3001/health`

## Deployment

Production build creates optimized bundle in `./build/`:
```bash
yarn build
```

The build is served by the Go backend in the final Docker image.

## Troubleshooting

### ERESOLVE peer errors
```bash
NPM_CONFIG_LEGACY_PEER_DEPS=true npx update-browserslist-db@latest
```

### Cypress binary issues
```bash
yarn cypress install
```

### Mock API not starting
Check if port 3001 is available:
```bash
lsof -i :3001
```

## Learn More

- [React Documentation](https://react.dev/)
- [Jotai Documentation](https://jotai.org/)
- [Bootstrap Documentation](https://getbootstrap.com/)
- [Cypress Documentation](https://docs.cypress.io/)
