<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { diffLines, type Change } from 'diff'
import hljs from 'highlight.js'
import HighlightedEditor from '../components/HighlightedEditor.vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import ResizableSplitPane from '../components/ResizableSplitPane.vue'
import Switch from '../components/Switch.vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useSyncScroll } from '../composables/useSyncScroll'

type DiffStyle = 'vscode' | 'github'
type ViewMode = 'side-by-side' | 'unified'

interface DiffLine {
    lineNumber: number | null
    content: string
    type: 'added' | 'removed' | 'unchanged'
    index: number
}

const originalText = useLocalStorage('diff-viewer-original', '')
const modifiedText = useLocalStorage('diff-viewer-modified', '')
const diffStyle = ref<DiffStyle>('vscode')
const viewMode = ref<ViewMode>('side-by-side')
const language = ref('auto')
const splitRatio = ref(50)
const enableHighlight = ref(true)
const syncScrollDiff = ref(true) // 比對區左右同步
const syncScrollAll = ref(false) // 全部區域同步（編輯區+比對區）
const currentChangeIndex = ref(-1)

// Refs for scroll containers
const leftInputContainer = ref<HTMLDivElement>()
const rightInputContainer = ref<HTMLDivElement>()
const leftPanel = ref<HTMLDivElement>()
const rightPanel = ref<HTMLDivElement>()
const unifiedPanel = ref<HTMLDivElement>()

const { isScrolling } = useSyncScroll()

const languages = [
    { value: 'auto', label: '自動偵測' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'shell', label: 'Shell / Bash' },
    { value: 'ini', label: 'INI / Config' },
    { value: 'properties', label: 'Properties / .env' },
    { value: 'plaintext', label: 'Plain Text' }
]

function detectLanguage(text: string): string {
    if (!text.trim()) return 'plaintext'
    
    try {
        JSON.parse(text)
        return 'json'
    } catch {
        // Not JSON
    }
    
    if (/^[\s]*[\w-]+:\s*.+$/m.test(text) && !text.includes('{')) {
        return 'yaml'
    }
    
    if (/^[\w_]+=[^\s].*$/m.test(text)) {
        return 'properties'
    }
    
    if (/^#!\/bin\/(ba)?sh/m.test(text) || text.includes('#!/usr/bin/env')) {
        return 'shell'
    }
    
    if (/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}|ERROR|WARN|INFO|DEBUG/i.test(text)) {
        return 'plaintext'  // Log files - use plaintext as highlight.js doesn't have 'log' language
    }
    
    const result = hljs.highlightAuto(text, [
        'javascript', 'typescript', 'python', 'json', 'yaml', 'shell', 'ini'
    ])
    
    return result.language || 'plaintext'
}

