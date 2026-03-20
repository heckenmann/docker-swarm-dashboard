/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Replicas } from '../../../../../src/components/services/Replicas'

describe('Replicas', () => {
  it('renders nothing when replicas is 0', () => {
    const { container } = render(<Replicas replicas={0} runningReplicas={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders success when all replicas running', () => {
    render(<Replicas replicas={3} runningReplicas={3} />)
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })

  it('renders danger when some replicas down', () => {
    render(<Replicas replicas={5} runningReplicas={3} />)
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('renders danger when all replicas down', () => {
    render(<Replicas replicas={3} runningReplicas={0} />)
    expect(screen.getByText('0/3')).toBeInTheDocument()
  })
})
