import React from 'react'
import { render, screen } from '@testing-library/react'

// mock jotai atom used for table size
jest.mock('../../src/common/store/atoms', () => ({ tableSizeAtom: 'sm' }))
jest.mock('jotai', () => ({ useAtomValue: () => 'sm' }))

import { JsonTable } from '../../src/components/JsonTable'

test('renders table from json', () => {
  const data = { x: { y: 'z' }, n: 1 }
  render(<JsonTable json={data} />)
  expect(screen.getByText('Key')).toBeInTheDocument()
  // since flattening creates key 'x.y' and 'n'
  expect(screen.getByText('x.y')).toBeInTheDocument()
  expect(screen.getByText('z')).toBeInTheDocument()
})
