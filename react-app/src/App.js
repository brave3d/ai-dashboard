import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import GenerationForm from './components/GenerationForm';
import HistoryGrid from './components/HistoryGrid';
import ImageModal from './components/ImageModal';
import LogsDisplay from './components/LogsDisplay';
import ThemeToggle from './components/ThemeToggle';

// Main App Container
function AppContainer() {
  const { 
    historyItems, 
    logs, 
    isLoading, 
    hasMoreHistory, 
    loadMoreHistory, 
    openImageModal, 
    deleteHistoryItem,
    isModalOpen, 
    selectedImage,
    closeImageModal,
    showPrevImage,
    showNextImage,
    downloadImage,
    reusePrompt,
    error
  } = useAppContext();

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8 flex flex-col items-center">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-bold text-center">Flux API Playground</h1>
        <p className="text-center text-gray-600 mt-2">Generate images with various Flux models</p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error shadow-lg mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Generation Controls */}
        <div className="md:col-span-5">
          <GenerationForm />
          <LogsDisplay logs={logs} />
        </div>
        
        {/* Right Column - Results and History */}
        <div className="md:col-span-7">
          <HistoryGrid 
            historyItems={historyItems} 
            onImageClick={openImageModal}
            onDeleteClick={deleteHistoryItem}
            loadMore={loadMoreHistory}
            hasMore={hasMoreHistory}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal 
        isOpen={isModalOpen} 
        onClose={closeImageModal}
        image={selectedImage}
        onPrev={showPrevImage}
        onNext={showNextImage}
        onDownload={() => selectedImage && downloadImage(selectedImage.url, `flux-${selectedImage.request_id}.png`)}
        onReusePrompt={() => selectedImage && reusePrompt(selectedImage.prompt)}
      />

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Flux API Playground - React Version</p>
        <p className="mt-1">
          <a 
            href="https://fal.ai/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="link link-hover"
          >
            fal.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

// Wrap with AppProvider
function App() {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
}

export default App;
