import { WIDTH, HEIGHT, type Game } from './engine'
import { KITTENS, type KittenKind, type KittenSprite } from './kittens'
import { SONIC } from './sonic'
const ship = [
  '00000100000',
  '00001110000',
  '00001110000',
  '00111111100',
  '01111111110',
  '11111111111',
  '11111111111',
  '11111111111',
]
const stars = Array.from({ length: 78 }, (_, i) => ({
  x: (i * 173 + 27) % WIDTH,
  y: (i * 97 + 31) % HEIGHT,
  a: 0.12 + ((i * 13) % 35) / 100,
}))
function pixel(
  ctx: CanvasRenderingContext2D,
  sprite: string[],
  x: number,
  y: number,
  size: number,
  color: string,
  frame = 0,
) {
  ctx.fillStyle = color
  sprite.forEach((row, ry) =>
    [...row].forEach((bit, rx) => {
      if (bit === '1')
        ctx.fillRect(
          Math.round(
            x + rx * size + (ry > 5 && frame ? (ry % 2 ? 1 : -1) * size : 0),
          ),
          Math.round(y + ry * size),
          size,
          size,
        )
    }),
  )
}
function coloredPixel(
  ctx: CanvasRenderingContext2D,
  sprite: KittenSprite,
  x: number,
  y: number,
  size: number,
  frame = 0,
) {
  sprite.frames[frame % sprite.frames.length]!.forEach((row, rowIndex) => {
    for (const [col, color] of [...row].entries()) {
      if (color === '.') continue
      ctx.fillStyle = sprite.palette[color]!
      ctx.fillRect(x + col * size, y + rowIndex * size, size, size)
    }
  })
}
export function renderGame(
  ctx: CanvasRenderingContext2D,
  g: Game,
  time: number,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = '#111c19'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  for (const s of stars) {
    ctx.fillStyle = `rgba(216,225,200,${s.a * (0.65 + Math.sin(time * 0.0006 + s.x) * 0.35)})`
    ctx.fillRect(s.x, s.y, s.a > 0.35 ? 2 : 1, s.a > 0.35 ? 2 : 1)
  }
  ctx.strokeStyle = '#26362d'
  ctx.setLineDash([2, 7])
  ctx.beginPath()
  ctx.moveTo(24, HEIGHT - 24)
  ctx.lineTo(WIDTH - 24, HEIGHT - 24)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.save()
  if (g.status === 'ready') ctx.globalAlpha = 0.18
  for (const e of g.enemies) {
    const kind: KittenKind =
      e.type === 0 ? 'ginger' : e.type < 3 ? 'tuxedo' : 'siamese'
    coloredPixel(ctx, KITTENS[kind], e.x, e.y, 2, e.frame)
  }
  for (const b of g.bunkers) {
    ctx.fillStyle = '#8caa7a'
    for (const c of b.cells)
      if (c.alive) ctx.fillRect(b.x + c.x, b.y + c.y, 5.5, 5.5)
  }
  ctx.restore()
  if (g.invulnerable <= 0 || Math.floor(time / 100) % 2 === 0) {
    ctx.shadowColor = '#c9e0ac'
    ctx.shadowBlur = 13
    pixel(ctx, ship, g.playerX - 22, HEIGHT - 64, 4, '#d7e3be')
    ctx.shadowBlur = 0
    if (g.status === 'playing') {
      ctx.fillStyle = time % 180 < 90 ? '#ff734d' : '#e6ba77'
      ctx.fillRect(g.playerX - 6, HEIGHT - 32, 12, 4 + (time % 6))
    }
  }
  if (g.ufo)
    coloredPixel(ctx, SONIC, g.ufo.x, g.ufo.y - 6, 2, Math.floor(time / 100))
  for (const b of g.bullets) {
    ctx.fillStyle = b.enemy ? '#ff7955' : '#e5edc9'
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 7
    ctx.fillRect(b.x - 2, b.y - 6, 4, b.enemy ? 11 : 16)
  }
  ctx.shadowBlur = 0
  for (const p of g.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 2)
    ctx.fillStyle = p.color
    ctx.fillRect(p.x, p.y, 3, 3)
  }
  ctx.globalAlpha = 1
  if (g.waveFlash > 0 && g.status === 'playing') {
    ctx.textAlign = 'center'
    ctx.font = '12px monospace'
    ctx.fillStyle = '#dee5c9'
    ctx.globalAlpha = Math.min(g.waveFlash, 1)
    ctx.fillText(
      `ВОЛНА ${String(g.wave).padStart(2, '0')} — ВПЕРЁД, ПИЛОТ`,
      WIDTH / 2,
      29,
    )
    ctx.globalAlpha = 1
  }
}
