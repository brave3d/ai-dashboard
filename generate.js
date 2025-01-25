document.addEventListener('DOMContentLoaded', () => {
  const modelSelect = document.getElementById('model-select');
  const fetchHistoryButton = document.getElementById('fetch-history');
  const historyContainer = document.getElementById('history-container');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const modal = document.getElementById('modal');
  const modalImage = document.getElementById('modal-image');
  const closeModal = document.getElementsByClassName('close')[0];

  let currentPage = 1;
  let totalPages = 1;

  const fetchHistory = async () => {
      const selectedModel = modelSelect.value;
      const url = `/api/history?model=${selectedModel}&page=${currentPage}`;

      try {
          const response = await fetch(url);
          const data = await response.json();
          displayHistory(data.items);
          totalPages = data.pages;
          updatePaginationButtons();
      } catch (error) {
          console.error('Error fetching history:', error);
      }
  };

  const displayHistory = (items) => {
      historyContainer.innerHTML = '';
      items.forEach(item => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          historyItem.innerHTML = `
              <p>Request ID: ${item.request_id}</p>
              <p>Started At: ${item.started_at}</p>
              <p>Ended At: ${item.ended_at}</p>
              <img src="${item.json_output.images[0].url}" alt="Generated">
          `;
          historyItem.addEventListener('click', () => openModal(item.json_output.images[0].url));
          historyContainer.appendChild(historyItem);
      });
  };

  const openModal = (imageUrl) => {
      modal.style.display = 'block';
      modalImage.src = imageUrl;
  };

  const closeModalHandler = () => {
      modal.style.display = 'none';
  };

  const updatePaginationButtons = () => {
      prevPageButton.disabled = currentPage <= 1;
      nextPageButton.disabled = currentPage >= totalPages;
  };

  fetchHistoryButton.addEventListener('click', fetchHistory);
  prevPageButton.addEventListener('click', () => {
      if (currentPage > 1) {
          currentPage--;
          fetchHistory();
      }
  });
  nextPageButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
          currentPage++;
          fetchHistory();
      }
  });
  closeModal.addEventListener('click', closeModalHandler);
  window.addEventListener('click', (event) => {
      if (event.target === modal) {
          closeModalHandler();
      }
  });
});