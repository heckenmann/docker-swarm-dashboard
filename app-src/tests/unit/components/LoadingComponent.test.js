// LoadingComponent.test.js
// Smoke test ensuring the LoadingComponent mounts without errors.
import React from 'react'
import { render } from '@testing-library/react'
import LoadingComponent from '../../../src/components/LoadingComponent'

test('LoadingComponent mounts', () => {
	const { container } = render(<LoadingComponent />)
	expect(container).toBeTruthy()
})
