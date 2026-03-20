/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ServiceStatusBadge } from '../../../../src/components/services/ServiceStatusBadge'

describe('ServiceStatusBadge', () => {
  it('renders running status', () => {
    render(<ServiceStatusBadge status="running" />)
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText('running').className).toContain('text-bg-success')
  })

  it('renders stopped status', () => {
    render(<ServiceStatusBadge status="stopped" />)
    expect(screen.getByText('stopped')).toBeInTheDocument()
    expect(screen.getByText('stopped').className).toContain('text-bg-secondary')
  })

  it('renders unknown status', () => {
    render(<ServiceStatusBadge status="unknown" />)
    expect(screen.getByText('unknown')).toBeInTheDocument()
    expect(screen.getByText('unknown').className).toContain('text-bg-warning')
  })

  it('renders running with 0 replicas', () => {
    render(<ServiceStatusBadge status="running" replicas={0} />)
    expect(screen.getByText('running (0)')).toBeInTheDocument()
  })

  it('renders running with replicas', () => {
    render(<ServiceStatusBadge status="running" replicas={3} />)
    expect(screen.getByText('running (3)')).toBeInTheDocument()
  })
})
