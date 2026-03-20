/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Replicas } from '../../../../src/components/services/Replicas'

describe('Replicas', () => {
  it('renders running state when replicas equals runningReplicas', () => {
    render(<Replicas replicas={3} runningReplicas={3} />)
    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(screen.getByText('3/3').className).toContain('text-bg-success')
  })

  it('renders degraded state when replicas greater than runningReplicas', () => {
    render(<Replicas replicas={5} runningReplicas={3} />)
    expect(screen.getByText('3/5')).toBeInTheDocument()
    expect(screen.getByText('3/5').className).toContain('text-bg-danger')
  })

  it('renders degraded state when runningReplicas is 0', () => {
    render(<Replicas replicas={3} runningReplicas={0} />)
    expect(screen.getByText('0/3')).toBeInTheDocument()
    expect(screen.getByText('0/3').className).toContain('text-bg-danger')
  })

  it('renders empty when replicas is 0', () => {
    render(<Replicas replicas={0} runningReplicas={0} />)
    expect(screen.queryByText(/\/0/)).not.toBeInTheDocument()
  })
})
