/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { StacksComponent } from '../../../../src/components/stacks/StacksComponent'

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()

jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../../src/common/store/atoms', () => ({
  stacksAtom: 'stacksAtom',
  viewAtom: 'viewAtom',
  errorAtom: 'errorAtom',
  isLoadingAtom: 'isLoadingAtom',
  isFirstAtom: 'isFirstAtom',
}))

describe('StacksComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('empty stacks', () => {
    it('renders null when stacks is null', () => {
      mockUseAtomValue.mockReturnValue(null)
      mockUseAtom.mockReturnValue('stacks')

      const { container } = render(<StacksComponent />)
      expect(container.firstChild).toBeNull()
    })

    it('renders null when stacks is empty array', () => {
      mockUseAtomValue.mockReturnValue([])
      mockUseAtom.mockReturnValue('stacks')

      const { container } = render(<StacksComponent />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('filtering', () => {
    const mockStacks = [
      { id: '1', name: 'web-stack', services: [] },
      { id: '2', name: 'api-stack', services: [] },
      { id: '3', name: 'db-stack', services: [] },
    ]

    it('filters stacks by serviceNameFilter', () => {
      mockUseAtomValue.mockReturnValue(mockStacks)
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return mockStacks
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return null
        if (atom === 'isLoadingAtom') return false
        if (atom === 'isFirstAtom') return true
        if (atom === 'serviceNameFilterAtom') return 'api'
        return undefined
      })

      render(<StacksComponent />)
    })

    it('filters stacks by stackNameFilter', () => {
      mockUseAtomValue.mockReturnValue(mockStacks)
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return mockStacks
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return null
        if (atom === 'isLoadingAtom') return false
        if (atom === 'isFirstAtom') return true
        if (atom === 'stackNameFilterAtom') return 'db'
        return undefined
      })

      render(<StacksComponent />)
    })

    it('shows no stacks found when filter matches nothing', () => {
      mockUseAtomValue.mockReturnValue(mockStacks)
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return mockStacks
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return null
        if (atom === 'isLoadingAtom') return false
        if (atom === 'isFirstAtom') return true
        if (atom === 'serviceNameFilterAtom') return 'nonexistent'
        return undefined
      })

      render(<StacksComponent />)
    })
  })

  describe('error state', () => {
    it('renders ErrorPage when error is set', () => {
      mockUseAtomValue.mockReturnValue([])
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return []
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return new Error('Test error')
        if (atom === 'isLoadingAtom') return false
        if (atom === 'isFirstAtom') return true
        return undefined
      })

      render(<StacksComponent />)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('renders LoadingBar when isLoading and not first', () => {
      mockUseAtomValue.mockReturnValue([])
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return []
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return null
        if (atom === 'isLoadingAtom') return true
        if (atom === 'isFirstAtom') return false
        return undefined
      })

      render(<StacksComponent />)
    })

    it('renders null on first load even when loading', () => {
      mockUseAtomValue.mockReturnValue([])
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return []
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return null
        if (atom === 'isLoadingAtom') return true
        if (atom === 'isFirstAtom') return true
        return undefined
      })

      const { container } = render(<StacksComponent />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('normal render', () => {
    it('renders StacksList with stacks', () => {
      const mockStacks = [{ id: '1', name: 'web-stack', services: [] }]
      mockUseAtomValue.mockReturnValue(mockStacks)
      mockUseAtom.mockImplementation((atom) => {
        if (atom === 'stacksAtom') return mockStacks
        if (atom === 'viewAtom') return 'stacks'
        if (atom === 'errorAtom') return null
        if (atom === 'isLoadingAtom') return false
        if (atom === 'isFirstAtom') return true
        return undefined
      })

      render(<StacksComponent />)
    })
  })
})
