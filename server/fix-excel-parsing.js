require('dotenv').config();
const sql = require('mssql');
const { poolPromise } = require('./db');

async function fixExcelParsing() {
    try {
        const pool = await poolPromise;
        console.log('Connected to database. Starting fix...');

        // First, get the latest upload ID
        const uploadResult = await pool.request().query(`
            SELECT TOP 1 id, file_name
            FROM DataUploads
            ORDER BY upload_date DESC
        `);

        if (uploadResult.recordset.length === 0) {
            console.log('No uploads found');
            return;
        }

        const uploadId = uploadResult.recordset[0].id;
        console.log(`Latest upload ID: ${uploadId}`);

        // Get the projects from this upload
        const projects = await pool.request()
            .input('uploadId', sql.Int, uploadId)
            .query(`
                SELECT *
                FROM ExcelProjects
                WHERE upload_id = @uploadId
            `);

        console.log(`Found ${projects.recordset.length} projects in upload ${uploadId}`);
        
        // Log a sample project to check the data
        if (projects.recordset.length > 0) {
            console.log('Sample project data:');
            console.log(JSON.stringify(projects.recordset[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

console.log('Starting Excel parsing fix...');
fixExcelParsing();
