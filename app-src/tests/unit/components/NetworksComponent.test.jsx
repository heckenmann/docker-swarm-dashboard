import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

let mockView
let mockResult
let mockSize
const mockNavigate = jest.fn()
const mockStack = jest.fn()
const mockService = jest.fn()
const mockFilterType = jest.fn()
let mockNames = true
jest.mock('jotai', () => ({
  useAtomValue: (atom) =>
    ({
      view: mockView,
      inventory: mockResult,
      detail: mockResult,
      size: mockSize,
      theme: 'light',
      locale: 'en-US',
      zone: 'UTC',
      names: mockNames,
    })[atom],
  useSetAtom: (atom) =>
    ({
      view: mockNavigate,
      stack: mockStack,
      service: mockService,
      filterType: mockFilterType,
    })[atom],
}))
jest.mock('../../../src/common/store/loadable', () => ({
  loadable: (atom) => atom,
}))
jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  networksAtom: 'inventory',
  networkDetailAtom: 'detail',
}))
jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'view',
}))
jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'size',
  stackNameFilterAtom: 'stack',
  serviceNameFilterAtom: 'service',
  filterTypeAtom: 'filterType',
  showNamesButtonsAtom: 'names',
  localeAtom: 'locale',
  timeZoneAtom: 'zone',
}))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'theme',
}))
jest.mock(
  '../../../src/components/common/DSDCard',
  () =>
    ({ title, headerActions, body, children }) => (
      <section>
        <h2>{title}</h2>
        {headerActions}
        {body}
        {children}
      </section>
    ),
)

jest.mock(
  '../../../src/components/shared/names/ServiceName',
  () =>
    ({ name, id }) => <a href={'#' + id}>{name}</a>,
)
const NetworksComponent =
  require('../../../src/components/networks/NetworksComponent').default
const entry = () => ({
  network: {
    Id: 'shared',
    Name: 'shared-overlay',
    Driver: 'overlay',
    Scope: 'swarm',
    Created: '2026-01-01T00:00:00Z',
    Ingress: false,
    Internal: false,
    Attachable: true,
    Labels: { 'com.docker.stack.namespace': 'demo' },
    Options: { encrypted: '' },
    IPAM: { Config: [{ Subnet: '10.0.0.0/24', Gateway: '10.0.0.1' }] },
  },
  services: [
    {
      id: 's1',
      name: 'web',
      stack: 'demo',
      aliases: ['api'],
      endpointMode: 'vip',
      virtualIPs: ['10.0.0.2/24'],
      ports: [
        {
          PublishedPort: 8080,
          TargetPort: 80,
          Protocol: 'tcp',
          PublishMode: 'ingress',
        },
      ],
    },
    {
      id: 's2',
      name: 'worker',
      stack: '',
      aliases: [],
      endpointMode: 'dnsrr',
      virtualIPs: [],
      ports: [],
    },
  ],
  missing: false,
})
beforeEach(() => {
  jest.clearAllMocks()
  mockView = { id: 'networks' }
  mockSize = 'sm'
  mockNames = true
  mockResult = {
    state: 'hasData',
    data: {
      networks: [
        entry(),
        {
          network: {
            Id: 'local',
            Name: 'bridge',
            Driver: 'bridge',
            Scope: 'local',
          },
          services: [],
          missing: true,
        },
      ],
      observation: 'Daemon-local observations do not prove connectivity.',
    },
  }
})
test('shows the complete inventory without filters and navigates by full ID', () => {
  render(<NetworksComponent />)
  expect(screen.getByText('Missing')).toBeInTheDocument()
  expect(screen.queryByLabelText('Filter networks by')).not.toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Open network: shared-overlay' }),
  )
  expect(mockNavigate).toHaveBeenCalledWith({
    id: 'networksDetail',
    detail: 'shared',
  })
  fireEvent.click(screen.getByRole('button', { name: 'Filter stack: demo' }))
  expect(mockStack).toHaveBeenCalledWith('demo')
  expect(mockNavigate).toHaveBeenCalledWith({ id: 'stacks' })
})
test('details show all service specifications, configuration and links', () => {
  mockView = { id: 'networksDetail', detail: 'shared' }
  mockResult.data = {
    ...entry(),
    observation: 'Daemon-local observations do not prove connectivity.',
  }
  const { rerender } = render(<NetworksComponent />)
  for (const text of ['web', 'worker', 'api', 'vip', 'dnsrr', '10.0.0.2/24'])
    expect(screen.getByText(text, { exact: true })).toBeInTheDocument()

  expect(screen.getByText('10.0.0.0/24')).toBeInTheDocument()
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  expect(screen.getAllByRole('table')).toHaveLength(7)
  expect(screen.getAllByRole('table')[0]).toHaveClass('table-sm')
  mockSize = 'lg'
  rerender(<NetworksComponent />)
  expect(screen.getAllByRole('table')[0]).not.toHaveClass('table-sm')

  fireEvent.click(screen.getByRole('button', { name: /Open ports: 8080/ }))
  expect(mockService).toHaveBeenCalledWith('web')
  expect(mockStack).toHaveBeenCalledWith('')
  expect(mockFilterType).toHaveBeenCalledWith('service')
  expect(mockNavigate).toHaveBeenCalledWith({ id: 'ports' })
  expect(
    screen.queryByRole('button', { name: 'All networks' }),
  ).not.toBeInTheDocument()
})
test('handles loading, failures, deletion and stale detail data explicitly', () => {
  const { rerender } = render(<NetworksComponent />)
  mockResult = { state: 'loading' }
  rerender(<NetworksComponent />)
  expect(screen.getByRole('status')).toBeInTheDocument()
  mockResult = { state: 'hasError' }
  rerender(<NetworksComponent />)
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to load')
  mockView = { id: 'networksDetail', detail: 'shared' }
  mockResult = { state: 'hasData', data: null }
  rerender(<NetworksComponent />)
  expect(screen.getByRole('alert')).toHaveTextContent('no longer')
  mockResult.data = { ...entry(), network: { Id: 'stale' } }
  rerender(<NetworksComponent />)
  expect(screen.getByRole('status')).toBeInTheDocument()
  mockResult.data = {
    ...entry(),
    missing: true,
    services: [],
    network: { Id: 'shared' },
  }
  rerender(<NetworksComponent />)
  expect(screen.getByText(/may have been deleted/)).toBeInTheDocument()
  expect(
    screen.getByText('No associated service specifications.'),
  ).toBeInTheDocument()
})

