import { render, screen } from '@testing-library/react'
const modTaskInfoTable = require('../../../src/components/tasks/details/TaskInfoTable')
const TaskInfoTable =
  modTaskInfoTable.TaskInfoTable || modTaskInfoTable.default || modTaskInfoTable

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  tableSizeAtom: 'tableSizeAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

describe('TaskInfoTable (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
    mockUseAtom.mockReturnValue([null, jest.fn()]) // Return array for useAtom
  })

  test('tableSizeAtom controls table-sm class', () => {
    // Test with 'sm' size
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'tableSizeAtom':
          return 'sm'
        default:
          return ''
      }
    })

    const taskObj = {
      ID: 'task1',
      ServiceID: 'service1',
      ServiceName: 'test-service',
      Slot: 1,
      Status: { State: 'running' },
    }

    const { rerender, container } = render(<TaskInfoTable taskObj={taskObj} />)
    const table = container.querySelector('table')
    expect(table).toHaveClass('table-sm')

    // Test with 'lg' size
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'tableSizeAtom':
          return 'lg'
        default:
          return ''
      }
    })

    rerender(<TaskInfoTable taskObj={taskObj} />)
    expect(table).not.toHaveClass('table-sm')
  })
})