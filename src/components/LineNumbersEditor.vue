<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(defineProps<{
    modelValue: string
    placeholder?: string
    showLineNumbers?: boolean
}>(), {
    showLineNumbers: true
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'input', value: string): void
    (e: 'scroll', event: Event): void
}>()

const textarea = ref<HTMLTextAreaElement>()
const lineNumbers = ref<HTMLDivElement>()
const lineNumbersText = ref('1')

function updateLineNumbers() {
    const lines = props.modelValue.split('\n')
    lineNumbersText.value = lines.map((_, i) => i + 1).join('\n')
}

function syncScroll() {
    if (textarea.value && lineNumbers.value) {
        lineNumbers.value.scrollTop = textarea.value.scrollTop
    }
}

function handleScroll(e: Event) {
    syncScroll()
    emit('scroll', e)
}

function handleInput(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value
    emit('update:modelValue', value)
    emit('input', value)
    updateLineNumbers()
}

watch(() => props.modelValue, () => {
    updateLineNumbers()
})

onMounted(() => {
    updateLineNumbers()
})
</script>

<template>
    <div class="line-number-editor-wrapper d-flex h-100">
        <div v-if="showLineNumbers" ref="lineNumbers" class="line-numbers-column">{{ lineNumbersText }}</div>
        <textarea ref="textarea" :value="modelValue" @input="handleInput" @scroll="handleScroll"
            class="form-control json-textarea p-3" :placeholder="placeholder" spellcheck="false"></textarea>
    </div>
</template>

<style scoped>
.line-number-editor-wrapper {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--theme-border);
    background: var(--theme-bg-card);
    height: 100%;
}

.line-numbers-column {
    background: var(--theme-bg-solid);
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    text-align: right;
    user-select: none;
    border-right: 1px solid var(--theme-border);
    width: 40px;
    min-width: min-content;
    overflow: hidden;
    white-space: pre;
    height: 100%;
    min-height: 0;
    padding-right: 12px;
    padding-left: 8px;
}

.line-number-editor-wrapper textarea {
    flex: 1;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    border: none;
    outline: none;
    resize: none;
    background: var(--theme-bg-card);
    color: var(--theme-text);
    transition: all 0.15s ease-in-out;
}


.line-number-editor-wrapper textarea::placeholder {
    color: #b0b8c9;
    opacity: 1;
}

.line-number-editor-wrapper textarea:focus {
    outline: none;
}
</style>
