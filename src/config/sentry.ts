// Sentry initialization (errors + traces; no native profiling)
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN || '';
const environment = process.env.SENTRY_ENV || process.env.NODE_ENV || 'development';
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE ?? 0); // 0..1

export function initSentry(appName = 'raven-core') {
    if (!dsn) return; // skip when DSN is not set

    Sentry.init({
        dsn,
        environment,
        release: `${appName}@${process.env.npm_package_version ?? '0.0.0'}`,
        tracesSampleRate,
    });
}

export { Sentry };
