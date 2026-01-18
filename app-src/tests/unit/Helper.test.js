// Helper.test.js
// Unit test for helper function that maps docker task states to CSS classes.
import { getStyleClassForState } from '../../src/Helper'

test('getStyleClassForState returns class for known state', () => {
	expect(getStyleClassForState('running')).toBeDefined()
})
