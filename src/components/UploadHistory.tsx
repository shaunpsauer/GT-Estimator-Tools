import React, { useState, useEffect } from 'react';
import SqlServerApi, { ExcelProjectChange } from '../services/SqlServerApi';
import { formatDate } from '../utils/dateUtils';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

interface UploadHistoryProps {
  onSelectUpload?: (uploadId: number) => void;
}

// Helper function to format field names
const formatFieldName = (fieldName: string): string => {
  // Special cases
  const specialCases: { [key: string]: string } = {
    'jeReadyToRoute': 'JE Ready to Route',
    'jeApproved': 'JE Approved',
    'pmoId': 'PMO ID',
    'mp1': 'MP1',
    'mp2': 'MP2',
    'ifc': 'IFC',
    'ntp': 'NTP',
    'mob': 'MOB',
    'ade': 'ADE',
    'mat': 'MAT'
  };

  if (specialCases[fieldName]) {
    return specialCases[fieldName];
  }

  // Add spaces before capital letters and numbers
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\d+)/g, ' $1')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const UploadHistory: React.FC<UploadHistoryProps> = ({ onSelectUpload }) => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<number | null>(null);
  const [comparisonUpload, setComparisonUpload] = useState<number | null>(null);
  const [changes, setChanges] = useState<ExcelProjectChange[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUploads();
  }, []);

  useEffect(() => {
    if (selectedUpload && comparisonUpload) {
      loadChanges(selectedUpload, comparisonUpload);
    } else {
      setChanges([]);
    }
  }, [selectedUpload, comparisonUpload]);

  const loadUploads = async () => {
    setLoading(true);
    setError(null);
    try {
      const uploadData = await SqlServerApi.getUploads();
      setUploads(uploadData);
      
      if (uploadData.length > 0) {
        setSelectedUpload(uploadData[0].id);
      }
    } catch (err) {
      setError('Failed to load upload history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadChanges = async (newUploadId: number, oldUploadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const changeData = await SqlServerApi.getUploadChanges(newUploadId, oldUploadId);
      setChanges(changeData);
    } catch (err) {
      setError('Failed to load changes between uploads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUpload = (uploadId: number) => {
    setSelectedUpload(uploadId);
    if (onSelectUpload) {
      onSelectUpload(uploadId);
    }
  };

  const handleCompare = (uploadId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setComparisonUpload(uploadId);
    // Compare with the latest upload
    if (uploads.length > 0) {
      loadChanges(uploads[0].id, uploadId);
    }
  };

  const getChangeTypeStyle = (changeType: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 500,
      display: 'inline-block',
      textTransform: 'capitalize',
      letterSpacing: '0.3px'
    };

    switch (changeType) {
      case 'added':
        return {
          ...baseStyle,
          backgroundColor: '#e6f4ea',
          color: '#1e7e34'
        };
      case 'removed':
        return {
          ...baseStyle,
          backgroundColor: '#fde8e8',
          color: '#c81e1e'
        };
      case 'modified':
        return {
          ...baseStyle,
          backgroundColor: '#fff3e0',
          color: '#b7791f'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#f3f4f6',
          color: '#4b5563'
        };
    }
  };

  const tableHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: 600,
    color: '#1f2937',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  };

  const tableCellStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '24px',
          fontWeight: 600,
          color: '#111827',
          margin: 0
        }}>
          Upload History
        </h2>
        <Tooltip title="View and compare different versions of your uploaded Sd-09 files. The latest upload is shown at the top." placement="right">
          <InfoIcon style={{ color: '#6b7280', fontSize: '20px', cursor: 'help' }} />
        </Tooltip>
      </div>
      
      {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      
      {uploads.length === 0 && !loading && !error && (
        <p style={{ color: '#6b7280' }}>No uploads found. Upload an SD-09 file to get started.</p>
      )}
      
      {uploads.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px',
              fontWeight: 500,
              color: '#374151',
              margin: 0
            }}>
              Recent Uploads
            </h3>
            <Tooltip title="Click 'Compare' on a previous upload to see what changed from the latest version" placement="right">
              <InfoIcon style={{ color: '#6b7280', fontSize: '16px', cursor: 'help' }} />
            </Tooltip>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uploads.map((upload, index) => (
              <div 
                key={upload.id}
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedUpload === upload.id ? '#3b82f6' : '#e5e7eb'}`,
                  backgroundColor: selectedUpload === upload.id ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSelectUpload(upload.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>
                        {upload.file_name}
                      </p>
                      {index === 0 && (
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          backgroundColor: '#e6f4ea',
                          color: '#1e7e34',
                          borderRadius: '12px',
                          fontWeight: 500
                        }}>
                          Latest
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                      Uploaded on {formatDate(new Date(upload.upload_date))} by {upload.user_name}
                    </p>
                  </div>
                  {index !== 0 && ( // Only show compare button for non-latest uploads
                    <Tooltip title="Compare this version with the latest upload" placement="left">
                      <button
                        onClick={(e) => handleCompare(upload.id, e)}
                        disabled={selectedUpload === upload.id}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: comparisonUpload === upload.id ? '#7c3aed' : '#f3f4f6',
                          color: comparisonUpload === upload.id ? 'white' : '#4b5563',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Compare
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {changes.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px',
              fontWeight: 500,
              color: '#374151',
              margin: 0
            }}>
              Changes
            </h3>
            <Tooltip title="Shows all changes between the selected versions. Modified values are highlighted in yellow, additions in green, and removals in red." placement="right">
              <InfoIcon style={{ color: '#6b7280', fontSize: '16px', cursor: 'help' }} />
            </Tooltip>
          </div>
          
          <div style={{ 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Change Type</th>
                  <th style={tableHeaderStyle}>PMO ID</th>
                  <th style={tableHeaderStyle}>Field</th>
                  <th style={tableHeaderStyle}>Old Value</th>
                  <th style={tableHeaderStyle}>New Value</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change, index) => (
                  <tr 
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td style={{...tableCellStyle}}>
                      <span style={getChangeTypeStyle(change.change_type)}>
                        {change.change_type}
                      </span>
                    </td>
                    <td style={{...tableCellStyle, fontWeight: 500, color: '#111827'}}>
                      {change.pmoId}
                    </td>
                    <td style={{...tableCellStyle, color: '#111827'}}>
                      {formatFieldName(change.field_name)}
                    </td>
                    <td style={tableCellStyle}>
                      {change.old_value || '-'}
                    </td>
                    <td style={tableCellStyle}>
                      {change.new_value || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHistory; 