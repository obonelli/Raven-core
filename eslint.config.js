// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
    // ignore build artifacts
    { ignores: ['dist/**', 'node_modules/**'] },

    // base recommended rules (JS + TS)
    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        files: ['**/*.{ts,tsx,js}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
            globals: { ...globals.node },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            // prefer the TS version of no-unused-vars
            'no-console': 'off',
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', ignoreRestSiblings: true },
            ],
        },
    },

    // browser-only file(s)
    {
        files: ['src/docs/components/swagger.ts'],
        languageOptions: { globals: { ...globals.browser } },
    },

    // test files
    {
        files: ['**/*.{test,spec}.{ts,js}'],
        languageOptions: { globals: { ...globals.node, ...globals.jest } },
    },
];
