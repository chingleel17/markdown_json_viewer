import { ref, watch, onMounted } from 'vue'

/**
 * Composable for persisting data to localStorage
 * @param key - The localStorage key
 * @param defaultValue - Default value if no stored value exists
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
    const data = ref<T>(defaultValue)

    // Load from localStorage on mount
    onMounted(() => {
        try {
            const stored = localStorage.getItem(key)
            if (stored !== null) {
                data.value = JSON.parse(stored)
            }
        } catch (e) {
            console.error(`Failed to load from localStorage (${key}):`, e)
        }
    })

    // Watch for changes and save to localStorage
    watch(data, (newValue) => {
        try {
            localStorage.setItem(key, JSON.stringify(newValue))
        } catch (e) {
            console.error(`Failed to save to localStorage (${key}):`, e)
        }
    }, { deep: true })

    return data
}
