/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TableSizeRow from '../../../../../src/components/settings/rows/TableSizeRow'

const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'tableSizeAtom',
}))

jest.mock('../../../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))

describe('TableSizeRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders both table size options', () => {
    mockUseAtom.mockReturnValue(['sm', jest.fn()])
    mockUseAtomValue.mockReturnValue({ tableSize: 'sm' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('Small (sm)')).toBeInTheDocument()
    expect(screen.getByText('Large (lg)')).toBeInTheDocument()
  })

  test('calls setTableSize with sm when small button clicked', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue(['lg', mockSet])
    mockUseAtomValue.mockReturnValue({ tableSize: 'lg' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByText('Small (sm)'))
    expect(mockSet).toHaveBeenCalledWith('sm')
  })

  test('calls setTableSize with lg when large button clicked', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue(['sm', mockSet])
    mockUseAtomValue.mockReturnValue({ tableSize: 'sm' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByText('Large (lg)'))
    expect(mockSet).toHaveBeenCalledWith('lg')
  })

  test('shows dashboardSettings.tableSize when available', () => {
    mockUseAtom.mockReturnValue(['sm', jest.fn()])
    mockUseAtomValue.mockReturnValue({ tableSize: 'lg' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('lg')).toBeInTheDocument()
  })

  test('shows empty string when dashboardSettings.tableSize is undefined', () => {
    mockUseAtom.mockReturnValue(['sm', jest.fn()])
    mockUseAtomValue.mockReturnValue({}) // tableSize is undefined

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    // The td should be empty - find the empty td by checking for empty text content
    const tds = screen.getAllByRole('cell')
    const emptyTd = tds.find(td => td.textContent === '')
    expect(emptyTd).toBeInTheDocument()
  })

  test('reset button calls setTableSize with dashboardSettings.tableSize', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue(['sm', mockSet])
    mockUseAtomValue.mockReturnValue({ tableSize: 'lg' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByLabelText('Reset table size to default'))
    expect(mockSet).toHaveBeenCalledWith('lg')
  })

  test('reset button calls setTableSize with lg when dashboardSettings.tableSize is undefined', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue(['sm', mockSet])
    mockUseAtomValue.mockReturnValue({}) // tableSize is undefined

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByLabelText('Reset table size to default'))
    expect(mockSet).toHaveBeenCalledWith('lg') // fallback to 'lg'
  })

  test('correct button is shown as active when tableSize is sm', () => {
    mockUseAtom.mockReturnValue(['sm', jest.fn()])
    mockUseAtomValue.mockReturnValue({ tableSize: 'sm' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    // The small button should have active={true}
    const buttons = screen.getAllByRole('button')
    const smallButton = buttons.find(b => b.textContent === 'Small (sm)')
    expect(smallButton).toBeInTheDocument()
  })

  test('correct button is shown as active when tableSize is lg', () => {
    mockUseAtom.mockReturnValue(['lg', jest.fn()])
    mockUseAtomValue.mockReturnValue({ tableSize: 'lg' })

    render(
      <table>
        <tbody>
          <TableSizeRow />
        </tbody>
      </table>
    )

    const buttons = screen.getAllByRole('button')
    const largeButton = buttons.find(b => b.textContent === 'Large (lg)')
    expect(largeButton).toBeInTheDocument()
  })
})
