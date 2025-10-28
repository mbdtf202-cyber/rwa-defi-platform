import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';

interface DocumentUploadProps {
  spvId: number;
  onUploadComplete?: (document: any) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ spvId, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      setMessage('Please select a file and document type');
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('spvId', spvId.toString());
      formData.append('documentType', documentType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadStatus('success');
      setMessage('Document uploaded and stored on-chain successfully');
      setFile(null);
      setDocumentType('');
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      setUploadStatus('error');
      setMessage('Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          >
            <option value="">Select type...</option>
            <option value="DEED">Property Deed</option>
            <option value="LEASE">Lease Agreement</option>
            <option value="INSPECTION">Inspection Report</option>
            <option value="APPRAISAL">Appraisal Report</option>
            <option value="INSURANCE">Insurance Policy</option>
            <option value="TAX">Tax Document</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-blue-500 mb-2" />
                  <p className="text-sm text-gray-600">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || !documentType || uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </>
          )}
        </button>

        {uploadStatus !== 'idle' && (
          <div
            className={`flex items-center p-4 rounded-lg ${
              uploadStatus === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
