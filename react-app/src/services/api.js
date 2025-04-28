// API service for Flux API interactions
const API_BASE_URL = '/api'; // Relative path assuming React app is served alongside API

export const ApiService = {
  // Generate image with the selected model
  generateImage: async (model, params) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, ...params }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  },

  // Fetch history for a specific model (with pagination)
  getHistory: async (model = null, page = 1) => {
    try {
      let url = `${API_BASE_URL}/history?page=${page}`;
      if (model) {
        url += `&model=${encodeURIComponent(model)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },

  // Delete a specific history item
  deleteHistoryItem: async (requestId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${requestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting history item:', error);
      throw error;
    }
  },

  // Upload file to server/storage
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  // Download image (helper method)
  downloadImage: (url, filename) => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'flux-generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default ApiService; 