<script setup lang="ts">
defineProps<{ titleId: string }>()
const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
const focusable = () =>
  Array.from(
    panel.value?.querySelectorAll<HTMLElement>(
      'button, a[href], select, [tabindex="0"]',
    ) ?? [],
  ).filter((el) => !el.hasAttribute('disabled'))
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('close')
  }
  if (e.key === 'Tab') {
    const items = focusable(),
      first = items[0],
      last = items.at(-1)
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}
onMounted(() => {
  previousFocus = document.activeElement as HTMLElement
  focusable()[0]?.focus()
  document.addEventListener('keydown', onKey, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey, true)
  previousFocus?.focus({ preventScroll: true })
})
</script>
<template>
  <Teleport to="body"
    ><div class="modal-backdrop" @click.self="emit('close')">
      <div
        ref="panel"
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <slot />
      </div></div
  ></Teleport>
</template>
