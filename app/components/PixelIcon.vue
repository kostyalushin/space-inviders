<script setup lang="ts">
import { KITTENS, type KittenKind } from '~/game/kittens'
import { SONIC } from '~/game/sonic'
const props = withDefaults(
  defineProps<{ type?: KittenKind | 'ship' | 'sonic' }>(),
  { type: 'ginger' },
)
const sprite = computed(() =>
  props.type === 'ship'
    ? null
    : props.type === 'sonic'
      ? SONIC
      : KITTENS[props.type],
)
const pixels = computed(() => {
  if (!sprite.value) return []
  return sprite.value.frames[0]!.flatMap((row, y) =>
    [...row].flatMap((color, x) =>
      color === '.' ? [] : [{ x, y, fill: sprite.value!.palette[color] }],
    ),
  )
})
const shipPath = 'M5 0h1v2h1v1h2v2h2v3H0V5h2V3h2V2h1z'
</script>
<template>
  <svg
    :viewBox="
      sprite
        ? `0 0 ${sprite.frames[0]![0]!.length} ${sprite.frames[0]!.length}`
        : '0 0 11 8'
    "
    fill="currentColor"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    <template v-if="sprite">
      <rect
        v-for="p in pixels"
        :key="`${p.x}-${p.y}`"
        :x="p.x"
        :y="p.y"
        width="1"
        height="1"
        :fill="p.fill"
      />
    </template>
    <path v-else :d="shipPath" fill-rule="evenodd" />
  </svg>
</template>
