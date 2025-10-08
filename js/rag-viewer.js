document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const fileInput = document.getElementById('rag-file-input');
    const textInput = document.getElementById('rag-text-input');
    const loadTextBtn = document.getElementById('btn-load-rag-text');
    const searchInput = document.getElementById('rag-search-input');
    const chunkList = document.getElementById('rag-chunk-list');
    const pageContentEl = document.getElementById('rag-page-content');
    const metadataEl = document.getElementById('rag-metadata');

    // --- State ---
    let allChunks = [];
    let activeChunkIndex = -1;

    // --- Functions ---

    /**
     * Main function to process and display chunks
     * @param {string} jsonString The raw JSON string data
     */
    function loadData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data)) {
                alert('Error: JSON data must be an array.');
                return;
            }
            allChunks = data.map((chunk, index) => ({ ...chunk, originalIndex: index }));
            renderChunkList(allChunks);
            if (allChunks.length > 0) {
                displayChunkDetails(0);
            }
        } catch (e) {
            alert(`Invalid JSON: ${e.message}`);
            allChunks = [];
            renderChunkList([]);
            clearDetails();
        }
    }

    /**
     * Renders the list of chunks on the left panel
     * @param {Array} chunksToRender The array of chunks to display
     */
    function renderChunkList(chunksToRender) {
        chunkList.innerHTML = '';
        if (chunksToRender.length === 0) {
            chunkList.innerHTML = '<div class="list-group-item">No chunks found.</div>';
            return;
        }

        chunksToRender.forEach((chunk, displayIndex) => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            item.dataset.originalIndex = chunk.originalIndex;

            const source = chunk.metadata?.source || 'N/A';
            const contentPreview = chunk.pageContent ? chunk.pageContent.substring(0, 70) + '...' : 'No content';
            
            item.innerHTML = `<strong>Source: ${source}</strong><br><small class="text-muted">${contentPreview}</small>`;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                displayChunkDetails(chunk.originalIndex);
            });
            chunkList.appendChild(item);
        });
    }

    /**
     * Displays the content and metadata of a selected chunk
     * @param {number} originalIndex The original index of the chunk in the allChunks array
     */
    function displayChunkDetails(originalIndex) {
        const chunk = allChunks.find(c => c.originalIndex === originalIndex);
        if (!chunk) return;

        activeChunkIndex = originalIndex;

        // Update content
        pageContentEl.textContent = chunk.pageContent || '';
        metadataEl.textContent = JSON.stringify(chunk.metadata || {}, null, 2);

        // Update active state in the list
        Array.from(chunkList.children).forEach(item => {
            if (parseInt(item.dataset.originalIndex) === originalIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function clearDetails() {
        pageContentEl.textContent = '';
        metadataEl.textContent = '';
    }

    // --- Event Listeners ---

    // Load from file
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            loadData(e.target.result);
        };
        reader.readAsText(file);
        fileInput.value = ''; // Reset for same-file uploads
    });

    // Load from text area
    loadTextBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            loadData(text);
        } else {
            alert('Text area is empty.');
        }
    });

    // Search/filter chunks
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredChunks = allChunks.filter(chunk => 
            chunk.pageContent && chunk.pageContent.toLowerCase().includes(searchTerm)
        );
        renderChunkList(filteredChunks);
    });
});