import React, { useState, useEffect } from 'react';
import SqlServerApi, { ExcelProjectChange } from '../services/SqlServerApi';
import { formatDate } from '../utils/dateUtils';

interface UploadHistoryProps {
  onSelectUpload?: (uploadId: number) => void;
}

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
      
      // Select the latest upload by default
      if (uploadData.length > 0) {
        setSelectedUpload(uploadData[0].id);
        
        // Set the second most recent upload as comparison if available
        if (uploadData.length > 1) {
          setComparisonUpload(uploadData[1].id);
        }
      }
    } catch (err) {
      console.error('Failed to load uploads:', err);
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
      console.error('Failed to load changes:', err);
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

  const handleSelectComparison = (uploadId: number) => {
    setComparisonUpload(uploadId);
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-100 text-green-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      case 'modified':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Upload History</h2>
      
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {uploads.length === 0 && !loading && !error && (
        <p className="text-gray-500">No uploads found. Upload an Excel file to get started.</p>
      )}
      
      {uploads.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Recent Uploads</h3>
          <div className="grid grid-cols-1 gap-3">
            {uploads.map((upload) => (
              <div 
                key={upload.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedUpload === upload.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleSelectUpload(upload.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{upload.file_name}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded on {formatDate(new Date(upload.upload_date))} by {upload.user_name}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className={`px-2 py-1 text-xs rounded ${
                        comparisonUpload === upload.id 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectComparison(upload.id);
                      }}
                      disabled={selectedUpload === upload.id}
                    >
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {changes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Changes</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Old Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {changes.map((change, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {change.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getChangeTypeColor(change.change_type)}`}>
                        {change.change_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {change.field_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {change.old_value || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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