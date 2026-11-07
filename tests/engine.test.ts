import { describe, expect, it } from 'vitest'
import {
  createGame,
  startGame,
  stepGame,
  shoot,
  togglePause,
  WIDTH,
  HEIGHT,
} from '../app/game/engine'
const idle = { left: false, right: false, fire: false }

describe('arcade simulation', () => {
  it('starts a fresh run with 55 invaders, three lives and five shields', () => {
    const g = createGame()
    startGame(g)
    expect(g.status).toBe('playing')
    expect(g.enemies).toHaveLength(55)
    expect(g.lives).toBe(3)
    expect(g.bunkers).toHaveLength(5)
    expect(g.score).toBe(0)
  })
  it('clamps the player inside the playfield', () => {
    const g = createGame()
    startGame(g)
    for (let i = 0; i < 300; i++) stepGame(g, 0.016, { ...idle, right: true })
    expect(g.playerX).toBeLessThanOrEqual(WIDTH - 30)
    expect(g.playerX).toBeGreaterThan(WIDTH / 2)
  })
  it('freezes simulation and disallows firing while paused', () => {
    const g = createGame()
    startGame(g)
    togglePause(g)
    const x = g.playerX
    stepGame(g, 0.1, { ...idle, right: true, fire: true })
    shoot(g)
    expect(g.playerX).toBe(x)
    expect(g.bullets).toHaveLength(0)
  })
  it('awards points exactly once for a destroyed enemy', () => {
    const g = createGame()
    startGame(g)
    const e = g.enemies[0]!
    g.bullets.push({ x: e.x + 16, y: e.y + 17, vy: -640, enemy: false })
    stepGame(g, 0.001, idle)
    expect(g.enemies).toHaveLength(54)
    expect(g.score).toBe(30)
    expect(g.kills).toBe(1)
    stepGame(g, 0.001, idle)
    expect(g.score).toBe(30)
  })
  it('prevents duplicate shots until the cooldown elapses', () => {
    const g = createGame()
    startGame(g)
    shoot(g)
    shoot(g)
    expect(g.bullets).toHaveLength(1)
    expect(g.shots).toBe(1)
  })
  it('enemy shots consume a single life and give temporary invulnerability', () => {
    const g = createGame()
    startGame(g)
    g.bullets.push(
      ...[1, 2].map(() => ({
        x: g.playerX,
        y: HEIGHT - 47,
        vy: 200,
        enemy: true,
      })),
    )
    stepGame(g, 0.001, idle)
    expect(g.lives).toBe(2)
    expect(g.invulnerable).toBeGreaterThan(0)
  })
  it('bullets erode bunker cells', () => {
    const g = createGame()
    startGame(g)
    const b = g.bunkers[0]!
    const cell = b.cells.find((c) => c.alive)!
    g.bullets.push({
      x: b.x + cell.x + 3,
      y: b.y + cell.y + 3,
      vy: 200,
      enemy: true,
    })
    stepGame(g, 0.001, idle)
    expect(cell.alive).toBe(false)
  })
  it('advances to a harder wave after clearing the formation', () => {
    const g = createGame()
    startGame(g)
    g.enemies = []
    stepGame(g, 0.01, idle)
    expect(g.wave).toBe(2)
    expect(g.enemies).toHaveLength(55)
  })
  it('ends a run when invaders reach the player', () => {
    const g = createGame()
    startGame(g)
    g.enemies[0]!.y = HEIGHT - 60
    stepGame(g, 0.001, idle)
    expect(g.status).toBe('gameover')
  })
  it('restart restores run state and remembers difficulty', () => {
    const g = createGame()
    startGame(g, 'hard')
    g.score = 123
    g.lives = 1
    startGame(g)
    expect(g.score).toBe(0)
    expect(g.lives).toBe(3)
    expect(g.wave).toBe(1)
    expect(g.difficulty).toBe('hard')
  })
})
