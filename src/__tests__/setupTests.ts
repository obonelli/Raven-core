import { jest } from '@jest/globals';

// Force prod to skip dev bootstraps in app.ts
process.env.NODE_ENV = 'production';

// Mute pino in tests
jest.mock('../config/logger.js', () => {
    const noop = { info: () => { }, error: () => { }, warn: () => { }, debug: () => { } };
    return { logger: noop };
});
