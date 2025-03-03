require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  }
};

console.log('Attempting to connect with modified config:', {
  ...config,
  password: '***'
});

async function testConnection() {
  try {
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('Successfully connected to database!');
    await pool.close();
  } catch (err) {
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      state: err.state,
      number: err.number
    });
  }
}

testConnection();