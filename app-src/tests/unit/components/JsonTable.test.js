// JsonTable.test.js
// Render tests for JsonTable to ensure component handles empty JSON config.
import React from 'react'
import { render } from '@testing-library/react'
import { JsonTable } from '../../../src/components/JsonTable'

test('JsonTable renders with empty data', () => {
	const { container } = render(<JsonTable json={{}} />)
	expect(container).toBeTruthy()
})
