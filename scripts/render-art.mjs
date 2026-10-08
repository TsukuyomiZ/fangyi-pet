// Renders every bust the terminal draws to a transparent PNG, 400px tall, with
// headless Edge: `node scripts/render-art.mjs <out dir>`. Then
// `py scripts/terminal_art.py <out dir>` turns them into hooks/terminal-art.ts
// and terminal-art/*.png. Windows only (it drives Edge).
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { join, resolve } from 'node:path'

// The mod imports './x' without an extension, as the engine allows.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context)
    } catch (error) {
      if (specifier.startsWith('.')) return next(`${specifier}.ts`, context)
      throw error
    }
  },
})

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const HEIGHT = 400
const out = resolve(process.argv[2] ?? 'art-out')
mkdirSync(out, { recursive: true })

const hooks = new URL('../hooks/', import.meta.url)
const { fangyiSvg } = await import(new URL('fangyi-svg.ts', hooks))
const { pandaSvg, mifuSvg } = await import(new URL('companions-svg.ts', hooks))

const MOODS = ['idle', 'thinking', 'working', 'speaking', 'done', 'waiting']
const busts = {
  ...Object.fromEntries(MOODS.map(mood => [`fangyi-${mood}`, fangyiSvg(mood, 'bust')])),
  panda: pandaSvg('bust'),
  mifu: mifuSvg('bust'),
}

for (const [name, svg] of Object.entries(busts)) {
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/)
  const width = Math.round((HEIGHT * Number(w)) / Number(h))
  const page = join(out, `${name}.html`)
  writeFileSync(page, `<html><body style="margin:0;background:transparent;overflow:hidden">${svg.replace(
    `width="${w}" height="${h}"`, `width="${width}" height="${HEIGHT}" style="display:block"`)}</body></html>`)
  const png = join(out, `${name}.png`)
  for (let attempt = 0; attempt < 3 && !existsSync(png); attempt++) {
    try {
      execFileSync(EDGE, ['--headless=new', `--user-data-dir=${join(out, 'profile')}`, '--no-first-run',
        '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
        `--screenshot=${png}`, `--window-size=${width + 40},${HEIGHT + 40}`,
        `file:///${page.replaceAll('\\', '/')}`], { stdio: 'ignore', timeout: 40000 })
    } catch {
      // A hung or slow Edge: tried again below.
    }
  }
  // The crop box: the drawing sits at the page's top left.
  writeFileSync(join(out, `${name}.box`), `${width} ${HEIGHT}`)
  console.log(name, existsSync(png) ? 'ok' : 'FAILED')
}
