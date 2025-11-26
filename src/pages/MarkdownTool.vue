<script setup lang="ts">
import { ref, watch } from 'vue'
import { marked } from 'marked'
import LineNumbersEditor from '../components/LineNumbersEditor.vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import Switch from '../components/Switch.vue'
import ResizableSplitPane from '../components/ResizableSplitPane.vue'

const markdownInput = ref('')
const markdownOutput = ref('')
const syncScroll = ref(true)
const splitRatio = ref(50)
const previewContainer = ref<HTMLDivElement>()

watch(markdownInput, async (newVal) => {
    markdownOutput.value = await marked(newVal)
})

function clearMarkdown() {
    markdownInput.value = ''
    markdownOutput.value = ''
}

function handleInputScroll(e: Event) {
    if (!syncScroll.value || !previewContainer.value) return

    const textarea = e.target as HTMLTextAreaElement
    const scrollRange = textarea.scrollHeight - textarea.clientHeight
    if (scrollRange === 0) {
        previewContainer.value.scrollTop = 0
    } else {
        const scrollPercentage = textarea.scrollTop / scrollRange
        previewContainer.value.scrollTop = scrollPercentage * (previewContainer.value.scrollHeight - previewContainer.value.clientHeight)
    }
}

function handlePreviewScroll(e: Event) {
    if (!syncScroll.value) return

    const preview = e.target as HTMLDivElement
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    const textarea = document.querySelector('textarea')
    if (textarea) {
        textarea.scrollTop = scrollPercentage * (textarea.scrollHeight - textarea.clientHeight)
    }
}
</script>

<template>
    <ToolWrapper title="Markdown 預覽器" icon="bi-markdown" description="即時預覽 Markdown 文件。您的所有輸入都只在瀏覽器中處理，絕不外洩。">
        <ResizableSplitPane v-model="splitRatio" :min-size="300">
            <template #first>
                <div class="input-section d-flex flex-column h-100 pe-2">
                    <div class="d-flex justify-content-between align-items-center"
                        style="height: 32px; margin-bottom: 0.5rem;">
                        <h6 class="section-title mb-0 d-flex align-items-center">
                            <i class="bi bi-pencil-square me-2"></i>
                            輸入 Markdown
                        </h6>
                        <button class="btn btn-sm btn-outline-danger" @click="clearMarkdown">
                            <i class="bi bi-x-lg me-1"></i> 清除
                        </button>
                    </div>
                    <div class="flex-grow-1 min-h-0">
                        <LineNumbersEditor v-model="markdownInput" placeholder="在這裡輸入 Markdown..."
                            @scroll="handleInputScroll" />
                    </div>
                </div>
            </template>
            <template #second>
                <div class="output-section d-flex flex-column h-100 ps-2">
                    <div class="d-flex justify-content-between align-items-center"
                        style="height: 32px; margin-bottom: 0.5rem;">
                        <h6 class="section-title mb-0 d-flex align-items-center">
                            <i class="bi bi-eye me-2"></i>
                            預覽
                        </h6>
                        <div class="d-flex align-items-center">
                            <span class="ms-2 align-middle me-1">
                                <i class="bi bi-arrow-left-right me-1" style="font-size: 0.9rem;"></i>
                                同步滾動
                            </span>
                            <Switch v-model="syncScroll" />
                        </div>
                    </div>
                    <div class="modern-output-wrapper rounded overflow-hidden flex-grow-1 min-h-0"
                        style="box-shadow: var(--shadow-sm)">
                        <div ref="previewContainer" class="modern-output markdown-preview p-3 h-100 overflow-y-auto"
                            v-html="markdownOutput" @scroll="handlePreviewScroll"></div>
                    </div>
                </div>
            </template>
        </ResizableSplitPane>
    </ToolWrapper>
</template>
