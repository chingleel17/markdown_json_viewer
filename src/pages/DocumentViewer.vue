<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import { useLocalStorage } from '../composables/useLocalStorage'

interface DocumentChunk {
    pageContent: string
    metadata: Record<string, any>
}

const allChunks = useLocalStorage<DocumentChunk[]>('document-viewer-chunks', [])
const searchQuery = ref('')
const selectedChunk = ref<DocumentChunk | null>(null)

const filteredChunks = computed(() => {
    if (!searchQuery.value) return allChunks.value
    return allChunks.value.filter(chunk =>
        chunk.pageContent.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
        const text = await file.text()
        const chunks = JSON.parse(text)
        loadChunks(chunks)
    } catch (err: any) {
        alert(`載入失敗: ${err.message}`)
    }
}

function loadFromText(text: string) {
    try {
        const data = JSON.parse(text)
        loadChunks(data)
    } catch (err: any) {
        alert(`載入失敗: ${err.message}`)
    }
}

function loadChunks(chunks: any) {
    if (!Array.isArray(chunks)) {
        alert('資料格式錯誤，必須為陣列')
        return
    }
    allChunks.value = chunks
    selectedChunk.value = null
}

function selectChunk(chunk: DocumentChunk) {
    selectedChunk.value = chunk
}

const ragTextInput = useLocalStorage('document-viewer-input', '')
</script>

<template>
    <ToolWrapper title="Document 檢視器" icon="bi-file-text"
        description="檢視和搜尋 Document (Retrieval-Augmented Generation) 的資料集。所有資料均在本地載入和處理，保障您的隱私。">
        <div class="row g-4">
            <!-- Data Input Section -->
            <div class="col-12 mb-3">
                <div class="border" style="background: var(--theme-bg-card)">
                    <div class="p-4">
                        <h6 class="section-title mb-3 d-flex align-items-center">
                            <i class="bi bi-upload me-2 "></i>
                            載入 Document 資料
                        </h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="rag-file-input" class="form-label">從 .json 檔案載入</label>
                                <input class="form-control" type="file" id="rag-file-input" accept=".json"
                                    @change="handleFileUpload" />
                            </div>
                            <div class="col-md-6">
                                <label for="rag-text-input" class="form-label">或在此處貼上 JSON 陣列</label>
                                <div class="modern-input-wrapper rounded overflow-hidden"
                                    style="box-shadow: var(--shadow-sm)">
                                    <textarea v-model="ragTextInput" class="form-control modern-textarea"
                                        id="rag-text-input" style="height: 120px"
                                        placeholder="貼上 JSON 陣列..."></textarea>
                                </div>
                                <button class="btn btn-primary mt-2" @click="loadFromText(ragTextInput)">
                                    <i class="bi bi-download me-1"></i>
                                    載入貼上的文字
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Viewer Columns -->
            <div class="col-md-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="section-title mb-0 d-flex align-items-center">
                        <i class="bi bi-list-ul me-2"></i>
                        區塊列表
                    </h6>
                </div>
                <div class="mb-3">
                    <input type="search" v-model="searchQuery" class="form-control"
                        placeholder="在 pageContent 中搜尋..." />
                </div>
                <div class="modern-output-wrapper rounded overflow-hidden" style="box-shadow: var(--shadow-sm)">
                    <div class="list-group modern-list" style="height: 50vh; overflow-y: auto">
                        <button v-for="(chunk, index) in filteredChunks" :key="index"
                            class="list-group-item list-group-item-action" @click="selectChunk(chunk)">
                            區塊 {{ index + 1 }}: {{ chunk.pageContent.substring(0, 50) }}...
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="section-title mb-0 d-flex align-items-center">
                        <i class="bi bi-file-text me-2"></i>
                        頁面內容
                    </h6>
                </div>
                <div class="modern-output-wrapper rounded overflow-hidden" style="box-shadow: var(--shadow-sm)">
                    <pre class="modern-output p-3 m-0"
                        style="height: 50vh; overflow-y: auto">{{ selectedChunk?.pageContent || '' }}</pre>
                </div>
            </div>
            <div class="col-md-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="section-title mb-0 d-flex align-items-center">
                        <i class="bi bi-info-circle me-2"></i>
                        元數據
                    </h6>
                </div>
                <div class="modern-output-wrapper rounded overflow-hidden" style="box-shadow: var(--shadow-sm)">
                    <pre class="modern-output p-3 m-0"
                        style="height: 50vh; overflow-y: auto">{{ selectedChunk ? JSON.stringify(selectedChunk.metadata, null, 2) : '' }}</pre>
                </div>
            </div>
        </div>
    </ToolWrapper>
</template>
