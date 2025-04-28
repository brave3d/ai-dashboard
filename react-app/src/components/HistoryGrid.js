import React, { useEffect, useRef, useState } from 'react';
import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';

// Placeholder component
function HistoryGrid({ historyItems, onImageClick, onDeleteClick, loadMore, hasMore, isLoading }) {
  const gridRef = useRef();
  const masonryRef = useRef();
  const [currentSizeClass, setCurrentSizeClass] = useState('w-1/4'); // Default size

  // TODO: Add Thumbnail size slider logic later

  useEffect(() => {
    if (!gridRef.current || historyItems.length === 0) return;

    imagesLoaded(gridRef.current, function () {
      if (!masonryRef.current) {
        console.log('Initializing Masonry');
        masonryRef.current = new Masonry(gridRef.current, {
          itemSelector: '.history-entry',
          percentPosition: true,
          gutter: 16, // Use gutter for spacing
        });
      } else {
        console.log('Reloading Masonry items');
        masonryRef.current.reloadItems();
        masonryRef.current.layout();
      }
    });

    // Cleanup
    return () => {
      if (masonryRef.current) {
        // Check if destroy method exists before calling
        if (typeof masonryRef.current.destroy === 'function') {
             console.log('Destroying Masonry instance');
             masonryRef.current.destroy();
        } else {
             console.warn('Masonry instance does not have a destroy method.');
        }
        masonryRef.current = null;
      }
    };
  }, [historyItems]); // Re-run when historyItems change

  return (
    <div className="history-section mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-center">History</h2>
      {/* TODO: Add Thumbnail Size Slider */} 
      <div ref={gridRef} className="history-grid -m-2"> {/* Negative margin to counteract gutter */} 
        {historyItems.map((item, index) => (
          <div key={item.request_id || `new-${index}`} className={`history-entry ${currentSizeClass} p-2`}> {/* Padding for gutter */} 
            <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200 relative group">
              <img
                src={item.url}
                alt={`History ${index}`}
                className="thumbnail w-full h-auto object-cover cursor-pointer block rounded-t-lg" // Added block
                onClick={() => onImageClick(item)}
                loading="lazy"
              />
              {item.request_id && (
                <button 
                  className="history-delete-btn btn btn-xs btn-circle btn-error absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                  title="Delete this result"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onDeleteClick(item.request_id, e.currentTarget.closest('.history-entry'));
                  }}
                >
                  &times;
                </button>
              )}
              {/* Optional: Add subtle info overlay on hover? */}
            </div>
          </div>
        ))}
      </div>
      {isLoading && <div className="text-center mt-4"><span className="loading loading-dots loading-lg"></span></div>}
      {!isLoading && hasMore && (
        <div className="text-center mt-4">
          <button onClick={loadMore} className="btn btn-outline btn-primary">Load More</button>
        </div>
      )}
      {!hasMore && historyItems.length > 0 && <p className="text-center mt-4 text-gray-500">End of history.</p>}
      {historyItems.length === 0 && !isLoading && <p className="text-center mt-4 text-gray-500">No history found for this model.</p>} 
    </div>
  );
}

export default HistoryGrid; 