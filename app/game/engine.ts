export const WIDTH = 840
export const HEIGHT = 580
export type Difficulty = 'easy' | 'normal' | 'hard'
export type Status = 'ready' | 'playing' | 'paused' | 'gameover'
export interface Input {
  left: boolean
  right: boolean
  fire: boolean
}
export interface Enemy {
  x: number
  y: number
  type: number
  frame: number
}
export interface Bullet {
  x: number
  y: number
  vy: number
  enemy: boolean
}
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
export interface Bunker {
  x: number
  y: number
  cells: { x: number; y: number; alive: boolean }[]
}
export interface Game {
  status: Status
  difficulty: Difficulty
  score: number
  wave: number
  lives: number
  playerX: number
  enemies: Enemy[]
  bullets: Bullet[]
  bunkers: Bunker[]
  particles: Particle[]
  direction: number
  marchTimer: number
  fireTimer: number
  shotTimer: number
  invulnerable: number
  elapsed: number
  shots: number
  kills: number
  ufo: { x: number; y: number } | null
  ufoTimer: number
  waveFlash: number
  events: ('shoot' | 'hit' | 'hurt' | 'wave' | 'ufo')[]
}
export function createGame(): Game {
  const g: Game = {
    status: 'ready',
    difficulty: 'normal',
    score: 0,
    wave: 1,
    lives: 3,
    playerX: WIDTH / 2,
    enemies: [],
    bullets: [],
    bunkers: [],
    particles: [],
    direction: 1,
    marchTimer: 0,
    fireTimer: 0,
    shotTimer: 0,
    invulnerable: 0,
    elapsed: 0,
    shots: 0,
    kills: 0,
    ufo: null,
    ufoTimer: 15,
    waveFlash: 0,
    events: [],
  }
  populate(g)
  return g
}
function populate(g: Game) {
  g.enemies = Array.from({ length: 55 }, (_, i) => ({
    x: 125 + (i % 11) * 53,
    y: 95 + Math.floor(i / 11) * 43 + Math.min(g.wave - 1, 5) * 12,
    type: Math.floor(i / 11),
    frame: 0,
  }))
  g.bunkers = [80, 232, 384, 536, 688].map((x) => ({
    x,
    y: HEIGHT - 139,
    cells: Array.from({ length: 120 }, (_, i) => {
      const col = i % 12
      const row = Math.floor(i / 12)
      return {
        x: col * 6,
        y: row * 6,
        alive:
          !(row < 2 && (col < 2 - row || col > 9 + row)) &&
          !(row > 5 && col > 3 && col < 8),
      }
    }),
  }))
  g.bullets = []
  g.direction = 1
  g.marchTimer = 0
  g.fireTimer = 0
  g.ufo = null
}
export function startGame(g: Game, difficulty: Difficulty = g.difficulty) {
  Object.assign(g, createGame(), { status: 'playing', difficulty })
  g.waveFlash = 1.5
}
export function togglePause(g: Game) {
  if (g.status === 'playing') g.status = 'paused'
  else if (g.status === 'paused') g.status = 'playing'
}
export function shoot(g: Game) {
  if (g.status !== 'playing' || g.shotTimer > 0) return
  g.bullets.push({ x: g.playerX, y: HEIGHT - 64, vy: -640, enemy: false })
  g.shotTimer = 0.24
  g.shots++
  g.events.push('shoot')
}
function burst(g: Game, x: number, y: number, color: string) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 35 + Math.random() * 110
    g.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      color,
    })
  }
}
export function stepGame(g: Game, delta: number, input: Input) {
  if (g.status !== 'playing') return
  const dt = Math.min(delta, 0.05)
  g.elapsed += dt
  g.shotTimer = Math.max(0, g.shotTimer - dt)
  g.invulnerable = Math.max(0, g.invulnerable - dt)
  g.waveFlash = Math.max(0, g.waveFlash - dt)
  g.playerX = Math.max(
    30,
    Math.min(
      WIDTH - 30,
      g.playerX + (Number(input.right) - Number(input.left)) * 330 * dt,
    ),
  )
  if (input.fire) shoot(g)
  const speed = { easy: 0.78, normal: 1, hard: 1.35 }[g.difficulty]
  const interval = Math.max(
    0.065,
    (0.64 - (55 - g.enemies.length) * 0.009 - (g.wave - 1) * 0.045) / speed,
  )
  g.marchTimer += dt
  if (g.marchTimer >= interval) {
    g.marchTimer = 0
    const edge = g.enemies.some(
      (e) =>
        e.x + g.direction * 12 < 30 || e.x + 32 + g.direction * 12 > WIDTH - 30,
    )
    if (edge) g.direction *= -1
    for (const e of g.enemies) {
      e.x += edge ? 0 : g.direction * 12
      e.y += edge ? 18 : 0
      e.frame = 1 - e.frame
    }
  }
  g.fireTimer += dt
  if (
    g.fireTimer > Math.max(0.26, (0.9 - g.wave * 0.045) / speed) &&
    g.enemies.length
  ) {
    g.fireTimer = 0
    const candidates = g.enemies.filter(
      (e) =>
        !g.enemies.some(
          (other) => Math.abs(other.x - e.x) < 5 && other.y > e.y,
        ),
    )
    const e = candidates[Math.floor(Math.random() * candidates.length)]!
    g.bullets.push({
      x: e.x + 16,
      y: e.y + 26,
      vy: (175 + g.wave * 12) * speed,
      enemy: true,
    })
  }
  g.ufoTimer -= dt
  if (g.ufoTimer <= 0 && !g.ufo) {
    g.ufo = { x: -50, y: 42 }
    g.ufoTimer = 18 + Math.random() * 10
  }
  if (g.ufo) {
    g.ufo.x += 105 * dt
    if (g.ufo.x > WIDTH + 50) g.ufo = null
  }
  const removed = new Set<Bullet>()
  for (const b of g.bullets) {
    b.y += b.vy * dt
    if (b.y < -10 || b.y > HEIGHT) {
      removed.add(b)
      continue
    }
    let shieldHit = false
    for (const bunker of g.bunkers) {
      if (
        b.x < bunker.x ||
        b.x > bunker.x + 72 ||
        b.y < bunker.y - 4 ||
        b.y > bunker.y + 64
      )
        continue
      const cell = bunker.cells.find(
        (c) =>
          c.alive &&
          b.x >= bunker.x + c.x - 2 &&
          b.x <= bunker.x + c.x + 8 &&
          b.y >= bunker.y + c.y - 3 &&
          b.y <= bunker.y + c.y + 9,
      )
      if (cell) {
        cell.alive = false
        for (const c of bunker.cells)
          if (Math.abs(c.x - cell.x) <= 6 && Math.abs(c.y - cell.y) <= 6)
            c.alive = false
        removed.add(b)
        shieldHit = true
        break
      }
    }
    if (shieldHit) continue
    if (!b.enemy) {
      const enemy = g.enemies.find(
        (e) =>
          b.x >= e.x - 2 &&
          b.x <= e.x + 34 &&
          b.y >= e.y - 4 &&
          b.y <= e.y + 28,
      )
      if (enemy) {
        g.enemies.splice(g.enemies.indexOf(enemy), 1)
        g.score += enemy.type === 0 ? 30 : enemy.type < 3 ? 20 : 10
        g.kills++
        removed.add(b)
        g.events.push('hit')
        burst(
          g,
          enemy.x + 16,
          enemy.y + 12,
          enemy.type === 0 ? '#ff714d' : '#e8e9cf',
        )
      } else if (
        g.ufo &&
        Math.abs(b.x - g.ufo.x - 22) < 26 &&
        Math.abs(b.y - g.ufo.y - 10) < 15
      ) {
        burst(g, g.ufo.x + 22, g.ufo.y, '#ff714d')
        g.ufo = null
        g.score += 150
        g.events.push('ufo')
        removed.add(b)
      }
    } else if (
      Math.abs(b.x - g.playerX) < 21 &&
      b.y > HEIGHT - 65 &&
      b.y < HEIGHT - 30
    ) {
      removed.add(b)
      if (g.invulnerable <= 0) {
        g.lives--
        g.invulnerable = 2
        g.events.push('hurt')
        burst(g, g.playerX, HEIGHT - 46, '#ff714d')
        if (g.lives <= 0) g.status = 'gameover'
      }
    }
  }
  g.bullets = g.bullets.filter((b) => !removed.has(b))
  for (const p of g.particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
  }
  g.particles = g.particles.filter((p) => p.life > 0)
  for (const bunker of g.bunkers)
    for (const e of g.enemies)
      if (e.y + 25 >= bunker.y && e.y <= bunker.y + 60) {
        for (const c of bunker.cells)
          if (
            bunker.x + c.x > e.x &&
            bunker.x + c.x < e.x + 32 &&
            bunker.y + c.y < e.y + 26
          )
            c.alive = false
      }
  if (g.enemies.some((e) => e.y + 26 >= HEIGHT - 66)) g.status = 'gameover'
  if (!g.enemies.length && g.status === 'playing') {
    g.wave++
    populate(g)
    g.waveFlash = 2
    g.events.push('wave')
  }
}
