<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useOutputSelectAll } from '../composables/useOutputSelectAll'
import { shallowRef } from 'vue'
const previewWrapper = shallowRef()
const { handleOutputKeydown } = useOutputSelectAll(previewWrapper)
import { marked } from 'marked'
import mermaid from 'mermaid'
import LineNumbersEditor from '../components/LineNumbersEditor.vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import Switch from '../components/Switch.vue'
import ResizableSplitPane from '../components/ResizableSplitPane.vue'
import TocTree from '../components/TocTree.vue'
import { useLocalStorage } from '../composables/useLocalStorage'

interface TocItem {
    text: string
    id: string
    level: number
    children?: TocItem[]
}

const markdownInput = useLocalStorage('markdown-tool-input', '')
const markdownOutput = ref('')
const syncScroll = ref(true)
const splitRatio = ref(50)
const previewContainer = ref<HTMLDivElement>()
const toc = ref<TocItem[]>([])
const showToc = ref(false)
const isHoveringPreview = ref(false)

const isScrolling = ref(false)
const collectedHeadings = ref<{ text: string, level: number, id: string }[]>([])

function generateId(text: string): string {
    return text.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'heading'
}

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
})

// Configure marked renderer
const renderer = new marked.Renderer()
const originalCode = renderer.code
const originalLink = renderer.link

renderer.code = function (this: any, item) {
    if (item.lang === 'mermaid') {
        return `<div class="mermaid">${item.text}</div>`
    }
    return originalCode.call(this, item)
}

renderer.heading = function (this: any, { text, depth, raw }: any) {
    // Use raw text for ID generation to avoid HTML tags in ID
    // Fallback to text if raw is missing (though it should be present)
    const content = raw || text
    const id = generateId(content)

    // Collect heading for TOC
    collectedHeadings.value.push({ text: content, level: depth, id })

    return `<h${depth} id="${id}">${text}</h${depth}>`
}

renderer.link = function (this: any, item) {
    const html = originalLink.call(this, item)
    // Don't add target="_blank" for internal anchor links
    if (item.href && item.href.startsWith('#')) {
        return html
    }
    return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
}

marked.use({ renderer })

watch(markdownInput, async (newVal) => {
    try {
        // Reset collected headings before render
        collectedHeadings.value = []

        markdownOutput.value = await marked(newVal)

        // Generate TOC tree from collected headings
        buildTocTree()

        await nextTick()
        await mermaid.run({
            nodes: document.querySelectorAll('.mermaid')
        })
    } catch (e) {
        console.error('Markdown/Mermaid rendering failed:', e)
    }
})

function clearMarkdown() {
    markdownInput.value = ''
    markdownOutput.value = ''
}

function handleInputScroll(e: Event) {
    if (!syncScroll.value || !previewContainer.value || isScrolling.value) return

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
    if (!syncScroll.value || isScrolling.value) return

    const preview = e.target as HTMLDivElement
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    const textarea = document.querySelector('textarea')
    if (textarea) {
        textarea.scrollTop = scrollPercentage * (textarea.scrollHeight - textarea.clientHeight)
    }
}

function buildTocTree() {
    const root: TocItem[] = []
    const stack: TocItem[] = []

    // Use collected headings which have consistent IDs with the rendered HTML
    collectedHeadings.value.forEach((h) => {
        const item: TocItem = {
            text: h.text, // This is raw text now
            id: h.id,
            level: h.level,
            children: []
        }

        while (stack.length > 0 && stack[stack.length - 1]!.level >= item.level) {
            stack.pop()
        }

        if (stack.length === 0) {
            root.push(item)
        } else {
            stack[stack.length - 1]!.children?.push(item)
        }

        stack.push(item)
    })

    toc.value = root
}

