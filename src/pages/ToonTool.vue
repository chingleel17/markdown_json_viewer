<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ResizableSplitPane from '../components/ResizableSplitPane.vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import { jsonToToon, toonToJson, type ConversionStats } from '../toon-converter'
import { useLocalStorage } from '../composables/useLocalStorage'

const inputText = useLocalStorage('toon-tool-input', '')
const outputText = ref('')
const conversionMode = useLocalStorage<'json-to-toon' | 'toon-to-json'>('toon-tool-mode', 'json-to-toon')
const error = ref('')
const stats = ref<ConversionStats | null>(null)

const inputPlaceholder = computed(() => {
    return conversionMode.value === 'json-to-toon'
        ? '請在此貼上 JSON...\n\n範例:\n{\n  "users": [\n    {\n      "id": 1,\n      "name": "Alice",\n      "email": "alice@example.com"\n    },\n    {\n      "id": 2,\n      "name": "Bob",\n      "email": "bob@example.com"\n    }\n  ]\n}'
        : '請在此貼上 TOON...\n\n範例:\nusers[2]:\n  id name email\n  1 Alice alice@example.com\n  2 Bob bob@example.com'
})

const inputLabel = computed(() => {
    return conversionMode.value === 'json-to-toon' ? 'JSON 輸入' : 'TOON 輸入'
})

const outputLabel = computed(() => {
    return conversionMode.value === 'json-to-toon' ? 'TOON 輸出' : 'JSON 輸出'
})

function convert() {
    error.value = ''
    stats.value = null

    if (!inputText.value.trim()) {
        outputText.value = ''
        return
    }

    try {
        if (conversionMode.value === 'json-to-toon') {
            const result = jsonToToon(inputText.value)
            outputText.value = result.toon
            stats.value = result.stats
        } else {
            const result = toonToJson(inputText.value)
            outputText.value = result.json
            stats.value = result.stats
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : '轉換失敗'
        outputText.value = ''
        stats.value = null
    }
}

function switchMode() {
    // Swap input and output when switching modes
    const temp = inputText.value
    inputText.value = outputText.value
    outputText.value = temp

    conversionMode.value = conversionMode.value === 'json-to-toon' ? 'toon-to-json' : 'json-to-toon'

    if (inputText.value.trim()) {
        convert()
    }
}

function clearAll() {
    inputText.value = ''
    outputText.value = ''
    error.value = ''
    stats.value = null
}

function copyOutput() {
    if (outputText.value) {
        navigator.clipboard.writeText(outputText.value)
    }
}

// Auto-convert on input
function handleInput() {
    convert()
}

// Watch for changes in input text (including initial load from localStorage)
watch(inputText, () => {
    convert()
})
</script>

<template>
    <ToolWrapper title="TOON ↔ JSON 轉換器" icon="bi-arrow-left-right"
        description="TOON (Token-Oriented Object Notation) - 專為 AI/LLM 設計的輕量級格式，能有效節省 Token 用量">
        <template #header>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" @click="switchMode"
                    title="切換轉換方向">
                    <i class="bi bi-arrow-repeat"></i>
                    <span>{{ conversionMode === 'json-to-toon' ? 'JSON → TOON' : 'TOON → JSON' }}</span>
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="clearAll" title="清除全部">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </template>

        <div class="d-flex flex-column h-100">
            <!-- Stats Display -->
            <div v-if="stats" class="border p-2 mb-2 flex-shrink-0">
                <div class="row g-2 text-center">
                    <div class="col-md-2">
                        <div class="stat-item">
                            <div class="stat-label">JSON Tokens</div>
                            <div class="stat-value text-primary">{{ stats.jsonTokens.toLocaleString() }}</div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="stat-item">
                            <div class="stat-label">TOON Tokens</div>
                            <div class="stat-value text-success">{{ stats.toonTokens.toLocaleString() }}</div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="stat-item">
                            <div class="stat-label">Token 節省</div>
                            <div class="stat-value" :class="stats.tokenSavings > 0 ? 'text-success' : 'text-warning'">
                                {{ stats.tokenSavings > 0 ? '-' : '+' }}{{ Math.abs(stats.tokenSavings) }}%
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="stat-item">
                            <div class="stat-label">JSON 大小</div>
                            <div class="stat-value text-primary">{{ stats.jsonSize }} B</div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="stat-item">
                            <div class="stat-label">TOON 大小</div>
                            <div class="stat-value text-success">{{ stats.toonSize }} B</div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="stat-item">
                            <div class="stat-label">大小節省</div>
                            <div class="stat-value" :class="stats.sizeSavings > 0 ? 'text-success' : 'text-warning'">
                                {{ stats.sizeSavings > 0 ? '-' : '+' }}{{ Math.abs(stats.sizeSavings) }}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 mb-3 flex-shrink-0"
                role="alert">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>{{ error }}</span>
            </div>

            <!-- Editor -->
            <div class="flex-grow-1" style="min-height: 0;">
                <ResizableSplitPane>
                    <template #first>
                        <div class="editor-panel h-100 d-flex flex-column">
                            <div class="editor-header d-flex align-items-center justify-content-between px-3 border-bottom"
                                style="height: 42px;">
                                <div class="d-flex align-items-center gap-2">
                                    <h6 class="section-title mb-0 d-flex align-items-center">
                                        <i class="bi bi-pencil-square me-2"></i>
                                        {{ inputLabel }}
                                    </h6>
                                </div>
                                <button v-if="inputText" class="btn btn-sm btn-outline-secondary"
                                    @click="inputText = ''" title="清除輸入">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <textarea v-model="inputText" @input="handleInput" :placeholder="inputPlaceholder"
                                class="json-textarea flex-grow-1 p-3" spellcheck="false"></textarea>
                        </div>
                    </template>

                    <template #second>
                        <div class="editor-panel h-100 d-flex flex-column">
                            <div class="editor-header d-flex align-items-center justify-content-between px-3 border-bottom"
                                style="height: 42px;">
                                <div class="d-flex align-items-center gap-2">
                                    <h6 class="section-title mb-0 d-flex align-items-center">
                                        <i class="bi bi-file-code me-2"></i>
                                        {{ outputLabel }}
                                    </h6>
                                </div>
                                <button v-if="outputText" class="btn btn-sm btn-outline-secondary" @click="copyOutput"
                                    title="複製到剪貼簿">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </div>
                            <textarea v-model="outputText"
                                :placeholder="conversionMode === 'json-to-toon' ? 'TOON 輸出將顯示於此...' : 'JSON 輸出將顯示於此...'"
                                class="json-textarea flex-grow-1 p-3" spellcheck="false" readonly></textarea>
                        </div>
                    </template>
                </ResizableSplitPane>
            </div>
        </div>
    </ToolWrapper>
</template>

<style scoped>
.editor-panel {
    background: var(--theme-bg-card);
    border: 1px solid var(--theme-border);
    border-radius: var(--border-radius-md);
    overflow: hidden;
}

.editor-header {
    background: var(--theme-bg-header);
    border-color: var(--theme-border);
    color: var(--theme-text);
    font-size: 0.9rem;
}

.json-textarea {
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.5;
    border: none;
    outline: none;
    resize: none;
    background: var(--theme-bg-input);
    color: var(--theme-text);
}

.json-textarea::placeholder {
    color: var(--theme-text-light);
    opacity: 0.6;
}

.stat-item {
    padding: 0.5rem;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--theme-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    font-family: var(--font-mono);
}
</style>
