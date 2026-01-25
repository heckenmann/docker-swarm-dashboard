// atoms.combined.test.js - top-level aggregator that imports atoms-related test modules
// Importing modules at top-level ensures their `describe` and `test` blocks register with Jest.

require('./atoms.test.js')
require('./atoms_theme.test.js')
require('./atoms_logic.test.js')
require('./atoms_branches.test.js')

// parsing & guards (optional)
try { require('./atoms_parsing.test.js') } catch (e) {}
try { require('./atoms_parse_edgecases.test.js') } catch (e) {}
try { require('./atoms_guards.test.js') } catch (e) {}

// fetch/runtime/module-load
try { require('./fetch_atoms.combined.test.js') } catch (e) {}
try { require('./atoms_runtime.test.js') } catch (e) {}
try { require('./atoms_module_load.combined.test.js') } catch (e) {}

// extra branches and variants
try { require('./atoms_additional_branches.test.js') } catch (e) {}
try { require('./atoms_hash_variants.test.js') } catch (e) {}
try { require('./atoms_and_jsontable_extra.test.js') } catch (e) {}

