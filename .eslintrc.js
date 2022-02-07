module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    // 'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/no-unused-vars": ["off"],
    "@typescript-eslint/ban-ts-comment": ["off"],
    "@typescript-eslint/no-empty-function": ["off"],
    "@typescript-eslint/ban-types": ["off"],
    "@typescript-eslint/no-var-requires": ["off"],
    "@typescript-eslint/no-inferrable-types": ["off"],
    "require-await": ["error"],
    "@typescript-eslint/no-floating-promises": ["error"],
    "max-len": ["off"],
    "semi": ["error"],
    "comma-dangle": ["error", "always-multiline"],
    "eol-last": ["error"],
  },
  ignorePatterns: ['.eslintrc.js'],
};