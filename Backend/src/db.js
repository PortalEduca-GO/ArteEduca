import sql from 'mssql';
import config from './config.js';

const poolConfig = {
  server: config.server,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password,
  requestTimeout: 30000,
  connectionTimeout: 30000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    appName: 'ArteEducaAPI',
    useUTC: true,
    validateBulkLoadParameters: false,
    tdsVersion: '7_4'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

export const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(poolConfig).then(pool => {
      console.log('✓ SQL Server connected');
      return pool;
    }).catch((error) => {
      console.error('✗ SQL Server connection failed:', error.message);
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
};

export { sql };
