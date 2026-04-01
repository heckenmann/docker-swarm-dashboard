// Flat ESLint config for ESLint v9 with enhanced rules.
module.exports = [
  // ignore common folders
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "cypress/**",
      "tests/**",
      "mock/**",
    ],
  },
  // Rules for JS/JSX files in src
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@common', './src/common'],
            ['@components', './src/components'],
            ['@shared', './src/components/shared'],
            ['@layout', './src/components/layout'],
            ['@dashboard', './src/components/dashboard'],
            ['@nodes', './src/components/nodes'],
            ['@services', './src/components/services'],
            ['@tasks', './src/components/tasks'],
            ['@settings', './src/components/settings'],
            ['@logs', './src/components/logs'],
            ['@stacks', './src/components/stacks'],
            ['@misc', './src/components/misc'],
            ['@ports', './src/components/ports'],
            ['@timeline', './src/components/timeline'],
          ],
          extensions: ['.js', '.jsx'],
        },
      },
    },
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
    plugins: {
      "unused-imports": require("eslint-plugin-unused-imports"),
      react: require("eslint-plugin-react"),
      prettier: require("eslint-plugin-prettier"),
      "jsx-a11y": require("eslint-plugin-jsx-a11y"),
      "react-hooks": require("eslint-plugin-react-hooks"),
      import: require("eslint-plugin-import"),
    },
    rules: {
      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import organization (lenient - warn only)
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
          ],
          pathGroupsExcludedImportTypes: ["react"],
          warnOnUnassignedImports: true,
        },
      ],
      "import/no-unresolved": "warn",
      "import/named": "warn",
      "import/default": "off",
      "import/namespace": "off",
      "import/export": "warn",
      "import/no-named-as-default": "warn",
      "import/no-named-as-default-member": "warn",

      // React rules
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-fragments": "error",
      "react/prop-types": "warn",
      "react/self-closing-comp": ["warn", { component: true, html: true }],
      "react/require-default-props": "off",

      // Prettier formatting
      "prettier/prettier": "error",

      // Accessibility rules
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",

      // Unused imports/vars
      "no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // General rules
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "no-console": "warn",
    },
  },
];
