// Exporta PNGs e favicon.ico a partir dos SVGs da marca.
const { chromium } = require('playwright-core'); const fs = require('fs'); const path = require('path')
const R = process.argv[2]
const exe = path.join(process.env.HOME, '.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell')
const jobs = [
  ['favicon-16.svg', 16, 'favicon-16.png'],
  ['favicon-32.svg', 32, 'favicon-32.png'],
  ['favicon-32.svg', 48, 'favicon-48.png'],
  ['icone-app.svg', 180, 'apple-touch-icon.png'],
  ['icone-app.svg', 192, 'icon-192.png'],
  ['icone-app.svg', 512, 'icon-512.png'],
  ['icone-app-maskable.svg', 512, 'icon-maskable-512.png'],
]
;(async () => {
  fs.mkdirSync(path.join(R, 'png'), { recursive: true })
  const b = await chromium.launch({ executablePath: exe })
  for (const [src, px, out] of jobs) {
    const p = await b.newPage({ viewport: { width: px, height: px } })
    const svg = fs.readFileSync(path.join(R, 'svg', src), 'utf8').replace('<svg ', `<svg width="${px}" height="${px}" `)
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`)
    await p.screenshot({ path: path.join(R, 'png', out), omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } })
    await p.close()
  }
  await b.close()
  // ICO com PNGs embutidos (16, 32, 48)
  const imgs = ['favicon-16.png', 'favicon-32.png', 'favicon-48.png'].map((f) => fs.readFileSync(path.join(R, 'png', f)))
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4)
  let off = 6 + 16 * imgs.length; const dir = []
  imgs.forEach((buf, i) => {
    const s = [16, 32, 48][i]; const e = Buffer.alloc(16)
    e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(off, 12)
    off += buf.length; dir.push(e)
  })
  fs.writeFileSync(path.join(R, 'favicon.ico'), Buffer.concat([head, ...dir, ...imgs]))
  console.log('ok')
})()
