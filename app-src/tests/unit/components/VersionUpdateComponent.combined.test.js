import { render, screen } from '@testing-library/react'
const modVersionUpdateComponent = require('../../../src/components/misc/VersionUpdateComponent')
const VersionUpdateComponent =
  modVersionUpdateComponent.VersionUpdateComponent || modVersionUpdateComponent.default || modVersionUpdateComponent

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  viewAtom: 'viewAtom',
  stacksAtom: 'stacksAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
  tableSizeAtom: 'tableSizeAtom',
  versionAtom: 'versionAtom',
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

    const { rerender, container } = render(<VersionUpdateComponent />)
    const table = container.querySelector('table')
    expect(table).toHaveClass('table-sm')

    // Test with 'lg' size
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

    rerender(<VersionUpdateComponent />)
    expect(table).not.toHaveClass('table-sm')
  })
})