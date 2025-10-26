<script setup lang="ts">
import { ref } from 'vue'

interface Props {
    title: string
    icon: string
    description: string
}

withDefaults(defineProps<Props>(), {})

const isFullscreen = ref(false)

const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
}

const exitFullscreen = () => {
    if (isFullscreen.value) {
        isFullscreen.value = false
    }
}

// ESC 鍵退出全螢幕
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isFullscreen.value) {
        exitFullscreen()
    }
})

defineExpose({
    isFullscreen,
    toggleFullscreen,
    exitFullscreen
})
</script>

<template>
    <div :class="['modern-card', { 'fullscreen-mode': isFullscreen }]">
        <div class="modern-card-header px-4 py-3 position-relative">
            <div class="card-title-wrapper">
                <h5 class="card-title mb-0 d-flex align-items-center">
                    <i :class="['bi', icon, 'me-2', 'text-primary']"></i>
                    {{ title }}
                </h5>
                <p class="card-subtitle mb-0 mt-2">
                    {{ description }}
                </p>
            </div>
            <!-- 全螢幕按鈕 -->
            <button class="btn btn-outline-secondary btn-sm position-absolute" @click="toggleFullscreen" title="全螢幕模式"
                :class="{ 'fullscreen-active': isFullscreen }" style="top: 16px; right: 24px; z-index: 10">
                <i :class="['bi', isFullscreen ? 'bi-arrows-fullscreen-exit' : 'bi-arrows-fullscreen', 'me-1']"></i>
                {{ isFullscreen ? '退出全螢幕' : '全螢幕' }}
            </button>
        </div>
        <div class="modern-card-body p-2">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.card-title-wrapper h5 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--theme-text);
}

.card-subtitle {
    color: var(--theme-text-muted);
    font-size: 0.9rem;
}

.modern-card {
    transition: all 0.3s ease;
    animation: fadeInUp 0.4s ease-out;
}

.modern-card.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    z-index: 9999;
    margin: 0;
    padding: 0;
    max-width: 100%;
    box-shadow: none;
}

.modern-card.fullscreen-mode .modern-card-body {
    /* height: calc(100vh - 90px); */
    overflow-y: auto;
}

.modern-card-header {
    border-bottom: 1px solid var(--theme-border);
    background: transparent;
}

.modern-card-body {
    background: var(--theme-bg-card);
}

.fullscreen-active {
    background-color: var(--theme-accent) !important;
    color: white !important;
    border-color: var(--theme-accent) !important;
}

.fullscreen-active i {
    color: white;
}
</style>
