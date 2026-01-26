// atoms.combined.test.js - top-level aggregator that imports atoms-related test modules
// Importing modules at top-level ensures their `describe` and `test` blocks register with Jest.

require('./atoms.test.js')
require('./atoms_theme.test.js')
require('./atoms_logic.test.js')
require('./atoms_branches.test.js')

// fetch/runtime/module-load
require('./fetch_atoms.combined.test.js')
