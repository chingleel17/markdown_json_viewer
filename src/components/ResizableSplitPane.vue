<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
    modelValue?: number // split percentage (0-100)
    minSize?: number // min width in px
    direction?: 'horizontal' | 'vertical'
}>(), {
    modelValue: 50,
    minSize: 200, // Default min size
    direction: 'horizontal'
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
}>()

const container = ref<HTMLElement>()
const isDragging = ref(false)
const split = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
    split.value = val
})

function startDrag(e: MouseEvent | TouchEvent) {
    isDragging.value = true
    document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('touchmove', onDrag)
    window.addEventListener('touchend', stopDrag)
}

function onDrag(e: MouseEvent | TouchEvent) {
    if (!isDragging.value || !container.value) return

    const rect = container.value.getBoundingClientRect()
    let pos = 0
    let total = 0

    if (props.direction === 'horizontal') {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        pos = clientX - rect.left
        total = rect.width
    } else {
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        pos = clientY - rect.top
        total = rect.height
    }

    let newSplit = (pos / total) * 100

    // Constraints
    const minPercent = (props.minSize / total) * 100

    if (newSplit < minPercent) newSplit = minPercent
    if (newSplit > 100 - minPercent) newSplit = 100 - minPercent

    split.value = newSplit
    emit('update:modelValue', newSplit)
}

function stopDrag() {
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
    window.removeEventListener('touchmove', onDrag)
    window.removeEventListener('touchend', stopDrag)
}
</script>

<template>
    <div ref="container" class="split-pane" :class="direction">
        <div class="pane pane-first" :style="{ flexBasis: `${split}%` }">
            <slot name="first"></slot>
        </div>
        <div class="resizer" @mousedown="startDrag" @touchstart.prevent="startDrag">
            <div class="resizer-line"></div>
            <div class="resizer-handle">
                <slot name="resizer-handle">
                    <i class="bi bi-grip-vertical"></i>
                </slot>
            </div>
        </div>
        <div class="pane pane-second" :style="{ flexBasis: `${100 - split}%` }">
            <slot name="second"></slot>
        </div>
    </div>
</template>

<style scoped>
.split-pane {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.split-pane.horizontal {
    flex-direction: row;
}

.split-pane.vertical {
    flex-direction: column;
}

.pane {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
    transition: flex-basis 0.05s ease-out; /* Smooth out tiny jitters, but keep it responsive */
}

.resizer {
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    user-select: none;
}

.split-pane.horizontal .resizer {
    width: 16px;
    cursor: col-resize;
    margin: 0 -8px; /* Negative margin to overlap */
}

.resizer-line {
    position: absolute;
    background: var(--theme-border);
    transition: all 0.2s ease;
}

.split-pane.horizontal .resizer-line {
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
}

.resizer:hover .resizer-line,
.resizer:active .resizer-line {
    background: var(--theme-accent);
    width: 2px;
    box-shadow: 0 0 4px var(--theme-accent);
}

.resizer-handle {
    background: var(--theme-bg-card);
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    color: var(--theme-text-muted);
    font-size: 12px;
    z-index: 101;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
    opacity: 0; /* Hidden by default */
}

.resizer:hover .resizer-handle,
.resizer:active .resizer-handle {
    opacity: 1;
    transform: scale(1.1);
    border-color: var(--theme-accent);
    color: var(--theme-accent);
}

.split-pane.horizontal .resizer-handle {
    width: 16px;
    height: 32px;
}

/* Mobile support */
@media (max-width: 768px) {
    .split-pane.horizontal {
        flex-direction: column;
    }

    .split-pane.horizontal .resizer {
        width: 100%;
        height: 16px;
        cursor: row-resize;
        margin: -8px 0;
    }

    .split-pane.horizontal .resizer-line {
        width: 100%;
        height: 1px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
    }

    .pane {
        flex-basis: auto !important;
        height: 50%; /* Fallback for mobile if we want equal split */
    }
}
</style>
