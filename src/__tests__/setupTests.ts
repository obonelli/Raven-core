// Asegura modo test (no producción)
process.env.NODE_ENV = 'test';
// Apaga Bull real por si algún import no usa factories
process.env.BULL_DISABLED = 'true';

// Activa el mock manual de bullmq (usa __mocks__/bullmq.ts)
jest.mock('bullmq');

// Silencia ruido en consola (Sentry/Rate-limit/Dynamo) para evitar
// "Cannot log after tests are done" por logs tardíos
const noop = () => { };
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(console, 'warn').mockImplementation(noop);
jest.spyOn(console, 'log').mockImplementation(noop);

// Si tienes un logger propio, lo puedes noopear también
jest.mock('../config/logger.js', () => {
    const n = { info: noop, error: noop, warn: noop, debug: noop };
    return { logger: n };
});
