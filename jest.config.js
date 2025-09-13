// jest.config.js
export default {
    // Use ts-jest with native ESM support
    preset: 'ts-jest/presets/default-esm',

    // Run tests in a Node environment (no JSDOM)
    testEnvironment: 'node',

    // Location of your test files
    roots: ['<rootDir>/src/tests'],

    // Treat .ts files as ESM
    extensionsToTreatAsEsm: ['.ts'],

    // Transform TypeScript test files using ts-jest (ESM mode)
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
    },

    // Allow TS files that import using a `.js` suffix to work in Jest
    // e.g., `import x from './foo.js'` inside TypeScript source
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },

    // Ignore compiled output and dependencies
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],

    // Automatically clear mock calls/instances between tests
    clearMocks: true,
};
