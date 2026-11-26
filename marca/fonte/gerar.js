// Gera a marca Raul Consórcio (direção C) em SVG.
const fs = require('fs')
const path = require('path')
const opentype = require('opentype.js')

const OUT = process.argv[2]
fs.mkdirSync(path.join(OUT, 'svg'), { recursive: true })

const COR = { vinho: '#7A0000', preto: '#111111', branco: '#FFFFFF' }
const fonte = (p) => opentype.parse(fs.readFileSync(require.resolve('@fontsource/montserrat/files/' + p)).buffer.slice(0))
const SEMI = fonte('montserrat-latin-600-normal.woff')
const REG = fonte('montserrat-latin-400-normal.woff')

/* ---------- símbolo ----------
   Três volumes de mesma largura (W) e mesmo espaço (G), base alinhada.
   Os topos seguem UMA diagonal (inclinação K), então os três sobem juntos.
   O terceiro volume continua a diagonal até a cumeeira e desce a 45° até a parede: o telhado. */
const W = 18, G = 6, K = 0.5, BASE = 100, Y0 = 56, CUME = 0.5 // cumeeira no meio do 3º volume
const yLinha = (x) => Y0 - K * x
function simboloPontos() {
  const xs = [0, W + G, 2 * (W + G)]
  const barras = xs.slice(0, 2).map((x) => [[x, BASE], [x, yLinha(x)], [x + W, yLinha(x + W)], [x + W, BASE]])
  const x3 = xs[2]
  const xc = x3 + W * CUME
  const yc = yLinha(xc)
  const yDir = yc + (x3 + W - xc) // desce a 45°
  barras.push([[x3, BASE], [x3, yLinha(x3)], [xc, yc], [x3 + W, yDir], [x3 + W, BASE]])
  return barras
}
const r = (n) => Math.round(n * 100) / 100
const pathDe = (polis, dx = 0, dy = 0, s = 1) => polis.map((p) => 'M' + p.map(([x, y]) => `${r(x * s + dx)} ${r(y * s + dy)}`).join('L') + 'Z').join('')
const SIM = simboloPontos()
function simboloDuasAguas() {
  const b = simboloPontos()
  const x3 = 2 * (W + G), ye = yLinha(x3) + 2
  b[2] = [[x3, BASE], [x3, ye], [x3 + W / 2, ye - W / 2], [x3 + W, ye], [x3 + W, BASE]]
  return b
}
const simTopo = Math.min(...SIM.flat().map((p) => p[1]))
const SIM_W = 3 * W + 2 * G
const SIM_H = BASE - simTopo

/* ---------- texto em curvas ---------- */
function textoPath(partes, x, y, tam, track = -0.01) {
  // partes: [{t, f}] ; tracking em em
  let cx = x
  let d = ''
  for (const { t, f, espaco } of partes) {
    if (espaco) { cx += espaco * tam; continue }
    const glyphs = f.stringToGlyphs(t)
    glyphs.forEach((g, i) => {
      d += g.getPath(cx, y, tam).toPathData(2)
      let adv = g.advanceWidth
      if (i < glyphs.length - 1) adv += f.getKerningValue(g, glyphs[i + 1])
      cx += (adv / f.unitsPerEm) * tam + track * tam
    })
  }
  return { d, largura: cx - x - track * tam }
}
const PARTES = [{ t: 'Raul', f: SEMI }, { espaco: 0.24 }, { t: 'Consórcio', f: REG }]
const CAP = SEMI.tables.os2.sCapHeight / SEMI.unitsPerEm // ~0.70

function svg(vb, corpo, titulo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${titulo}">${corpo}</svg>\n`
}

/* ---------- horizontal ---------- */
function horizontal(corSim, corTxt) {
  const tam = (SIM_H * 0.44) / CAP // altura das maiúsculas = 44% da altura do símbolo
  const gap = W * 1.15
  const centro = simTopo + SIM_H * 0.56 // centro óptico (o símbolo pesa embaixo)
  const base = centro + (CAP * tam) / 2
  const t = textoPath(PARTES, SIM_W + gap, base, tam)
  const largura = SIM_W + gap + t.largura
  const vb = `0 ${r(simTopo)} ${r(largura)} ${r(SIM_H)}`
  return svg(vb, `<path fill="${corSim}" d="${pathDe(SIM)}"/><path fill="${corTxt}" d="${t.d}"/>`, 'Raul Consórcio')
}

