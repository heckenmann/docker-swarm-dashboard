// atoms.combined.test.js - aggregates all atoms-related test modules
// Importing modules at top-level ensures their `describe` and `test` blocks register with Jest.
// NOTE: atoms_extra.test.js imports createStore from jotai directly and must be
// loaded BEFORE any file that uses top-level jest.mock('jotai', ...) to avoid
// module registry contamination.
require('./atoms_extra.test.js')
require('./atoms_parseHash.coverage.test.js')
require('./atoms.test.js')
require('./atoms_theme.test.js')
require('./atoms_logic.test.js')
require('./atoms_branches.test.js')
require('./exercise_atoms_branches.test.js')

// fetch/runtime/module-load
require('./fetch_atoms.combined.test.js')