test('keeps independent three-click sorts and honors the entity action setting', () => {
  const { rerender } = render(<NetworksComponent />)
  const nameHeader = screen.getByRole('button', { name: /Sort by Name,/ })
  fireEvent.click(nameHeader)
  expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  fireEvent.keyDown(nameHeader, { key: 'Enter' })
  expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  fireEvent.click(nameHeader)
  expect(nameHeader).toHaveAttribute('aria-sort', 'none')
  mockNames = false
  rerender(<NetworksComponent />)
  expect(
    screen.queryByRole('button', { name: /Open network:/ }),
  ).not.toBeInTheDocument()
  mockView = { id: 'networksDetail', detail: 'shared' }
  mockResult.data = {
    ...entry(),
    network: {
      ...entry().network,
      Containers: {
        one: {
          Name: 'web.1',
          EndpointID: 'endpoint',
          IPv4Address: '10.0.0.3/24',
        },
      },
      Peers: [{ Name: 'node-1', IP: '192.0.2.1' }],
    },
  }
  rerender(<NetworksComponent />)
  fireEvent.click(screen.getByRole('button', { name: /Sort by Service,/ }))

  fireEvent.click(screen.getByRole('button', { name: /Sort by Subnet,/ }))
  expect(
    screen.getByRole('button', { name: /Sort by Service,/ }),
  ).toHaveAttribute('aria-sort', 'ascending')

  expect(screen.getByText('web.1')).toBeInTheDocument()
  expect(screen.getByText('192.0.2.1')).toBeInTheDocument()

  expect(screen.getByText(/"EndpointID":\s*"endpoint"/)).toBeInTheDocument()
})

test('uses the same plain JSON presentation as service and node details', () => {
  mockView = { id: 'networksDetail', detail: 'shared' }
  mockResult.data = { ...entry(), observation: 'Daemon-local observations.' }
  render(<NetworksComponent />)
  const code = screen.getByText(/"Id":\s*"shared"/)
  expect(code.tagName).toBe('CODE')
  expect(code.parentElement.tagName).toBe('PRE')
  expect(code.parentElement).toHaveClass('mb-0')
  expect(code.parentElement).toHaveStyle({
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    fontSize: '12px',
  })
  expect(
    screen.queryByRole('button', { name: /copy/i }),
  ).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Code language')).not.toBeInTheDocument()
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
})
