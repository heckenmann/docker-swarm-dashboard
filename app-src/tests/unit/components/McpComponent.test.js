import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtomValue: (atom) => mockUseAtomValue(atom),
}))

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  baseUrlAtom: 'baseUrlAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))

const {
  buildMcpUrl,
  default: McpComponent,
} = require('../../../src/components/misc/McpComponent.jsx')

describe('McpComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
  })

  test('builds a root MCP URL from the dashboard origin', () => {
    expect(
      buildMcpUrl('/', {
        origin: 'https://dashboard.example.com',
        pathname: '/',
      }),
    ).toBe('https://dashboard.example.com/mcp')
  })

  test('preserves a dashboard path prefix and ignores a custom API host', () => {
    expect(
      buildMcpUrl('http://api.internal/docker-dashboard/', {
        origin: 'https://dashboard.example.com',
        pathname: '/docker-dashboard/',
      }),
    ).toBe('https://dashboard.example.com/docker-dashboard/mcp')
  })

  test('renders connection details and copies the MCP URL', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'baseUrlAtom') return '/docker-dashboard/'
      if (atom === 'dashboardSettingsAtom') return { mcpEnabled: true }
      return null
    })

    render(<McpComponent />)

    expect(screen.getByText('Streamable HTTP')).toBeInTheDocument()
    expect(screen.getAllByText('docker-swarm-dashboard')).toHaveLength(2)
    expect(screen.getByLabelText('MCP URL')).toHaveValue(
      'http://localhost/docker-dashboard/mcp',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy MCP URL' }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'http://localhost/docker-dashboard/mcp',
      )
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
  })

  test('renders nothing when MCP is disabled', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'baseUrlAtom') return '/'
      if (atom === 'dashboardSettingsAtom') return { mcpEnabled: false }
      return null
    })

    const { container } = render(<McpComponent />)
    expect(container).toBeEmptyDOMElement()
  })

  test('reports clipboard failures without throwing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockRejectedValue(new Error('denied')),
      },
    })

    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'baseUrlAtom') return '/'
      if (atom === 'dashboardSettingsAtom') return { mcpEnabled: true }
      return null
    })

    render(<McpComponent />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy MCP URL' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Copy failed')
  })
})
