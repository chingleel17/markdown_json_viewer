<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import LineNumbersEditor from '../components/LineNumbersEditor.vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import ConvertButton from '../components/ConvertButton.vue'
import { validateAndParseJSON, attemptJSONRepair } from '../json-utils'

const jsonInput = ref('')
const jsonOutput = ref('')
const jsonTreeOutput = ref('')
const jsonStatus = ref('')
const jsonError = ref('')
const action = ref('format')
const viewMode = ref('text')
let currentJSON: any = null

const isValid = computed(() => {
    if (!jsonInput.value.trim()) return null
    const result = validateAndParseJSON(jsonInput.value)
    return result.valid
})

function validateJSON() {
    const result = validateAndParseJSON(jsonInput.value)
    if (result.valid) {
        currentJSON = result.data
        jsonStatus.value = '✓ 有效'
        jsonError.value = ''
        return true
    } else {
        jsonStatus.value = '✗ 無效'
        jsonError.value = `錯誤: ${result.error}`
        return false
    }
}

// 語法高亮函數
function jsonToSyntaxHTML(jsonString: string): string {
    return jsonString
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/"([^"]*)"(?=\s*[,\}\]])/g, '<span class="json-string">"$1"</span>')
        .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
        .replace(/[\[\]]/g, '<span class="json-bracket">$&</span>')
        .replace(/[\{\}]/g, '<span class="json-brace">$&</span>')
        .replace(/,/g, '<span class="json-comma">,</span>')
        .replace(/:/g, '<span class="json-colon">:</span>')
}

// Tree 視圖生成函數
function createTreeView(obj: any, level: number = 0): string {
    let html = ''

    if (Array.isArray(obj)) {
        html += `<div class="json-tree-item"><span class="json-tree-toggle">▼</span><span class="json-bracket">[</span></div>`
        html += `<div class="json-tree-children">`
        obj.forEach((item, index) => {
            html += `<div class="json-tree-item">`
            html += `<span class="json-key">${index}</span><span class="json-colon">:</span>`
            if (typeof item === 'object' && item !== null) {
                html += createTreeView(item, level + 1)
            } else {
                html += `<span class="json-tree-value">${formatValue(item)}</span>`
            }
            if (index < obj.length - 1) html += '<span class="json-comma">,</span>'
            html += `</div>`
        })
        html += `</div>`
        html += `<div class="json-tree-item"><span class="json-bracket">]</span></div>`
    } else if (typeof obj === 'object' && obj !== null) {
        html += `<div class="json-tree-item"><span class="json-tree-toggle">▼</span><span class="json-brace">{</span></div>`
        html += `<div class="json-tree-children">`
        const keys = Object.keys(obj)
        keys.forEach((key, index) => {
            html += `<div class="json-tree-item">`
            html += `<span class="json-key">"${key}"</span><span class="json-colon">:</span>`
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                html += createTreeView(obj[key], level + 1)
            } else {
                html += `<span class="json-tree-value">${formatValue(obj[key])}</span>`
            }
            if (index < keys.length - 1) html += '<span class="json-comma">,</span>'
            html += `</div>`
        })
        html += `</div>`
        html += `<div class="json-tree-item"><span class="json-brace">}</span></div>`
    }

    return html
}

function formatValue(value: any): string {
    if (typeof value === 'string') {
        return `<span class="json-string">"${value}"</span>`
    } else if (typeof value === 'number') {
        return `<span class="json-number">${value}</span>`
    } else if (typeof value === 'boolean') {
        return `<span class="json-boolean">${value}</span>`
    } else if (value === null) {
        return `<span class="json-null">null</span>`
    }
    return String(value)
}

function updateDisplay() {
    if (!currentJSON) return

    let displayData = currentJSON
    if (action.value === 'schema') {
        displayData = generateJSONSchema(currentJSON)
    }

    if (viewMode.value === 'text') {
        const formatted = JSON.stringify(displayData, null, 2)
        jsonOutput.value = jsonToSyntaxHTML(formatted)
        jsonTreeOutput.value = ''
    } else {
        jsonTreeOutput.value = `<div class="json-tree">${createTreeView(displayData)}</div>`
        jsonOutput.value = ''
        // 延遲綁定 toggle 事件
        nextTick(() => {
            bindTreeToggles()
        })
    }
}

function bindTreeToggles() {
    const toggles = document.querySelectorAll('.json-tree-toggle')
    toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const parent = toggle.parentElement
            const children = parent?.nextElementSibling
            if (children && children.classList.contains('json-tree-children')) {
                if (children.classList.contains('json-tree-collapsed')) {
                    children.classList.remove('json-tree-collapsed')
                    toggle.textContent = '▼'
                } else {
                    children.classList.add('json-tree-collapsed')
                    toggle.textContent = '▶'
                }
            }
        })
    })
}

function processJSON() {
    if (!validateJSON()) return
    updateDisplay()
}

function clearJSON() {
    jsonInput.value = ''
    jsonOutput.value = ''
    jsonTreeOutput.value = ''
    jsonStatus.value = ''
    jsonError.value = ''
    currentJSON = null
}

function autoFixJSONInput() {
    const result = attemptJSONRepair(jsonInput.value)
    if (result.success) {
        jsonInput.value = result.repaired
        validateJSON()
        jsonStatus.value = '✓ 已自動修復'
    } else {
        jsonError.value = `修復失敗: ${result.error}`
    }
}

function stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '')
}

