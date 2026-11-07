const { createRequire } = require('node:module')

const bootstrapConfigPath = require.resolve('stylelint-config-twbs-bootstrap')
const bootstrapConfig = require(bootstrapConfigPath)
const requireFromBootstrap = createRequire(bootstrapConfigPath)

module.exports = {
  ...bootstrapConfig,
  // Bootstrap still bundles a Standard preset with a rule removed in Stylelint 18.
  extends: bootstrapConfig.extends.map((preset) =>
    preset === 'stylelint-config-standard'
      ? require.resolve(preset)
      : requireFromBootstrap.resolve(preset),
  ),
}
