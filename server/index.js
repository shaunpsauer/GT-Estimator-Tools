require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');

const app = express();
// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true // Allow cookies if needed
}));
app.use(express.json());

   // Add this near the top of your server/index.js file
   async function ensureTablesExist() {
    try {
      const pool = await poolPromise;
      
      // Check if Projects table exists
      const tableCheck = await pool.request().query(`
        SELECT OBJECT_ID('dbo.Projects') as TableID
      `);
      
      if (!tableCheck.recordset[0].TableID) {
        console.log('Creating Projects table...');
        
        // Create the Projects table
        await pool.request().batch(`
          CREATE TABLE Projects (
            id INT PRIMARY KEY,
            costEstimator NVARCHAR(255),
            costEstimatorRequest NVARCHAR(255),
            ade NVARCHAR(255),
            projectManager NVARCHAR(255),
            projectEngineer NVARCHAR(255),
            designEstimator NVARCHAR(255),
            constructionContractor NVARCHAR(255),
            bundleId NVARCHAR(255),
            postEstimate NVARCHAR(255),
            pmoId NVARCHAR(255),
            order_number NVARCHAR(255),
            multipleOrder NVARCHAR(255),
            mat NVARCHAR(255),
            projectName NVARCHAR(255),
            workStream NVARCHAR(255),
            workType NVARCHAR(255),
            engrPlanYear NVARCHAR(255),
            constPlanYear NVARCHAR(255),
            commitmentDate NVARCHAR(255),
            station NVARCHAR(255),
            line NVARCHAR(255),
            mp1 NVARCHAR(255),
            mp2 NVARCHAR(255),
            city NVARCHAR(255),
            county NVARCHAR(255),
            class5 NVARCHAR(255),
            class4 NVARCHAR(255),
            class3 NVARCHAR(255),
            class2 NVARCHAR(255),
            negotiatePrice NVARCHAR(255),
            jeReadyToRoute NVARCHAR(255),
            jeApproved NVARCHAR(255),
            estimateAnalysis NVARCHAR(255),
            thirtyPercentDesignReviewMeeting NVARCHAR(255),
            thirtyPercentDesignAvailable NVARCHAR(255),
            sixtyPercentDesignReviewMeeting NVARCHAR(255),
            sixtyPercentDesignAvailable NVARCHAR(255),
            ninetyPercentDesignReviewMeeting NVARCHAR(255),
            ninetyPercentDesignAvailable NVARCHAR(255),
            ifc NVARCHAR(255),
            ntp NVARCHAR(255),
            mob NVARCHAR(255),
            tieIn NVARCHAR(255),
            enro NVARCHAR(255),
            unitCapture NVARCHAR(255),
            version INT DEFAULT 1,
            is_changed BIT DEFAULT 0,
            last_updated DATETIME DEFAULT GETDATE()
          );
        `);
        console.log('Projects table created successfully');
      } else {
        console.log('Projects table already exists');
        
        // Check if any columns need to be added
        try {
          await pool.request().query(`
            SELECT is_changed FROM Projects WHERE 1=0
          `);
        } catch (err) {
          console.log('Adding is_changed column to Projects table...');
          await pool.request().query(`
            ALTER TABLE Projects ADD is_changed BIT DEFAULT 0
          `);
        }
        
        try {
          await pool.request().query(`
            SELECT last_updated FROM Projects WHERE 1=0
          `);
        } catch (err) {
          console.log('Adding last_updated column to Projects table...');
          await pool.request().query(`
            ALTER TABLE Projects ADD last_updated DATETIME DEFAULT GETDATE()
          `);
        }
      }
      
      // Check if ProjectChanges table exists
      const changesTableCheck = await pool.request().query(`
        SELECT OBJECT_ID('dbo.ProjectChanges') as TableID
      `);
      
      if (!changesTableCheck.recordset[0].TableID) {
        console.log('Creating ProjectChanges table...');
        
        await pool.request().batch(`
          CREATE TABLE ProjectChanges (
            id INT IDENTITY(1,1) PRIMARY KEY,
            project_id INT NOT NULL,
            field_name NVARCHAR(255) NOT NULL,
            old_value NVARCHAR(MAX),
            new_value NVARCHAR(MAX),
            changed_at DATETIME DEFAULT GETDATE(),
            changed_by NVARCHAR(255),
            FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
          );
        `);
        console.log('ProjectChanges table created successfully');
      } else {
        console.log('ProjectChanges table already exists');
      }
      
      // Check if DataUploads table exists
      const dataUploadsTableCheck = await pool.request().query(`
        SELECT OBJECT_ID('dbo.DataUploads') as TableID
      `);
      
      if (!dataUploadsTableCheck.recordset[0].TableID) {
        console.log('Creating DataUploads table...');
        
        await pool.request().batch(`
          CREATE TABLE DataUploads (
            id INT IDENTITY(1,1) PRIMARY KEY,
            upload_date DATETIME DEFAULT GETDATE(),
            file_name NVARCHAR(255),
            user_name NVARCHAR(255),
            is_active BIT DEFAULT 1
          );
        `);
        console.log('DataUploads table created successfully');
      } else {
        console.log('DataUploads table already exists');
      }
      
      // Check if ExcelProjects table exists
      const excelProjectsTableCheck = await pool.request().query(`
        SELECT OBJECT_ID('dbo.ExcelProjects') as TableID
      `);
      
      if (!excelProjectsTableCheck.recordset[0].TableID) {
        console.log('Creating ExcelProjects table...');
        
        await pool.request().batch(`
          CREATE TABLE ExcelProjects (
            id INT NOT NULL,
            upload_id INT NOT NULL,
            costEstimator NVARCHAR(255),
            costEstimatorRequest NVARCHAR(255),
            ade NVARCHAR(255),
            projectManager NVARCHAR(255),
            projectEngineer NVARCHAR(255),
            designEstimator NVARCHAR(255),
            constructionContractor NVARCHAR(255),
            bundleId NVARCHAR(255),
            postEstimate NVARCHAR(255),
            pmoId NVARCHAR(255),
            order_number NVARCHAR(255),
            multipleOrder NVARCHAR(255),
            mat NVARCHAR(255),
            projectName NVARCHAR(255),
            workStream NVARCHAR(255),
            workType NVARCHAR(255),
            engrPlanYear NVARCHAR(255),
            constPlanYear NVARCHAR(255),
            commitmentDate NVARCHAR(255),
            station NVARCHAR(255),
            line NVARCHAR(255),
            mp1 NVARCHAR(255),
            mp2 NVARCHAR(255),
            city NVARCHAR(255),
            county NVARCHAR(255),
            class5 NVARCHAR(255),
            class4 NVARCHAR(255),
            class3 NVARCHAR(255),
            class2 NVARCHAR(255),
            negotiatePrice NVARCHAR(255),
            jeReadyToRoute NVARCHAR(255),
            jeApproved NVARCHAR(255),
            estimateAnalysis NVARCHAR(255),
            thirtyPercentDesignReviewMeeting NVARCHAR(255),
            thirtyPercentDesignAvailable NVARCHAR(255),
            sixtyPercentDesignReviewMeeting NVARCHAR(255),
            sixtyPercentDesignAvailable NVARCHAR(255),
            ninetyPercentDesignReviewMeeting NVARCHAR(255),
            ninetyPercentDesignAvailable NVARCHAR(255),
            ifc NVARCHAR(255),
            ntp NVARCHAR(255),
            mob NVARCHAR(255),
            tieIn NVARCHAR(255),
            enro NVARCHAR(255),
            unitCapture NVARCHAR(255),
            PRIMARY KEY (id, upload_id),
            FOREIGN KEY (upload_id) REFERENCES DataUploads(id) ON DELETE CASCADE
          );
        `);
        console.log('ExcelProjects table created successfully');
      } else {
        console.log('ExcelProjects table already exists');
      }
      
      // Check if ExcelProjectChanges table exists
      const excelChangesTableCheck = await pool.request().query(`
        SELECT OBJECT_ID('dbo.ExcelProjectChanges') as TableID
      `);
      
      if (!excelChangesTableCheck.recordset[0].TableID) {
        console.log('Creating ExcelProjectChanges table...');
        
        await pool.request().batch(`
          CREATE TABLE ExcelProjectChanges (
            id INT IDENTITY(1,1) PRIMARY KEY,
            project_id INT NOT NULL,
            old_upload_id INT,
            new_upload_id INT NOT NULL,
            field_name NVARCHAR(255) NOT NULL,
            old_value NVARCHAR(MAX),
            new_value NVARCHAR(MAX),
            change_type NVARCHAR(50) NOT NULL,
            FOREIGN KEY (new_upload_id) REFERENCES DataUploads(id) ON DELETE CASCADE
          );
        `);
        console.log('ExcelProjectChanges table created successfully');
      } else {
        console.log('ExcelProjectChanges table already exists');
      }
    } catch (err) {
      console.error('Error ensuring tables exist:', err);
      throw err;
    }
  }

