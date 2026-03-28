/**
 * Unit tests for VersionUpdateComponent.
 *
 * Covers:
 * - Renders the up-to-date state when versionCheckEnabled and no update.
 * - Renders the update-available state with GitHub release link.
 * - Renders the disabled state with how-to instructions and GitHub link.
 * - Shows '—' for lastChecked when the field is empty (formatLastChecked fallback).
 */

jest.mock('jotai', () => ({ atom: (v) => v, useAtomValue: jest.fn() }))
jest.mock('jotai/utils', () => ({
  atomWithReducer: (v) => v,
  atomWithReset: (v) => v,
}))
jest.mock('jotai-location', () => ({ atomWithHash: (_k, def) => def }))
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))
jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: { add: () => {} },
}))
jest.mock('@fortawesome/free-solid-svg-icons', () => ({}))

const React = require('react')
const { render, screen } = require('@testing-library/react')
const { useAtomValue } = require('jotai')
// Require atoms once — module registry is NOT reset between tests so identity
// checks in the useAtomValue mock work correctly.
const atoms = require('../../../src/common/store/atoms')
const {
  default: VersionUpdateComponent,
} = require('../../../src/components/misc/VersionUpdateComponent')

/**
 * Configure the useAtomValue mock for one render.
 *
 * @param {object} opts
 * @param {boolean} opts.versionCheckEnabled
 * @param {object} opts.version
 */
function setup({ versionCheckEnabled, version }) {
  useAtomValue.mockImplementation((atom) => {
    if (atom === atoms.currentVariantAtom) return 'light'
    if (atom === atoms.currentVariantClassesAtom) return ''
    if (atom === atoms.dashboardSettingsAtom) return { versionCheckEnabled }
    if (atom === atoms.versionAtom) return version
    return null
  })
}

afterEach(() => {
  jest.clearAllMocks()
})

test('shows up-to-date message when check enabled and no update', () => {
  setup({
    versionCheckEnabled: true,
    version: {
      version: '1.0.0',
      remoteVersion: '1.0.0',
      updateAvailable: false,
      lastChecked: '2026-03-08T10:00:00Z',
    },
  })
  render(React.createElement(VersionUpdateComponent))
  // "up to date" appears in both the Alert text and the Badge
  expect(screen.getAllByText(/up to date/i).length).toBeGreaterThan(0)
  expect(screen.queryByText(/update.*available/i)).not.toBeInTheDocument()
})

test('shows update-available alert with release link when update exists', () => {
  setup({
    versionCheckEnabled: true,
    version: {
      version: '1.0.0',
      remoteVersion: '2.0.0',
      updateAvailable: true,
      lastChecked: '2026-03-08T10:00:00Z',
    },
  })
  render(React.createElement(VersionUpdateComponent))
  expect(screen.getByText(/update 2\.0\.0 available/i)).toBeInTheDocument()
  const releaseLink = screen.getByRole('link', { name: /view release notes/i })
  expect(releaseLink).toHaveAttribute(
    'href',
    'https://github.com/heckenmann/docker-swarm-dashboard/releases',
  )
})

test('shows em-dash for lastChecked when field is empty', () => {
  setup({
    versionCheckEnabled: true,
    version: {
      version: '1.0.0',
      remoteVersion: '',
      updateAvailable: false,
      lastChecked: '',
    },
  })
  render(React.createElement(VersionUpdateComponent))
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('shows disabled message and how-to instructions when check disabled', () => {
  setup({
    versionCheckEnabled: false,
    version: {
      version: '1.0.0',
      remoteVersion: '',
      updateAvailable: false,
      lastChecked: '',
    },
  })
  render(React.createElement(VersionUpdateComponent))
  expect(screen.getByText(/disabled/i)).toBeInTheDocument()
  // The env var name appears both in the description text and in the <pre> block
  expect(screen.getAllByText(/DSD_VERSION_CHECK_ENABLED/).length).toBeGreaterThan(0)
  const githubLink = screen.getByRole('link', {
    name: /browse all releases on github/i,
  })
  expect(githubLink).toHaveAttribute(
    'href',
    'https://github.com/heckenmann/docker-swarm-dashboard/releases',
  )
})
