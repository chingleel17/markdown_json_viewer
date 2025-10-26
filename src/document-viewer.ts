// Document Viewer Implementation

interface DocumentChunk {
    pageContent: string;
    metadata: Record<string, any>;
}

let allChunks: DocumentChunk[] = [];
let filteredChunks: DocumentChunk[] = [];

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('rag-file-input') as HTMLInputElement;
    const textInput = document.getElementById('rag-text-input') as HTMLTextAreaElement;
    const btnLoadText = document.getElementById('btn-load-rag-text') as HTMLButtonElement;
    const searchInput = document.getElementById('rag-search-input') as HTMLInputElement;
    const chunkList = document.getElementById('rag-chunk-list') as HTMLDivElement;
    const pageContent = document.getElementById('rag-page-content') as HTMLPreElement;
    const metadata = document.getElementById('rag-metadata') as HTMLPreElement;

    // Load from file
    fileInput?.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            loadChunks(data);
        } catch (err: any) {
            alert(`載入失敗: ${err.message}`);
        }
    });

    // Load from text
    btnLoadText?.addEventListener('click', () => {
        try {
            const data = JSON.parse(textInput.value);
            loadChunks(data);
        } catch (err: any) {
            alert(`載入失敗: ${err.message}`);
        }
    });

    // Search
    searchInput?.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        if (query) {
            filteredChunks = allChunks.filter(chunk =>
                chunk.pageContent.toLowerCase().includes(query)
            );
        } else {
            filteredChunks = allChunks;
        }
        renderChunkList();
    });

    function loadChunks(data: any) {
        if (!Array.isArray(data)) {
            alert('資料格式錯誤，必須為陣列');
            return;
        }
        allChunks = data;
        filteredChunks = data;
        renderChunkList();
    }

    function renderChunkList() {
        if (!chunkList) return;

        chunkList.innerHTML = '';
        filteredChunks.forEach((chunk, index) => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action';
            item.textContent = `區塊 ${index + 1}: ${chunk.pageContent.substring(0, 50)}...`;
            item.addEventListener('click', () => showChunk(chunk));
            chunkList.appendChild(item);
        });
    }

    function showChunk(chunk: DocumentChunk) {
        if (pageContent) pageContent.textContent = chunk.pageContent;
        if (metadata) metadata.textContent = JSON.stringify(chunk.metadata, null, 2);
    }
});

export { };
