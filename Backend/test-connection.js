import sql from 'mssql';

const config = {
  server: 'LOOKER',
  port: 2733,
  database: 'EDU_HOM',
  user: 'eduhom',
  password: 'teste@eduhom#giz',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

console.log('Testing SQL Server connection...');
console.log('Config:', {
  ...config,
  password: config.password.substring(0, 4) + '...'
});

try {
  const pool = await sql.connect(config);
  console.log('✓ Connection successful!');
  
  const result = await pool.request().query('SELECT 1 AS test');
  console.log('✓ Query successful:', result.recordset);
  
  await pool.close();
  console.log('✓ Connection closed');
  process.exit(0);
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}
