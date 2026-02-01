<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import hljs from 'highlight.js'

const props = withDefaults(defineProps<{
    modelValue: string
    placeholder?: string
    showLineNumbers?: boolean
    language?: string
    enableHighlight?: boolean
}>(), {
    showLineNumbers: true,
    language: 'plaintext',
    enableHighlight: false
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'input', value: string): void
    (e: 'scroll', event: Event): void
}>()

const textarea = ref<HTMLTextAreaElement>()
const lineNumbers = ref<HTMLDivElement>()
const highlightedCode = ref<HTMLPreElement>()
const scrollContainer = ref<HTMLDivElement>()
const lineNumbersText = ref('1')

function updateLineNumbers() {
    const lines = props.modelValue.split('\n')
    lineNumbersText.value = lines.map((_, i) => i + 1).join('\n')
}

// 統一由外層容器處理滾動事件
function handleScroll(e: Event) {
    emit('scroll', e)
}

function handleInput(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value
    emit('update:modelValue', value)
    emit('input', value)
    updateLineNumbers()
}

// 語法高亮的 HTML
const highlightedHtml = computed(() => {
    if (!props.enableHighlight || !props.modelValue || props.language === 'plaintext') {
        return escapeHtml(props.modelValue)
    }

    try {
        if (props.language === 'auto') {
            const result = hljs.highlightAuto(props.modelValue)
            return result.value
        }
        return hljs.highlight(props.modelValue, { language: props.language }).value
    } catch {
        return escapeHtml(props.modelValue)
    }
})

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

watch(() => props.modelValue, () => {
    updateLineNumbers()
})

onMounted(() => {
    updateLineNumbers()
})
</script>

<template>
    <!-- 統一的滾動容器 -->
    <div ref="scrollContainer" class="editor-scroll-container" @scroll="handleScroll">
        <!-- 內部佈局層：確保寬度能隨內容撐開 -->
        <div class="editor-inner-layout">
            <!-- 行號欄：使用 Sticky 固定在左側 -->
            <div v-if="showLineNumbers" ref="lineNumbers" class="line-numbers-column">
                {{ lineNumbersText }}
            </div>

            <!-- 內容疊加層 -->
            <div class="editor-content-wrapper">
                <!-- 語法高亮層（背景層/尺寸支撐層） -->
                <pre ref="highlightedCode" class="highlighted-code-layer" aria-hidden="true"
                    v-html="highlightedHtml"></pre>

                <!-- 可編輯的 textarea（前景層） -->
                <textarea ref="textarea" :value="modelValue" @input="handleInput" class="code-textarea"
                    :class="{ 'with-highlight': enableHighlight }" :placeholder="placeholder" spellcheck="false"
                    autocomplete="off" autocorrect="off" autocapitalize="off" wrap="off"></textarea>
            </div>
        </div>
    </div>
</template>

<style scoped>
.editor-scroll-container {
    height: 100%;
    width: 100%;
    overflow: auto;
    /* 統一負責 X 和 Y 軸滾動 */
    position: relative;
    background: var(--theme-bg-card);
    border: 1px solid var(--theme-border);
}

.editor-inner-layout {
    display: flex;
    min-width: 100%;
    width: max-content;
    /* 關鍵：隨內容撐開寬度，觸發水平滾動 */
    min-height: 100%;
}

.line-numbers-column {
    position: sticky;
    /* 關鍵：固定在左側 */
    left: 0;
    z-index: 10;
    top: 0;

    background: var(--theme-bg-solid);
    color: #94a3b8;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    text-align: right;
    user-select: none;
    border-right: 1px solid var(--theme-border);
    width: 50px;
    flex-shrink: 0;
    overflow: hidden;
    white-space: pre;
    padding: 2px 8px;
    padding-right: 8px;
    height: 100%;
    /* 隨父容器高度 */
}

.editor-content-wrapper {
    flex: 1;
    /* 佔據剩餘空間 */
    display: grid;
    grid-template-areas: "content";
    /* 不需要 min-width，由父級控制 */
}

.highlighted-code-layer {
    grid-area: content;
    position: relative;
    margin: 0;
    padding: 2px 8px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    letter-spacing: normal;
    font-variant-ligatures: none;
    white-space: pre;
    tab-size: 4;
    pointer-events: none;
    color: var(--theme-text);
    word-wrap: normal;
    word-break: normal;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
}

.code-textarea {
    grid-area: content;
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 2px 8px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    letter-spacing: normal;
    font-variant-ligatures: none;
    white-space: pre;
    tab-size: 4;
    word-wrap: normal;
    word-break: normal;
    border: none;
    outline: none;
    resize: none;
    background: var(--theme-bg-card);
    color: var(--theme-text);
    overflow: hidden;
}

/* 當啟用語法高亮時，讓 textarea 背景透明 */
.code-textarea.with-highlight {
    background: transparent;
    color: transparent;
    caret-color: var(--theme-text);
    -webkit-text-fill-color: transparent;
}

.code-textarea::placeholder {
    color: #b0b8c9;
    opacity: 1;
    -webkit-text-fill-color: #b0b8c9;
}

.code-textarea:focus {
    outline: none;
}
</style>
