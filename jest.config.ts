// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',

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

    moduleNameMapper: {
        // permite imports con sufijo .js en TS (NodeNext) → mapea al .ts
        '^(\\.{1,2}/.*)\\.js$': '$1',
        // 👇 mockea jose para evitar el error de ESM
        '^jose$': '<rootDir>/src/__tests__/mocks/jose.ts',
    },

    testMatch: [
        '<rootDir>/src/__tests__/**/*.test.ts',
        '<rootDir>/src/tests/**/*.test.ts',
    ],

    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],

    transformIgnorePatterns: ['/node_modules/'],

    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/index.ts',
        '!src/**/types.ts',
        '!src/__tests__/setupTests.ts',
    ],
};

export default config;
