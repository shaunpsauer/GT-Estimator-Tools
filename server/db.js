const sql = require('mssql');

// Get configuration from environment variables
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // From your Azure SQL connection strings
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: false
  }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => console.error('Database Connection Failed: ', err));

module.exports = {
  sql, poolPromise
};