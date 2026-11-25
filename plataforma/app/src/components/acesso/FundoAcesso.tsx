'use client'

import { useEffect, useRef } from 'react'

/**
 * Fundo das telas de acesso: um campo de cartas de crédito desenhadas em traço fino,
 * em três profundidades, que sobem devagar e reagem de leve ao mouse (paralaxe).
 * Monocromático, sem foto e sem brilho colorido. Com "reduzir movimento", fica parado.
 */

const VALORES = ['R$ 80.000', 'R$ 120.000', 'R$ 150.000', 'R$ 200.000', 'R$ 250.000', 'R$ 300.000', 'R$ 350.000', 'R$ 400.000', 'R$ 500.000', 'R$ 650.000', 'R$ 800.000', 'R$ 1.000.000']
const BENS = ['Imóvel', 'Carro', 'Moto', 'Pesados', 'Imóvel', 'Serviços', 'Imóvel', 'Carro']
const PRAZOS = [60, 80, 100, 120, 150, 180, 200, 220]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

interface Carta {
  x: number
  y: number
  rot: number
  valor: string
  bem: string
  prazo: number
  dur: number
  atraso: number
  marca: boolean
  grupo: string
}

function gerar(camada: number, qtd: number): Carta[] {
  const r = rng(97 + camada * 131)
  return Array.from({ length: qtd }, (_, k) => ({
    // distribui em faixas para não amontoar
    x: ((k + r() * 0.8) / qtd) * 112 - 6,
    y: r() * 120 - 10,
    rot: (r() - 0.5) * 14,
    valor: VALORES[Math.floor(r() * VALORES.length)],
    bem: BENS[Math.floor(r() * BENS.length)],
    prazo: PRAZOS[Math.floor(r() * PRAZOS.length)],
    dur: 70 + r() * 60,
    atraso: -r() * 90,
    marca: camada === 2 && k % 4 === 1,
    grupo: String(1000 + Math.floor(r() * 8999)),
  }))
}

const CAMADAS = [
  { escala: 0.62, opac: 0.07, paralaxe: 6, qtd: 9 },
  { escala: 0.82, opac: 0.11, paralaxe: 14, qtd: 7 },
  { escala: 1, opac: 0.17, paralaxe: 26, qtd: 5 },
].map((c, i) => ({ ...c, cartas: gerar(i, c.qtd) }))

function CartaCredito({ c, escala }: { c: Carta; escala: number }) {
  return (
    <div
      className="fundo-carta absolute"
      style={{
        left: `${c.x}%`,
        top: `${c.y}%`,
        animationDuration: `${c.dur}s`,
        animationDelay: `${c.atraso}s`,
      }}
    >
      <div
        className="rounded-[14px] border border-white/90 p-4 text-white"
        style={{ width: 236 * escala, height: 148 * escala, transform: `rotate(${c.rot}deg) scale(1)`, padding: 16 * escala }}
      >
        <div className="flex items-center justify-between" style={{ fontSize: 9.5 * escala }}>
          <span className="tracking-[0.08em]">CARTA DE CRÉDITO</span>
          <span className="font-mono">GR {c.grupo}</span>
        </div>
        {/* chip */}
        <div className="mt-[10%] rounded-[4px] border border-white/90" style={{ width: 26 * escala, height: 19 * escala }} />
        <p className="font-mono font-semibold tracking-[-0.01em]" style={{ fontSize: 19 * escala, marginTop: 10 * escala }}>
          {c.valor}
        </p>
        <div className="flex items-center justify-between" style={{ fontSize: 10 * escala, marginTop: 4 * escala }}>
          <span>
            {c.bem} · {c.prazo} meses
          </span>
          {c.marca && <span className="rounded-full bg-[#ef3b2d]" style={{ width: 6 * escala, height: 6 * escala }} />}
        </div>
      </div>
    </div>
  )
}

export function FundoAcesso() {
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = raiz.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let alvoX = 0
    let alvoY = 0
    let x = 0
    let y = 0
    let raf = 0
    const mover = (e: PointerEvent) => {
      alvoX = e.clientX / window.innerWidth - 0.5
      alvoY = e.clientY / window.innerHeight - 0.5
      if (!raf) raf = requestAnimationFrame(passo)
    }
    const passo = () => {
      x += (alvoX - x) * 0.06
      y += (alvoY - y) * 0.06
      el.style.setProperty('--mx', x.toFixed(4))
      el.style.setProperty('--my', y.toFixed(4))
      raf = Math.abs(alvoX - x) + Math.abs(alvoY - y) > 0.0005 ? requestAnimationFrame(passo) : 0
    }
    window.addEventListener('pointermove', mover)
    return () => {
      window.removeEventListener('pointermove', mover)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={raiz} aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0e0f11]" style={{ ['--mx' as string]: 0, ['--my' as string]: 0 }}>
      <style>{`
        @keyframes fundo-sobe { from { transform: translateY(0); } to { transform: translateY(-38vh); } }
        @keyframes fundo-entra { from { opacity: 0; } to { opacity: 1; } }
        .fundo-carta { animation-name: fundo-sobe; animation-timing-function: linear; animation-iteration-count: infinite; animation-direction: alternate; }
        .fundo-camada { animation: fundo-entra 1.4s cubic-bezier(0.32,0.72,0,1) both; }
        @media (prefers-reduced-motion: reduce) { .fundo-carta { animation: none; } .fundo-camada { animation: none; } }
      `}</style>
      {/* grade de pontos bem discreta */}
      <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.09) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {CAMADAS.map((c, i) => (
        <div
          key={i}
          className="absolute -inset-[6%]"
          style={{ opacity: c.opac, transform: `translate3d(calc(var(--mx) * ${-c.paralaxe}px), calc(var(--my) * ${-c.paralaxe}px), 0)` }}
        >
          <div className="fundo-camada absolute inset-0" style={{ animationDelay: `${i * 180}ms` }}>
            {c.cartas.map((carta, k) => (
              <CartaCredito key={k} c={carta} escala={c.escala} />
            ))}
          </div>
        </div>
      ))}
      {/* no celular o texto fica por cima das cartas: véu uniforme */}
      <div className="absolute inset-0 bg-[#0e0f11]/60 lg:hidden" />
      {/* escurece de leve atrás do título (esquerda) e nas bordas, para o texto respirar */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 22% 52%, rgb(14 15 17 / 0.85) 0%, transparent 100%), radial-gradient(130% 95% at 50% 45%, transparent 45%, rgb(14 15 17 / 0.8) 100%)' }} />
    </div>
  )
}
