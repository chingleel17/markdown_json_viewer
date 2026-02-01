import { ref, type Ref } from 'vue'

/**
 * 同步滾動的 Composable
 * 用於在兩個容器之間實現同步滾動功能
 */
export function useSyncScroll() {
    const isScrolling = ref(false)

    /**
     * 計算滾動百分比
     */
    function getScrollPercentage(element: HTMLElement): number {
        const scrollRange = element.scrollHeight - element.clientHeight
        if (scrollRange === 0) return 0
        return element.scrollTop / scrollRange
    }

    /**
     * 設置滾動位置（基於百分比）
     */
    function setScrollPercentage(element: HTMLElement, percentage: number) {
        const scrollRange = element.scrollHeight - element.clientHeight
        element.scrollTop = percentage * scrollRange
    }

    /**
     * 創建同步滾動處理器
     * @param sourceRef 來源容器的 ref
     * @param targetRef 目標容器的 ref
     * @param enabledRef 是否啟用同步滾動的 ref
     */
    function createScrollHandler(
        sourceRef: Ref<HTMLElement | undefined>,
        targetRef: Ref<HTMLElement | undefined>,
        enabledRef: Ref<boolean>
    ) {
        return (e: Event) => {
            if (!enabledRef.value || !sourceRef.value || !targetRef.value || isScrolling.value) {
                return
            }

            const source = e.target as HTMLElement
            const percentage = getScrollPercentage(source)
            setScrollPercentage(targetRef.value, percentage)
        }
    }

    /**
     * 滾動到指定元素（帶鎖定以防止觸發同步）
     * @param container 容器元素
     * @param target 目標元素或滾動位置
     * @param offset 偏移量（像素）
     */
    function scrollToElement(
        container: HTMLElement,
        target: HTMLElement | number,
        offset: number = 20
    ) {
        isScrolling.value = true

        if (typeof target === 'number') {
            container.scrollTo({
                top: target,
                behavior: 'smooth'
            })
        } else {
            const containerRect = container.getBoundingClientRect()
            const targetRect = target.getBoundingClientRect()
            const relativeTop = targetRect.top - containerRect.top + container.scrollTop

            container.scrollTo({
                top: relativeTop - offset,
                behavior: 'smooth'
            })
        }

        // 重置鎖定
        setTimeout(() => {
            isScrolling.value = false
        }, 500)
    }

    return {
        isScrolling,
        getScrollPercentage,
        setScrollPercentage,
        createScrollHandler,
        scrollToElement
    }
}
