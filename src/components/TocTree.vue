<script setup lang="ts">
import { ref } from 'vue'

export interface TocItem {
    text: string
    id: string
    level: number
    children?: TocItem[]
}

defineProps<{
    items: TocItem[]
}>()

const emit = defineEmits(['click-item'])

const collapsed = ref<Record<string, boolean>>({})

function toggle(id: string) {
    collapsed.value[id] = !collapsed.value[id]
}

function handleClick(item: TocItem) {
    emit('click-item', item.id)
}
</script>

<template>
    <ul class="toc-list">
        <li v-for="item in items" :key="item.id" class="toc-list-item">
            <div class="toc-item-content" :style="{ paddingLeft: (item.level - 1) * 1 + 'rem' }">
                <span class="toc-toggle" :class="{ 'is-hidden': !item.children || item.children.length === 0 }"
                    @click.stop="toggle(item.id)">
                    <i class="bi" :class="collapsed[item.id] ? 'bi-caret-right-fill' : 'bi-caret-down-fill'"></i>
                </span>
                <span class="toc-text" @click="handleClick(item)" :title="item.text">{{ item.text }}</span>
            </div>

            <div v-if="item.children && item.children.length" v-show="!collapsed[item.id]" class="toc-children">
                <TocTree :items="item.children" @click-item="$emit('click-item', $event)" />
            </div>
        </li>
    </ul>
</template>

<style scoped>
.toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.toc-list-item {
    margin-bottom: 2px;
}

.toc-item-content {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
    color: var(--theme-text-muted);
}

.toc-item-content:hover {
    background-color: var(--theme-bg-solid);
    color: var(--theme-text);
}

.toc-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: 4px;
    font-size: 0.8rem;
    color: var(--theme-text-light);
    transition: color 0.2s;
}

.toc-toggle:hover {
    color: var(--theme-text);
}

.toc-toggle.is-hidden {
    visibility: hidden;
}

.toc-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
}

.toc-children {
    overflow: hidden;
}
</style>
