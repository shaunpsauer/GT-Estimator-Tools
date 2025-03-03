require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000 // Increasing timeout to 30 seconds
  }
};

console.log('Attempting to connect with config:', {
  ...config,
  password: '***' // Hide password in logs
});

async function testConnection() {
  try {
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('Successfully connected to database!');
    
    // Test a simple query
    const result = await pool.request().query('SELECT 1 as test');
    console.log('Test query result:', result.recordset);
    
    await pool.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      state: err.state,
      number: err.number,
      stack: err.stack
    });
  }
}

testConnection();