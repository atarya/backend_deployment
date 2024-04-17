module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: 'standard',
  overrides: [
    {
      env: {
        node: true
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'comma-dangle': ['error', 'never'], // Disallow trailing commas
    semi: ['error', 'always'], // Require semicolons
    quotes: ['error', 'single'], // Enforce single quotes
    indent: ['error', 2], // Enforce 2-space indent
    'no-unused-vars': 'off', // Lessen severity for unused variables
    'no-undef': 'warn' // Lessen severity for undefined variables
  }
};
