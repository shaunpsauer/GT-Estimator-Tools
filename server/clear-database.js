require('dotenv').config();
const sql = require('mssql');
const { poolPromise } = require('./db');

async function clearDatabase() {
    try {
        const pool = await poolPromise;
        console.log('Connected to database. Starting cleanup...');

        // Disable foreign key constraints temporarily
        await pool.request().query('ALTER TABLE ProjectChanges NOCHECK CONSTRAINT ALL');
        
        // Clear tables in order (child tables first)
        console.log('Clearing ProjectChanges table...');
        await pool.request().query('DELETE FROM ProjectChanges');
        
        console.log('Clearing ExcelProjects table...');
        await pool.request().query('DELETE FROM ExcelProjects');
        
        console.log('Clearing Projects table...');
        await pool.request().query('DELETE FROM Projects');

        console.log('Clearing DataUploads table...');
        await pool.request().query('DELETE FROM DataUploads');

        // Re-enable foreign key constraints
        await pool.request().query('ALTER TABLE ProjectChanges CHECK CONSTRAINT ALL');

        // Reset identity columns if they exist
        try {
            await pool.request().query('DBCC CHECKIDENT (\'ProjectChanges\', RESEED, 0)');
            await pool.request().query('DBCC CHECKIDENT (\'DataUploads\', RESEED, 0)');
            console.log('Identity columns reset successfully');
        } catch (err) {
            console.log('Note: Some tables might not have identity columns to reset');
        }

        console.log('Database cleared successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            state: err.state,
            number: err.number
        });
        process.exit(1);
    }
}

// Run the cleanup
console.log('Starting database cleanup...');
clearDatabase();