// GET all projects
app.get('/api/projects', async (req, res) => {
  console.log(`Received request for GET /api/projects from ${req.ip}`);
  console.log('Request headers:', req.headers);
  
  // Set proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const pool = await poolPromise;
    console.log('Connected to database pool');
    
    const result = await pool.request().query('SELECT * FROM Projects');
    console.log(`Retrieved ${result.recordset.length} projects from database`);
    
    // Convert database records to frontend format
    const projects = result.recordset.map(record => {
      // Handle order_number to order conversion
      const { order_number, ...rest } = record;
      return {
        ...rest,
        order: order_number
      };
    });
    
    console.log(`Sending ${projects.length} projects to client`);
    
    // Return a proper JSON response
    return res.status(200).json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    
    // Return a proper JSON error response
    return res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// GET a specific project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM Projects WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Convert database record to frontend format
    const { order_number, ...rest } = result.recordset[0];
    const project = {
      ...rest,
      order: order_number
    };
    
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// POST a new project
app.post('/api/projects', async (req, res) => {
  try {
    const project = req.body;
    
    // Validate that id exists and is a number
    if (!project.id || isNaN(parseInt(project.id))) {
      return res.status(400).json({ error: 'Project ID is required and must be a number' });
    }
    
    console.log(`Received request to add project ${project.id}`);
    
    const pool = await poolPromise;
    
    // Check if a project with this ID already exists
    const existingProject = await pool.request()
      .input('id', sql.Int, parseInt(project.id))
      .query('SELECT id FROM Projects WHERE id = @id');
      
    if (existingProject.recordset.length > 0) {
      console.log(`Project ${project.id} already exists, returning 409 Conflict`);
      return res.status(409).json({ 
        error: 'A project with this ID already exists',
        message: 'Use PUT /api/projects/:id to update an existing project'
      });
    }
    
    // Create SQL parameter assignments dynamically from the project object
    const request = pool.request();
    request.input('id', sql.Int, parseInt(project.id));
    
    // Process each field with appropriate type handling
    Object.keys(project).forEach(key => {
      // Skip id as it will be handled separately
      if (key !== 'id') {
        // Handle special case for 'order' which is a reserved SQL keyword
        const paramName = key === 'order' ? 'order_number' : key;
        
        // Skip fields that shouldn't be stored in the database
        if (key === '_changes' || key === 'dateCategory') {
          return;
        }
        
        // Handle null or undefined values
        let value = project[key];
        if (value === null || value === undefined) {
          value = null;
        } else if (typeof value === 'object') {
          // Convert objects to JSON strings
          value = JSON.stringify(value);
        }
        
        // Add the parameter with the appropriate SQL type
        if (key === 'is_changed') {
          request.input(paramName, sql.Bit, value ? 1 : 0);
        } else if (key === 'engrPlanYear' || key === 'constPlanYear') {
          // Handle numeric fields that might come as strings
          request.input(paramName, sql.NVarChar(255), value !== null ? String(value) : null);
        } else {
          request.input(paramName, sql.NVarChar(255), value !== null ? String(value) : null);
        }
      }
    });
    
    // Build the SQL query dynamically
    const columns = Object.keys(project)
      .filter(key => key !== 'id' && key !== '_changes' && key !== 'dateCategory') // Remove fields that shouldn't be in the database
      .map(key => key === 'order' ? 'order_number' : key) // Handle 'order' special case
      .join(', ');
    
    const paramNames = Object.keys(project)
      .filter(key => key !== 'id' && key !== '_changes' && key !== 'dateCategory')
      .map(key => '@' + (key === 'order' ? 'order_number' : key))
      .join(', ');
    
    // Only add columns if there are any
    const query = columns.length > 0 
      ? `INSERT INTO Projects (id, ${columns}) VALUES (@id, ${paramNames})`
      : `INSERT INTO Projects (id) VALUES (@id)`;
    
    console.log(`Executing query to add project ${project.id}`);
    
    await request.query(query);
    console.log(`Project ${project.id} created successfully`);
    res.status(201).json({ message: 'Project created successfully', id: project.id });
  } catch (err) {
    console.error('Error creating project:', err);
    // Send a more detailed error message
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message,
      details: err.toString()
    });
  }
});

