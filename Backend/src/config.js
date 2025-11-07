import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const envPath = process.env.DOTENV_PATH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');

dotenv.config({
  path: envPath,
  override: true
});

const config = {
  server: process.env.SQL_SERVER || 'localhost',
  port: parseInt(process.env.SQL_PORT || '1433', 10),
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  schema: process.env.SQL_SCHEMA || 'arteeduca',
  appPort: parseInt(process.env.PORT || '3001', 10)
};

export default config;
