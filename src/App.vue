<script setup lang="ts">
import { ref } from 'vue'
import JsonTool from './pages/JsonTool.vue'
import MarkdownTool from './pages/MarkdownTool.vue'
import DocumentViewer from './pages/DocumentViewer.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

const activeTab = ref('json')
</script>
<template>
  <header class="modern-header p-2 mb-3 sticky-top">
    <div class="container-fluid">
      <div class="d-flex flex-wrap align-items-center justify-content-between">
        <a href="/" class="d-flex align-items-center mb-2 mb-lg-0 text-decoration-none brand-link">
          <div class="brand-icon me-3 d-flex align-items-center justify-content-center">
            <i class="bi bi-tools"></i>
          </div>
          <div>
            <h4 class="mb-0 brand-title">開發者工具箱</h4>
            <small class="brand-subtitle d-block">Developer Toolkit</small>
          </div>
        </a>

        <div class="d-flex align-items-center">
          <ul class="nav modern-nav-pills me-4 p-1" role="tablist">
            <li class="nav-item">
              <button
                :class="['nav-link', 'modern-nav-link', 'px-3', 'py-2', 'd-flex', 'align-items-center', { active: activeTab === 'json' }]"
                @click="activeTab = 'json'">
                <i class="bi bi-braces me-2"></i>
                <span>JSON 工具</span>
              </button>
            </li>
            <li class="nav-item">
              <button
                :class="['nav-link', 'modern-nav-link', 'px-3', 'py-2', 'd-flex', 'align-items-center', { active: activeTab === 'markdown' }]"
                @click="activeTab = 'markdown'">
                <i class="bi bi-markdown me-2"></i>
                <span>Markdown</span>
              </button>
            </li>
            <li class="nav-item">
              <button
                :class="['nav-link', 'modern-nav-link', 'px-3', 'py-2', 'd-flex', 'align-items-center', { active: activeTab === 'document' }]"
                @click="activeTab = 'document'">
                <i class="bi bi-file-text me-2"></i>
                <span>文檔檢視</span>
              </button>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-2">
            <ThemeSwitcher />
            <a href="https://github.com/chingleel17/document-viewer" title="GitHub Repository" target="_blank"
              rel="noopener" class="modern-icon-btn github-link d-flex align-items-center justify-content-center">
              <i class="bi bi-github"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="container-fluid flex-grow-1"
    style="max-width: 1600px; margin: 0 auto; padding-left: 0.5rem; padding-right: 0.5rem;">
    <JsonTool v-if="activeTab === 'json'" />
    <MarkdownTool v-if="activeTab === 'markdown'" />
    <DocumentViewer v-if="activeTab === 'document'" />
  </main>

  <footer class="container-fluid text-center p-1 mt-auto" style="backdrop-filter: blur(20px); margin-top: 2rem;">
    <small class="text-muted">Copyright © 2025 ching lee. All rights reserved.</small>
  </footer>
</template>

<style scoped>
.modern-header {
  background: var(--theme-bg-card);
  border-bottom: 1px solid var(--theme-border);
  box-shadow: var(--shadow-sm);
}
</style>
