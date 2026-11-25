import type { Nivel } from '@/lib/tipos'
import { cx } from '@/components/ds'

/**
 * Ilustração do nível: medalha ou troféu desenhados em SVG, chapados (sem degradê).
 * O Raul escolhe só a cor do miolo; o resto é a mesma peça para todos os níveis.
 */
export function Insignia({ cor, tipo = 'medalha', tamanho = 56, apagada, className, numero }: { cor: string; tipo?: 'medalha' | 'trofeu'; tamanho?: number; apagada?: boolean; className?: string; numero?: number }) {
  const claro = `color-mix(in oklab, ${cor} 55%, white)`
  const escuro = `color-mix(in oklab, ${cor} 70%, black)`
  const aro = 'color-mix(in oklab, var(--ink) 12%, var(--panel))'
  const aroEscuro = 'color-mix(in oklab, var(--ink) 22%, var(--panel))'
  return (
    <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} aria-hidden className={cx('shrink-0', apagada && 'opacity-35 grayscale', className)}>
      {tipo === 'medalha' ? (
        <>
          {/* fita */}
          <path d="M20 4h10l6 18h-10z" fill={escuro} />
          <path d="M44 4H34l-6 18h10z" fill={cor} />
          {/* aro */}
          <circle cx="32" cy="40" r="20" fill={aroEscuro} />
          <circle cx="32" cy="40" r="18" fill={aro} />
          {/* miolo */}
          <circle cx="32" cy="40" r="14" fill={cor} />
          <path d="M32 26a14 14 0 0 1 14 14H18a14 14 0 0 1 14-14z" fill={claro} opacity="0.35" />
          {numero !== undefined ? (
            <text x="32" y="45.5" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="var(--font-archivo), sans-serif" fill="white">
              {numero}
            </text>
          ) : (
            <path d="m32 32.5 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" fill="white" opacity="0.92" />
          )}
        </>
      ) : (
        <>
          {/* alças */}
          <path d="M14 10h7v5h-4.5c.3 7.5 3.2 12 8 14.5l-2.3 4C15.6 30.2 12 23 12 13a3 3 0 0 1 2-3z" fill={aroEscuro} />
          <path d="M50 10h-7v5h4.5c-.3 7.5-3.2 12-8 14.5l2.3 4C48.4 30.2 52 23 52 13a3 3 0 0 0-2-3z" fill={aroEscuro} />
          {/* taça */}
          <path d="M18 6h28v16c0 9.5-6.3 16-14 16S18 31.5 18 22z" fill={cor} />
          <path d="M18 6h14v32c-7.7 0-14-6.5-14-16z" fill={claro} opacity="0.35" />
          {/* haste e base */}
          <rect x="28.5" y="38" width="7" height="8" fill={aroEscuro} />
          <rect x="21" y="46" width="22" height="5" rx="1.5" fill={aro} />
          <rect x="16" y="51" width="32" height="8" rx="2.5" fill={aroEscuro} />
          <path d="m32 13 2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" fill="white" opacity="0.92" />
        </>
      )}
    </svg>
  )
}

export function InsigniaNivel({ nivel, niveis, ...rest }: { nivel: Nivel; niveis: Nivel[] } & Omit<Parameters<typeof Insignia>[0], 'cor' | 'tipo'>) {
  const ord = [...niveis].sort((a, b) => a.minFechadas - b.minFechadas)
  const tipo = nivel.ilustracao ?? (ord[ord.length - 1]?.id === nivel.id ? 'trofeu' : 'medalha')
  return <Insignia cor={nivel.cor} tipo={tipo} {...rest} />
}
