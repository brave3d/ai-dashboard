document.addEventListener('DOMContentLoaded', async function() {
    const numStepsSlider = document.getElementById('numStepsSlider');
    const numStepsInput = document.getElementById('numStepsInput');
  
    // Update number input when slider changes
    numStepsSlider.addEventListener('input', function() {
      numStepsInput.value = this.value;
    });
  
    // Update slider when number input changes
    numStepsInput.addEventListener('change', function() {
      numStepsSlider.value = this.value;
    });
  
    // Ensure the number input stays within the slider's range
    numStepsInput.addEventListener('input', function() {
      let value = parseInt(this.value);
      if (value < 1) this.value = 1;
      if (value > 50) this.value = 50;
    });

    const guidanceScaleSlider = document.getElementById('guidanceScaleSlider');
    const guidanceScaleInput = document.getElementById('guidanceScaleInput');

    // Update number input when slider changes
    guidanceScaleSlider.addEventListener('input', function() {
        guidanceScaleInput.value = this.value;
    });

    // Update slider when number input changes
    guidanceScaleInput.addEventListener('change', function() {
        guidanceScaleSlider.value = this.value;
    });

    // Ensure the number input stays within the slider's range
    guidanceScaleInput.addEventListener('input', function() {
        let value = parseFloat(this.value);
        if (value < 1) this.value = 1;
        if (value > 10) this.value = 10;
    });

    const form = document.getElementById('generationForm');
    const logsContainer = document.getElementById('logs');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let totalImages = 0;
    let imagesGenerated = 0;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const queryString = new URLSearchParams(formData).toString();
        totalImages = parseInt(formData.get('numImages'), 10) || 1; // Get the total number of images to be generated
        imagesGenerated = 0;

        // Clear previous logs and images
        logsContainer.innerHTML = '';
        imagePlaceholder.innerHTML = '';

        const eventSource = new EventSource(`https://test-flux-9xg34uukm-brave-mans-projects.vercel.app/generate-stream?${queryString}`);

        
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
                appendLog(data.message);
            } else if (data.type === 'result') {
                imagesGenerated++;
                displayImages(data.data.images);
                handleFinalStream(data.data); // Call handleFinalStream with the final data
                if (imagesGenerated === totalImages) {
                    eventSource.close();
                }
            } else if (data.type === 'error') {
                appendLog(`Error: ${data.message}`);
                eventSource.close();
            }
        };

        eventSource.onerror = function(error) {
            console.error('EventSource failed:', error);
            appendLog('Connection error. Please try again.');
            eventSource.close();
        };
    });

    function appendLog(message) {
        const progressMatch = message.match(/(\d+)%/);
        if (progressMatch) {
            const progress = parseInt(progressMatch[1], 10);
            const overallProgress = Math.min((imagesGenerated - 1) / totalImages * 100 + progress / totalImages, 100);
        }
    }

    function handleFinalStream(data) {
        const logsContainer = document.getElementById('logs');
        const logEntry = document.createElement('div');

        // Format timings to readable time
        const inferenceTime = data.timings.inference.toFixed(2) + ' seconds';

        logEntry.textContent = `Prompt: ${data.prompt}, Seed: ${data.seed}, NSFW Concepts: ${data.has_nsfw_concepts}, Timings: Inference - ${inferenceTime}`;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        // Save to IndexedDB
        const images = data.images.map(image => image.url);
        saveToHistory({
            prompt: data.prompt,
            seed: data.seed,
            has_nsfw_concepts: data.has_nsfw_concepts,
            timings: JSON.stringify(data.timings),
            images: images
        });
    }

    function displayImages(imageArray) {
        imagePlaceholder.innerHTML = ''; // Clear previous images
        imageArray.forEach((image, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';

            const img = document.createElement('img');
            img.src = image.url;
            img.alt = `Generated Image ${index + 1}`;
            img.style.display = 'block';

            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download';
            downloadBtn.className = 'download-btn';
            downloadBtn.addEventListener('click', () => downloadImage(image.url, `generated-image-${index + 1}.png`));

            imgContainer.appendChild(img);
            imgContainer.appendChild(downloadBtn);
            imagePlaceholder.appendChild(imgContainer);
        });

        // Hide navigation buttons as all images are displayed at once
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }

    function downloadImage(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => console.error('Error downloading image:', error));
    }

    // Initialize IndexedDB
    const db = await idb.openDB('historyDB', 1, {
        upgrade(db) {
            db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        }
    });

    // Function to save data to IndexedDB
    async function saveToHistory(data) {
        await db.add('history', data);
        displayHistory();
    }

    // Function to display history from IndexedDB
    let allImages = [];
    let currentImageIndex = 0;

    async function displayHistory() {
        const historyContainer = document.getElementById('history');
        historyContainer.innerHTML = ''; // Clear previous history

        const allEntries = await db.getAll('history');
        allImages = []; // Reset the global list of images

        allEntries.reverse().forEach(entry => {
            entry.images.forEach((image, index) => {
                const historyEntry = document.createElement('div');
                historyEntry.className = 'history-entry';

                const img = document.createElement('img');
                img.src = image;
                img.alt = 'Generated Image';
                img.addEventListener('click', () => {
                    currentImageIndex = allImages.findIndex(imgObj => imgObj.url === image);
                    showImage(currentImageIndex);
                    document.getElementById('modalPrompt').textContent = `Prompt: ${entry.prompt}`;
                    document.getElementById('modalSeed').textContent = `Seed: ${entry.seed}`;
                    document.getElementById('modalNSFW').textContent = `NSFW Concepts: ${entry.has_nsfw_concepts}`;
                    document.getElementById('modalTimings').textContent = `Timings: ${entry.timings}`;
                    $('#imageModal').modal('show');
                });

                historyEntry.appendChild(img);
                historyContainer.appendChild(historyEntry);

                // Add image to the global list with its metadata
                allImages.push({ url: image, prompt: entry.prompt, seed: entry.seed, has_nsfw_concepts: entry.has_nsfw_concepts, timings: entry.timings });
            });
        });
    }

    function showImage(index) {
        if (allImages.length > 0) {
            currentImageIndex = (index + allImages.length) % allImages.length;
            const imageObj = allImages[currentImageIndex];
            document.getElementById('modalImage').src = imageObj.url;
            document.getElementById('modalPrompt').textContent = `Prompt: ${imageObj.prompt}`;
            document.getElementById('modalSeed').textContent = `Seed: ${imageObj.seed}`;
            document.getElementById('modalNSFW').textContent = `NSFW Concepts: ${imageObj.has_nsfw_concepts}`;
            document.getElementById('modalTimings').textContent = `Timings: ${imageObj.timings}`;
        }
    }

    function showPreviousImage() {
        showImage(currentImageIndex - 1);
    }

    function showNextImage() {
        showImage(currentImageIndex + 1);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (event.key === 'ArrowRight') {
            showNextImage();
        }
    });

    // Add event listeners for the new buttons
    document.getElementById('downloadBtn').addEventListener('click', () => {
        const imageObj = allImages[currentImageIndex];
        downloadImage(imageObj.url, `generated-image-${currentImageIndex + 1}.png`);
    });

    document.getElementById('reusePromptBtn').addEventListener('click', () => {
        const imageObj = allImages[currentImageIndex];
        document.getElementById('prompt').value = imageObj.prompt; // Update the textarea with ID 'prompt'
        $('#imageModal').modal('hide');
    });

    // Call displayHistory on page load to show existing history
    displayHistory();
});