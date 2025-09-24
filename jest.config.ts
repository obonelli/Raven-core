// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // ✅ Ejecuta Jest en modo ESM para evitar el "Unexpected token export" de `jose`
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.spec.json',
            },
        ],
    },
    extensionsToTreatAsEsm: ['.ts'],

    // Permite imports con sufijo .js en TS (NodeNext) → mapea al .ts
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },

    testMatch: [
        '<rootDir>/src/__tests__/**/*.test.ts',
        '<rootDir>/src/tests/**/*.test.ts',
    ],

    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],

    // Mantén por defecto; al usar ESM ya no intentará ejecutar `jose` como CJS
    transformIgnorePatterns: ['/node_modules/'],

    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/index.ts',
        '!src/**/types.ts',
        '!src/__tests__/setupTests.ts',
    ],
};

export default config;
