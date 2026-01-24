// Minimal flat ESLint config to allow ESLint v9 to run in this codebase.
// This avoids the legacy 'env' key error and gives a first-pass lint report.
module.exports = [
  // ignore common folders
  {
    ignores: ["node_modules/**", "coverage/**", "dist/**"],
  },
  // Basic rules for JS files in src
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
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
    rules: {
      // keep a couple lightweight rules; expand later as needed
  "prefer-const": "error",
  "react-hooks/exhaustive-deps": "off",
    },
  },
];
// Note: keep this file a flat-config (array) export. Legacy configs using
// `module.exports = { env: ... }` will break ESLint v9 when using flat config.
