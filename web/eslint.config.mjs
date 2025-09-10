import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // Ignore patterns
  {
    ignores: [
      "node_modules/**/*",
      "dist/**/*",
      "build/**/*",
      "coverage/**/*",
      "*.min.js",
      ".next/**/*",
      ".vite/**/*",
      "public/**/*",
      "*.log",
    ],
  },
  
  // JavaScript and JSX files configuration - Comprehensive React Frontend Rules
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2024, // Latest ECMAScript version
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Base JavaScript rules (comprehensive)
      ...js.configs.recommended.rules,
      
      // React rules (comprehensive)
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      
      // Prettier rules
      ...prettierConfig.rules,
      "prettier/prettier": "error",
      
      // === VARIABLES & DECLARATIONS ===
      "prefer-const": "error",
      "no-var": "error",
      "no-undef": "error",
      "no-unused-vars": [
        "error", 
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        }
      ],
      "no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
      "no-shadow": "error",
      "no-shadow-restricted-names": "error",
      "no-redeclare": "error",

      // === FUNCTIONS ===
      "func-style": ["error", "expression", { allowArrowFunctions: true }],
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],
      "no-loop-func": "error",
      "no-new-func": "error",
      "default-param-last": "error",
      "no-param-reassign": ["error", { props: false }],

      // === OBJECTS & ARRAYS ===
      "object-shorthand": ["error", "always"],
      "prefer-destructuring": ["error", { array: true, object: true }],
      "no-array-constructor": "error",
      "array-callback-return": ["error", { allowImplicit: true }],
      "prefer-spread": "error",
      "prefer-rest-params": "error",

      // === STRINGS & TEMPLATES ===
      "prefer-template": "error",
      "no-useless-escape": "error",
      "no-useless-concat": "error",

      // === COMPARISON & CONDITIONALS ===
      "eqeqeq": ["error", "always"],
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "error",
      "no-else-return": "error",
      "consistent-return": "error",

      // === ERROR HANDLING ===
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",

      // === ASYNC/AWAIT & PROMISES ===
      "require-await": "error",
      "no-await-in-loop": "warn",
      "no-async-promise-executor": "error",
      "no-promise-executor-return": "error",

      // === MODULES ===
      "no-duplicate-imports": "error",
      "no-useless-rename": "error",

      // === SECURITY & BEST PRACTICES ===
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-script-url": "error",
      "no-caller": "error",
      "no-iterator": "error",
      "no-proto": "error",
      "no-extend-native": "error",
      "no-global-assign": "error",

      // === BROWSER SPECIFIC ===
      "no-alert": "warn", // Allow alerts but warn in browser code
      "no-console": "warn", // Warn about console statements in production code

      // === CODE QUALITY ===
      "complexity": ["warn", 15],
      "max-depth": ["warn", 4],
      "max-lines": ["warn", { max: 500, skipComments: true }], // Smaller for React components
      "max-lines-per-function": ["warn", { max: 80, skipComments: true }], // Smaller for React functions
      "max-params": ["warn", 4], // React components shouldn't have too many props
      "max-statements": ["warn", 20],

      // === NAMING CONVENTIONS ===
      "camelcase": ["error", { properties: "never", ignoreDestructuring: false }],
      "new-cap": ["error", { newIsCap: true, capIsNew: false }],

      // === PERFORMANCE ===
      "no-lonely-if": "error",
      "no-useless-call": "error",
      "no-useless-return": "error",
      "no-useless-constructor": "error",

      // === MODERN JAVASCRIPT ===
      "prefer-object-spread": "error",
      "prefer-exponentiation-operator": "error",
      "prefer-numeric-literals": "error",
      "prefer-object-has-own": "error",

      // === STYLE (handled by Prettier, but keep logical ones) ===
      "curly": ["error", "all"],
      "dot-notation": "error",
      "no-multi-assign": "error",
      "one-var": ["error", "never"],

      // === REGEX ===
      "prefer-named-capture-group": "warn",
      "prefer-regex-literals": "error",
      "no-useless-backreference": "error",

      // === UNICODE & SPECIAL CHARACTERS ===
      "unicode-bom": ["error", "never"],
      "no-irregular-whitespace": "error",

      // === REACT SPECIFIC RULES (Enhanced) ===
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "warn", // Warn instead of error
      "react/display-name": "warn",
      "react/no-unused-prop-types": "warn",
      "react/no-unused-state": "warn",
      "react/prefer-stateless-function": "warn",
      "react/self-closing-comp": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-closing-bracket-location": "error",
      "react/jsx-closing-tag-location": "error",
      "react/jsx-curly-spacing": ["error", "never"],
      "react/jsx-equals-spacing": ["error", "never"],
      "react/jsx-first-prop-new-line": ["error", "multiline-multiprop"],
      "react/jsx-indent-props": ["error", 2],
      "react/jsx-max-props-per-line": ["error", { maximum: 1, when: "multiline" }],
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-pascal-case": "error",
      "react/jsx-uses-react": "off", // Not needed in React 17+
      "react/jsx-uses-vars": "error",
      "react/jsx-wrap-multilines": ["error", {
        declaration: "parens-new-line",
        assignment: "parens-new-line",
        return: "parens-new-line",
        arrow: "parens-new-line",
        condition: "parens-new-line",
        logical: "parens-new-line",
        prop: "parens-new-line",
      }],
      "react/no-array-index-key": "warn",
      "react/no-danger": "warn",
      "react/no-did-mount-set-state": "error",
      "react/no-did-update-set-state": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-multi-comp": ["warn", { ignoreStateless: true }],
      "react/no-string-refs": "error",
      "react/no-unknown-property": "error",
      "react/prefer-es6-class": "error",
      "react/require-render-return": "error",

      // === REACT HOOKS RULES ===
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === ACCESSIBILITY (Basic) ===
      "jsx-a11y/alt-text": "off", // Would need jsx-a11y plugin
      
      // === IMPORT/EXPORT STYLE ===
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "../**", // Discourage relative imports beyond parent
          ],
        },
      ],
    },
  },
  
  // Configuration files (JSON, etc.) - Minimal rules
  {
    files: ["**/*.{json,jsonc,json5}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  
  // Test files configuration
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}", "**/test/**/*.{js,jsx}", "**/tests/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        test: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    rules: {
      // Relax rules for test files
      "no-console": "off",
      "no-unused-expressions": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "complexity": "off",
      "prefer-arrow-callback": "off",
      "func-style": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
    },
  },
];