async function copyJSON() {
    try {
        const text = jsonOutput.value ? stripHtmlTags(jsonOutput.value) : stripHtmlTags(jsonTreeOutput.value)
        await navigator.clipboard.writeText(text)
    } catch (e) {
        alert('複製失敗')
    }
}

function minifyJSON() {
    if (currentJSON) {
        const action_val = action.value === 'schema' ? generateJSONSchema(currentJSON) : currentJSON
        jsonOutput.value = jsonToSyntaxHTML(JSON.stringify(action_val))
        jsonTreeOutput.value = ''
    }
}

function generateJSONSchema(obj: any): any {
    if (Array.isArray(obj)) {
        return {
            type: 'array',
            items: obj.length > 0 ? generateJSONSchema(obj[0]) : { type: 'string' }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        const properties: Record<string, any> = {}
        Object.keys(obj).forEach(key => {
            properties[key] = generateJSONSchema(obj[key])
        })
        return { type: 'object', properties }
    } else if (typeof obj === 'string') {
        return { type: 'string' }
    } else if (typeof obj === 'number') {
        return { type: 'number' }
    } else if (typeof obj === 'boolean') {
        return { type: 'boolean' }
    } else {
        return { type: 'null' }
    }
}

// 監聽 action 和 viewMode 變化，自動更新顯示
watch([action, viewMode], () => {
    if (currentJSON) {
        updateDisplay()
    }
})
</script>

<template>
    <ToolWrapper title="JSON 工具" icon="bi-braces"
        description="格式化、驗證、壓縮 JSON，或從 JSON 生成 JSON Schema。所有操作都在您的瀏覽器本地進行，確保資料的絕對安全。">
        <!-- Input and Output -->
        <div class="position-relative">
            <div class="row g-3">
                <!-- Left: Input -->
                <div class="col-lg-6">
                    <div class="input-section h-100">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <h6 class="section-title mb-0 d-flex align-items-center">
                                    <i class="bi bi-pencil-square me-2"></i>
                                    輸入JSON
                                </h6>
                                <span v-if="jsonStatus" :class="['badge', isValid ? 'bg-success' : 'bg-danger']">
                                    {{ jsonStatus }}
                                </span>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <!-- 處理動作 -->
                                <div class="btn-group btn-group-sm" role="group">
                                    <input type="radio" class="btn-check" v-model="action" value="format"
                                        id="json-action-format" />
                                    <label class="btn btn-outline-primary" for="json-action-format" title="格式化">
                                        <i class="bi bi-code-square"></i> Format
                                    </label>
                                    <input type="radio" class="btn-check" v-model="action" value="schema"
                                        id="json-action-schema" />
                                    <label class="btn btn-outline-primary" for="json-action-schema" title="JSON Schema">
                                        <i class="bi bi-diagram-3"></i> Schema
                                    </label>
                                </div>
                                <button class="btn btn-sm btn-outline-warning" @click="autoFixJSONInput"
                                    title="自動修復 JSON 格式和移除註解">
                                    <i class="bi bi-tools"></i> 修復
                                </button>
                                <button class="btn btn-sm btn-outline-danger" @click="clearJSON" title="清除">
                                    <i class="bi bi-x-lg"></i>清除
                                </button>
                            </div>
                        </div>
                        <LineNumbersEditor v-model="jsonInput" @input="validateJSON" placeholder="在這裡貼上您的 JSON..." />
                        <div class="mt-2" style="min-height: 1.5rem">
                            <div v-if="jsonError" class="error-message py-2 small">{{ jsonError }}</div>
                        </div>
                    </div>
                </div>

                <!-- Right: Output -->
                <div class="col-lg-6">
                    <div class="output-section h-100">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <h6 class="section-title mb-0 d-flex align-items-center">
                                    <i class="bi bi-file-code me-2"></i>
                                    輸出
                                </h6>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <!-- 顯示模式 -->
                                <div class="btn-group btn-group-sm" role="group">
                                    <input type="radio" class="btn-check" v-model="viewMode" value="text"
                                        id="text-mode" />
                                    <label class="btn btn-outline-primary" for="text-mode" title="Text 模式">
                                        <i class="bi bi-file-text"></i> Text
                                    </label>
                                    <input type="radio" class="btn-check" v-model="viewMode" value="tree"
                                        id="tree-mode" />
                                    <label class="btn btn-outline-primary" for="tree-mode" title="Tree 模式">
                                        <i class="bi bi-diagram-2"></i> Tree
                                    </label>
                                </div>
                                <button class="btn btn-sm btn-outline-secondary" @click="minifyJSON" title="壓縮">
                                    <i class="bi bi-arrows-angle-contract"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success" @click="copyJSON" title="複製">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modern-output-wrapper rounded overflow-hidden" style="box-shadow: var(--shadow-sm)">
                            <pre v-if="viewMode === 'text'" class="modern-output p-3 m-0"
                                style="height: 75vh; overflow-y: auto; white-space: pre-wrap;"
                                v-html="jsonOutput"></pre>
                            <div v-else class="modern-output p-3" style="height: 75vh; overflow-y: auto;"
                                v-html="jsonTreeOutput"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Center: Process Button (Floating) -->
            <ConvertButton class="position-absolute top-50 start-50 translate-middle" style="z-index: 100;"
                @click="processJSON" :disabled="!isValid" title="轉換 JSON" />
        </div>
    </ToolWrapper>
</template>
