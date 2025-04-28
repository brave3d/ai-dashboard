import React, { useState, useCallback } from 'react';

// Placeholder - UploadThing integration will be added later
function ImageUpload({ onFileSelect, uploadedImageUrl }) {
  const [preview, setPreview] = useState(null);
  const [isPasting, setIsPasting] = useState(false); // To show paste indicator
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        // Simulate upload for now - replace with actual UploadThing call
        setUploadStatus('Uploading...');
        setUploadProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setUploadStatus('Upload complete!');
            onFileSelect(reader.result); // Pass data URL for now
            setTimeout(() => setUploadStatus(''), 2000);
          }
        }, 100);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      setUploadStatus('Invalid file type.');
      onFileSelect(null);
    }
  };

  // TODO: Implement Drag & Drop and Paste
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    processFile(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handlePaste = useCallback(async (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            event.preventDefault();
            const blob = item.getAsFile();
            processFile(blob);
            return;
        }
    }
  }, [onFileSelect]);

  const handleClickToPaste = () => {
    // Logic to focus or prompt user to paste
    navigator.clipboard.read().then(items => {
      handlePaste({ clipboardData: { items } });
    }).catch(err => {
      console.error('Failed to read clipboard:', err);
      alert('Could not access clipboard. Please paste manually (Ctrl+V/Cmd+V).');
    });
  };

  return (
    <div 
      id="imageUploadContainer" 
      className="border-2 border-dashed border-gray-400 p-4 rounded-lg text-center mb-4 relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onPaste={handlePaste} // Basic paste listener
      tabIndex={0} // Make focusable for paste
    >
      <input
        type="file"
        id="imageUploadInput"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden" // Hide default input
      />
      <label 
        htmlFor="imageUploadInput" 
        className="cursor-pointer block mb-2 text-gray-600 hover:text-primary"
      >
        {preview ? 'Change Image' : 'Select Input Image'}
      </label>
      
      {!preview && (
          <div 
              id="pasteTarget" 
              className="text-sm text-gray-500 mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={handleClickToPaste} // Add click handler for paste attempt
          >
              Drop image here or click to paste from clipboard
          </div>
      )}

      {preview && (
        <img 
          id="imagePreview" 
          src={preview} 
          alt="Image Preview" 
          className="max-w-xs mx-auto mb-2 rounded shadow"
        />
      )}

      {/* Upload Progress Indicator */}
      {uploadStatus && (
        <div id="uploadProgress" className="mt-2">
          <p id="uploadStatus" className={`text-sm ${uploadStatus.includes('failed') || uploadStatus.includes('Invalid') ? 'text-error' : 'text-info'}`}>{uploadStatus}</p>
          {uploadStatus === 'Uploading...' && (
            <progress 
              id="uploadProgressBar" 
              className="progress progress-primary w-full mt-1" 
              value={uploadProgress}
              max="100"
            ></progress>
          )}
        </div>
      )}
      
      {/* Hidden input to store the uploaded URL (will be needed later) */}
      <input type="hidden" id="uploadedImageUrl" name="uploadedImageUrl" value={uploadedImageUrl || ''} />
    </div>
  );
}

export default ImageUpload; 