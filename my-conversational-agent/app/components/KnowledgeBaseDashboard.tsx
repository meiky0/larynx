// components/KnowledgeBaseDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ElevenLabsKnowledgeBase, KnowledgeBaseDocument, CreateDocumentResponse } from '../lib/elevenlabs-api';

interface KnowledgeBaseDashboardProps {
  apiKey: string;
}

export default function KnowledgeBaseDashboard({ apiKey }: KnowledgeBaseDashboardProps) {
  const [kbService] = useState(() => new ElevenLabsKnowledgeBase(apiKey));
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);

  // Form states
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'file'>('text');

  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadDocuments = useCallback(async (cursor?: string, append: boolean = false) => {
    try {
      setIsLoadingDocuments(true);
      const response = await kbService.listDocuments(cursor, 20);
      
      if (append) {
        setDocuments(prev => [...prev, ...response.documents]);
      } else {
        setDocuments(response.documents);
      }
      
      setHasMore(response.has_more);
      setNextCursor(response.next_cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [kbService]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreateFromText = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text content');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const response = await kbService.createFromText(textInput, textName || undefined);
      setSuccess(`Document created successfully: ${response.message || 'Text document added'}`);
      setTextInput('');
      setTextName('');
      
      // Reload documents to show the new one
      setTimeout(() => loadDocuments(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document from text');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromUrl = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const response = await kbService.createFromUrl(urlInput, urlName || undefined);
      setSuccess(`Document created successfully: ${response.message || 'URL document added'}`);
      setUrlInput('');
      setUrlName('');
      
      // Reload documents to show the new one
      setTimeout(() => loadDocuments(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document from URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromFile = async () => {
    if (!fileInput) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const response = await kbService.createFromFile(fileInput, fileName || undefined);
      setSuccess(`Document created successfully: ${response.message || 'File document added'}`);
      setFileInput(null);
      setFileName('');
      
      // Reset file input
      const fileInputElement = document.getElementById('file-input') as HTMLInputElement;
      if (fileInputElement) {
        fileInputElement.value = '';
      }
      
      // Reload documents to show the new one
      setTimeout(() => loadDocuments(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document from file');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }

    try {
      await kbService.deleteDocument(documentId);
      setSuccess('Document deleted successfully');
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileInput(file);
      if (!fileName) {
        setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'url': return '🌐';
      case 'file': return '📄';
      default: return '📄';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ready': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Knowledge Base Dashboard</h2>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={clearMessages}
            className="text-red-300 hover:text-white text-xs mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
          <p className="text-green-200">{success}</p>
          <button 
            onClick={clearMessages}
            className="text-green-300 hover:text-white text-xs mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Add Documents */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Add New Document</h3>
          
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              📝 Text
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'url'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🌐 URL
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'file'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              📁 File
            </button>
          </div>

          {/* Text Input Tab */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Name (Optional)</label>
                <input
                  type="text"
                  value={textName}
                  onChange={(e) => setTextName(e.target.value)}
                  placeholder="Enter document name..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text Content</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your text content here..."
                  rows={8}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
                <div className="text-xs text-slate-400 mt-1">
                  {textInput.length} characters
                </div>
              </div>
              <button
                onClick={handleCreateFromText}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create from Text'}
              </button>
            </div>
          )}

          {/* URL Input Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Name (Optional)</label>
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  placeholder="Enter document name..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/documentation"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCreateFromUrl}
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create from URL'}
              </button>
            </div>
          )}

          {/* File Input Tab */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Name (Optional)</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter document name..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.pdf,.doc,.docx,.md"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {fileInput && (
                  <div className="text-xs text-slate-400 mt-1">
                    Selected: {fileInput.name} ({(fileInput.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
              <button
                onClick={handleCreateFromFile}
                disabled={loading || !fileInput}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Document List */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Your Documents ({documents.length})
          </h3>
          
          {isLoadingDocuments && documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No documents in your knowledge base yet.</p>
              <p className="text-sm mt-2">Add your first document using the forms on the left.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(doc.type)}</span>
                        <h4 className="font-medium text-white truncate">
                          {doc.name || `Document ${doc.id.slice(0, 8)}...`}
                        </h4>
                        {doc.status && (
                          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-1">
                        ID: {doc.id}
                      </p>
                      {doc.url && (
                        <p className="text-xs text-blue-300 truncate mb-1">
                          🔗 {doc.url}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Created: {formatDate(doc.created_at)}
                      </p>
                      {doc.content_preview && (
                        <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                          {doc.content_preview}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <button
                  onClick={() => loadDocuments(nextCursor, true)}
                  disabled={isLoadingDocuments}
                  className="w-full py-2 mt-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoadingDocuments ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}