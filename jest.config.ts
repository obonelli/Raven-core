// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
    // Usamos ts-jest pero transpila a CJS para evitar líos de ESM
    preset: 'ts-jest',

    testEnvironment: 'node',

    // Transform TS/TSX con ts-jest apuntando al tsconfig **spec** (CJS)
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.spec.json'
            }
        ]
    },

    // Permite imports con sufijo .js en tu código TS (NodeNext) → mapea al .ts
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // Dónde están los tests (ambas rutas válidas)
    testMatch: [
        '<rootDir>/src/__tests__/**/*.test.ts',
        '<rootDir>/src/tests/**/*.test.ts'
    ],

    // Archivo de setup (NO es test)
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],

    transformIgnorePatterns: ['/node_modules/'],

    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/index.ts',
        '!src/**/types.ts',
        '!src/__tests__/setupTests.ts'
    ]
};

export default config;
