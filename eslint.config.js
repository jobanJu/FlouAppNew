module.exports = [
  {
    ignores: ['node_modules', '.expo', 'dist', 'build', '.expo-shared'],
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
