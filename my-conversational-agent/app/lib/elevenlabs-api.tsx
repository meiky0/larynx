// lib/elevenlabs-api.ts
export interface KnowledgeBaseDocument {
  id: string;
  name: string;
  type: 'text' | 'url' | 'file';
  created_at: string;
  updated_at: string;
  content_preview?: string;
  url?: string;
  size?: number;
  status?: 'processing' | 'ready' | 'failed';
}

export interface KnowledgeBaseResponse {
  documents: KnowledgeBaseDocument[];
  has_more: boolean;
  next_cursor?: string;
}

export interface CreateDocumentResponse {
  id: string;
  message: string;
}

export class ElevenLabsKnowledgeBase {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'xi-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail) 
            ? errorData.detail.map((d: any) => d.msg || d).join(', ')
            : errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If we can't parse error response, use default message
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return { success: true };
    }
  }

  async listDocuments(
    cursor?: string,
    pageSize: number = 30,
    search?: string,
    showOnlyOwned: boolean = false
  ): Promise<KnowledgeBaseResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);
    if (showOnlyOwned) params.append('show_only_owned_documents', 'true');

    const queryString = params.toString();
    const endpoint = `/knowledge-base${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  async createFromText(text: string, name?: string): Promise<CreateDocumentResponse> {
    const formData = new FormData();
    
    // Create a text file blob
    const textBlob = new Blob([text], { type: 'text/plain' });
    formData.append('file', textBlob, name ? `${name}.txt` : 'document.txt');
    
    if (name) {
      formData.append('name', name);
    }

    return this.makeRequest('/knowledge-base', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
    });
  }

  async createFromUrl(url: string, name?: string): Promise<CreateDocumentResponse> {
    const formData = new FormData();
    formData.append('url', url);
    
    if (name) {
      formData.append('name', name);
    }

    return this.makeRequest('/knowledge-base', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
      },
    });
  }

  async createFromFile(file: File, name?: string): Promise<CreateDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (name) {
      formData.append('name', name);
    }

    return this.makeRequest('/knowledge-base', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
      },
    });
  }

  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/knowledge-base/${documentId}`, {
      method: 'DELETE',
    });
  }

  async getDocument(documentId: string): Promise<KnowledgeBaseDocument> {
    return this.makeRequest(`/knowledge-base/${documentId}`, {
      method: 'GET',
    });
  }

  async updateDocument(
    documentId: string, 
    updates: { name?: string }
  ): Promise<KnowledgeBaseDocument> {
    return this.makeRequest(`/knowledge-base/${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  // Test API key validity
  async testApiKey(): Promise<boolean> {
    try {
      await this.listDocuments(undefined, 1);
      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
}