function scrollToHeading(id: string) {
    const element = document.getElementById(id)
    if (element && previewContainer.value) {
        // Lock scrolling to prevent sync-scroll from interfering
        isScrolling.value = true

        // Calculate element position relative to the container
        const containerRect = previewContainer.value.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const relativeTop = elementRect.top - containerRect.top + previewContainer.value.scrollTop

        // Scroll to the element position within the container
        previewContainer.value.scrollTo({
            top: relativeTop - 20, // 20px offset for better visibility
            behavior: 'smooth'
        })

        // Reset lock after animation
        setTimeout(() => {
            isScrolling.value = false
        }, 500)
    }
}

function scrollToTop() {
    if (previewContainer.value) {
        isScrolling.value = true
        previewContainer.value.scrollTo({ top: 0, behavior: 'smooth' })

        // Reset lock after animation
        setTimeout(() => {
            isScrolling.value = false
        }, 500)
    }
}
</script>

<template>
    <ToolWrapper title="Markdown 預覽器" icon="bi-markdown" description="即時預覽 Markdown 文件。您的所有輸入都只在瀏覽器中處理，絕不外洩。">
        <ResizableSplitPane v-model="splitRatio" :min-size="300">
            <template #first>
                <div class="input-section d-flex flex-column h-100 pe-2">
                    <div class="d-flex justify-content-between align-items-center"
                        style="height: 32px; min-height: 32px;margin-bottom: 0.5rem;">
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
                        style="height: 32px; min-height: 32px; margin-bottom: 0.5rem;">
                        <h6 class="section-title mb-0 d-flex align-items-center">
                            <i class="bi bi-eye me-2"></i>
                            預覽
                        </h6>
                        <div class="d-flex align-items-center gap-2">
                            <button v-show="isHoveringPreview"
                                class="btn btn-sm btn-outline-secondary d-flex align-items-center" @click="scrollToTop"
                                title="回到頂端">
                                <i class="bi bi-arrow-up"></i>
                            </button>

                            <button class="btn btn-sm d-flex align-items-center"
                                :class="showToc ? 'btn-primary' : 'btn-outline-secondary'" @click="showToc = !showToc"
                                title="目錄">
                                <i class="bi bi-list-ul"></i>
                            </button>

                            <div class="d-flex align-items-center border-start ps-2">
                                <span class="ms-2 align-middle me-1"
                                    style="font-size: 0.85rem; color: var(--theme-text-muted);">
                                    <i class="bi bi-arrow-left-right me-1"></i>
                                    同步滾動
                                </span>
                                <Switch v-model="syncScroll" />
                            </div>
                        </div>
                    </div>
                    <div class="modern-output-wrapper overflow-hidden flex-grow-1 min-h-0 position-relative d-flex"
                        style="box-shadow: var(--shadow-sm)" @mouseenter="isHoveringPreview = true"
                        @mouseleave="isHoveringPreview = false">
                        <div class="modern-output markdown-preview p-3 h-100 overflow-y-auto flex-grow-1" tabindex="0"
                            :ref="previewWrapper" @keydown="handleOutputKeydown" v-html="markdownOutput"
                            @scroll="handlePreviewScroll"></div>

                        <!-- TOC Sidebar -->
                        <div v-if="showToc" class="toc-sidebar border-start"
                            style="width: 250px; min-width: 250px; background: var(--theme-bg-input);">
                            <div class="p-2 border-bottom font-weight-bold text-muted small">
                                <i class="bi bi-list-nested me-1"></i> 目錄
                            </div>
                            <div class="overflow-y-auto h-100 p-2 pb-5">
                                <TocTree :items="toc" @click-item="scrollToHeading" />
                            </div>
                        </div>

                        <!-- Floating Back to Top -->
                        <button v-show="isHoveringPreview" class="btn-floating-top" @click="scrollToTop">
                            <i class="bi bi-arrow-up"></i>
                        </button>
                    </div>
                </div>
            </template>
        </ResizableSplitPane>
    </ToolWrapper>
</template>

<style scoped>
.toc-sidebar {
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
}

.btn-floating-top {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--theme-accent);
    color: white;
    border: none;
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;
}

.btn-floating-top:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background: var(--theme-accent-secondary);
}
</style>