function highlightCode(code: string, lang: string): string {
    if (!enableHighlight.value || !code) return escapeHtml(code)
    
    const detectedLang = lang === 'auto' ? detectLanguage(code) : lang
    
    try {
        if (detectedLang === 'plaintext') {
            return escapeHtml(code)
        }
        return hljs.highlight(code, { language: detectedLang }).value
    } catch {
        return escapeHtml(code)
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

const diffResult = computed(() => {
    if (!originalText.value && !modifiedText.value) return []
    return diffLines(originalText.value, modifiedText.value)
})

const sideBySideData = computed(() => {
    const left: DiffLine[] = []
    const right: DiffLine[] = []
    let leftLine = 1
    let rightLine = 1
    let index = 0

    diffResult.value.forEach((change: Change) => {
        const lines = change.value.split('\n')
        if (lines[lines.length - 1] === '') {
            lines.pop()
        }

        if (change.removed) {
            lines.forEach(line => {
                left.push({
                    lineNumber: leftLine++,
                    content: line,
                    type: 'removed',
                    index: index
                })
                right.push({
                    lineNumber: null,
                    content: '',
                    type: 'unchanged',
                    index: index
                })
            })
            index++
        } else if (change.added) {
            lines.forEach(line => {
                right.push({
                    lineNumber: rightLine++,
                    content: line,
                    type: 'added',
                    index: index
                })
                left.push({
                    lineNumber: null,
                    content: '',
                    type: 'unchanged',
                    index: index
                })
            })
            index++
        } else {
            lines.forEach(line => {
                left.push({
                    lineNumber: leftLine++,
                    content: line,
                    type: 'unchanged',
                    index: index
                })
                right.push({
                    lineNumber: rightLine++,
                    content: line,
                    type: 'unchanged',
                    index: index
                })
            })
        }
    })

    return { left, right }
})

const unifiedData = computed(() => {
    const lines: (DiffLine & { oldLine: number | null, newLine: number | null })[] = []
    let oldLine = 1
    let newLine = 1
    let index = 0

    diffResult.value.forEach((change: Change) => {
        const lineList = change.value.split('\n')
        if (lineList[lineList.length - 1] === '') {
            lineList.pop()
        }

        const changeIndex = index
        lineList.forEach(line => {
            if (change.removed) {
                lines.push({
                    oldLine: oldLine++,
                    newLine: null,
                    lineNumber: null,
                    content: line,
                    type: 'removed',
                    index: changeIndex
                })
            } else if (change.added) {
                lines.push({
                    oldLine: null,
                    newLine: newLine++,
                    lineNumber: null,
                    content: line,
                    type: 'added',
                    index: changeIndex
                })
            } else {
                lines.push({
                    oldLine: oldLine++,
                    newLine: newLine++,
                    lineNumber: null,
                    content: line,
                    type: 'unchanged',
                    index: changeIndex
                })
            }
        })

        if (change.added || change.removed) {
            index++
        }
    })

    return lines
})

// 修正：獲取變更塊的第一行位置
const changePositions = computed(() => {
    const positions: Array<{ index: number; lineIndex: number }> = []
    
    if (viewMode.value === 'side-by-side') {
        const seen = new Set<number>()
        sideBySideData.value.left.forEach((line, lineIdx) => {
            if (line.type !== 'unchanged' && !seen.has(line.index)) {
                seen.add(line.index)
                positions.push({ index: line.index, lineIndex: lineIdx })
            }
        })
    } else {
        const seen = new Set<number>()
        unifiedData.value.forEach((line, lineIdx) => {
            if (line.type !== 'unchanged' && !seen.has(line.index)) {
                seen.add(line.index)
                positions.push({ index: line.index, lineIndex: lineIdx })
            }
        })
    }
    
    return positions.sort((a, b) => a.lineIndex - b.lineIndex)
})

const totalChanges = computed(() => changePositions.value.length)

// 通用的同步滾動函數
function syncAllPanels(sourceElement: HTMLElement, excludeElements: HTMLElement[] = []) {
    if (isScrolling.value) return
    
    const scrollHeight = sourceElement.scrollHeight - sourceElement.clientHeight
    if (scrollHeight <= 0) return
    
    const percentage = sourceElement.scrollTop / scrollHeight
    isScrolling.value = true
    
    // 獲取所有需要同步的區域（editor-container 而不是 textarea）
    const allPanels = [
        leftInputContainer.value?.querySelector('.editor-container'),
        rightInputContainer.value?.querySelector('.editor-container'),
        leftPanel.value,
        rightPanel.value
    ].filter(Boolean) as HTMLElement[]
    
    allPanels.forEach(panel => {
        if (panel !== sourceElement && !excludeElements.includes(panel)) {
            const targetScrollHeight = panel.scrollHeight - panel.clientHeight
            if (targetScrollHeight > 0) {
                panel.scrollTop = percentage * targetScrollHeight
            }
        }
    })
    
    setTimeout(() => {
        isScrolling.value = false
    }, 10)
}

// 比對區滾動處理
const handleLeftScroll = (e: Event) => {
    const source = e.target as HTMLElement
    if (!source) return
    
    if (syncScrollAll.value) {
        // 全部同步：同步所有四個區域
        syncAllPanels(source)
    } else if (syncScrollDiff.value) {
        // 僅比對同步：只同步左右比對區
        syncAllPanels(source, [
            leftInputContainer.value?.querySelector('.editor-container'),
            rightInputContainer.value?.querySelector('.editor-container')
        ].filter(Boolean) as HTMLElement[])
    }
}

const handleRightScroll = (e: Event) => {
    const source = e.target as HTMLElement
    if (!source) return
    
    if (syncScrollAll.value) {
        // 全部同步：同步所有四個區域
        syncAllPanels(source)
    } else if (syncScrollDiff.value) {
        // 僅比對同步：只同步左右比對區
        syncAllPanels(source, [
            leftInputContainer.value?.querySelector('.editor-container'),
            rightInputContainer.value?.querySelector('.editor-container')
        ].filter(Boolean) as HTMLElement[])
    }
}

// 編輯區滾動處理
const handleLeftInputScroll = (e: Event) => {
    const container = e.target as HTMLElement
    if (!container || !syncScrollAll.value) return
    
    // 全部同步：同步所有四個區域
    syncAllPanels(container)
}

const handleRightInputScroll = (e: Event) => {
    const container = e.target as HTMLElement
    if (!container || !syncScrollAll.value) return
    
    // 全部同步：同步所有四個區域
    syncAllPanels(container)
}

function navigateToChange(direction: 'prev' | 'next') {
    if (changePositions.value.length === 0) return

    let newPosIndex: number
    if (currentChangeIndex.value === -1) {
        newPosIndex = direction === 'next' ? 0 : changePositions.value.length - 1
    } else {
        const currentPos = changePositions.value.findIndex(p => p.index === currentChangeIndex.value)
        if (direction === 'next') {
            newPosIndex = currentPos < changePositions.value.length - 1 ? currentPos + 1 : 0
        } else {
            newPosIndex = currentPos > 0 ? currentPos - 1 : changePositions.value.length - 1
        }
    }

    const targetPosition = changePositions.value[newPosIndex]
    if (!targetPosition) return
    
    currentChangeIndex.value = targetPosition.index

    nextTick(() => {
        // 鎖定滾動，防止同步滾動干擾
        isScrolling.value = true

        if (viewMode.value === 'side-by-side') {
            // Side-by-Side 模式：同時滾動左右兩側到相同位置
            const leftSelector = `.left-panel .diff-line[data-line-index="${targetPosition.lineIndex}"]`
            const rightSelector = `.right-panel .diff-line[data-line-index="${targetPosition.lineIndex}"]`
            const leftElement = document.querySelector(leftSelector) as HTMLElement
            const rightElement = document.querySelector(rightSelector) as HTMLElement
            
            if (leftElement && leftPanel.value) {
                const containerRect = leftPanel.value.getBoundingClientRect()
                const elementRect = leftElement.getBoundingClientRect()
                const relativeTop = elementRect.top - containerRect.top + leftPanel.value.scrollTop
                
                leftPanel.value.scrollTo({
                    top: relativeTop - 100,
                    behavior: 'smooth'
                })
            }
            
            if (rightElement && rightPanel.value) {
                const containerRect = rightPanel.value.getBoundingClientRect()
                const elementRect = rightElement.getBoundingClientRect()
                const relativeTop = elementRect.top - containerRect.top + rightPanel.value.scrollTop
                
                rightPanel.value.scrollTo({
                    top: relativeTop - 100,
                    behavior: 'smooth'
                })
            }
        } else {
            // Unified 模式：只有一個面板
            const selector = `.diff-line[data-line-index="${targetPosition.lineIndex}"]`
            const element = document.querySelector(selector) as HTMLElement
            
            if (element && unifiedPanel.value) {
                const containerRect = unifiedPanel.value.getBoundingClientRect()
                const elementRect = element.getBoundingClientRect()
                const relativeTop = elementRect.top - containerRect.top + unifiedPanel.value.scrollTop
                
                unifiedPanel.value.scrollTo({
                    top: relativeTop - 100,
                    behavior: 'smooth'
                })
            }
        }

        // 重置滾動鎖定
        setTimeout(() => {
            isScrolling.value = false
        }, 500)
    })
}

function clearAll() {
    originalText.value = ''
    modifiedText.value = ''
    currentChangeIndex.value = -1
}
</script>

<template>
    <ToolWrapper title="Diff 檢視器" icon="bi-file-diff"
        description="比對兩個文本的差異，支援語法高亮。適合比對設定檔、log 檔案等。">
        <div class="d-flex flex-column h-100">
            <!-- 頂部工具列 -->
            <div class="toolbar d-flex justify-content-between align-items-center mb-3 p-2 rounded"
                style="background: var(--theme-bg-solid); border: 1px solid var(--theme-border);">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <!-- 視圖模式 -->
                    <div class="d-flex align-items-center gap-2">
                        <label class="small text-muted mb-0">視圖:</label>
                        <div class="btn-group btn-group-sm" role="group">
                            <input type="radio" class="btn-check" v-model="viewMode" value="side-by-side"
                                id="view-side-by-side" />
                            <label class="btn btn-outline-primary" for="view-side-by-side">
                                <i class="bi bi-layout-split me-1"></i>並排
                            </label>
                            <input type="radio" class="btn-check" v-model="viewMode" value="unified" id="view-unified" />
                            <label class="btn btn-outline-primary" for="view-unified">
                                <i class="bi bi-list-ul me-1"></i>統一
                            </label>
                        </div>
                    </div>

                    <!-- 風格選擇 -->
                    <div class="d-flex align-items-center gap-2">
                        <label class="small text-muted mb-0">風格:</label>
                        <div class="btn-group btn-group-sm" role="group">
                            <input type="radio" class="btn-check" v-model="diffStyle" value="vscode" id="style-vscode" />
                            <label class="btn btn-outline-primary" for="style-vscode">
                                VSCode
                            </label>
                            <input type="radio" class="btn-check" v-model="diffStyle" value="github" id="style-github" />
                            <label class="btn btn-outline-primary" for="style-github">
                                GitHub
                            </label>
                        </div>
                    </div>

                    <!-- 語言選擇 -->
                    <div class="d-flex align-items-center gap-2">
                        <label class="small text-muted mb-0">語言:</label>
                        <select v-model="language" class="form-select form-select-sm" style="width: auto;">
                            <option v-for="lang in languages" :key="lang.value" :value="lang.value">
                                {{ lang.label }}
                            </option>
                        </select>
                    </div>

                    <!-- 語法高亮開關 -->
                    <div class="d-flex align-items-center gap-2">
                        <span class="small text-muted">語法高亮</span>
                        <Switch v-model="enableHighlight" />
                    </div>

                    <!-- 同步滾動開關 -->
                    <div class="d-flex align-items-center gap-2 border-start ps-3">
                        <span class="small text-muted">
                            <i class="bi bi-arrow-left-right me-1"></i>比對同步
                        </span>
                        <Switch v-model="syncScrollDiff" />
                    </div>

                    <!-- 全部同步開關 -->
                    <div class="d-flex align-items-center gap-2">
                        <span class="small text-muted">
                            <i class="bi bi-arrows-expand me-1"></i>全部同步
                        </span>
                        <Switch v-model="syncScrollAll" />
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <!-- 變更導航 -->
                    <div v-if="totalChanges > 0" class="d-flex align-items-center gap-2 border-end pe-2">
                        <span class="small text-muted">
                            變更: {{ totalChanges }}
                        </span>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-secondary" @click="navigateToChange('prev')"
                                title="上一個變更">
                                <i class="bi bi-chevron-up"></i>
                            </button>
                            <button class="btn btn-outline-secondary" @click="navigateToChange('next')"
                                title="下一個變更">
                                <i class="bi bi-chevron-down"></i>
                            </button>
                        </div>
                    </div>

                    <button class="btn btn-sm btn-outline-danger" @click="clearAll">
                        <i class="bi bi-x-lg me-1"></i>清除
                    </button>
                </div>
            </div>

            <!-- 輸入區 -->
            <div class="input-section mb-3">
                <ResizableSplitPane v-model="splitRatio" :min-size="200">
                    <template #first>
                        <div ref="leftInputContainer" class="h-100 d-flex flex-column pe-2">
                            <h6 class="section-title mb-2">
                                <i class="bi bi-file-text me-2"></i>原始文本
                            </h6>
                            <div class="flex-grow-1 min-h-0">
                                <HighlightedEditor 
                                    v-model="originalText" 
                                    placeholder="貼上原始文本..." 
                                    :language="language"
                                    :enable-highlight="enableHighlight"
                                    @scroll="handleLeftInputScroll" />
                            </div>
                        </div>
                    </template>
                    <template #second>
                        <div ref="rightInputContainer" class="h-100 d-flex flex-column ps-2">
                            <h6 class="section-title mb-2">
                                <i class="bi bi-file-text-fill me-2"></i>修改後文本
                            </h6>
                            <div class="flex-grow-1 min-h-0">
                                <HighlightedEditor 
                                    v-model="modifiedText" 
                                    placeholder="貼上修改後的文本..." 
                                    :language="language"
                                    :enable-highlight="enableHighlight"
                                    @scroll="handleRightInputScroll" />
                            </div>
                        </div>
                    </template>
                </ResizableSplitPane>
            </div>

            <!-- Diff 輸出區 -->
            <div class="output-section flex-grow-1 min-h-0">
                <h6 class="section-title mb-2">
                    <i class="bi bi-file-diff me-2"></i>差異比對
                </h6>

                <!-- Side-by-Side 視圖 -->
                <div v-if="viewMode === 'side-by-side'" 
                    class="diff-output side-by-side h-100"
                    :class="`diff-style-${diffStyle}`">
                    <div class="diff-container">
                        <div class="diff-panel left-panel">
                            <div class="diff-header">原始版本</div>
                            <div ref="leftPanel" class="diff-content" @scroll="handleLeftScroll">
                                <div v-for="(line, index) in sideBySideData.left" 
                                    :key="'left-' + index"
                                    :class="['diff-line', `diff-line-${line.type}`, { 'current-change': line.index === currentChangeIndex }]"
                                    :data-line-index="index"
                                    :data-change-index="line.type !== 'unchanged' ? line.index : undefined">
                                    <span class="line-number">{{ line.lineNumber || '' }}</span>
                                    <pre class="line-content" 
                                        v-html="line.content ? highlightCode(line.content, language) : '&nbsp;'"></pre>
                                </div>
                            </div>
                        </div>
                        <div class="diff-panel right-panel">
                            <div class="diff-header">修改版本</div>
                            <div ref="rightPanel" class="diff-content" @scroll="handleRightScroll">
                                <div v-for="(line, index) in sideBySideData.right" 
                                    :key="'right-' + index"
                                    :class="['diff-line', `diff-line-${line.type}`, { 'current-change': line.index === currentChangeIndex }]"
                                    :data-line-index="index"
                                    :data-change-index="line.type !== 'unchanged' ? line.index : undefined">
                                    <span class="line-number">{{ line.lineNumber || '' }}</span>
                                    <pre class="line-content" 
                                        v-html="line.content ? highlightCode(line.content, language) : '&nbsp;'"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Unified 視圖 -->
                <div v-else 
                    class="diff-output unified h-100"
                    :class="`diff-style-${diffStyle}`">
                    <div class="diff-container">
                        <div ref="unifiedPanel" class="diff-content">
                            <div v-for="(line, index) in unifiedData" 
                                :key="'unified-' + index"
                                :class="['diff-line', `diff-line-${line.type}`, { 'current-change': line.index === currentChangeIndex }]"
                                :data-line-index="index"
                                :data-change-index="line.type !== 'unchanged' ? line.index : undefined">
                                <span class="line-number old-line-number">{{ line.oldLine || '' }}</span>
                                <span class="line-number new-line-number">{{ line.newLine || '' }}</span>
                                <span class="diff-marker">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>
                                <pre class="line-content" 
                                    v-html="line.content ? highlightCode(line.content, language) : '&nbsp;'"></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ToolWrapper>
</template>

<style scoped>
.input-section {
    height: 300px;
    min-height: 200px;
}

.output-section {
    min-height: 400px;
}

.diff-output {
    border: 1px solid var(--theme-border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--theme-bg-card);
}

.diff-container {
    height: 100%;
    display: flex;
    overflow: auto;
}

.side-by-side .diff-container {
    flex-direction: row;
}

.diff-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.left-panel {
    border-right: 1px solid var(--theme-border);
}

.diff-header {
    background: var(--theme-bg-solid);
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid var(--theme-border);
    color: var(--theme-text-muted);
}

.diff-content {
    flex: 1;
    overflow: auto;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
}

.diff-line {
    display: flex;
    align-items: flex-start;
    min-height: 20.8px; /* 13px * 1.6 line-height */
    position: relative;
    white-space: nowrap;
}

.diff-line.current-change::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--theme-accent);
    z-index: 10;
}

