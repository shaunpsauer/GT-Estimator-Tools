require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Projects');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).send('Server error');
  }
});

// GET a specific project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Projects WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).send('Project not found');
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).send('Server error');
  }
});

// POST a new project
app.post('/api/projects', async (req, res) => {
  try {
    const project = req.body;
    const pool = await poolPromise;
    
    // Create SQL parameter assignments dynamically from the project object
    const request = pool.request();
    Object.keys(project).forEach(key => {
      // Skip id as it will be used in the query directly
      if (key !== 'id') {
        // Handle special case for 'order' which is a reserved SQL keyword
        const paramName = key === 'order' ? 'order_number' : key;
        request.input(paramName, project[key]);
      }
    });
    
    // Build the SQL query dynamically
    const columns = Object.keys(project)
      .filter(key => key !== 'id') // Remove id from columns
      .map(key => key === 'order' ? 'order_number' : key) // Handle 'order' special case
      .join(', ');
    
    const paramNames = Object.keys(project)
      .filter(key => key !== 'id')
      .map(key => '@' + (key === 'order' ? 'order_number' : key))
      .join(', ');
    
    const query = `
      INSERT INTO Projects (id, ${columns}) 
      VALUES (${project.id}, ${paramNames})
    `;
    
    await request.query(query);
    res.status(201).json({ message: 'Project created successfully' });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).send('Server error');
  }
});

// PUT to update a project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = req.body;
    const pool = await poolPromise;
    
    // First get the current project to track changes
    const currentProject = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Projects WHERE id = @id');
    
    if (currentProject.recordset.length === 0) {
      return res.status(404).send('Project not found');
    }
    
    const oldProject = currentProject.recordset[0];
    
    // Create SQL parameter assignments dynamically
    const request = pool.request();
    request.input('id', sql.Int, id);
    
    const updateParts = Object.keys(project)
      .filter(key => key !== 'id' && key !== '_changes' && key !== 'is_changed')
      .map(key => {
        const paramName = key === 'order' ? 'order_number' : key;
        request.input(paramName, project[key]);
        return `${paramName} = @${paramName}`;
      })
      .join(', ');
    
    // Add the change tracking fields
    request.input('last_updated', sql.DateTime2, new Date());
    request.input('version', sql.Int, (oldProject.version || 0) + 1);
    request.input('is_changed', sql.Bit, 1);
    
    const query = `
      UPDATE Projects
      SET ${updateParts}, last_updated = @last_updated, version = @version, is_changed = @is_changed
      WHERE id = @id
    `;
    
    await request.query(query);
    
    // Track changes in the ProjectChanges table
    for (const key of Object.keys(project)) {
      if (key !== 'id' && key !== '_changes' && key !== 'is_changed' && 
          project[key] !== oldProject[key === 'order' ? 'order_number' : key]) {
        
        await pool.request()
          .input('project_id', sql.Int, id)
          .input('field_name', sql.NVarChar, key)
          .input('old_value', sql.NVarChar, oldProject[key === 'order' ? 'order_number' : key]?.toString() || null)
          .input('new_value', sql.NVarChar, project[key]?.toString() || null)
          .query(`
            INSERT INTO ProjectChanges (project_id, field_name, old_value, new_value)
            VALUES (@project_id, @field_name, @old_value, @new_value)
          `);
      }
    }
    
    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).send('Server error');
  }
});

// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // First delete any change records
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ProjectChanges WHERE project_id = @id');
    
    // Then delete the project
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Projects WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send('Project not found');
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).send('Server error');
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});