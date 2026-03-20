/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ImageTag } from '../../../../src/components/images/ImageTag'

describe('ImageTag', () => {
  it('renders image tag', () => {
    render(<ImageTag imageTag="nginx:latest" />)
    expect(screen.getByText('nginx:latest')).toBeInTheDocument()
  })

  it('renders truncated hash when isHash is true', () => {
    render(<ImageTag imageTag="abc123def456" isHash={true} />)
    expect(screen.getByText('abc123def456')).toBeInTheDocument()
  })

  it('renders :latest tag by default', () => {
    render(<ImageTag imageTag="nginx" />)
    expect(screen.getByText('nginx:latest')).toBeInTheDocument()
  })

  it('does not append :latest when isHash is true', () => {
    render(<ImageTag imageTag="abc123" isHash={true} />)
    expect(screen.getByText('abc123')).toBeInTheDocument()
    expect(screen.queryByText('abc123:latest')).not.toBeInTheDocument()
  })

  it('does not append :latest when tag already present', () => {
    render(<ImageTag imageTag="nginx:1.19" />)
    expect(screen.getByText('nginx:1.19')).toBeInTheDocument()
  })
})
