require('dotenv').config();
const sql = require('mssql');
const { poolPromise } = require('./db');

async function fixExcelMapping() {
    try {
        const pool = await poolPromise;
        console.log('Connected to database. Starting fix...');

        // First, clear the existing data
        console.log('Clearing existing data...');
        await pool.request().query('DELETE FROM ExcelProjects');
        await pool.request().query('DELETE FROM DataUploads');
        
        // Reset identity columns
        await pool.request().query('DBCC CHECKIDENT (\'DataUploads\', RESEED, 0)');
        
        console.log('Database cleared. Please re-upload your Excel file.');
        console.log('\nMake sure your Excel file has:');
        console.log('1. Sheet name: First sheet will be used');
        console.log('2. Headers in row 4');
        console.log('3. "Row" column will be used as the ID');
        console.log('4. Data starting from row 5');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

console.log('Starting Excel mapping fix...');
fixExcelMapping();
