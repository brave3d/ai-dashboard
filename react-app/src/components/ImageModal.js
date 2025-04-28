import React from 'react';

// Placeholder component
function ImageModal({ isOpen, onClose, image, onPrev, onNext, onDownload, onReusePrompt }) {
  if (!isOpen || !image) return null;

  return (
    <div id="imageModal" className={`modal modal-open`} onClick={onClose}> {/* Add modal-open dynamically */} 
      <div className="modal-box w-11/12 max-w-5xl relative p-0" onClick={(e) => e.stopPropagation()}> {/* Stop backdrop click propagation */} 
        {/* Close button */}
        <button 
          id="closeModalBtn" 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10" 
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="flex flex-col md:flex-row">
            {/* Image Display */}
            <div className="w-full md:w-3/4 flex items-center justify-center bg-black p-4 relative">
                <img id="modalImage" src={image.url} alt="Generated Preview" className="max-h-[80vh] max-w-full object-contain" />
                {/* Prev/Next Buttons */} 
                <button id="prevBtn" onClick={onPrev} className="btn btn-circle btn-ghost absolute left-4 top-1/2 transform -translate-y-1/2">❮</button>
                <button id="nextBtn" onClick={onNext} className="btn btn-circle btn-ghost absolute right-4 top-1/2 transform -translate-y-1/2">❯</button>
            </div>

            {/* Details and Actions Panel */}
            <div className="w-full md:w-1/4 p-4 bg-base-200 flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <div className="text-sm space-y-1 mb-4 overflow-auto flex-grow">
                    <p id="modalPrompt"><strong>Prompt:</strong> {image.prompt || 'N/A'}</p>
                    <p id="modalSeed"><strong>Seed:</strong> {image.seed || 'N/A'}</p>
                    <p id="modalNSFW"><strong>NSFW:</strong> {image.has_nsfw_concepts !== undefined ? String(image.has_nsfw_concepts) : 'N/A'}</p>
                    <p id="modalTimings"><strong>Timings:</strong> {image.timings || 'N/A'}</p>
                    {/* Add more details if needed */}
                </div>
                
                <div className="modal-action mt-auto grid grid-cols-2 gap-2"> 
                    <button id="downloadBtn" onClick={onDownload} className="btn btn-secondary btn-sm">Download</button>
                    <button id="reusePromptBtn" onClick={onReusePrompt} className="btn btn-accent btn-sm">Reuse Prompt</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default ImageModal; 