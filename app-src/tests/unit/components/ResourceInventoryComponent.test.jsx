import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

const mockNavigationContext = React.createContext(null)
let mockResult
let mockSize
let mockDetail
const mockSetStack = jest.fn()
jest.mock('jotai', () => ({
  useAtom: () => require('react').useContext(mockNavigationContext),
  useSetAtom: () => mockSetStack,
  useAtomValue: (atom) => {
    const [view] = require('react').useContext(mockNavigationContext)
    if (atom === 'configDetail' || atom === 'secretDetail') {
      if (mockDetail.state !== 'hasData') return mockDetail
      const resource = mockResult.data?.resources.find(
        (item) => item.id === view.detail,
      )
      return {
        state: 'hasData',
        data: resource
          ? {
              ...resource,
              content:
                mockDetail.data?.id === resource.id
                  ? mockDetail.data.content
                  : null,
            }
          : null,
      }
    }
    return {
      configs: mockResult,
      secrets: mockResult,
      size: mockSize,
      theme: 'light',
      locale: 'en-US',
      zone: 'UTC',
    }[atom]
  },
}))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'theme',
}))
jest.mock('../../../src/common/store/loadable', () => ({
  loadable: (atom) => atom,
}))
jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  configsAtom: 'configs',
  configDetailAtom: 'configDetail',
  secretDetailAtom: 'secretDetail',
  secretsAtom: 'secrets',
}))
jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'view',
}))
jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'size',
  localeAtom: 'locale',
  timeZoneAtom: 'zone',
  stackNameFilterAtom: 'stack',
}))
jest.mock(
  '../../../src/components/common/DSDCard',
  () =>
    ({ title, body, children, headerActions }) => (
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
    ({ name, id }) => <a href={'#service/' + id}>{name}</a>,
)
const Inventory =
  require('../../../src/components/resources/ResourceInventoryComponent').default

const DetailsResource =
  require('../../../src/components/resources/DetailsResourceComponent').default
const ResourceInventory = ({ kind }) => {
  const navigation = React.useState({ id: kind })
  return (
    <mockNavigationContext.Provider value={navigation}>
      {navigation[0].id.endsWith('Detail') ? (
        <DetailsResource kind={kind} />
      ) : (
        <Inventory kind={kind} />
      )}
    </mockNavigationContext.Provider>
  )
}

const resource = (overrides = {}) => ({
  id: 'shared',
  name: 'resource-v2',
  version: 7,
  created: '2026-01-01T00:00:00Z',
  updated: '2026-02-01T00:00:00Z',
  stack: 'demo',
  labels: { password: '********' },
  usage: 'referenced',
  consumers: [
    {
      serviceId: 's1',
      serviceName: 'web',
      stack: 'consumer-stack',
      target: '/etc/web',
      uid: '1000',
      gid: '1001',
      mode: '0440',
    },
    { serviceId: 's2', serviceName: 'worker', target: '/etc/worker' },
  ],
  ...overrides,
})
const inventory = (
  resources = [
    resource(),
    resource({
      id: 'unused',
      name: 'old-version',
      stack: '',
      usage: 'unreferenced',
      consumers: [],
    }),
  ],
  overrides = {},
) => ({ state: 'hasData', data: { resources, usageKnown: true, ...overrides } })
beforeEach(() => {
  mockResult = inventory()
  mockSize = 'lg'
  mockDetail = {
    state: 'hasData',
    data: { id: 'shared', content: { status: 'hidden' } },
  }
  mockSetStack.mockReset()
})

it('shows separate inventories and cleanup candidates with global table size', () => {
  const { rerender } = render(<ResourceInventory kind="configs" />)
  expect(screen.getByRole('heading', { name: 'Configs' })).toBeInTheDocument()
  expect(screen.getByText(/cleanup candidate/)).toBeInTheDocument()
  expect(screen.getByRole('table')).not.toHaveClass('table-sm')
  rerender(<ResourceInventory kind="secrets" />)
  expect(screen.getByRole('heading', { name: 'Secrets' })).toBeInTheDocument()
})
it('shows every service mount, metadata and stack links in details', () => {
  render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(screen.getByText('/etc/web')).toBeInTheDocument()
  expect(screen.getByText('/etc/worker')).toBeInTheDocument()
  expect(screen.getByText('1000')).toBeInTheDocument()
  expect(screen.getByText('1001')).toBeInTheDocument()
  expect(screen.getByText('0440')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'web' })).toHaveAttribute(
    'href',
    '#service/s1',
  )
  expect(screen.getByText('********')).toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'demo' })[0])
  expect(mockSetStack).toHaveBeenCalledWith('demo')
})
it('reflects removed services and resources on refresh', () => {
  const { rerender } = render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  mockResult = inventory([resource({ usage: 'unreferenced', consumers: [] })])
  rerender(<ResourceInventory kind="configs" />)
  expect(screen.getByText('No consuming services.')).toBeInTheDocument()
  expect(screen.queryByText('/etc/web')).not.toBeInTheDocument()
  mockResult = inventory([])
  rerender(<ResourceInventory kind="configs" />)
  expect(
    screen.getByText('This resource is no longer in the inventory.'),
  ).toBeInTheDocument()
})
it('never presents unknown usage as unused', () => {
  mockResult = inventory([resource({ usage: 'unknown', consumers: [] })], {
    usageKnown: false,
    message: 'Services unavailable',
  })
  render(<ResourceInventory kind="secrets" />)
  expect(screen.getByText('Services unavailable')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(
    screen.getByText('Consuming services are unknown.'),
  ).toBeInTheDocument()
  expect(screen.queryByText(/cleanup candidate/)).not.toBeInTheDocument()
})
it('shows missing references and runtime targets without invented timestamps', () => {
  mockResult = inventory([
    resource({
      missing: true,
      version: 0,
      labels: null,
      name: '',
      consumers: [{ serviceId: 's1', serviceName: 'web', runtime: true }],
    }),
  ])
  render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'shared' }))
  expect(
    screen.getByText(/Referenced resource was not returned/),
  ).toBeInTheDocument()
  expect(screen.getByText('Runtime target')).toBeInTheDocument()
})
it('shows loading and errors instead of an empty inventory', () => {
  mockResult = { state: 'loading' }
  const { rerender } = render(<ResourceInventory kind="configs" />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading configs')
  mockResult = { state: 'hasError' }
  rerender(<ResourceInventory kind="configs" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to load configs')
})

it('updates density in both inventory and mount tables', () => {
  const { rerender } = render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  for (const table of screen.getAllByRole('table'))
    expect(table).not.toHaveClass('table-sm')
  mockSize = 'sm'
  rerender(<ResourceInventory kind="configs" />)
  for (const table of screen.getAllByRole('table'))
    expect(table).toHaveClass('table-sm')
})

it('shows full config text safely only when the server exposes it', () => {
  const value = '<script>example</script>\nPASSWORD=example-value\n'
  mockDetail = {
    state: 'hasData',
    data: {
      id: 'shared',
      content: { status: 'available', encoding: 'utf-8', value },
    },
  }
  const { container, rerender } = render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(container.querySelector('pre code').textContent).toBe(value)
  expect(container.querySelector('script')).toBeNull()
  mockDetail = {
    state: 'hasData',
    data: { id: 'shared', content: { status: 'hidden' } },
  }
  rerender(<ResourceInventory kind="configs" />)
  expect(
    screen.getByText(/Set DSD_HIDE_CONFIG_CONTENT=false/),
  ).toBeInTheDocument()
  expect(container.querySelector('pre')).toBeNull()
})
it('distinguishes binary, empty and unavailable config content', () => {
  mockDetail = {
    state: 'hasData',
    data: {
      id: 'shared',
      content: { status: 'available', encoding: 'base64', value: '/wA=' },
    },
  }
  const { rerender } = render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(screen.getByText('Binary content (Base64)')).toBeInTheDocument()
  expect(screen.getByText('/wA=')).toBeInTheDocument()
  mockDetail = {
    state: 'hasData',
    data: {
      id: 'shared',
      content: { status: 'available', encoding: 'utf-8', value: '' },
    },
  }
  rerender(<ResourceInventory kind="configs" />)
  expect(screen.getByText('This config is empty.')).toBeInTheDocument()
  mockDetail = {
    state: 'hasData',
    data: {
      id: 'shared',
      content: { status: 'unavailable', message: 'Config was removed' },
    },
  }
  rerender(<ResourceInventory kind="configs" />)
  expect(screen.getByText('Config was removed')).toBeInTheDocument()
})
it('handles content loading, errors and a previous config response', () => {
  mockDetail = { state: 'loading' }
  const { rerender, container } = render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading resource details',
  )
  mockDetail = { state: 'hasError' }
  rerender(<ResourceInventory kind="configs" />)
  expect(
    screen.getByText(/Failed to load resource details/),
  ).toBeInTheDocument()
  mockDetail = {
    state: 'hasData',
    data: {
      id: 'another',
      content: { status: 'available', value: 'stale-content' },
    },
  }
  rerender(<ResourceInventory kind="configs" />)
  expect(container).not.toHaveTextContent('stale-content')
})
it('never displays a payload section in secret details', () => {
  render(<ResourceInventory kind="secrets" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(
    screen.queryByRole('region', { name: 'Config content' }),
  ).not.toBeInTheDocument()
})

it('sorts inventories in both directions and restores original order', () => {
  mockResult = inventory([
    resource({ id: 'z', name: 'Zulu' }),
    resource({ id: 'a', name: 'Alpha' }),
  ])
  render(<ResourceInventory kind="configs" />)
  const names = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.querySelector('button').textContent)
  const header = screen.getByRole('button', { name: /Sort by Name/ })
  expect(names()).toEqual(['Zulu', 'Alpha'])
  fireEvent.click(header)
  expect(names()).toEqual(['Alpha', 'Zulu'])
  expect(header).toHaveAttribute('aria-sort', 'ascending')
  fireEvent.keyDown(header, { key: 'Enter' })
  expect(names()).toEqual(['Zulu', 'Alpha'])
  fireEvent.keyDown(header, { key: ' ' })
  expect(header).toHaveAttribute('aria-sort', 'none')
  expect(names()).toEqual(['Zulu', 'Alpha'])
})
it('sorts consumers independently', () => {
  const { container } = render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  const header = screen.getByRole('button', { name: /Sort by Service,/ })
  fireEvent.click(header)
  expect(header).toHaveAttribute('aria-sort', 'ascending')
  fireEvent.click(header)
  expect(header).toHaveAttribute('aria-sort', 'descending')
  fireEvent.click(header)
  expect(header).toHaveAttribute('aria-sort', 'none')
  expect(
    container.querySelectorAll('table.table-bordered.table-striped.mb-0'),
  ).toHaveLength(1)
})

it('uses a separate detail page with the standard header', () => {
  render(<ResourceInventory kind="configs" />)
  fireEvent.click(screen.getByRole('button', { name: 'resource-v2' }))
  expect(
    screen.queryByLabelText('Filter resource name or ID'),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Config "resource-v2"' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Back to/ }),
  ).not.toBeInTheDocument()
})

// Resource navigation is exercised independently through the shared name component.
jest.mock(
  '../../../src/components/shared/names/ResourceName',
  () =>
    ({ name, id, kind }) => {
      const [, setView] = require('jotai').useAtom(
        require('../../../src/common/store/atoms/navigationAtoms').viewAtom,
      )
      return (
        <button
          disabled={!id}
          onClick={() => setView({ id: kind + 'Detail', detail: id })}
        >
          {name}
        </button>
      )
    },
)
