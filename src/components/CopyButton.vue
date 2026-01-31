<script setup lang="ts">
import { ref } from 'vue'
import Swal from 'sweetalert2'

const props = defineProps<{
  text: string | (() => string)
  icon?: string
  copiedIcon?: string
  copiedText?: string
  duration?: number
  effect?: 'glow' | 'firework' | 'none'
  btnClass?: string
  onCopied?: () => void
  title?: string
}>()

const isCopied = ref(false)

async function doCopy() {
  let copyText = typeof props.text === 'function' ? props.text() : props.text
  if (!copyText || !copyText.trim()) {
    Swal.fire({
      toast: true,
      icon: 'warning',
      title: '沒有可複製的內容',
      position: 'top',
      timer: 1800,
      showConfirmButton: false
    })
    return
  }
  try {
    await navigator.clipboard.writeText(copyText)
    isCopied.value = true
    props.onCopied?.()
    if (props.effect === 'firework') {
      triggerFirework()
    }
    setTimeout(() => {
      isCopied.value = false
    }, props.duration ?? 1800)
  } catch (e) {
    Swal.fire({
      toast: true,
      icon: 'error',
      title: '複製失敗',
      position: 'top',
      timer: 1800,
      showConfirmButton: false
    })
  }
}

function triggerFirework() {
  // firework 動畫，可自訂
  const btn = document.querySelector('.copy-btn-firework')
  if (!btn) return
  const firework = document.createElement('span')
  firework.className = 'copy-firework'
  btn.appendChild(firework)
  setTimeout(() => btn.removeChild(firework), 900)
}
</script>

<template>
  <button
    :class="['btn', btnClass, effect === 'glow' && isCopied ? 'glow-success' : '', effect === 'firework' ? 'copy-btn-firework' : '']"
    @click="doCopy" :title="isCopied ? (copiedText ?? '已複製') : (title ?? '複製')" type="button">
    <i class="bi" :class="isCopied ? (copiedIcon ?? 'bi-check-lg text-success') : (icon ?? 'bi-clipboard')"></i>
    <template v-if="$slots.default">
      <slot />
    </template>
  </button>
</template>

<style scoped>
.copy-firework {
  position: absolute;
  left: 50%;
  top: 0;
  width: 32px;
  height: 32px;
  pointer-events: none;
  background: url('data:image/svg+xml;utf8,<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><g><circle cx="16" cy="16" r="2" fill="gold"/><g stroke="gold" stroke-width="2"><line x1="16" y1="0" x2="16" y2="8"/><line x1="16" y1="24" x2="16" y2="32"/><line x1="0" y1="16" x2="8" y2="16"/><line x1="24" y1="16" x2="32" y2="16"/><line x1="5" y1="5" x2="11" y2="11"/><line x1="21" y1="21" x2="27" y2="27"/><line x1="5" y1="27" x2="11" y2="21"/><line x1="21" y1="11" x2="27" y2="5"/></g></g></svg>') no-repeat center/contain;
  animation: firework-pop 0.9s cubic-bezier(.4, 2, .6, 1) forwards;
  transform: translate(-50%, -50%);
}

@keyframes firework-pop {
  0% {
    opacity: 0;
    transform: scale(0.5) translate(-50%, -50%);
  }

  30% {
    opacity: 1;
    transform: scale(1.2) translate(-50%, -50%);
  }

  100% {
    opacity: 0;
    transform: scale(1.8) translate(-50%, -50%);
  }
}
</style>
