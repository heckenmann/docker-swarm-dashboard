import { render, screen } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  dashboardSettingsAtom: {},
}))
jest.mock('jotai', () => ({ useAtomValue: () => ({ locale: 'en', timeZone: 'UTC' }) }))
jest.mock('../../../src/common/DefaultDateTimeFormat', () => ({
  toDefaultDateTimeString: () => '2026-01-18T00:00:00Z',
}))


describe('ServiceStatusBadge (combined)', () => {
  test('renders simple badge when no tooltip data', () => {
    render(<ServiceStatusBadge id={1} serviceState={'running'} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  test('renders overlay tooltip when createdAt/updatedAt/serviceError provided', () => {
    render(
      <ServiceStatusBadge
        id={2}
        serviceState={'failed'}
        createdAt={new Date().toISOString()}
        updatedAt={new Date().toISOString()}
        serviceError={'boom'}
      />,
    )
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  test('returns nothing when state is hidden', () => {
    const { container } = render(
      <ServiceStatusBadge id={3} serviceState={'running'} hiddenStates={['running']} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
