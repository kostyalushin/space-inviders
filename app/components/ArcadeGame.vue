<script setup lang="ts">
import {
  createGame,
  startGame,
  stepGame,
  togglePause,
  WIDTH,
  HEIGHT,
  type Difficulty,
  type Status,
} from '~/game/engine'
import { renderGame } from '~/game/render'
import { playRingSound } from '~/game/audio'
const emit = defineEmits<{ help: [] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const field = ref<HTMLElement | null>(null)
const gameColumn = ref<HTMLElement | null>(null)
const selected = ref<Difficulty>('normal')
const sound = ref(true)
const recordModal = ref(false)
const highScore = ref(0)
const runs = ref<{ score: number; wave: number; date: string }[]>([])
const ui = reactive({
  status: 'ready' as Status,
  score: 0,
  lives: 3,
  wave: 1,
  kills: 0,
  shots: 0,
  elapsed: 0,
})
const g = createGame()
const input = { left: false, right: false, fire: false }
let frame = 0,
  previous = 0,
  audio: AudioContext | undefined,
  saved = false
const scoreText = (n: number) => String(n).padStart(5, '0')
const accuracy = computed(() =>
  ui.shots ? Math.min(100, Math.round((ui.kills / ui.shots) * 100)) : 0,
)
const statusLabel = computed(
  () =>
    ({
      ready: 'ОЖИДАНИЕ ПИЛОТА',
      playing: 'МИССИЯ В ПРОЦЕССЕ',
      paused: 'МИССИЯ НА ПАУЗЕ',
      gameover: 'МИССИЯ ЗАВЕРШЕНА',
    })[ui.status],
)
const actionLabel = computed(
  () =>
    ({
      ready: 'Начать игру',
      playing: 'Поставить на паузу',
      paused: 'Продолжить игру',
      gameover: 'Ещё один полёт',
    })[ui.status],
)
function resetInput() {
  input.left = false
  input.right = false
  input.fire = false
}
function sync() {
  Object.assign(ui, {
    status: g.status,
    score: g.score,
    lives: g.lives,
    wave: g.wave,
    kills: g.kills,
    shots: g.shots,
    elapsed: g.elapsed,
  })
  if (g.score > highScore.value) {
    highScore.value = g.score
    persist()
  }
}
function initAudio() {
  if (!sound.value) return
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    /* Audio is optional. */
  }
}
function beep(
  freq: number,
  duration: number,
  kind: OscillatorType = 'square',
  volume = 0.025,
) {
  if (!sound.value || !audio || audio.state !== 'running') return
  const oscillator = audio.createOscillator(),
    gain = audio.createGain()
  oscillator.type = kind
  oscillator.frequency.setValueAtTime(freq, audio.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(40, freq / 3),
    audio.currentTime + duration,
  )
  gain.gain.setValueAtTime(volume, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start()
  oscillator.stop(audio.currentTime + duration)
}
function persist() {
  try {
    localStorage.setItem(
      'space-inviders-v1',
      JSON.stringify({ highScore: highScore.value, runs: runs.value }),
    )
  } catch {
    /* Play normally when storage is unavailable. */
  }
}
function saveRun() {
  if (saved || g.elapsed < 0.2) return
  saved = true
  highScore.value = Math.max(highScore.value, g.score)
  runs.value = [
    {
      score: g.score,
      wave: g.wave,
      date: new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      }),
    },
    ...runs.value,
  ].slice(0, 5)
  persist()
}
function start() {
  initAudio()
  resetInput()
  startGame(g, selected.value)
  saved = false
  sync()
  field.value?.focus({ preventScroll: true })
}
function action() {
  if (g.status === 'ready' || g.status === 'gameover') start()
  else {
    initAudio()
    togglePause(g)
    resetInput()
    sync()
    field.value?.focus({ preventScroll: true })
  }
}
function pause() {
  if (g.status === 'playing') {
    togglePause(g)
    resetInput()
    sync()
  }
}
function restart() {
  if (g.status === 'playing' || g.status === 'paused') saveRun()
  start()
}
function showRecords() {
  pause()
  recordModal.value = true
}
async function closeRecords() {
  recordModal.value = false
  await nextTick()
  focusGame()
}
function focusGame() {
  field.value?.focus({ preventScroll: true })
}
function help() {
  pause()
  emit('help')
}
function toggleSound() {
  sound.value = !sound.value
  initAudio()
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await gameColumn.value?.requestFullscreen()
  } catch {
    /* Browser may not support fullscreen. */
  } finally {
    // Space should control the game, not activate the fullscreen button again.
    focusGame()
  }
}
function onKey(e: KeyboardEvent) {
  if (
    (e.target as HTMLElement)?.matches('input, select, textarea') ||
    document.querySelector('[role="dialog"]')
  )
    return
  const key = e.key.toLowerCase()
  if (
    [' ', 'enter'].includes(key) &&
    (e.target as HTMLElement)?.closest('button, a')
  )
    return
  if (
    ![
      'arrowleft',
      'arrowright',
      'a',
      'd',
      ' ',
      'p',
      'escape',
      'r',
      'enter',
    ].includes(key)
  )
    return
  e.preventDefault()
  if (key === 'arrowleft' || key === 'a') input.left = true
  if (key === 'arrowright' || key === 'd') input.right = true
  if (key === ' ') {
    if (g.status === 'ready' || g.status === 'gameover') {
      if (!e.repeat) start()
    } else input.fire = true
  }
  if (!e.repeat && ['p', 'escape', 'enter'].includes(key)) action()
  if (key === 'r' && !e.repeat) restart()
}
function onKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  if (key === 'arrowleft' || key === 'a') input.left = false
  if (key === 'arrowright' || key === 'd') input.right = false
  if (key === ' ') input.fire = false
}
function touch(e: PointerEvent, key: keyof typeof input, pressed: boolean) {
  e.preventDefault()
  if (pressed) {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    initAudio()
  }
  input[key] = pressed
}
function visibility() {
  if (document.hidden) pause()
}
onMounted(() => {
  try {
    const data = JSON.parse(localStorage.getItem('space-inviders-v1') || '{}')
    if (typeof data.highScore === 'number' && Number.isFinite(data.highScore))
      highScore.value = Math.max(0, data.highScore)
    if (Array.isArray(data.runs))
      runs.value = data.runs
        .filter(
          (r: Record<string, unknown>) =>
            r &&
            typeof r.score === 'number' &&
            Number.isFinite(r.score) &&
            typeof r.wave === 'number' &&
            typeof r.date === 'string',
        )
        .slice(0, 5)
  } catch {
    /* Invalid or blocked storage does not prevent playing. */
  }
  const ctx = canvas.value?.getContext('2d')
  if (ctx && canvas.value) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.value.width = WIDTH * dpr
    canvas.value.height = HEIGHT * dpr
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = false
    const animate = (time: number) => {
      stepGame(g, previous ? (time - previous) / 1000 : 0, input)
      previous = time
      for (const event of g.events) {
        if (event === 'shoot') beep(520, 0.08)
        if (
          (event === 'hit' || event === 'ufo') &&
          sound.value &&
          audio?.state === 'running'
        )
          playRingSound(audio)
        if (event === 'hurt') beep(95, 0.3, 'sawtooth', 0.05)
        if (event === 'wave') beep(780, 0.35, 'triangle', 0.06)
      }
      g.events.length = 0
      renderGame(ctx, g, time)
      sync()
      if (g.status === 'gameover') saveRun()
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', pause)
  document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  persist()
  void audio?.close()
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', pause)
  document.removeEventListener('visibilitychange', visibility)
})
defineExpose({ focusGame, showRecords, pause })
</script>

<template>
  <section id="arcade" class="arcade-layout" aria-label="Космическая аркада">
    <div ref="gameColumn" class="game-column">
      <div
        ref="field"
        class="game-frame"
        tabindex="0"
        aria-label="Игровое поле. Стрелки — движение, пробел — огонь, P — пауза"
      >
        <div class="game-hud">
          <div class="hud-score">
            <span>СЧЁТ</span><strong>{{ scoreText(ui.score) }}</strong>
          </div>
          <div class="hud-record">
            <span>РЕКОРД</span><strong>{{ scoreText(highScore) }}</strong>
          </div>
          <div class="hud-wave">
            <span>ВОЛНА</span
            ><strong>{{ String(ui.wave).padStart(2, '0') }}</strong>
          </div>
        </div>
        <div class="canvas-wrap">
          <canvas
            ref="canvas"
            :width="WIDTH"
            :height="HEIGHT"
            aria-label="Корабль защищает Землю от космических котят"
          />
          <div class="scanlines" />
          <div
            v-if="ui.status !== 'playing'"
            class="game-overlay"
            :class="{ 'ready-overlay': ui.status === 'ready' }"
          >
            <template v-if="ui.status === 'ready'"
              ><div class="orbit-mark"><span /><PixelIcon /><span /></div>
              <span class="overlay-eyebrow"
                >ПЛАНЕТА ОДНА. ПОПЫТОК — СКОЛЬКО УГОДНО.</span
              >
              <h2>ОНИ ИДУТ.<br /><span>ТВОЙ ХОД.</span></h2>
              <p>Маленький корабль. Большая миссия.</p>
              <button class="play-button" @click="start">
                <span class="play-triangle">▶</span> НАЧАТЬ ИГРУ
                <span class="button-arrow">↗</span></button
              ><span class="space-hint"
                >или нажми <kbd>ПРОБЕЛ</kbd></span
              ></template
            >
            <template v-else-if="ui.status === 'paused'"
              ><span class="pause-glyph">Ⅱ</span
              ><span class="overlay-eyebrow">ЗЕМЛЯ ПОДОЖДЁТ МИНУТКУ</span>
              <h2>ПЕРЕДЫШКА<span>.</span></h2>
              <p>Твоя миссия ещё не закончена.</p>
              <button class="play-button" @click="action">
                ▶ &nbsp; ПРОДОЛЖИТЬ <span class="button-arrow">↗</span></button
              ><span class="space-hint"
                ><kbd>P</kbd> — вернуться в игру</span
              ></template
            >
            <template v-else
              ><PixelIcon class="gameover-icon" type="ship" /><span
                class="overlay-eyebrow"
                >ХОРОШИЙ ПОЛЁТ, ПИЛОТ</span
              >
              <h2>GAME OVER<span>.</span></h2>
              <p>
                Твой счёт
                <strong class="end-score">{{ scoreText(ui.score) }}</strong> ·
                Волна {{ ui.wave }}
              </p>
              <button class="play-button" @click="start">
                ↻ &nbsp; ЕЩЁ ОДНА ПОПЫТКА
                <span class="button-arrow">↗</span></button
              ><span class="space-hint"
                >Земля всё ещё верит в тебя.</span
              ></template
            >
          </div>
        </div>
        <div class="game-bottom">
          <div class="lives">
            <PixelIcon
              v-for="i in 3"
              :key="i"
              type="ship"
              :class="{ lost: i > ui.lives }"
            /><span>{{ ui.lives }} ЖИЗНИ</span>
          </div>
          <span class="sector">СЕКТОР 01 / ЗЕМЛЯ</span>
          <div class="field-tools">
            <button
              :aria-label="sound ? 'Выключить звук' : 'Включить звук'"
              :aria-pressed="sound"
              @click="toggleSound"
            >
              <svg viewBox="0 0 24 24">
                <path d="M11 5 6 9H3v6h3l5 4z" />
                <path v-if="sound" d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" />
                <path v-else d="m16 9 5 6m0-6-5 6" />
              </svg></button
            ><button aria-label="Полный экран" @click="fullscreen">
              <svg viewBox="0 0 24 24">
                <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="touch-controls">
        <button
          aria-label="Двигаться влево"
          @pointerdown="touch($event, 'left', true)"
          @pointerup="touch($event, 'left', false)"
          @pointercancel="touch($event, 'left', false)"
          @lostpointercapture="input.left = false"
        >
          ←</button
        ><button
          aria-label="Двигаться вправо"
          @pointerdown="touch($event, 'right', true)"
          @pointerup="touch($event, 'right', false)"
          @pointercancel="touch($event, 'right', false)"
          @lostpointercapture="input.right = false"
        >
          →</button
        ><button
          class="touch-pause"
          :aria-label="ui.status === 'paused' ? 'Продолжить' : 'Пауза'"
          :disabled="ui.status === 'ready' || ui.status === 'gameover'"
          @click="action"
        >
          {{ ui.status === 'paused' ? '▶' : 'Ⅱ' }}</button
        ><button
          class="touch-fire"
          aria-label="Стрелять"
          @pointerdown="touch($event, 'fire', true)"
          @pointerup="touch($event, 'fire', false)"
          @pointercancel="touch($event, 'fire', false)"
          @lostpointercapture="input.fire = false"
        >
          ОГОНЬ &nbsp; ⊕
        </button>
      </div>
      <div class="keyboard-strip">
        <div>
          <kbd>←</kbd><kbd>→</kbd><span>двигаться</span
          ><span class="key-divider" /><kbd>SPACE</kbd><span>стрелять</span
          ><span class="key-divider" /><kbd>P</kbd><span>пауза</span>
        </div>
        <button @click="help">Все клавиши <span>↗</span></button>
      </div>
    </div>

    <aside class="mission-console">
      <div class="console-title">
        <span class="eyebrow">ПУЛЬТ УПРАВЛЕНИЯ</span
        ><span class="console-corner">⌘</span>
      </div>
      <div class="mission-status">
        <span class="status-dot" :class="{ live: ui.status === 'playing' }" />{{
          statusLabel
        }}
      </div>
      <div class="difficulty-section">
        <label for="difficulty">УРОВЕНЬ СЛОЖНОСТИ</label>
        <div class="select-wrap">
          <select
            id="difficulty"
            v-model="selected"
            :disabled="ui.status === 'playing' || ui.status === 'paused'"
          >
            <option value="easy">Лёгкий полёт</option>
            <option value="normal">Классический</option>
            <option value="hard">Последний герой</option></select
          ><span>⌄</span>
        </div>
        <p>
          {{
            selected === 'easy'
              ? 'Чуть больше времени на подвиги.'
              : selected === 'hard'
                ? 'Котики быстрее. Выше ставки.'
                : 'Всё как раньше. Только ты и они.'
          }}
        </p>
      </div>
      <div class="console-actions">
        <button class="primary-button" @click="action">
          <span>{{ ui.status === 'playing' ? 'Ⅱ' : '▶' }}</span
          >{{ actionLabel }}<span>↗</span></button
        ><button
          class="restart-button"
          aria-label="Начать заново"
          title="Начать заново (R)"
          @click="restart"
        >
          ↻
        </button>
      </div>
      <div class="enemy-guide">
        <div class="section-label">
          <span>КОТИКИ НА РАДАРЕ</span><span>ОЧКИ</span>
        </div>
        <div>
          <PixelIcon type="ginger" class="enemy-orange" /><span
            >Рыжий непоседа</span
          ><strong>30</strong>
        </div>
        <div>
          <PixelIcon type="tuxedo" /><span>Котёнок в смокинге</span
          ><strong>20</strong>
        </div>
        <div>
          <PixelIcon type="siamese" /><span>Сиамский соня</span
          ><strong>10</strong>
        </div>
        <div>
          <PixelIcon type="sonic" class="enemy-orange" /><span>Соник</span
          ><strong>150</strong>
        </div>
      </div>
      <div class="run-stats">
        <div class="section-label"><span>ЭТОТ ПОЛЁТ</span><span>↗</span></div>
        <div>
          <span>Поймано</span
          ><strong>{{ String(ui.kills).padStart(2, '0') }}</strong>
        </div>
        <div>
          <span>Точность</span><strong>{{ accuracy }}<small>%</small></strong>
        </div>
        <div>
          <span>Время в бою</span
          ><strong
            >{{
              Math.floor(ui.elapsed / 60)
                .toString()
                .padStart(2, '0')
            }}:{{
              Math.floor(ui.elapsed % 60)
                .toString()
                .padStart(2, '0')
            }}</strong
          >
        </div>
      </div>
      <button class="record-card" @click="showRecords">
        <span class="record-symbol">♜</span
        ><span
          ><span class="section-label">ЛИЧНЫЙ РЕКОРД</span
          ><strong>{{ scoreText(highScore) }}</strong></span
        ><span class="record-arrow">↗</span>
      </button>
      <p class="local-note">
        <span class="small-lock">⌑</span> Рекорды хранятся в твоём браузере
      </p>
    </aside>
    <ArcadeModal
      v-if="recordModal"
      title-id="records-title"
      @close="recordModal = false"
      ><section class="help-modal records-modal">
        <button
          class="modal-close"
          aria-label="Закрыть рекорды"
          @click="recordModal = false"
        >
          ×</button
        ><span class="eyebrow">БОРТОВОЙ ЖУРНАЛ</span>
        <h2 id="records-title">Твои <span>полёты.</span></h2>
        <div class="records-best">
          <span>ЛИЧНЫЙ РЕКОРД</span><strong>{{ scoreText(highScore) }}</strong>
        </div>
        <div v-if="!runs.length" class="records-empty">
          <PixelIcon type="ship" />
          <p>
            Каждая история начинается с первого полёта.<br />Твой рекорд ещё
            впереди.
          </p>
        </div>
        <div v-for="(run, i) in runs" :key="i" class="record-row">
          <span>{{ String(i + 1).padStart(2, '0') }}</span
          ><span>{{ run.date }} · Волна {{ run.wave }}</span
          ><strong>{{ scoreText(run.score) }}</strong>
        </div>
        <button class="primary-button" @click="closeRecords">
          Вернуться к миссии <span>↗</span>
        </button>
      </section></ArcadeModal
    >
  </section>
</template>