.line-number {
    display: inline-block;
    width: 50px;
    padding: 2px 8px;
    text-align: right;
    user-select: none;
    color: var(--theme-text-muted);
    flex-shrink: 0;
    background: var(--theme-bg-solid);
    border-right: 1px solid var(--theme-border);
}

.old-line-number,
.new-line-number {
    width: 45px;
}

.diff-marker {
    display: inline-block;
    width: 20px;
    text-align: center;
    user-select: none;
    flex-shrink: 0;
    font-weight: bold;
}

.line-content {
    flex: 1;
    margin: 0;
    padding: 2px 8px;
    white-space: pre;
    overflow: visible;
    background: transparent;
    border: none;
    min-width: 0;
}

/* VSCode 風格 */
.diff-style-vscode .diff-line-added {
    background-color: rgba(156, 204, 44, 0.15);
}

.diff-style-vscode .diff-line-removed {
    background-color: rgba(255, 0, 0, 0.15);
}

.diff-style-vscode .diff-line-added .line-content {
    background-color: rgba(156, 204, 44, 0.25);
}

.diff-style-vscode .diff-line-removed .line-content {
    background-color: rgba(255, 0, 0, 0.2);
}

.diff-style-vscode .diff-marker {
    color: var(--theme-text-muted);
}

/* GitHub 風格 */
.diff-style-github .diff-line-added {
    background-color: #dafbe1;
}

.diff-style-github .diff-line-removed {
    background-color: #ffebe9;
}

.diff-style-github .diff-line-added .line-content {
    background-color: #dafbe1;
}

.diff-style-github .diff-line-removed .line-content {
    background-color: #ffebe9;
}

.diff-style-github .diff-line-added .diff-marker {
    color: #1a7f37;
    background-color: #ccffd8;
}

.diff-style-github .diff-line-removed .diff-marker {
    color: #d1242f;
    background-color: #ffd7d5;
}

:root[data-theme="dark"] .diff-style-github .diff-line-added {
    background-color: rgba(46, 160, 67, 0.15);
}

:root[data-theme="dark"] .diff-style-github .diff-line-removed {
    background-color: rgba(248, 81, 73, 0.15);
}

:root[data-theme="dark"] .diff-style-github .diff-line-added .line-content {
    background-color: rgba(46, 160, 67, 0.15);
}

:root[data-theme="dark"] .diff-style-github .diff-line-removed .line-content {
    background-color: rgba(248, 81, 73, 0.15);
}

.unified .diff-content {
    width: 100%;
}

.unified .diff-line-unchanged {
    background-color: transparent;
}
</style>
