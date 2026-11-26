import { cx } from '@/components/ds'

/** Símbolo da marca (direção C): três volumes que sobem, o último com telhado. Fonte: marca/svg/simbolo-vinho.svg */
export const SIMBOLO_D = 'M0 100L0 56L18 47L18 100ZM24 100L24 44L42 35L42 100ZM48 100L48 32L57 27.5L66 36.5L66 100Z'

/** Cor vem de `currentColor`: vinho por padrão, troque com uma classe text-*. */
export function Selo({ tamanho = 30, className }: { tamanho?: number; className?: string }) {
  return (
    <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center text-[#7A0000]', className)} style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 27.5 66 72.5" style={{ height: '86%', width: 'auto' }} fill="currentColor">
        <path d={SIMBOLO_D} />
      </svg>
    </span>
  )
}

export function Marca() {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Selo />
      <span className="block truncate font-title text-[15.5px] leading-tight tracking-[-0.01em] text-ink">
        <span className="font-semibold">Raul</span> Consórcio
      </span>
    </span>
  )
}
