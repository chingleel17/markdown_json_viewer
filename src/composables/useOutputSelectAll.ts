// src/composables/useOutputSelectAll.ts
// 共用 hook：讓 output 區塊支援 ctrl+a 只選取內容
import { onMounted, onBeforeUnmount } from 'vue'

export function useOutputSelectAll(elRef: any) {
    function handleOutputKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            const wrapper = e.currentTarget as HTMLElement
            if (document.activeElement === wrapper) {
                e.stopPropagation()
                // 取得第一個子元素（pre、div、markdown-preview等）
                const child = wrapper.querySelector('.modern-output, .markdown-preview')
                if (child) {
                    const range = document.createRange()
                    range.selectNodeContents(child)
                    const sel = window.getSelection()
                    sel?.removeAllRanges()
                    sel?.addRange(range)
                }
                e.preventDefault()
            }
        }
    }

    onMounted(() => {
        if (elRef.value) {
            elRef.value.addEventListener('keydown', handleOutputKeydown)
        }
    })
    onBeforeUnmount(() => {
        if (elRef.value) {
            elRef.value.removeEventListener('keydown', handleOutputKeydown)
        }
    })

    return { handleOutputKeydown }
}
