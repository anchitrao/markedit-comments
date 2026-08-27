import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, __PKG_VERSION__: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
