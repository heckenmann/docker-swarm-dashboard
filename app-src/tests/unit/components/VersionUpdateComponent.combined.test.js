import { render, screen } from '@testing-library/react'
const modVersionUpdateComponent = require('../../../src/components/misc/VersionUpdateComponent')
const VersionUpdateComponent = modVersionUpdateComponent.default

jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
}))

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  viewAtom: 'viewAtom',
  stacksAtom: 'stacksAtom',
  versionAtom: 'versionAtom',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
  tableSizeAtom: 'tableSizeAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

describe('VersionUpdateComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('tableSizeAtom controls table-sm class', () => {
    // Test with 'sm' size
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC', versionCheckEnabled: true }
        case 'tableSizeAtom':
          return 'sm'
        case 'viewAtom':
          return 'nodes'
        case 'versionAtom':
          return { current: '1.0.0', latest: '1.0.0', lastChecked: '2024-01-01T00:00:00Z', updateAvailable: false, version: '1.0.0', remoteVersion: '1.0.0' }
        default:
          return ''
      }
    })

    const { rerender, container, unmount } = render(<VersionUpdateComponent />)
    const table = container.querySelector('table')
    expect(table).toHaveClass('table-sm')

    // Test with 'lg' size - need to unmount and remount to force re-render since React.memo skips re-render
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC', versionCheckEnabled: true }
        case 'tableSizeAtom':
          return 'lg'
        case 'viewAtom':
          return 'nodes'
        case 'versionAtom':
          return { current: '1.0.0', latest: '1.0.0', lastChecked: '2024-01-01T00:00:00Z', updateAvailable: false, version: '1.0.0', remoteVersion: '1.0.0' }
        default:
          return ''
      }
    })

    unmount()
    const { container: container2 } = render(<VersionUpdateComponent />)
    const tableLg = container2.querySelector('table')
    expect(tableLg).not.toHaveClass('table-sm')
    expect(tableLg).toHaveClass('table-lg')
  })

  it('handles version fetch error gracefully', () => {
    // Mock versionAtom to throw an error (simulating network failure)
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC', versionCheckEnabled: true }
        case 'tableSizeAtom':
          return 'sm'
        case 'viewAtom':
          return 'nodes'
        case 'versionAtom':
          // This simulates the error case - returns empty version (catch block fallback)
          return { version: '', remoteVersion: '', updateAvailable: false, lastChecked: '' }
        default:
          return ''
      }
    })

    const { container } = render(<VersionUpdateComponent />)
    // Should render without crashing
    expect(container.querySelector('table')).toBeInTheDocument()
  })
})