<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ToolWrapper from '../components/ToolWrapper.vue'
import { useLocalStorage } from '../composables/useLocalStorage'

interface PasswordOptions {
    length: number
    upper: boolean
    lower: boolean
    number: boolean
    special: boolean
    strength: 'low' | 'standard' | 'strong'
    encoding: 'normal' | 'hex' | 'base64'
    count: number
}

const options = useLocalStorage<PasswordOptions>('password-gen-options', {
    length: 16,
    upper: true,
    lower: true,
    number: true,
    special: true,
    strength: 'standard',
    encoding: 'normal',
    count: 1
})

const generatedPasswords = ref<string[]>([])
const copyStatus = ref<number | null>(null) // index of copied password, -1 for all
const isGenerating = ref(false)

const charSets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

function setStrength(strength: 'low' | 'standard' | 'strong') {
    options.value.strength = strength
    if (strength === 'low') {
        options.value.length = 8
        options.value.upper = false
        options.value.lower = true
        options.value.number = true
        options.value.special = false
    } else if (strength === 'standard') {
        options.value.length = 16
        options.value.upper = true
        options.value.lower = true
        options.value.number = true
        options.value.special = false
    } else if (strength === 'strong') {
        options.value.length = 24
        options.value.upper = true
        options.value.lower = true
        options.value.number = true
        options.value.special = true
    }
    generate()
}

function generate() {
    isGenerating.value = true

    // 小延遲以展示模糊效果並減少閃爍感
    setTimeout(() => {
        let pool = ''
        if (options.value.upper) pool += charSets.upper
        if (options.value.lower) pool += charSets.lower
        if (options.value.number) pool += charSets.number
        if (options.value.special) pool += charSets.special

        if (!pool) {
            generatedPasswords.value = ['請至少選擇一種字元類型']
            isGenerating.value = false
            return
        }

        const passwords: string[] = []
        const count = Math.max(1, Math.min(100, options.value.count))

        for (let c = 0; c < count; c++) {
            let password = ''
            const array = new Uint32Array(options.value.length)
            if (typeof window !== 'undefined' && window.crypto) {
                window.crypto.getRandomValues(array)
            } else {
                for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 4294967296)
            }

            for (let i = 0; i < options.value.length; i++) {
                const index = array[i]
                if (index !== undefined) {
                    password += pool[index % pool.length]
                }
            }

            if (options.value.encoding === 'hex') {
                password = Array.from(password).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
            } else if (options.value.encoding === 'base64') {
                try {
                    password = btoa(unescape(encodeURIComponent(password)))
                } catch (e) { }
            }
            passwords.push(password)
        }

        generatedPasswords.value = passwords
        isGenerating.value = false
    }, 150)
}

const strengthScore = computed(() => {
    let score = 0
    if (options.value.length > 8) score += 1
    if (options.value.length > 12) score += 1
    if (options.value.length > 20) score += 1
    if (options.value.upper) score += 1
    if (options.value.lower) score += 1
    if (options.value.number) score += 1
    if (options.value.special) score += 2
    return score // max is around 8-9
})

const strengthLabel = computed(() => {
    const score = strengthScore.value
    if (score < 4) return { text: '極弱', color: 'text-danger', advice: '增加長度並加入不同類型的字元。' }
    if (score < 6) return { text: '弱', color: 'text-warning', advice: '建議包含大寫字母或特殊符號。' }
    if (score < 8) return { text: '良好', color: 'text-info', advice: '這是一個相當安全的密碼。' }
    return { text: '極強', color: 'text-success', advice: '非常卓越！這個密碼極難被暴力拆解。' }
})

const entropy = computed(() => {
    let poolSize = 0
    if (options.value.upper) poolSize += 26
    if (options.value.lower) poolSize += 26
    if (options.value.number) poolSize += 10
    if (options.value.special) poolSize += charSets.special.length

    if (poolSize === 0) return 0
    return Math.floor(options.value.length * Math.log2(poolSize))
})

const lengthPercentage = computed(() => {
    return ((options.value.length - 4) / (64 - 4)) * 100
})

function adjustLength(delta: number) {
    const newVal = options.value.length + delta
    if (newVal >= 4 && newVal <= 64) {
        options.value.length = newVal
    }
}

async function copyToClipboard(text: string, index: number) {
    try {
        await navigator.clipboard.writeText(text)
        copyStatus.value = index
        setTimeout(() => {
            if (copyStatus.value === index) copyStatus.value = null
        }, 2000)
    } catch (err) {
        console.error('Failed to copy', err)
    }
}

async function copyAll() {
    const text = generatedPasswords.value.join('\n')
    await copyToClipboard(text, -1)
}

watch([() => options.value.length, () => options.value.upper, () => options.value.lower, () => options.value.number, () => options.value.special, () => options.value.encoding, () => options.value.count], () => {
    generate()
})

