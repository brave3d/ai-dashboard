import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';

// Create context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider = ({ children }) => {
  // App state
  const [selectedModel, setSelectedModel] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState(null);

  // Load history when model changes
  useEffect(() => {
    if (selectedModel) {
      loadHistory(1, true);
    }
  }, [selectedModel]);

  // Generate image
  const generateImage = async (params) => {
    if (!selectedModel) {
      appendLog('Error: No model selected');
      setError('Please select a model first');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      appendLog(`Generating image with model: ${selectedModel}`);
      appendLog(`Parameters: ${JSON.stringify(params, null, 2)}`);
      
      const result = await ApiService.generateImage(selectedModel, params);
      
      appendLog('Image generated successfully');
      
      // Add to history (prepend)
      setHistoryItems(prev => [result, ...prev]);
      
      return result;
    } catch (err) {
      appendLog(`Error: ${err.message}`);
      setError(`Failed to generate image: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load history
  const loadHistory = useCallback(async (page = 1, reset = false) => {
    setIsLoading(true);
    
    try {
      const data = await ApiService.getHistory(selectedModel, page);
      
      if (reset) {
        setHistoryItems(data.items || []);
      } else {
        setHistoryItems(prev => [...prev, ...(data.items || [])]);
      }
      
      setHasMoreHistory(data.has_more || false);
      setCurrentPage(page);
    } catch (err) {
      appendLog(`Error loading history: ${err.message}`);
      setError(`Failed to load history: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  // Load more history
  const loadMoreHistory = () => {
    if (!isLoading && hasMoreHistory) {
      loadHistory(currentPage + 1);
    }
  };

  // Delete history item
  const deleteHistoryItem = async (requestId) => {
    try {
      await ApiService.deleteHistoryItem(requestId);
      setHistoryItems(prev => prev.filter(item => item.request_id !== requestId));
      appendLog(`Deleted history item: ${requestId}`);
    } catch (err) {
      appendLog(`Error deleting history item: ${err.message}`);
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // Append log
  const appendLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Open modal with image
  const openImageModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  // Close modal
  const closeImageModal = () => {
    setIsModalOpen(false);
  };

  // Navigate to previous/next image
  const showPrevImage = () => {
    if (!selectedImage) return;
    
    const currentIndex = historyItems.findIndex(item => item.request_id === selectedImage.request_id);
    if (currentIndex > 0) {
      setSelectedImage(historyItems[currentIndex - 1]);
    }
  };

  const showNextImage = () => {
    if (!selectedImage) return;
    
    const currentIndex = historyItems.findIndex(item => item.request_id === selectedImage.request_id);
    if (currentIndex < historyItems.length - 1) {
      setSelectedImage(historyItems[currentIndex + 1]);
    }
  };

  // Download image
  const downloadImage = (url, filename) => {
    ApiService.downloadImage(url, filename);
  };

  // Reuse prompt
  const reusePrompt = (prompt) => {
    // Will be handled by the form component
    closeImageModal();
    // The form will need to access this prompt
    return prompt;
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) {
      setUploadedImage(null);
      return;
    }
    
    try {
      // For now, just store the data URL
      setUploadedImage(file);
      return file;
    } catch (err) {
      appendLog(`Error uploading file: ${err.message}`);
      setError(`Failed to upload: ${err.message}`);
      return null;
    }
  };

  // Provide value to consumers
  const value = {
    selectedModel,
    setSelectedModel,
    historyItems,
    logs,
    isLoading,
    currentPage,
    hasMoreHistory,
    selectedImage,
    isModalOpen,
    uploadedImage,
    error,
    generateImage,
    loadHistory,
    loadMoreHistory,
    deleteHistoryItem,
    appendLog,
    clearLogs,
    openImageModal,
    closeImageModal,
    showPrevImage,
    showNextImage,
    downloadImage,
    reusePrompt,
    handleFileUpload,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext; 