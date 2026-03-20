/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ServicePorts } from '../../../../../src/components/services/ServicePorts'

describe('ServicePorts', () => {
  it('renders nothing when ports is null', () => {
    const { container } = render(<ServicePorts ports={null} />)
    expect(container.firstChild).toBeNull()
  })
})