// PUT to update a project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = req.body;
    const pool = await poolPromise;
    
    console.log(`Updating project ${id}...`);
    
    // First get the current project to track changes
    const currentProject = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM Projects WHERE id = @id');
    
    if (currentProject.recordset.length === 0) {
      console.log(`Project ${id} not found for update`);
      return res.status(404).json({
        error: 'Project not found',
        message: `No project with ID ${id} exists`
      });
    }
    
    const oldProject = currentProject.recordset[0];
    
    // Create SQL parameter assignments dynamically
    const request = pool.request();
    request.input('id', sql.Int, parseInt(id));
    
    // Process each field with appropriate type handling
    const updateParts = [];
    
    // Track which parameters we've already added to avoid duplicates
    const addedParams = new Set(['id']);
    
    Object.keys(project)
      .filter(key => key !== 'id' && key !== '_changes' && key !== 'is_changed' && key !== 'dateCategory')
      .forEach(key => {
        // Handle special case for 'order' which is a reserved SQL keyword
        const paramName = key === 'order' ? 'order_number' : key;
        
        // Skip if we've already added this parameter
        if (addedParams.has(paramName)) return;
        
        // Mark this parameter as added
        addedParams.add(paramName);
        
        // Handle null or undefined values
        let value = project[key];
        if (value === null || value === undefined) {
          value = null;
        } else if (typeof value === 'object') {
          // Convert objects to JSON strings
          value = JSON.stringify(value);
        }
        
        // Add the parameter with the appropriate SQL type
        if (key === 'is_changed') {
          request.input(paramName, sql.Bit, value ? 1 : 0);
        } else if (key === 'engrPlanYear' || key === 'constPlanYear') {
          // Handle numeric fields that might come as strings
          request.input(paramName, sql.NVarChar(255), value !== null ? String(value) : null);
        } else {
          request.input(paramName, sql.NVarChar(255), value !== null ? String(value) : null);
        }
        
        updateParts.push(`${paramName} = @${paramName}`);
      });
    
    // Add the change tracking fields
    if (!addedParams.has('last_updated')) {
      request.input('last_updated', sql.DateTime2, new Date());
      updateParts.push('last_updated = @last_updated');
      addedParams.add('last_updated');
    }
    
    if (!addedParams.has('version')) {
      request.input('version', sql.Int, (oldProject.version || 0) + 1);
      updateParts.push('version = @version');
      addedParams.add('version');
    }
    
    if (!addedParams.has('is_changed')) {
      request.input('is_changed', sql.Bit, 1);
      updateParts.push('is_changed = @is_changed');
      addedParams.add('is_changed');
    }
    
    // Only proceed if there are fields to update
    if (updateParts.length === 0) {
      console.log(`No fields to update for project ${id}`);
      return res.json({ message: 'No fields to update' });
    }
    
    const query = `
      UPDATE Projects
      SET ${updateParts.join(', ')}
      WHERE id = @id
    `;
    
    console.log(`Executing update query for project ${id}`);
    await request.query(query);
    
    // Track changes in the ProjectChanges table
    for (const key of Object.keys(project)) {
      if (key !== 'id' && key !== '_changes' && key !== 'is_changed' && key !== 'dateCategory' && 
          project[key] !== oldProject[key === 'order' ? 'order_number' : key]) {
        
        const dbKey = key === 'order' ? 'order_number' : key;
        const oldValue = oldProject[dbKey]?.toString() || null;
        const newValue = project[key]?.toString() || null;
        
        console.log(`Tracking change for project ${id}, field ${key}: ${oldValue} -> ${newValue}`);
        
        await pool.request()
          .input('project_id', sql.Int, parseInt(id))
          .input('field_name', sql.NVarChar(255), key)
          .input('old_value', sql.NVarChar(sql.MAX), oldValue)
          .input('new_value', sql.NVarChar(sql.MAX), newValue)
          .query(`
            INSERT INTO ProjectChanges (project_id, field_name, old_value, new_value)
            VALUES (@project_id, @field_name, @old_value, @new_value)
          `);
      }
    }
    
    console.log(`Project ${id} updated successfully`);
    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message,
      details: err.toString()
    });
  }
});

// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    console.log(`Attempting to delete project with ID: ${id}`);
    
    // Check if project exists first
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Projects WHERE id = @id');
    
    if (checkResult.recordset.length === 0) {
      console.log(`Project ${id} not found, returning 404`);
      return res.status(404).json({ 
        error: 'Project not found',
        message: `No project with ID ${id} exists`
      });
    }
    
    // First delete any change records
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ProjectChanges WHERE project_id = @id');
    
    // Then delete the project
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Projects WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        error: 'Project not found',
        message: `No project with ID ${id} exists`
      });
    }
    
    console.log(`Project ${id} deleted successfully`);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({
      error: 'Server error', 
      message: err.message,
      details: err.toString()
    });
  }
});

// Get project changes
app.get('/api/projects/:id/changes', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM ProjectChanges 
        WHERE project_id = @id 
        ORDER BY changed_at DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching project changes:', err);
    res.status(500).send('Server error');
  }
});

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  
  // Set proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Return a proper JSON response
  return res.status(200).json({ message: 'Server is working!' });
});

// Add a root API endpoint
app.get('/api', (req, res) => {
  console.log('Root API endpoint called');
  res.status(200).json({ message: 'API is working!' });
});

const PORT = process.env.PORT || 4000; // Use environment variable with fallback to 4000

