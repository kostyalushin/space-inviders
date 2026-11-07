<script setup lang="ts">
const helpOpen = ref(false)
const game = ref<{
  focusGame: () => void
  showRecords: () => void
  pause: () => void
} | null>(null)
async function closeHelp() {
  helpOpen.value = false
  await nextTick()
  game.value?.focusGame()
}
watch(helpOpen, (open) => {
  if (open) game.value?.pause()
})
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="#" aria-label="Space Inviders — главная"
        ><span class="brand-mark"><PixelIcon /></span
        ><span
          >space<span class="brand-light">/</span>inviders<span
            class="brand-dot"
            >.</span
          ></span
        ></a
      >
      <nav aria-label="Навигация">
        <a class="nav-link active" href="#arcade" @click="game?.focusGame()"
          >Играть <span class="nav-dot" /></a
        ><button class="nav-link" @click="helpOpen = true">
          Как играть <span>↗</span></button
        ><button class="nav-link" @click="game?.showRecords()">
          Мои рекорды <span>↗</span>
        </button>
      </nav>
      <span class="header-badge"
        ><span class="status-dot" /> ВСЕГДА ГОТОВ К ВТОРЖЕНИЮ</span
      >
    </header>

    <main>
      <section class="intro" aria-labelledby="page-title">
        <div class="eyebrow">
          <span class="small-line" /> КЛАССИКА АРКАД. НОВАЯ ОРБИТА.
        </div>
        <div class="intro-row">
          <h1 id="page-title">SPACE <span>INVIDERS</span><sup>®</sup></h1>
          <div class="intro-copy">
            Они снова здесь.<br />У тебя есть корабль. И всё, что нужно.
          </div>
        </div>
        <div class="intro-bottom">
          <p>Защити Землю. Побей рекорд. Повтори.</p>
          <span
            ><span class="tiny-cross">✳</span> БЕЗ МОНЕТ. БЕЗ СКАЧИВАНИЯ. ПРОСТО
            ИГРАЙ.</span
          >
        </div>
      </section>

      <ArcadeGame ref="game" @help="helpOpen = true" />

      <section class="feature-strip" aria-label="Особенности игры">
        <div>
          <span class="feature-number">01 /</span>
          <div>
            <strong>Знакомая с 1978-го.</strong>
            <p>Та самая механика. Всё ещё затягивает.</p>
          </div>
          <PixelIcon type="ginger" />
        </div>
        <div>
          <span class="feature-number">02 /</span>
          <div>
            <strong>Каждая волна — вызов.</strong>
            <p>Меньше котят. Больше скорости.</p>
          </div>
          <span class="feature-star">↗</span>
        </div>
        <div>
          <span class="feature-number">03 /</span>
          <div>
            <strong>Твой рекорд. Твоя история.</strong>
            <p>Лучшие результаты остаются с тобой.</p>
          </div>
          <span class="feature-star">✳</span>
        </div>
      </section>
    </main>

    <footer>
      <span>СДЕЛАНО ДЛЯ ТЕХ, КТО ПОМНИТ. И ТЕХ, КТО НАЧИНАЕТ.</span
      ><span>ЗЕМЛЯ РАССЧИТЫВАЕТ НА ТЕБЯ <PixelIcon type="ship" /></span
      ><span>EST. 1978 / RE:2026</span>
    </footer>

    <ArcadeModal v-if="helpOpen" title-id="help-title" @close="helpOpen = false"
      ><section class="help-modal">
        <button
          class="modal-close"
          aria-label="Закрыть инструкцию"
          @click="helpOpen = false"
        >
          ×</button
        ><span class="eyebrow">ПРЕДПОЛЁТНЫЙ БРИФИНГ</span>
        <h2 id="help-title">План простой.<br /><span>Спаси Землю.</span></h2>
        <p>
          Лови космических котят, уклоняйся от выстрелов и прячься за укрытиями.
          Если котята доберутся до твоего корабля — миссия окончена.
        </p>
        <div class="help-keys">
          <div><kbd>←</kbd><kbd>→</kbd><span>или A / D — двигаться</span></div>
          <div><kbd>ПРОБЕЛ</kbd><span>стрелять (можно удерживать)</span></div>
          <div><kbd>P</kbd><span>пауза / продолжить</span></div>
          <div><kbd>R</kbd><span>начать заново</span></div>
        </div>
        <p class="help-note">
          На телефоне используй кнопки под игровым полем. Соник приносит 150
          очков. С каждой новой волной котята становятся быстрее.
        </p>
        <button class="primary-button" @click="closeHelp">
          Всё понятно. К полёту <span>↗</span>
        </button>
      </section></ArcadeModal
    >
  </div>
</template>
