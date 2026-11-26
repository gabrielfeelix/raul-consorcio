'use client'

import { useEffect, useRef } from 'react'

/**
 * Fundo das telas de acesso: foto de arquitetura ao anoitecer (Unsplash, licença livre),
 * escurecida em direção ao cartão de login. Movimento discreto: aproximação lenta da foto
 * e um leve deslocamento com o mouse. Tudo parado com "reduzir movimento".
 */
export function FundoAcesso() {
  const foto = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let alvoX = 0
    let alvoY = 0
    let x = 0
    let y = 0
    const mover = (e: PointerEvent) => {
      alvoX = (e.clientX / window.innerWidth - 0.5) * -14
      alvoY = (e.clientY / window.innerHeight - 0.5) * -10
    }
    const passo = () => {
      x += (alvoX - x) * 0.05
      y += (alvoY - y) * 0.05
      if (foto.current) foto.current.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
      raf = requestAnimationFrame(passo)
    }
    window.addEventListener('pointermove', mover)
    raf = requestAnimationFrame(passo)
    return () => {
      window.removeEventListener('pointermove', mover)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div ref={foto} className="absolute -inset-6">
        <div className="fundo-foto absolute inset-0 bg-cover bg-[center_42%]" style={{ backgroundImage: 'url(/login-fundo.webp)' }} />
      </div>
      {/* escurece da esquerda (foto visível) para a direita (onde fica o login) */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_11_13/0.52)_0%,rgb(10_11_13/0.66)_42%,rgb(10_11_13/0.9)_68%,rgb(10_11_13/0.96)_100%)]" />
      {/* base e topo mais escuros, para o texto respirar */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_11_13/0.55)_0%,transparent_28%,transparent_62%,rgb(10_11_13/0.8)_100%)]" />
      {/* no celular o login fica por cima da foto: escurece por igual */}
      <div className="absolute inset-0 bg-[rgb(10_11_13/0.45)] lg:hidden" />
    </div>
  )
}
