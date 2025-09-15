/* eslint-env jest */

// We force prod to skip dev bootstraps in app.ts
process.env.NODE_ENV = 'production';

// Mute pine in tests
jest.mock('../config/logger.js', () => {
    const noop = { info: () => { }, error: () => { }, warn: () => { }, debug: () => { } };
    return { logger: noop };
});
