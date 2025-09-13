import 'dotenv/config';
import process from 'process';

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';

export const env = { PORT, NODE_ENV, isProd: NODE_ENV === 'production' };