const VIDEO_MODELS = [
    {
        name: "Kling 2.0 Image-to-Video",
        model_path: "fal-ai/kling-video/v2/master/image-to-video",
        type: "I2V", // Image-to-Video
        inputs: ["prompt", "image"],
        params: ["seed"] // Example, add more like fps, duration, motion_bucket_id
    },
    // Add other video models here later
    // {
    //     name: "Some Text-to-Video Model",
    //     model_path: "fal-ai/some-t2v-model",
    //     type: "T2V",
    //     inputs: ["prompt"],
    //     params: ["seed", "duration", "fps"]
    // }
];

let videoMsnry = null; // Masonry instance for video history
const videoHistoryItemSelector = '.history-entry'; 
let allHistoryVideos = []; // For modal navigation
let currentHistoryVideoIndex = 0;
let currentVideoHistoryPage = 1; 
let isLoadingVideoHistory = false; 
let hasMoreVideoHistory = true; 
let currentVideoHistoryEndpoint = null; 
const videoHistorySizeMap = { 
    1: { label: "Small", className: 'w-1/6' },
    2: { label: "Medium", className: 'w-1/4' },
    3: { label: "Large", className: 'w-1/3' },
    4: { label: "X-Large", className: 'w-1/2' }
};
let currentVideoSizeClass = videoHistorySizeMap[2].className; 

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modelSelect = document.getElementById('videoModelSelect');
    const form = document.getElementById('videoGenerationForm');
    const promptInput = document.getElementById('prompt');
    const imageInputContainer = document.getElementById('imageInputContainer');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const seedInput = document.getElementById('seed');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const logsContainer = document.getElementById('logs');

    // --- Add New DOM Elements ---
    const videoHistoryContainer = document.getElementById('videoHistory');
    const videoThumbnailSizeSlider = document.getElementById('thumbnailSizeSlider'); 
    const videoThumbnailSizeLabel = document.getElementById('thumbnailSizeLabel'); 
    const videoModal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalPrompt = document.getElementById('modalPrompt'); // Add getter
    const modalSeed = document.getElementById('modalSeed'); // Add getter
    const modalReusePromptBtn = document.getElementById('reusePromptBtn'); // Add getter
    const modalCloseBtn = document.getElementById('closeModalBtn'); // Add getter

    let selectedImageFile = null;
    let currentModelType = null;

    // --- Functions ---

    // Populate model dropdown
    function loadVideoModels() {
        VIDEO_MODELS.forEach(model => {
            const option = document.createElement('option');
            option.value = model.model_path;
            option.textContent = model.name;
            option.dataset.type = model.type; // Store type for easy access
            modelSelect.appendChild(option);
        });
        // Select first model by default if available
        if (modelSelect.options.length > 1) {
            modelSelect.selectedIndex = 1;
            updateInputVisibility(); // Update UI for default model
        } else {
             modelSelect.disabled = true;
             generateBtn.disabled = true;
             appendLog("Error: No video models configured.");
        }
    }

    // Show/hide inputs based on selected model type
    function updateInputVisibility() {
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        currentModelType = selectedOption ? selectedOption.dataset.type : null;
        console.log("Selected Model Type:", currentModelType);

        if (currentModelType === 'I2V') {
            imageInputContainer.style.display = 'block';
            imageInput.required = true;
        } else { // For T2V or others that don't need an initial image
            imageInputContainer.style.display = 'none';
            imageInput.required = false;
            imagePreview.classList.add('hidden'); // Hide preview if switching away
            selectedImageFile = null; // Clear selection
            imageInput.value = ''; // Clear file input
        }
        // Add logic here later to show/hide specific parameter inputs based on model.params
    }

    // Handle image file selection and preview
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else {
            selectedImageFile = null;
            imagePreview.src = '';
            imagePreview.classList.add('hidden');
            if (file) { // If a file was selected but wasn't an image
                 alert("Please select a valid image file (jpg, png, webp, etc.).");
                 imageInput.value = ''; // Clear invalid selection
            }
        }
    });

    // Append log messages
    function appendLog(message) {
        const logEntry = document.createElement('div');
        // Simple text logging for now, can parse progress later
        logEntry.textContent = message;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight; 
    }

    // --- Form Submission ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        logsContainer.innerHTML = ''; // Clear logs
        videoPlaceholder.innerHTML = '<p class="text-base-content text-opacity-60">Generating video...</p>'; // Clear previous video
        generateBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';

        const modelPath = modelSelect.value;
        const prompt = promptInput.value;
        const seed = seedInput.value;
        let imageUrl = null;

        try {
            // 1. Upload image if required
            if (currentModelType === 'I2V') {
                if (!selectedImageFile) {
                    throw new Error("Input image is required for this model.");
                }
                appendLog("Uploading input image...");
                const formData = new FormData();
                formData.append('videoInputFile', selectedImageFile); // Match backend field name

                const uploadResponse = await fetch('/api/upload-video-input', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(`Image upload failed: ${errorData.error || uploadResponse.statusText}`);
                }
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.url;
                appendLog(`Image uploaded successfully: ${imageUrl}`);
            }

            // 2. Build query parameters for generation stream
            const queryParams = new URLSearchParams();
            queryParams.append('model', modelPath);
            queryParams.append('prompt', prompt);
            if (seed && seed.toLowerCase() !== 'random') {
                 queryParams.append('seed', seed);
            }
            if (imageUrl) { // Only include if applicable
                queryParams.append('imageUrl', imageUrl);
            }
            // Add other parameters here (fps, duration etc.) based on form inputs
            // Example: queryParams.append('duration', document.getElementById('durationInput').value);

            // 3. Start EventSource for generation
            appendLog("Starting video generation stream...");
            const eventSource = new EventSource(`/generate-video-stream?${queryParams.toString()}`);

            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    console.log("Stream message received:", data);

                    if (data.type === 'log') {
                        appendLog(data.message);
                    } else if (data.type === 'result') {
                        appendLog("Generation complete!");
                        if (data.video && data.video.url) {
                            // Display the video
                            videoPlaceholder.innerHTML = ''; // Clear placeholder text
                            const videoElement = document.createElement('video');
                            videoElement.src = data.video.url;
                            videoElement.controls = true;
                            videoElement.setAttribute('playsinline', ''); // Good for mobile
                            videoElement.setAttribute('muted', ''); // Often needed for autoplay
                            videoElement.setAttribute('autoplay', ''); // Optional autoplay
                            videoElement.setAttribute('loop', ''); // Optional loop
                            videoPlaceholder.appendChild(videoElement);

                            // Add to history
                            const resultDataForHistory = {
                                 url: data.video?.url,
                                 prompt: data.prompt || queryParams.get('prompt'), // Get prompt used
                                 seed: data.seed, // Get seed from result
                                 request_id: data.request_id || null // Need request_id from Fal result if possible
                            };
                            if (resultDataForHistory.url) {
                                appendVideoToHistoryDOM(resultDataForHistory, true); // Prepend
                            }
                        } else {
                            appendLog("Error: Result received but video URL is missing.");
                            videoPlaceholder.innerHTML = '<p class="text-base-content text-error">Error: Video URL missing in result.</p>';
                        }
                        eventSource.close();
                        generateBtn.disabled = false;
                        loadingSpinner.style.display = 'none';
                    } else if (data.type === 'error') {
                         appendLog(`Error: ${data.message}`);
                         if(data.details) {
                            appendLog(`Details: ${JSON.stringify(data.details)}`);
                         }
                         videoPlaceholder.innerHTML = '<p class="text-base-content text-error">Generation failed. Check logs.</p>';
                         eventSource.close();
                         generateBtn.disabled = false;
                         loadingSpinner.style.display = 'none';
                    } else {
                         console.warn("Unknown stream message type:", data);
                    }
                } catch(err) {
                    console.error("Error processing stream message:", err, event.data);
                    appendLog("Error processing stream message. See console.");
                }
            };

            eventSource.onerror = function(error) {
                console.error('EventSource failed:', error);
                appendLog('Connection error during generation. Please try again.');
                eventSource.close();
                generateBtn.disabled = false;
                loadingSpinner.style.display = 'none';
                videoPlaceholder.innerHTML = '<p class="text-base-content text-error">Connection error. Please try again.</p>';
            };

        } catch (error) {
            console.error("Generation Error:", error);
            appendLog(`Error: ${error.message}`);
            generateBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            videoPlaceholder.innerHTML = '<p class="text-base-content text-error">An error occurred. Check logs.</p>';
        }
    });

    // --- Add History Functions (Copied & Adapted from script.js) ---

     function setVideoHistoryItemSize(sliderValue) {
        const setting = videoHistorySizeMap[sliderValue];
        if (videoHistoryContainer && setting) {
            const newSizeClass = setting.className;
            if (videoThumbnailSizeLabel) videoThumbnailSizeLabel.textContent = setting.label;
            if (newSizeClass === currentVideoSizeClass) return;
            console.log(`Changing video history item size class from ${currentVideoSizeClass} to ${newSizeClass}`);
            const items = videoHistoryContainer.querySelectorAll(videoHistoryItemSelector);
            items.forEach(item => {
                item.classList.remove(currentVideoSizeClass);
                item.classList.add(newSizeClass);
            });
            currentVideoSizeClass = newSizeClass;
            if (videoMsnry) {
                console.log("Triggering Video Masonry layout due to size change.");
                videoMsnry.layout();
            }
        } else {
            console.warn("Could not set video history item size:", sliderValue);
        }
    }
    
    function initVideoMasonry() {
        if (videoMsnry) videoMsnry.destroy();
        imagesLoaded(videoHistoryContainer, function() { // Use imagesLoaded even for video posters/elements
            console.log("Video history elements loaded, initializing Masonry...");
            videoMsnry = new Masonry(videoHistoryContainer, {
                itemSelector: videoHistoryItemSelector,
                percentPosition: true,
                gutter: 0
            });
            console.log("Video Masonry initialized.");
        });
    }

     function appendVideoToHistoryDOM(entryData, prepend = false) {
        if (!videoHistoryContainer || !entryData || !entryData.url) return;

        const historyEntry = document.createElement('div');
        historyEntry.className = `history-entry ${currentVideoSizeClass}`;
        historyEntry.id = `video-history-item-${entryData.request_id}`;

        const thumb = document.createElement('video');
        thumb.src = entryData.url;
        thumb.className = 'thumbnail';
        thumb.muted = true; 
        thumb.addEventListener('mouseover', () => thumb.play().catch(e => {})); 
        thumb.addEventListener('mouseout', () => thumb.pause());
        
        if (entryData.request_id) {
             const deleteBtn = document.createElement('button');
             deleteBtn.className = 'history-delete-btn';
             deleteBtn.innerHTML = '&times;';
             deleteBtn.title = 'Delete this result';
             deleteBtn.addEventListener('click', (e) => {
                 e.stopPropagation();
                 handleDeleteVideoHistoryItem(entryData.request_id, historyEntry); // Need this function
             });
             historyEntry.appendChild(deleteBtn);
        }

        historyEntry.appendChild(thumb); // Add thumb video/placeholder

         const videoObjForModal = { url: entryData.url, prompt: entryData.prompt, seed: entryData.seed, request_id: entryData.request_id };

        if (prepend) {
            videoHistoryContainer.insertBefore(historyEntry, videoHistoryContainer.firstChild);
            allHistoryVideos.unshift(videoObjForModal);
        } else {
            videoHistoryContainer.appendChild(historyEntry);
            allHistoryVideos.push(videoObjForModal);
        }

        if (videoMsnry) {
             imagesLoaded(historyEntry, function() { 
                 console.log(`Adding video ${entryData.request_id || 'new'} to Masonry.`);
                 if (prepend) videoMsnry.prepended(historyEntry);
                 else videoMsnry.appended(historyEntry);
             });
        }

         thumb.addEventListener('click', () => {
            currentHistoryVideoIndex = allHistoryVideos.findIndex(item => item.request_id === entryData.request_id);
            if (currentHistoryVideoIndex === -1) currentHistoryVideoIndex = 0;
            showVideoModal(currentHistoryVideoIndex);
        });
    }

     async function displayVideoHistory(endpoint = null, page = 1) {
        if (endpoint && endpoint !== currentVideoHistoryEndpoint) {
            currentVideoHistoryPage = 1; hasMoreVideoHistory = true; currentVideoHistoryEndpoint = endpoint;
            if (videoMsnry) videoMsnry.destroy(); videoMsnry = null;
            videoHistoryContainer.innerHTML = ''; allHistoryVideos = [];
        } else if (!endpoint && !currentVideoHistoryEndpoint) {
             currentVideoHistoryEndpoint = modelSelect.value || (modelSelect.options[1] ? modelSelect.options[1].value : null);
        }
        const modelToFetch = currentVideoHistoryEndpoint;
        if (!modelToFetch || isLoadingVideoHistory || (page > 1 && !hasMoreVideoHistory)) return;

        isLoadingVideoHistory = true;
        // Add/remove loading indicator logic here if desired

        console.log(`Fetching video history for endpoint: ${modelToFetch}, page: ${page}`);
        try {
            const historyUrl = `/api/video-history?endpoint=${encodeURIComponent(modelToFetch)}&page=${page}`; // New endpoint
            const response = await fetch(historyUrl);
            if (!response.ok) throw new Error(`Failed to fetch video history: ${response.status}`);
            const historyData = await response.json();
            console.log("Received video history data:", historyData);

            let newElements = [];
            if (historyData && Array.isArray(historyData.items)) {
                if (historyData.items.length === 0) { hasMoreVideoHistory = false; /* Handle empty */ 
                    if (page === 1) videoHistoryContainer.innerHTML = '<p class="text-center col-span-4">No history found.</p>';
                } else {
                    historyData.items.forEach(item => {
                        if (item.json_output && item.json_output.video && item.json_output.video.url) {
                             const entryData = {
                                 url: item.json_output.video.url,
                                 prompt: item.json_output.prompt || item.json_input?.prompt || '[Prompt N/A]',
                                 seed: item.json_output.seed !== undefined ? item.json_output.seed : '[Seed N/A]',
                                 request_id: item.request_id || null
                             };
                              const historyEntry = document.createElement('div');
                              historyEntry.className = `history-entry ${currentVideoSizeClass}`;
                              historyEntry.id = `video-history-item-${entryData.request_id}`;
                              
                              const thumb = document.createElement('video'); 
                               thumb.src = entryData.url; thumb.className = 'thumbnail'; thumb.muted=true;
                               thumb.addEventListener('mouseover', () => thumb.play().catch(e => {})); 
                               thumb.addEventListener('mouseout', () => thumb.pause());
                               
                               if (entryData.request_id) {
                                    const deleteBtn = document.createElement('button');
                                    deleteBtn.className = 'history-delete-btn';
                                    deleteBtn.innerHTML = '&times;';
                                    deleteBtn.title = 'Delete this result';
                                    deleteBtn.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        handleDeleteVideoHistoryItem(entryData.request_id, historyEntry); // Need this func
                                    });
                                    historyEntry.appendChild(deleteBtn);
                               }
                              historyEntry.appendChild(thumb);

                              thumb.addEventListener('click', () => {
                                currentHistoryVideoIndex = allHistoryVideos.findIndex(item => item.request_id === entryData.request_id);
                                if (currentHistoryVideoIndex === -1) currentHistoryVideoIndex = 0;
                                showVideoModal(currentHistoryVideoIndex);
                              });

                                newElements.push(historyEntry);
                                allHistoryVideos.push({ url: entryData.url, prompt: entryData.prompt, seed: entryData.seed, request_id: entryData.request_id });
                        } else { console.warn("Video History item skipped - missing video output:", item); }
                    });
                     
                     newElements.forEach(el => videoHistoryContainer.appendChild(el));

                     if (page === 1) initVideoMasonry();
                     else if (videoMsnry && newElements.length > 0) {
                         imagesLoaded(newElements, function() {
                             videoMsnry.appended(newElements);
                         });
                     }
                    currentVideoHistoryPage = page;
                    hasMoreVideoHistory = true;
                 }
            } // ... Error/Empty handling ...
        } catch (error) {
             console.error("Error fetching/displaying video history:", error); hasMoreVideoHistory = false;
             if(page===1) videoHistoryContainer.innerHTML = `<p class="text-error">Error loading history.</p>`
        } finally { isLoadingVideoHistory = false; }
    }

    // --- NEED handleDeleteVideoHistoryItem --- 
     async function handleDeleteVideoHistoryItem(requestId, elementToRemove) {
         console.log(`Attempting to delete video history item: ${requestId}`);
         if (!confirm(`Delete video result ${requestId}? This attempts to remove data from Fal storage.`)) return;
         try {
             elementToRemove.style.opacity = '0.5'; 
             const response = await fetch(`/api/delete-fal-video-request/${requestId}`, { method: 'POST' }); // New endpoint
             if (response.ok) {
                 if (videoMsnry) { videoMsnry.remove(elementToRemove); videoMsnry.layout(); } 
                 else { elementToRemove.remove(); }
                 if (elementToRemove.parentNode) elementToRemove.remove(); // Ensure removal
                 const indexToRemove = allHistoryVideos.findIndex(item => item.request_id === requestId);
                 if (indexToRemove > -1) allHistoryVideos.splice(indexToRemove, 1);
             } else {
                 const err = await response.json(); throw new Error(err.error || response.statusText);
             }
         } catch (error) {
             console.error(`Error deleting video item ${requestId}:`, error);
             alert(`Error deleting video: ${error.message}`);
             elementToRemove.style.opacity = '1';
         }
     }

    function showVideoModal(index) {
        if (allHistoryVideos.length === 0 || index < 0 || index >= allHistoryVideos.length) return;
        currentHistoryVideoIndex = index;
        const videoObj = allHistoryVideos[currentHistoryVideoIndex];
        modalVideo.src = videoObj.url;
        modalPrompt.textContent = `Prompt: ${videoObj.prompt || 'N/A'}`;
        modalSeed.textContent = `Seed: ${videoObj.seed || 'N/A'}`;
        videoModal.classList.add('modal-open');
    }

     // --- Add Modal/Slider Listeners --- 
     if (videoThumbnailSizeSlider) {
         videoThumbnailSizeSlider.addEventListener('input', (event) => {
             setVideoHistoryItemSize(event.target.value);
         });
          const initialSetting = videoHistorySizeMap[videoThumbnailSizeSlider.value];
          if(initialSetting) currentVideoSizeClass = initialSetting.className;
          setVideoHistoryItemSize(videoThumbnailSizeSlider.value); 
     }
     if(videoModal) {
         videoModal.addEventListener('click', (event) => {
             if (event.target === videoModal) {
                  videoModal.classList.remove('modal-open');
                  modalVideo.pause(); // Pause video when closing modal via backdrop
             }
         });
     }
    if(modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
             videoModal.classList.remove('modal-open');
             modalVideo.pause(); // Pause video when closing via button
        });
    }
    if(modalReusePromptBtn) {
         modalReusePromptBtn.addEventListener('click', () => {
             if (allHistoryVideos.length > 0 && currentHistoryVideoIndex < allHistoryVideos.length) { // Add bounds check
                 promptInput.value = allHistoryVideos[currentHistoryVideoIndex]?.prompt || ''; // Use optional chaining
                 videoModal.classList.remove('modal-open');
                 modalVideo.pause();
             }
         });
    }
    
     // Add scroll listener for video history
     window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop; 
        const clientHeight = document.documentElement.clientHeight;
        const threshold = 300; 
        if (scrollHeight - scrollTop <= clientHeight + threshold) {
            if (!isLoadingVideoHistory && hasMoreVideoHistory) {
                const nextPage = currentVideoHistoryPage + 1;
                console.log(`Scroll Trigger: Load video history page ${nextPage}`);
                displayVideoHistory(currentVideoHistoryEndpoint, nextPage);
            }
        }
    });

    // --- Modify Initialization ---
    loadVideoModels();
    modelSelect.addEventListener('change', () => {
         updateInputVisibility();
         displayVideoHistory(modelSelect.value, 1); // Load history for new model
    });
    // Initial history load
    displayVideoHistory(null, 1); // Use null to let the function determine initial endpoint
}); 