-- Projects table
CREATE TABLE IF NOT EXISTS Projects (
    id INT PRIMARY KEY,
    costEstimator NVARCHAR(255),
    costEstimatorRequest NVARCHAR(255),
    projectManager NVARCHAR(255),
    projectEngineer NVARCHAR(255),
    designEstimator NVARCHAR(255),
    constructionContractor NVARCHAR(255),
    ade NVARCHAR(255),
    pmoId NVARCHAR(50),
    order_number NVARCHAR(50), -- Using order_number as 'order' is a reserved keyword
    multipleOrder NVARCHAR(50),
    bundleId NVARCHAR(50),
    postEstimate NVARCHAR(50),
    mat NVARCHAR(100),
    projectName NVARCHAR(255),
    workStream NVARCHAR(100),
    workType NVARCHAR(100),
    engrPlanYear INT,
    constPlanYear INT,
    commitmentDate DATETIME2,
    station NVARCHAR(100),
    line NVARCHAR(100),
    mp1 NVARCHAR(100),
    mp2 NVARCHAR(100),
    city NVARCHAR(100),
    county NVARCHAR(100),
    class5 DATETIME2,
    class4 DATETIME2,
    class3 DATETIME2,
    class2 DATETIME2,
    negotiatePrice DATETIME2,
    jeReadyToRoute DATETIME2,
    jeApproved DATETIME2,
    estimateAnalysis DATETIME2,
    thirtyPercentDesignReviewMeeting DATETIME2,
    thirtyPercentDesignAvailable DATETIME2,
    sixtyPercentDesignReviewMeeting DATETIME2,
    sixtyPercentDesignAvailable DATETIME2,
    ninetyPercentDesignReviewMeeting DATETIME2,
    ninetyPercentDesignAvailable DATETIME2,
    ifc DATETIME2,
    ntp DATETIME2,
    mob DATETIME2,
    tieIn DATETIME2,
    enro DATETIME2,
    unitCapture DATETIME2,
    dateCategory NVARCHAR(20), -- To store the visual category for date filtering
    
    -- Change tracking fields
    last_updated DATETIME2 DEFAULT GETDATE(),
    last_updated_by NVARCHAR(100),
    version INT DEFAULT 1,
    is_changed BIT DEFAULT 0
);

-- ProjectChanges table for tracking field-level changes
CREATE TABLE IF NOT EXISTS ProjectChanges (
    change_id INT IDENTITY(1,1) PRIMARY KEY,
    project_id INT,
    field_name NVARCHAR(100),
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    changed_at DATETIME2 DEFAULT GETDATE(),
    changed_by NVARCHAR(100),
    FOREIGN KEY (project_id) REFERENCES Projects(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_projects_pmoid ON Projects(pmoId);
CREATE INDEX idx_projects_order_number ON Projects(order_number);
CREATE INDEX idx_projects_is_changed ON Projects(is_changed);
CREATE INDEX idx_projects_last_updated ON Projects(last_updated);
CREATE INDEX idx_projectchanges_project_id ON ProjectChanges(project_id);
CREATE INDEX idx_projectchanges_changed_at ON ProjectChanges(changed_at);

-- Create stored procedure for updating a project with change tracking
CREATE OR ALTER PROCEDURE sp_UpdateProjectWithChangeTracking
    @id INT,
    @field_name NVARCHAR(100),
    @new_value NVARCHAR(MAX),
    @updated_by NVARCHAR(100)
AS
BEGIN
    DECLARE @old_value NVARCHAR(MAX);
    DECLARE @sql NVARCHAR(MAX);
    
    -- Get the current value
    SET @sql = N'SELECT @old_value = CONVERT(NVARCHAR(MAX), ' + QUOTENAME(@field_name) + ') FROM Projects WHERE id = @id';
    
    EXEC sp_executesql @sql, 
        N'@id INT, @old_value NVARCHAR(MAX) OUTPUT', 
        @id, @old_value OUTPUT;
    
    -- Only track changes if values are different
    IF (@old_value IS NULL AND @new_value IS NOT NULL) OR 
       (@old_value IS NOT NULL AND @new_value IS NULL) OR
       (@old_value <> @new_value)
    BEGIN
        -- Update the project
        SET @sql = N'UPDATE Projects SET ' + QUOTENAME(@field_name) + ' = @new_value, 
                    last_updated = GETDATE(),
                    last_updated_by = @updated_by,
                    version = version + 1,
                    is_changed = 1
                    WHERE id = @id';
        
        EXEC sp_executesql @sql, 
            N'@id INT, @new_value NVARCHAR(MAX), @updated_by NVARCHAR(100)', 
            @id, @new_value, @updated_by;
        
        -- Record the change
        INSERT INTO ProjectChanges (project_id, field_name, old_value, new_value, changed_by)
        VALUES (@id, @field_name, @old_value, @new_value, @updated_by);
    END
END;

-- Create stored procedure for acknowledging changes on a project
CREATE OR ALTER PROCEDURE sp_AcknowledgeChanges
    @project_id INT
AS
BEGIN
    UPDATE Projects
    SET is_changed = 0
    WHERE id = @project_id;
END;

-- Create stored procedure for getting all projects with their change status
CREATE OR ALTER PROCEDURE sp_GetProjectsWithChangeStatus
AS
BEGIN
    SELECT 
        p.*,
        (SELECT COUNT(*) FROM ProjectChanges WHERE project_id = p.id) AS change_count
    FROM 
        Projects p
    ORDER BY 
        p.last_updated DESC;
END;

-- Create stored procedure for getting change history for a project
CREATE OR ALTER PROCEDURE sp_GetProjectChangeHistory
    @project_id INT
AS
BEGIN
    SELECT 
        pc.change_id,
        pc.field_name,
        pc.old_value,
        pc.new_value,
        pc.changed_at,
        pc.changed_by
    FROM 
        ProjectChanges pc
    WHERE 
        pc.project_id = @project_id
    ORDER BY 
        pc.changed_at DESC;
END;