// Call this function before starting the server
ensureTablesExist().then(async () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Helper function to limit uploads to the most recent 3
async function limitUploadsToThree() {
  try {
    const pool = await poolPromise;
    
    // Get all uploads ordered by date
    const uploadsResult = await pool.request().query(`
      SELECT id FROM DataUploads 
      ORDER BY upload_date DESC
    `);
    
    // If we have more than 3 uploads, delete the oldest ones
    if (uploadsResult.recordset.length > 3) {
      console.log(`Found ${uploadsResult.recordset.length} uploads, keeping only the 3 most recent`);
      
      // Get IDs of uploads to keep
      const keepIds = uploadsResult.recordset.slice(0, 3).map(row => row.id);
      
      // Delete changes for old uploads
      await pool.request().query(`
        DELETE FROM ExcelProjectChanges 
        WHERE new_upload_id NOT IN (${keepIds.join(',')})
        OR (old_upload_id IS NOT NULL AND old_upload_id NOT IN (${keepIds.join(',')}))
      `);
      
      // Delete projects from old uploads
      await pool.request().query(`
        DELETE FROM ExcelProjects 
        WHERE upload_id NOT IN (${keepIds.join(',')})
      `);
      
      // Delete old uploads
      await pool.request().query(`
        DELETE FROM DataUploads 
        WHERE id NOT IN (${keepIds.join(',')})
      `);
      
      console.log('Cleaned up old uploads successfully');
    }
  } catch (err) {
    console.error('Error limiting uploads to three:', err);
  }
}

// Helper function to compare projects and track changes
async function compareAndTrackChanges(newUploadId, oldUploadId) {
  try {
    const pool = await poolPromise;
    
    console.log(`Comparing upload ${newUploadId} with previous upload ${oldUploadId || 'none'}`);
    
    // Get projects from new upload
    const newProjectsResult = await pool.request()
      .input('uploadId', sql.Int, newUploadId)
      .query(`
        SELECT * FROM ExcelProjects 
        WHERE upload_id = @uploadId
      `);
    
    // If there's no old upload, all projects are new
    if (!oldUploadId) {
      console.log('No previous upload to compare with, all projects are new');
      
      // Mark all projects as added
      for (const project of newProjectsResult.recordset) {
        try {
          await pool.request()
            .input('projectId', sql.Int, project.id)
            .input('newUploadId', sql.Int, newUploadId)
            .input('changeType', sql.NVarChar, 'added')
            .query(`
              INSERT INTO ExcelProjectChanges 
              (project_id, new_upload_id, field_name, new_value, change_type)
              VALUES (@projectId, @newUploadId, 'all', 'New project', @changeType)
            `);
        } catch (insertErr) {
          console.error(`Error marking project ${project.id} as new:`, insertErr);
          // Continue with other projects
        }
      }
      
      console.log(`Marked ${newProjectsResult.recordset.length} projects as new`);
      return;
    }
    
    // Get projects from old upload
    const oldProjectsResult = await pool.request()
      .input('uploadId', sql.Int, oldUploadId)
      .query(`
        SELECT * FROM ExcelProjects 
        WHERE upload_id = @uploadId
      `);
    
    // Create maps for easier lookup
    const newProjects = new Map();
    newProjectsResult.recordset.forEach(project => {
      newProjects.set(project.id, project);
    });
    
    const oldProjects = new Map();
    oldProjectsResult.recordset.forEach(project => {
      oldProjects.set(project.id, project);
    });
    
    // Track added projects
    const addedProjects = [];
    newProjects.forEach((project, id) => {
      if (!oldProjects.has(id)) {
        addedProjects.push(project);
      }
    });
    
    console.log(`Found ${addedProjects.length} new projects`);
    
    // Track removed projects
    const removedProjects = [];
    oldProjects.forEach((project, id) => {
      if (!newProjects.has(id)) {
        removedProjects.push(project);
      }
    });
    
    console.log(`Found ${removedProjects.length} removed projects`);
    
    // Track modified projects
    const modifiedProjects = [];
    newProjects.forEach((newProject, id) => {
      if (oldProjects.has(id)) {
        const oldProject = oldProjects.get(id);
        const changes = [];
        
        // Compare each field
        Object.keys(newProject).forEach(key => {
          // Skip id and upload_id
          if (key === 'id' || key === 'upload_id') return;
          
          if (newProject[key] !== oldProject[key]) {
            changes.push({
              field: key,
              oldValue: oldProject[key],
              newValue: newProject[key]
            });
          }
        });
        
        if (changes.length > 0) {
          modifiedProjects.push({
            project: newProject,
            changes
          });
        }
      }
    });
    
    console.log(`Found ${modifiedProjects.length} modified projects`);
    
    // Insert changes into the database
    // Added projects
    for (const project of addedProjects) {
      try {
        await pool.request()
          .input('projectId', sql.Int, project.id)
          .input('newUploadId', sql.Int, newUploadId)
          .input('oldUploadId', sql.Int, oldUploadId)
          .input('changeType', sql.NVarChar, 'added')
          .query(`
            INSERT INTO ExcelProjectChanges 
            (project_id, new_upload_id, old_upload_id, field_name, new_value, change_type)
            VALUES (@projectId, @newUploadId, @oldUploadId, 'all', 'New project', @changeType)
          `);
      } catch (insertErr) {
        console.error(`Error recording added project ${project.id}:`, insertErr);
        // Continue with other projects
      }
    }
    
    // Removed projects
    for (const project of removedProjects) {
      try {
        await pool.request()
          .input('projectId', sql.Int, project.id)
          .input('newUploadId', sql.Int, newUploadId)
          .input('oldUploadId', sql.Int, oldUploadId)
          .input('changeType', sql.NVarChar, 'removed')
          .query(`
            INSERT INTO ExcelProjectChanges 
            (project_id, new_upload_id, old_upload_id, field_name, old_value, change_type)
            VALUES (@projectId, @newUploadId, @oldUploadId, 'all', 'Project removed', @changeType)
          `);
      } catch (insertErr) {
        console.error(`Error recording removed project ${project.id}:`, insertErr);
        // Continue with other projects
      }
    }
    
    // Modified projects
    for (const { project, changes } of modifiedProjects) {
      for (const change of changes) {
        try {
          await pool.request()
            .input('projectId', sql.Int, project.id)
            .input('newUploadId', sql.Int, newUploadId)
            .input('oldUploadId', sql.Int, oldUploadId)
            .input('fieldName', sql.NVarChar, change.field)
            .input('oldValue', sql.NVarChar, change.oldValue || null)
            .input('newValue', sql.NVarChar, change.newValue || null)
            .input('changeType', sql.NVarChar, 'modified')
            .query(`
              INSERT INTO ExcelProjectChanges 
              (project_id, new_upload_id, old_upload_id, field_name, old_value, new_value, change_type)
              VALUES (@projectId, @newUploadId, @oldUploadId, @fieldName, @oldValue, @newValue, @changeType)
            `);
        } catch (insertErr) {
          console.error(`Error recording change for project ${project.id}, field ${change.field}:`, insertErr);
          // Continue with other changes
        }
      }
    }
    
    console.log('Finished comparing and tracking changes');
  } catch (err) {
    console.error('Error comparing and tracking changes:', err);
    // Don't throw the error to avoid breaking the upload process
  }
}

// GET data uploads history
app.get('/api/uploads', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT id, upload_date, file_name, user_name, is_active
      FROM DataUploads
      ORDER BY upload_date DESC
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching upload history:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// GET latest data upload
app.get('/api/uploads/latest', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT TOP 1 id, upload_date, file_name, user_name, is_active
      FROM DataUploads
      ORDER BY upload_date DESC
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No uploads found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching latest upload:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// GET projects from a specific upload
app.get('/api/uploads/:id/projects', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('uploadId', sql.Int, id)
      .query(`
        SELECT * FROM ExcelProjects
        WHERE upload_id = @uploadId
      `);
    
    // Convert database records to frontend format
    const projects = result.recordset.map(record => {
      // Handle order_number to order conversion
      const { order_number, upload_id, ...rest } = record;
      return {
        ...rest,
        order: order_number
      };
    });
    
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects from upload:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// GET changes between two uploads
app.get('/api/uploads/:newId/changes', async (req, res) => {
  try {
    const { newId } = req.params;
    const { oldId } = req.query;
    
    const pool = await poolPromise;
    
    let query = `
      SELECT c.*, p.projectName, p.pmoId, p.order_number
      FROM ExcelProjectChanges c
      LEFT JOIN ExcelProjects p ON c.project_id = p.id AND p.upload_id = c.new_upload_id
      WHERE c.new_upload_id = @newId
    `;
    
    if (oldId) {
      query += ` AND c.old_upload_id = @oldId`;
    }
    
    query += ` ORDER BY c.project_id, c.field_name`;
    
    const request = pool.request()
      .input('newId', sql.Int, newId);
      
    if (oldId) {
      request.input('oldId', sql.Int, oldId);
    }
    
    const result = await request.query(query);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching changes between uploads:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// POST a new data upload
app.post('/api/uploads', async (req, res) => {
  try {
    const { fileName, userName, projects } = req.body;
    
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ error: 'Projects data is required' });
    }
    
    const pool = await poolPromise;
    
    // Create a new upload record
    const uploadResult = await pool.request()
      .input('fileName', sql.NVarChar, fileName || 'Unknown file')
      .input('userName', sql.NVarChar, userName || 'Unknown user')
      .query(`
        INSERT INTO DataUploads (file_name, user_name)
        OUTPUT INSERTED.id, INSERTED.upload_date
        VALUES (@fileName, @userName)
      `);
    
    const uploadId = uploadResult.recordset[0].id;
    const uploadDate = uploadResult.recordset[0].upload_date;
    
    console.log(`Created new upload with ID ${uploadId}`);
    
    // Get the most recent upload before this one
    const previousUploadResult = await pool.request()
      .input('currentId', sql.Int, uploadId)
      .query(`
        SELECT TOP 1 id
        FROM DataUploads
        WHERE id != @currentId
        ORDER BY upload_date DESC
      `);
    
    const previousUploadId = previousUploadResult.recordset.length > 0 
      ? previousUploadResult.recordset[0].id 
      : null;
    
    // Insert all projects
    for (const project of projects) {
      // Create SQL parameter assignments dynamically from the project object
      const request = pool.request();
      request.input('id', sql.Int, parseInt(project.id));
      request.input('uploadId', sql.Int, uploadId);
      
      // Process each field with appropriate type handling
      Object.keys(project).forEach(key => {
        // Skip id as it will be handled separately
        if (key !== 'id') {
          // Handle special case for 'order' which is a reserved SQL keyword
          const paramName = key === 'order' ? 'order_number' : key;
          
          // Skip fields that shouldn't be stored in the database
          if (key === '_changes' || key === 'dateCategory') {
            return;
          }
          
          // Handle null or undefined values
          let value = project[key];
          if (value === null || value === undefined) {
            value = null;
          } else if (typeof value === 'object') {
            // Convert objects to JSON strings
            value = JSON.stringify(value);
          }
          
          // Add the parameter with the appropriate SQL type
          request.input(paramName, sql.NVarChar(255), value !== null ? String(value) : null);
        }
      });
      
      // Build the SQL query dynamically
      const columns = Object.keys(project)
        .filter(key => key !== 'id' && key !== '_changes' && key !== 'dateCategory') // Remove fields that shouldn't be in the database
        .map(key => key === 'order' ? 'order_number' : key) // Handle 'order' special case
        .join(', ');
      
      const paramNames = Object.keys(project)
        .filter(key => key !== 'id' && key !== '_changes' && key !== 'dateCategory')
        .map(key => '@' + (key === 'order' ? 'order_number' : key))
        .join(', ');
      
      // Only add columns if there are any
      const query = columns.length > 0 
        ? `INSERT INTO ExcelProjects (id, upload_id, ${columns}) VALUES (@id, @uploadId, ${paramNames})`
        : `INSERT INTO ExcelProjects (id, upload_id) VALUES (@id, @uploadId)`;
      
      await request.query(query);
    }
    
    console.log(`Added ${projects.length} projects to upload ${uploadId}`);
    
    // Compare with previous upload and track changes
    await compareAndTrackChanges(uploadId, previousUploadId);
    
    // Limit uploads to the most recent 3
    await limitUploadsToThree();
    
    res.status(201).json({ 
      message: 'Upload created successfully', 
      uploadId, 
      uploadDate,
      projectCount: projects.length
    });
  } catch (err) {
    console.error('Error creating upload:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});

// GET projects from the latest upload
app.get('/api/excel-projects', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get the latest upload
    const latestUploadResult = await pool.request().query(`
      SELECT TOP 1 id
      FROM DataUploads
      ORDER BY upload_date DESC
    `);
    
    if (latestUploadResult.recordset.length === 0) {
      console.log('No uploads found when fetching Excel projects');
      return res.status(404).json({ 
        error: 'No uploads found',
        message: 'There are no data uploads in the system'
      });
    }
    
    const uploadId = latestUploadResult.recordset[0].id;
    console.log(`Fetching Excel projects from upload ID: ${uploadId}`);
    
    // Get projects from the latest upload
    const result = await pool.request()
      .input('uploadId', sql.Int, uploadId)
      .query(`
        SELECT * FROM ExcelProjects
        WHERE upload_id = @uploadId
      `);
    
    console.log(`Found ${result.recordset.length} Excel projects from upload ID: ${uploadId}`);
    
    // Convert database records to frontend format
    const projects = result.recordset.map(record => {
      // Handle order_number to order conversion
      const { order_number, upload_id, ...rest } = record;
      return {
        ...rest,
        order: order_number
      };
    });
    
    res.json(projects);
  } catch (err) {
    console.error('Error fetching excel projects:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message,
      details: err.toString()
    });
  }
});