onMounted(() => {
    generate()
})
</script>

<template>
    <ToolWrapper title="密碼產生器" icon="bi-shield-lock" description="快速產生安全且隨機的強密碼，保護您的帳戶安全">
        <div class="row g-4 h-100">
            <!-- Settings Panel -->
            <div class="col-lg-5">
                <div class="border p-4 h-100">
                    <h5 class="section-title mb-4">
                        <i class="bi bi-sliders me-2"></i>設定選項
                    </h5>

                    <!-- Strength Presets -->
                    <div class="mb-4">
                        <label class="form-label text-muted small text-uppercase fw-bold">密碼強度</label>
                        <div class="btn-group w-100 p-1 bg-light border rounded">
                            <button class="btn btn-sm flex-grow-1"
                                :class="options.strength === 'low' ? 'btn-danger shadow-sm' : 'btn-link strength-btn-unselected'"
                                @click="setStrength('low')">低(好記)</button>
                            <button class="btn btn-sm flex-grow-1"
                                :class="options.strength === 'standard' ? 'btn-primary shadow-sm' : 'btn-link strength-btn-unselected'"
                                @click="setStrength('standard')">標準</button>
                            <button class="btn btn-sm flex-grow-1"
                                :class="options.strength === 'strong' ? 'btn-success shadow-sm' : 'btn-link strength-btn-unselected'"
                                @click="setStrength('strong')">強(複雜)</button>
                        </div>
                    </div>

                    <!-- Length -->
                    <div class="mb-4">
                        <div class="d-flex align-items-center mb-3">
                            <i class="bi bi-stars text-primary me-2"></i>
                            <h6 class="mb-0 fw-bold">密碼長度：{{ options.length }}</h6>
                        </div>

                        <div class="d-flex align-items-center gap-2 mb-2">
                            <button class="btn btn-range-adj" @click="adjustLength(-1)" :disabled="options.length <= 4">
                                <i class="bi bi-dash-lg"></i>
                            </button>

                            <div class="flex-grow-1 px-2">
                                <input type="range" class="form-range custom-range" min="4" max="64" step="1"
                                    v-model.number="options.length"
                                    :style="{ backgroundSize: lengthPercentage + '% 100%' }">
                            </div>

                            <button class="btn btn-range-adj" @click="adjustLength(1)" :disabled="options.length >= 64">
                                <i class="bi bi-plus-lg"></i>
                            </button>
                        </div>

                        <div class="d-flex justify-content-between text-muted mt-1 px-5" style="font-size: 0.75rem;">
                            <span>最短 4</span>
                            <span>最長 64</span>
                        </div>
                    </div>

                    <!-- Characters -->
                    <div class="mb-4">
                        <label class="form-label text-muted small text-uppercase fw-bold">字元選項</label>
                        <div class="row g-2">
                            <div class="col-6">
                                <div class="form-check form-switch custom-switch p-3 border rounded h-100">
                                    <input class="form-check-input ms-0" type="checkbox" id="upper"
                                        v-model="options.upper">
                                    <label class="form-check-label ms-2" for="upper">大寫字母 (A-Z)</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="form-check form-switch custom-switch p-3 border rounded h-100">
                                    <input class="form-check-input ms-0" type="checkbox" id="lower"
                                        v-model="options.lower">
                                    <label class="form-check-label ms-2" for="lower">小寫字母 (a-z)</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="form-check form-switch custom-switch p-3 border rounded h-100">
                                    <input class="form-check-input ms-0" type="checkbox" id="number"
                                        v-model="options.number">
                                    <label class="form-check-label ms-2" for="number">數字 (0-9)</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="form-check form-switch custom-switch p-3 border rounded h-100">
                                    <input class="form-check-input ms-0" type="checkbox" id="special"
                                        v-model="options.special">
                                    <label class="form-check-label ms-2" for="special">特殊符號 (!@#)</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label text-muted small text-uppercase fw-bold">編碼格式</label>
                            <select class="form-select" v-model="options.encoding">
                                <option value="normal">純文字</option>
                                <option value="hex">16 進位 (Hex)</option>
                                <option value="base64">Base64</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label text-muted small text-uppercase fw-bold">產生數量</label>
                            <input type="number" class="form-control" v-model.number="options.count" min="1" max="100">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Output Panel -->
            <div class="col-lg-7 d-flex flex-column h-100">
                <div class="d-flex flex-column h-100 gap-3 min-h-0">
                    <!-- Strength Advice -->
                    <div class="border p-4" :class="'border-' + (strengthLabel.color.replace('text-', ''))">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="section-title mb-0">
                                <i class="bi bi-shield-check me-2"></i>安全強度分析
                            </h5>
                            <span :class="['fw-bold', strengthLabel.color]">{{ strengthLabel.text }}</span>
                        </div>

                        <div class="progress mb-3" style="height: 6px;">
                            <div class="progress-bar" role="progressbar"
                                :style="{ width: (strengthScore / 9 * 100) + '%' }"
                                :class="'bg-' + (strengthLabel.color.replace('text-', ''))"></div>
                        </div>

                        <p class="mb-0 small text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            {{ strengthLabel.advice }}
                            <span class="ms-2 fw-bold">安全性得分: {{ entropy }} 分</span>
                        </p>
                    </div>

                    <!-- Result List -->
                    <div class="border flex-grow-1 d-flex flex-column min-h-0">
                        <div
                            class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                            <span class="text-muted small text-uppercase fw-bold">產生的密碼</span>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-primary" @click="generate">
                                    <i class="bi bi-arrow-clockwise me-1"></i> 重新產生
                                </button>
                                <button class="btn btn-sm btn-primary" @click="copyAll">
                                    <i class="bi" :class="copyStatus === -1 ? 'bi-check2' : 'bi-clipboard-check'"></i>
                                    {{ copyStatus === -1 ? '已複製全部' : '複製全部' }}
                                </button>
                            </div>
                        </div>

                        <div class="flex-grow-1 overflow-auto p-3 result-list-container"
                            :class="{ 'is-generating': isGenerating }">
                            <div v-for="(pw, idx) in generatedPasswords" :key="idx"
                                class="password-row p-3 border rounded mb-2 d-flex align-items-center transition-all">
                                <div class="password-text font-monospace flex-grow-1 text-break">{{ pw }}</div>
                                <button class="btn btn-icon ms-2" @click="copyToClipboard(pw, idx)"
                                    :title="copyStatus === idx ? '已複製' : '複製'">
                                    <i class="bi"
                                        :class="copyStatus === idx ? 'bi-check-lg text-success' : 'bi-clipboard text-muted'"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ToolWrapper>
</template>

<style scoped>
:deep(.border) {
    height: auto;
    flex: 1;
    /* 讓卡片填滿父層 */
    min-height: 0;
    /* 關鍵：允許內部佈局收縮並觸發滾動條 */
}

:deep(.border-body) {
    flex: 1;
    /* 讓內容區填滿卡片 */
    min-height: 0;
    /* 同上 */
}

.font-monospace {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    letter-spacing: 0.5px;
}

.password-row {
    background: var(--theme-bg-input);
    border-color: var(--theme-border);
}

.password-row:hover {
    border-color: var(--theme-accent);
    background: var(--theme-bg-card);
}

.btn-icon {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.btn-icon:hover {
    background: rgba(0, 0, 0, 0.05);
}

.custom-switch {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
}

.custom-switch:hover {
    border-color: var(--theme-accent) !important;
}

.custom-switch .form-check-input {
    cursor: pointer;
}

.transition-all {
    transition: all 0.2s ease;
}

.bg-light {
    background-color: var(--theme-bg-header) !important;
}

/* Adjust range thumb color if needed */
.form-range::-webkit-slider-thumb {
    background: var(--theme-accent);
    box-shadow: 0 0 0 4px rgba(var(--theme-accent-rgb, 13, 110, 253), 0.2);
}

.form-range::-moz-range-thumb {
    background: var(--theme-accent);
    box-shadow: 0 0 0 4px rgba(var(--theme-accent-rgb, 13, 110, 253), 0.2);
}

.custom-range::-ms-thumb {
    background: var(--theme-accent);
    box-shadow: 0 0 0 4px rgba(var(--theme-accent-rgb, 13, 110, 253), 0.2);
}

.min-h-0 {
    min-height: 0;
}

/* Custom Range styling */
.custom-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    background-color: var(--theme-bg-header) !important;
    background-image: linear-gradient(var(--theme-accent), var(--theme-accent)) !important;
    background-repeat: no-repeat !important;
    height: 6px;
    border-radius: 10px;
    cursor: pointer;
}

/* 必須將軌道背景設為透明，才能看到 input 本身的背景填滿效果 */
.custom-range::-webkit-slider-runnable-track {
    background: transparent !important;
    border: none;
}

.custom-range::-moz-range-track {
    background: transparent !important;
    border: none;
}

.btn-range-adj {
    width: 38px;
    height: 38px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--theme-bg-header);
    border: 1px solid var(--theme-border);
    color: var(--theme-text);
    transition: all 0.2s;
}

.btn-range-adj:hover:not(:disabled) {
    background: var(--theme-bg-input);
    border-color: var(--theme-accent);
    color: var(--theme-accent);
    transform: scale(1.05);
}

.btn-range-adj:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.strength-btn-unselected {
    color: var(--theme-text) !important;
    opacity: 0.6;
    text-decoration: none;
}

.strength-btn-unselected:hover {
    opacity: 1;
}

.result-list-container {
    transition: filter 0.2s ease;
}

.is-generating {
    filter: blur(4px);
    pointer-events: none;
}
</style>
