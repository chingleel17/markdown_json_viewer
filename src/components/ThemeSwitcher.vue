<script setup lang="ts">
import { ref, onMounted } from 'vue'

const theme = ref(localStorage.getItem('theme') || 'light')

function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem('theme', theme.value)
}

onMounted(() => {
    document.documentElement.setAttribute('data-theme', theme.value)
})
</script>

<template>
    <button class="btn modern-icon-btn d-flex align-items-center justify-content-center" @click="toggleTheme"
        title="切換主題">
        <i :class="theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill'"></i>
    </button>
</template>
