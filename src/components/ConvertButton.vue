<script setup lang="ts">
defineProps<{
    disabled?: boolean
}>()

defineEmits<{
    click: []
}>()
</script>

<style scoped>
.button {
    display: block;
    position: relative;
    width: 56px;
    height: 56px;
    margin: 0;
    overflow: hidden;
    outline: none;
    background-color: var(--theme-border);
    border-radius: 50%;
    border: 0;
}

.button:before,
.button:after {
    content: "";
    position: absolute;
    border-radius: 50%;
    inset: 7px;
}

.button:before {
    border: 4px solid #F0EEEF;
    transition: opacity .4s cubic-bezier(.77, 0, .175, 1) 80ms, transform .5s cubic-bezier(.455, .03, .515, .955) 80ms;
}

.button:after {
    border: 4px solid #96daf0;
    transform: scale(1.3);
    transition: opacity .4s cubic-bezier(.165, .84, .44, 1), transform .5s cubic-bezier(.25, .46, .45, .94);
    opacity: 0;
}

.button:hover:before,
.button:focus:before {
    opacity: 0;
    transform: scale(0.7);
    transition: opacity .4s cubic-bezier(.165, .84, .44, 1), transform .5s cubic-bezier(.25, .46, .45, .94);
}

.button:hover:after,
.button:focus:after {
    opacity: 1;
    transform: scale(1);
    transition: opacity .4s cubic-bezier(.77, 0, .175, 1) 80ms, transform .5s cubic-bezier(.455, .03, .515, .955) 80ms;
}

.button-box {
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    width: 200%;
}

.button-elem {
    display: block;
    width: 20px;
    height: 20px;
    margin: 15px 18px 0 18px;
    fill: var(--theme-accent);
}

.button:hover .button-box,
.button:focus .button-box {
    transition: .4s;
    transform: translateX(56px);
}
</style>

<template>
    <button class="button" @click="$emit('click')" :disabled="disabled">
        <div class="button-box">
            <span class="button-elem">
                <svg viewBox="0 0 46 40" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z">
                    </path>
                </svg>
            </span>
            <span class="button-elem">
                <svg viewBox="0 0 46 40">
                    <path
                        d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z">
                    </path>
                </svg>
            </span>
        </div>
    </button>
</template>