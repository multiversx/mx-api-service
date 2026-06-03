const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.js'
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      "require-await": ["error"],
      "max-len": ["off"],
      "semi": ["error"],
      "comma-dangle": ["error", "only-multiline"],
      "eol-last": ["error"],

      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/no-unused-vars": ["off"],
      "@typescript-eslint/ban-ts-comment": ["off"],
      "@typescript-eslint/no-empty-function": ["off"],
      "@typescript-eslint/ban-types": ["off"],
      "@typescript-eslint/no-var-requires": ["off"],
      "@typescript-eslint/no-inferrable-types": ["off"],
      "@typescript-eslint/no-floating-promises": ["error"],
      "@typescript-eslint/await-thenable": ["error"],
    },
  },
];
