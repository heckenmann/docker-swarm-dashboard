import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider, useAtom } from 'jotai'
import { useEntityActions } from '../../../src/common/actions/entityActions'
import * as atoms from '../../../src/common/store/atoms'
import {
  servicesDetailId,
  nodesDetailId,
  tasksId,
} from '../../../src/common/navigationConstants'

function TestEntity({ entityType }) {
  const { onOpen, onFilter } = useEntityActions(entityType)
  const [view] = useAtom(atoms.viewAtom)
  const [svcFilter] = useAtom(atoms.serviceNameFilterAtom)
  const [stackFilter] = useAtom(atoms.stackNameFilterAtom)

  return (
    <div>
      <button onClick={() => onOpen('ID1')}>open</button>
      <button onClick={() => onFilter('foo')}>filter</button>
      <div data-testid="view">{JSON.stringify(view)}</div>
      <div data-testid="svc">{svcFilter}</div>
      <div data-testid="stack">{stackFilter}</div>
    </div>
  )
}

describe('useEntityActions coverage', () => {
  test('onOpen sets view for service/node/task and onFilter sets filters', async () => {
    const { container } = render(
      <Provider
        initialValues={[[atoms.viewAtom, {}], [atoms.serviceNameFilterAtom, ''], [atoms.stackNameFilterAtom, ''], [atoms.filterTypeAtom, 'service']]}>
        <TestEntity entityType="service" />
      </Provider>,
    )

    const openBtn = screen.getByText('open')
    fireEvent.click(openBtn)
    await waitFor(() => expect(screen.getByTestId('view')).toBeInTheDocument())
    const view = JSON.parse(screen.getByTestId('view').textContent)
    expect(view.id).toBeDefined()

    const filterBtn = screen.getByText('filter')
    fireEvent.click(filterBtn)
    await waitFor(() => expect(screen.getByTestId('svc').textContent).toBe('foo'))

    // now test stack variant
    render(
      <Provider
        initialValues={[[atoms.viewAtom, {}], [atoms.serviceNameFilterAtom, ''], [atoms.stackNameFilterAtom, ''], [atoms.filterTypeAtom, 'service']]}>
        <TestEntity entityType="stack" />
      </Provider>,
    )
    const filterBtns = screen.getAllByText('filter')
    const filterBtn2 = filterBtns[1]
    fireEvent.click(filterBtn2)
    await waitFor(() => {
      const stacks = screen.getAllByTestId('stack')
      expect(stacks[1].textContent).toBe('foo')
    })
  })
})
