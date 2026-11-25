import { cx } from '@/components/ds'

/** Marca provisória até chegar a identidade feita pelo Rodrigo. */
export function Selo({ tamanho = 34, className }: { tamanho?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-ink font-title font-extrabold text-on-ink', className)}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.5 }}
    >
      R
      <span className="absolute right-0 bottom-0 h-[34%] w-[34%] rounded-tl-[6px] bg-brand" />
    </span>
  )
}

export function Marca({ sub }: { sub?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Selo />
      <span className="min-w-0">
        <span className="block truncate font-title text-[15px] leading-tight font-bold tracking-[-0.01em] text-ink">Raul Consórcios</span>
        <span className="block truncate text-[11.5px] text-dim">{sub ?? 'Multimarcas'}</span>
      </span>
    </span>
  )
}
