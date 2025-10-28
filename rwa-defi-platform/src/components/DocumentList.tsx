import React, { useEffect, useState } from 'react';
import { FileText, Download, CheckCircle, Clock, Shield } from 'lucide-react';

interface Document {
  id: string;
  hash: string;
  ipfsHash: string;
  filename: string;
  documentType: string;
  verified: boolean;
  onChain: boolean;
  createdAt: string;
}

interface DocumentListProps {
  spvId: number;
}

export const DocumentList: React.FC<DocumentListProps> = ({ spvId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [spvId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/spv/${spvId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (hash: string, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${hash}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleVerify = async (hash: string) => {
    try {
      const response = await fetch(`/api/documents/${hash}/verify`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.verified ? 'Document verified successfully' : 'Verification failed');
        fetchDocuments();
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Documents</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <FileText className="w-10 h-10 text-blue-500" />
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{doc.filename}</h4>
                  <p className="text-sm text-gray-500">{doc.documentType}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {doc.onChain && (
                    <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Shield className="w-3 h-3 mr-1" />
                      On-Chain
                    </span>
                  )}
                  
                  {doc.verified ? (
                    <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleVerify(doc.hash)}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleDownload(doc.hash, doc.filename)}
                  className="flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-400 font-mono">
              Hash: {doc.hash.substring(0, 20)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
