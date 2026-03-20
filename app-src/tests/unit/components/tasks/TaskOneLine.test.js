/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { TaskOneLine } from '../../../../src/components/tasks/TaskOneLine'

jest.mock('../../../../src/common/utils/docker', () => ({
  getSlotNumberPlacement: jest.fn((idx) => idx === 0 ? null : idx),
}))

const mockTask = {
  ID: 'task1',
  ServiceID: 'svc1',
  pIndex: 1,
  slot: 5,
  status: 'running',
  message: '',
}

describe('TaskOneLine', () => {
  it('renders task ID', () => {
    render(<TaskOneLine n={mockTask} />)
    expect(screen.getByText('task1')).toBeInTheDocument()
  })

  it('renders pIndex when not 0', () => {
    render(<TaskOneLine n={mockTask} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('does not render pIndex when 0', () => {
    const taskWithZeroIndex = { ...mockTask, pIndex: 0 }
    render(<TaskOneLine n={taskWithZeroIndex} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders running status', () => {
    render(<TaskOneLine n={mockTask} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('renders error message when present', () => {
    const taskWithError = { ...mockTask, message: 'failed to start' }
    render(<TaskOneLine n={taskWithError} />)
    expect(screen.getByText('failed to start')).toBeInTheDocument()
  })
})
