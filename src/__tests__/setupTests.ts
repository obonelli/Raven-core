// Forzamos prod para saltarnos bootstraps de dev en app.ts
process.env.NODE_ENV = 'production';

// Silenciar pino en tests
jest.mock('../config/logger.js', () => {
    const noop = { info: () => { }, error: () => { }, warn: () => { }, debug: () => { } };
    return { logger: noop };
});
