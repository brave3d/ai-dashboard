document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const historyContainer = document.getElementById('history-container');
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const modalDetails = document.getElementById('modal-details');
    const closeModal = document.getElementsByClassName('close')[0];

    let currentImageIndex = 0;
    let historyItems = [];
    let isLoading = false; // To prevent multiple fetches
    let currentPage = 1;
    const pageSize = 20; // Default page size
    let totalPages = 0;

    const fetchHistory = async () => {
        if (isLoading) return;
        isLoading = true;

        const selectedModel = modelSelect.value || 'fal-ai/flux/dev'; // Default model value
        const url = `/api/history?model=${selectedModel}&page=${currentPage}&size=${pageSize}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            displayHistory(data.items);
            totalPages = data.pages;
            currentPage++;
            historyItems = [...historyItems, ...data.items]; // Append fetched items
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            isLoading = false;
        }
    };

    const displayHistory = (items) => {
        if (!items) return; // Check if items is undefined
        items.forEach((item, index) => {
            if (!item.json_output || !item.json_output.images || !item.json_output.images[0]) {
                console.error('Invalid item:', item);
                return; // Skip invalid items
            }
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.setAttribute('data-index', historyItems.length + index); // Set global index
            historyItem.innerHTML = `
                <img src="${item.json_output.images[0].url}" alt="Generated" style="border: none; width: 200px; height: auto;">
            `;
            historyItem.addEventListener('click', (event) => openModal(event, item));
            historyContainer.appendChild(historyItem);
        });
    };

    const openModal = (event, item) => {
        const historyItem = event.currentTarget;
        const clickedIndex = parseInt(historyItem.getAttribute('data-index'), 10);
        currentImageIndex = clickedIndex;
        console.log(`Modal opened. Clicked image index: ${clickedIndex}, Current image index: ${currentImageIndex}`);
        modal.style.display = 'block';
        updateModalContent(item);
    };

    const updateModalContent = (item) => {
        if (!item || !item.json_output || !item.json_output.images || !item.json_output.images[0]) return; // Check if item is valid
        modalImage.src = item.json_output.images[0].url;
        modalDetails.innerHTML = `
            <p style="display:none"><strong>Request ID:</strong> ${item.request_id}</p>
            <p><strong>Prompt:</strong> ${item.json_input.prompt}</p>
            <p><strong>Started At:</strong> ${item.started_at}</p>
            <p><strong>Duration:</strong> ${item.duration}</p>
        `;
    };

    const closeModalHandler = () => {
        modal.style.display = 'none';
    };

    const navigateModal = (direction) => {
        if (direction === 'left') {
            currentImageIndex = Math.max(currentImageIndex - 1, 0);
        } else if (direction === 'right') {
            currentImageIndex = Math.min(currentImageIndex + 1, historyItems.length - 1);
        }
        console.log(`Navigating ${direction}, currentImageIndex: ${currentImageIndex}`);
        if (currentImageIndex >= 0 && currentImageIndex < historyItems.length) {
            updateModalContent(historyItems[currentImageIndex]);
        }
    };

    document.addEventListener('keydown', (event) => {
        if (modal.style.display === 'block') {
            if (event.key === 'ArrowLeft') {
                navigateModal('left');
            } else if (event.key === 'ArrowRight') {
                navigateModal('right');
            } else if (event.key === 'Escape') {
                closeModalHandler();
            }
        }
    });

    const loadModels = async () => {
        try {
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = 'fal-ai/flux/dev';
            defaultOption.textContent = 'fal-ai/flux/dev';
            modelSelect.appendChild(defaultOption);

            const response = await fetch('models.json');
            const models = await response.json();
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.model_path;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
            modelSelect.value = 'fal-ai/flux/dev'; // Set default model value
            fetchHistory(); // Fetch history after loading models
        } catch (error) {
            console.error('Error loading models:', error);
        }
    };

    // Load models into the select element
    loadModels();

    modelSelect.addEventListener('change', () => {
        currentPage = 1;
        historyContainer.innerHTML = ''; // Clear previous history
        historyItems = []; // Clear previous items
        currentImageIndex = 0; // Reset current image index
        fetchHistory();
    });

    closeModal.addEventListener('click', closeModalHandler);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModalHandler();
        }
    });

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            fetchHistory();
        }
    });
});