/* ---------- vertical ---------- */
function vertical(corSim, corTxt) {
  const tam0 = 10
  const tam = tam0 * (SIM_W * 2.1) / textoPath(PARTES, 0, 0, tam0).largura // texto = 2,1× a largura do símbolo
  const medida = textoPath(PARTES, 0, 0, tam).largura
  const largura = Math.max(medida, SIM_W)
  const sx = (largura - SIM_W) / 2
  const base = BASE + SIM_H * 0.24 + CAP * tam
  const t = textoPath(PARTES, (largura - medida) / 2, base, tam)
  const vb = `0 ${r(simTopo)} ${r(largura)} ${r(base - simTopo + 0.02 * tam)}`
  return svg(vb, `<path fill="${corSim}" d="${pathDe(SIM, sx)}"/><path fill="${corTxt}" d="${t.d}"/>`, 'Raul Consórcio')
}

/* ---------- símbolo isolado ---------- */
const simbolo = (cor) => svg(`0 ${r(simTopo)} ${SIM_W} ${r(SIM_H)}`, `<path fill="${cor}" d="${pathDe(SIM)}"/>`, 'Raul Consórcio')

/* ---------- favicons desenhados no pixel ----------
   16 px: sem diagonal (vira borrão). Degraus retos + telhado de 2 px no 3º volume.
   32 px: diagonal em passos inteiros, telhado com cumeeira no pixel. */
const fav16 = (cor) =>
  svg('0 0 16 16', `<path fill="${cor}" d="M1 15V9h4v6zM6 15V6h4v9zM11 15V4l2-2 2 2v11z" shape-rendering="crispEdges"/>`, 'Raul Consórcio')
function fav32(cor) {
  // grade 32: volumes de 8 px, espaço de 2 px, margem 2; todos os vértices caem em pixel inteiro
  const w = 8, x = [2, 12, 22], base = 30
  const yl = (xx) => 18 - 0.5 * (xx - 2)
  const b1 = [[x[0], base], [x[0], yl(x[0])], [x[0] + w, yl(x[0] + w)], [x[0] + w, base]]
  const b2 = [[x[1], base], [x[1], yl(x[1])], [x[1] + w, yl(x[1] + w)], [x[1] + w, base]]
  const xc = x[2] + 4, yc = yl(xc)
  const b3 = [[x[2], base], [x[2], yl(x[2])], [xc, yc], [x[2] + w, yc + 4], [x[2] + w, base]]
  return svg('0 0 32 32', `<path fill="${cor}" d="${pathDe([b1, b2, b3])}"/>`, 'Raul Consórcio')
}

/* ---------- ícone de app (fundo vinho, símbolo branco) ----------
   maskable: símbolo dentro da zona segura (círculo de 80%). */
function icone(lado = 512, escala = 0.5, fundo = COR.vinho, cor = COR.branco, raio = 0) {
  const s = (lado * escala) / SIM_H
  const dx = (lado - SIM_W * s) / 2
  const dy = (lado - SIM_H * s) / 2 - simTopo * s + lado * 0.01
  const bg = raio ? `<rect width="${lado}" height="${lado}" rx="${raio}" fill="${fundo}"/>` : `<rect width="${lado}" height="${lado}" fill="${fundo}"/>`
  return svg(`0 0 ${lado} ${lado}`, bg + `<path fill="${cor}" d="${pathDe(SIM, dx, dy, s)}"/>`, 'Raul Consórcio')
}

const arquivos = {
  'simbolo-vinho.svg': simbolo(COR.vinho),
  'simbolo-preto.svg': simbolo(COR.preto),
  'simbolo-branco.svg': simbolo(COR.branco),
  'logo-horizontal.svg': horizontal(COR.vinho, COR.preto),
  'logo-horizontal-vinho.svg': horizontal(COR.vinho, COR.vinho),
  'logo-horizontal-preto.svg': horizontal(COR.preto, COR.preto),
  'logo-horizontal-branco.svg': horizontal(COR.branco, COR.branco),
  'logo-vertical.svg': vertical(COR.vinho, COR.preto),
  'logo-vertical-vinho.svg': vertical(COR.vinho, COR.vinho),
  'logo-vertical-preto.svg': vertical(COR.preto, COR.preto),
  'logo-vertical-branco.svg': vertical(COR.branco, COR.branco),
  'favicon-16.svg': fav16(COR.vinho),
  'favicon-32.svg': fav32(COR.vinho),
  'favicon.svg': fav32(COR.vinho),
  'icone-app.svg': icone(512, 0.5),
  'icone-app-maskable.svg': icone(512, 0.42),
  'alternativa-duas-aguas.svg': svg(`0 ${r(simTopo - 2)} ${SIM_W} ${r(SIM_H + 2)}`, `<path fill="${COR.vinho}" d="${pathDe(simboloDuasAguas())}"/>`, 'Alternativa'),
}
for (const [n, c] of Object.entries(arquivos)) fs.writeFileSync(path.join(OUT, 'svg', n), c)
console.log(Object.keys(arquivos).length, 'svgs', { SIM_W, SIM_H: r(SIM_H) })
