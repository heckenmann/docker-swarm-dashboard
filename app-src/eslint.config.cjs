// Minimal flat ESLint config to allow ESLint v9 to run in this codebase.
// This avoids the legacy 'env' key error and gives a first-pass lint report.
module.exports = [
  // ignore common folders
  {
    ignores: ["node_modules/**", "coverage/**", "dist/**"],
  },
  // Basic rules for JS files in src
  {
    files: ["src/**/*.js", "src/**/*.jsx", "tests/**/*.js", "tests/**/*.jsx"],
    languageOptions: {
  ecmaVersion: 2021,
  sourceType: "module",
  parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        process: "readonly",
      },
    },
   plugins: { "unused-imports": require("eslint-plugin-unused-imports"), "react": require("eslint-plugin-react"), "prettier": require("eslint-plugin-prettier"), "jsx-a11y": require("eslint-plugin-jsx-a11y") },
    rules: {
      // keep a couple lightweight rules; expand later as needed
  "prefer-const": "error",
  "react-hooks/exhaustive-deps": "off",
  "no-unused-vars": ["error", { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }],
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": ["warn", { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }],
  "react/jsx-uses-vars": "error",
  // Enforce Prettier formatting via ESLint
  "prettier/prettier": "error",
  // ARIA accessibility rules
  "jsx-a11y/aria-props": "error",
  "jsx-a11y/aria-proptypes": "error",
  "jsx-a11y/aria-role": "error",
  "jsx-a11y/aria-unsupported-elements": "error",
  "jsx-a11y/label-has-associated-control": "error",
  "jsx-a11y/role-has-required-aria-props": "error",
  "jsx-a11y/anchor-is-valid": "error",
  "jsx-a11y/interactive-supports-focus": "error",
    },
  },
];
// Note: keep this file a flat-config (array) export. Legacy configs using
// `module.exports = { env: ... }` will break ESLint v9 when using flat config.
