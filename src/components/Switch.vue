<style scoped>
/* The switch - the box around the slider */
.switch {
    font-size: 17px;
    position: relative;
    display: inline-block;
    width: 3rem;
    height: 1.5rem;
    margin-right: 0.5rem;
}

/* Hide default HTML checkbox */
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

/* The slider */
.slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--bs-gray-500);
    border-radius: 50px;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
}

.slider:before {
    position: absolute;
    content: "";
    height: 1rem;
    width: 1em;
    left: 0.3em;
    bottom: 0.25em;
    background-color: white;
    border-radius: 50px;
    box-shadow: 0 0px 20px rgba(0, 0, 0, 0.4);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.switch input:checked+.slider {
    background: var(--theme-accent);
}

.switch input:focus+.slider {
    box-shadow: 0 0 1px var(--theme-accent);
}

.switch input:checked+.slider:before {
    transform: translateX(1.25em);
}
</style>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

function onChange(e: Event) {
    emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
    <label class="switch">
        <input type="checkbox" :checked="props.modelValue" @change="onChange">
        <span class="slider"></span>
    </label>
</template>
