import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const port = Number(env.PORT ?? 3000);
app.listen(port, () => {
    logger.info(`API listening on http://localhost:${port}`);
});
