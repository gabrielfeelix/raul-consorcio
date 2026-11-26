'use client'

import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import { ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import type { Nivel } from '@/lib/tipos'
import { iniciais } from '@/lib/regras'
import { Portal } from './controles'

export * from './controles'

export function cx(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(' '))
}

/* ---------------- Cabeçalho da página ---------------- */

export function PageHeader({ title, subtitle, actions, trilha }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; trilha?: Array<{ rotulo: string; href?: string }> }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        {trilha && (
          <nav aria-label="Trilha" className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px]">
            {trilha.map((p, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-faint">/</span>}
                {p.href ? (
                  <Link href={p.href} className="text-dim transition-colors hover:text-ink">
                    {p.rotulo}
                  </Link>
                ) : (
                  <span className="font-medium text-soft">{p.rotulo}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-title text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink sm:text-[27px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/* ---------------- Cartão ---------------- */

export function Card({ className, children, ...rest }: ComponentProps<'section'>) {
  return (
    <section className={cx('rounded-[12px] bg-panel shadow-card', className)} {...rest}>
      {children}
    </section>
  )
}

export function CardHeader({ title, count, extra, action, className }: { title: ReactNode; count?: ReactNode; extra?: ReactNode; action?: { label: string; href: string } | ReactNode; className?: string }) {
  const ehLink = typeof action === 'object' && action !== null && 'href' in (action as object) && 'label' in (action as object)
  return (
    <div className={cx('flex min-h-[52px] items-center gap-3 px-4 pt-3 pb-2.5 sm:px-5', className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h2 className="flex items-center gap-2 font-title text-[15.5px] font-semibold tracking-[-0.01em] whitespace-nowrap text-ink">
          {title}
          {count !== undefined && <Contagem>{count}</Contagem>}
        </h2>
        {extra && <span className="text-[13px] text-faint">{extra}</span>}
      </div>
      {action && (
        <div className="shrink-0">
          {ehLink ? (
            <Link href={(action as { href: string }).href} className="group flex items-center gap-0.5 text-[13px] font-medium text-dim transition-colors hover:text-ink">
              {(action as { label: string }).label}
              <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-suave group-hover:translate-x-0.5" />
            </Link>
          ) : (
            (action as ReactNode)
          )}
        </div>
      )}
    </div>
  )
}

export function Contagem({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'vermelho' | 'escuro' }) {
  return (
    <span
      className={cx(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11.5px] font-semibold',
        tom === 'vermelho' && 'bg-brand text-white',
        tom === 'escuro' && 'bg-ink text-on-ink',
        tom === 'neutro' && 'bg-sunken text-dim',
      )}
    >
      {children}
    </span>
  )
}

/* ---------------- Botões ---------------- */

type Variante = 'primario' | 'marca' | 'secundario' | 'fantasma' | 'perigo' | 'whatsapp'
type Tamanho = 'sm' | 'md' | 'lg'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-ink text-on-ink hover:bg-ink-press',
  marca: 'bg-brand text-white hover:bg-brand-press',
  secundario: 'bg-panel text-ink border border-line shadow-[0_1px_2px_rgb(17_17_17/0.04)] hover:bg-sunken',
  fantasma: 'text-soft hover:bg-sunken hover:text-ink',
  perigo: 'bg-panel text-danger border border-line hover:bg-danger-weak hover:border-transparent',
  whatsapp: 'bg-whats-weak text-whats hover:bg-whats-weak-2',
}
const TAMANHOS: Record<Tamanho, string> = {
  sm: 'h-8 gap-1.5 rounded-[7px] px-2.5 text-[12.5px] [&_svg]:size-3.5',
  md: 'h-9 gap-2 rounded-[8px] px-3.5 text-[13.5px] [&_svg]:size-4',
  lg: 'h-11 gap-2 rounded-[9px] px-5 text-[14.5px] [&_svg]:size-[18px]',
}

export function botaoClasse(variante: Variante = 'primario', tamanho: Tamanho = 'md', extra?: string) {
  return cx('clicavel inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-50', VARIANTES[variante], TAMANHOS[tamanho], extra)
}

export function Botao({ variante = 'primario', tamanho = 'md', className, type = 'button', ...rest }: ComponentProps<'button'> & { variante?: Variante; tamanho?: Tamanho }) {
  return <button type={type} className={botaoClasse(variante, tamanho, className)} {...rest} />
}

export function BotaoLink({ variante = 'primario', tamanho = 'md', className, ...rest }: ComponentProps<typeof Link> & { variante?: Variante; tamanho?: Tamanho }) {
  return <Link className={botaoClasse(variante, tamanho, className)} {...rest} />
}

/* ---------------- Pílula / estado ---------------- */

type TomPilula = 'neutro' | 'ok' | 'aviso' | 'perigo' | 'escuro' | 'marca' | 'info'

export function Pilula({ tom = 'neutro', children, className }: { tom?: TomPilula; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap',
        tom === 'neutro' && 'bg-sunken text-dim',
        tom === 'ok' && 'bg-ok-weak text-ok',
        tom === 'aviso' && 'bg-warn-weak text-warn',
        tom === 'perigo' && 'bg-danger-weak text-danger',
        tom === 'escuro' && 'bg-ink text-on-ink',
        tom === 'marca' && 'bg-brand-weak text-brand',
        tom === 'info' && 'bg-info-weak text-info',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Progresso({ valor, tom = 'ink', className }: { valor: number; tom?: 'ink' | 'marca' | 'ok'; className?: string }) {
  const pct = Math.max(0, Math.min(100, valor))
  return (
    <span className={cx('block h-1.5 overflow-hidden rounded-full bg-sunken-2', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span className={cx('cresce-x block h-full rounded-full', tom === 'ink' && 'bg-ink', tom === 'marca' && 'bg-brand', tom === 'ok' && 'bg-ok')} style={{ width: `${pct}%` }} />
    </span>
  )
}

/* ---------------- Avatar / nível ---------------- */

/** Tons calmos, sem saturação: o avatar identifica, não chama atenção. */
const CORES_AVATAR = ['#6b7280', '#8a6f5a', '#5f7a6e', '#6a6f8f', '#8a6476', '#7a7a5c']

export function Avatar({ nome, tamanho = 32, className, foto }: { nome: string; tamanho?: number; className?: string; foto?: string }) {
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  if (foto)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt="" aria-hidden width={tamanho} height={tamanho} className={cx('shrink-0 rounded-full object-cover', className)} style={{ width: tamanho, height: tamanho }} />
  return (
    <span
      aria-hidden
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.01em]', className)}
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: tamanho * 0.36,
        background: `color-mix(in oklab, ${CORES_AVATAR[h % CORES_AVATAR.length]} 18%, var(--panel))`,
        color: `color-mix(in oklab, ${CORES_AVATAR[h % CORES_AVATAR.length]} 80%, var(--ink))`,
      }}
    >
      {iniciais(nome)}
    </span>
  )
}

export function Medalha({ nivel, tamanho = 'sm' }: { nivel: Nivel; tamanho?: 'sm' | 'md' }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border border-line bg-panel font-semibold text-ink', tamanho === 'sm' ? 'h-6 px-2 text-[12px]' : 'h-8 px-3 text-[13px]')}>
      <span className={cx('rounded-full', tamanho === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} style={{ background: nivel.cor, boxShadow: `0 0 0 2px ${nivel.cor}33` }} />
      {nivel.nome}
    </span>
  )
}

/* ---------------- Campos ---------------- */

/** Rótulo + controle. Use `grupo` quando o controle não é um input nativo (Selecao, CampoData, chips):
 *  vira um grupo nomeado em vez de <label>, para o clique no rótulo não acionar o primeiro botão. */
export function Campo({ rotulo, dica, obrigatorio, children, className, grupo }: { rotulo: string; dica?: ReactNode; obrigatorio?: boolean; children: ReactNode; className?: string; grupo?: boolean }) {
  const Tag = grupo ? 'div' : 'label'
  return (
    <Tag className={cx('flex flex-col gap-1.5', className)} {...(grupo ? { role: 'group', 'aria-label': rotulo } : {})}>
      <span className="text-[13px] font-medium text-soft">
        {rotulo}
        {obrigatorio ? <span className="ml-0.5 text-brand">*</span> : obrigatorio === false ? <span className="ml-1.5 text-[12px] font-normal text-faint">opcional</span> : null}
      </span>
      {children}
      {dica && <span className="text-[12px] text-faint">{dica}</span>}
    </Tag>
  )
}

export function Segmentado<T extends string>({ opcoes, valor, onChange, className }: { opcoes: { id: T; rotulo: string }[]; valor: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx('inline-flex rounded-[9px] bg-sunken-2/70 p-1', className)}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={valor === o.id}
          onClick={() => onChange(o.id)}
          className={cx('clicavel h-8 rounded-[7px] px-3 text-[13px] font-semibold whitespace-nowrap', valor === o.id ? 'bg-panel text-ink shadow-[0_1px_3px_rgb(17_17_17/0.1)]' : 'text-dim hover:text-ink')}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Vazio ---------------- */

export function Vazio({ icone, titulo, texto, acao }: { icone?: ReactNode; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icone && <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] bg-sunken text-dim [&_svg]:size-5">{icone}</div>}
      <p className="font-title text-[15px] font-semibold text-ink">{titulo}</p>
      {texto && <p className="mt-1 max-w-[42ch] text-[13px] text-dim">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}

/* ---------------- Modal / painel lateral ---------------- */

export function Modal({ aberto, onFechar, titulo, subtitulo, children, rodape, largura = 520, icone }: { aberto: boolean; onFechar: () => void; titulo: ReactNode; subtitulo?: ReactNode; children: ReactNode; rodape?: ReactNode; largura?: number; icone?: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.fixed.z-\\[80\\]')) onFechar()
    }
    window.addEventListener('keydown', k)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // foco inicial: primeiro campo com autoFocus, senão a própria caixa
    requestAnimationFrame(() => {
      if (!caixa.current?.contains(document.activeElement)) caixa.current?.focus()
    })
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = overflow
      anterior?.focus?.({ preventScroll: true })
    }
  }, [aberto, onFechar])
  if (!aberto) return null
  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
        <div className="entra-fundo absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={onFechar} />
        <div ref={caixa} tabIndex={-1} role="dialog" aria-modal className="entra-pop relative flex max-h-[92dvh] w-full flex-col rounded-t-[16px] bg-panel shadow-modal outline-none focus-visible:outline-none sm:rounded-[16px]" style={{ maxWidth: largura }}>
          <div className="flex items-start gap-3 px-5 pt-5 pb-3 sm:px-6">
            {icone && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-sunken text-soft [&_svg]:size-[18px]">{icone}</span>}
            <div className="min-w-0 flex-1">
              <h2 className="font-title text-[18px] font-bold tracking-[-0.01em] text-ink">{titulo}</h2>
              {subtitulo && <p className="mt-0.5 text-[13px] text-dim">{subtitulo}</p>}
            </div>
            <button onClick={onFechar} aria-label="Fechar" className="clicavel -mt-1 -mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-sunken hover:text-ink">
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="rolagem-fina min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
          {rodape && <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3.5 pb-[max(14px,env(safe-area-inset-bottom))] sm:px-6">{rodape}</div>}
        </div>
      </div>
    </Portal>
  )
}

/* ---------------- Botão de ícone (ações rápidas) ---------------- */

export function BotaoIcone({ rotulo, children, className, tom = 'neutro', ...rest }: ComponentProps<'button'> & { rotulo: string; tom?: 'neutro' | 'whats' | 'aviso' }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      className={cx(
        'clicavel inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-line bg-panel text-soft [&_svg]:size-[17px]',
        tom === 'neutro' && 'hover:bg-sunken hover:text-ink',
        tom === 'whats' && 'border-transparent bg-whats-weak text-whats hover:bg-whats-weak-2',
        tom === 'aviso' && 'hover:border-transparent hover:bg-warn-weak hover:text-warn',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------- Caixa de seleção ---------------- */

export function Marcador({ marcado, onChange, children, className }: { marcado: boolean; onChange: (v: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-2.5 text-[13px] text-soft select-none', className)}>
      <input type="checkbox" checked={marcado} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={cx('mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink', marcado ? 'border-ink bg-ink text-on-ink' : 'border-line bg-panel')}>
        {marcado && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2.5 6.2 2.3 2.3 4.7-5" />
          </svg>
        )}
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  )
}

/* ---------------- Métrica ---------------- */

export function Metrica({ rotulo, valor, detalhe, variacao, icone }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; variacao?: number; icone?: ReactNode }) {
  const temVar = variacao !== undefined && isFinite(variacao)
  return (
    <Card className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        {icone && <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-sunken text-dim [&_svg]:size-[15px]">{icone}</span>}
        <span className="text-[13px] font-medium text-dim">{rotulo}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-title text-[28px] leading-none font-bold tracking-[-0.02em] tabular-nums">{valor}</span>
        {temVar && (
          <span title="Comparado ao período anterior, de mesmo tamanho" className={cx('text-[12px] font-semibold tabular-nums', variacao! > 0 ? 'text-ok' : variacao! < 0 ? 'text-danger' : 'text-faint')}>
            {variacao! > 0 ? '↑' : variacao! < 0 ? '↓' : ''} {Math.abs(Math.round(variacao!))}%
          </span>
        )}
      </div>
      {detalhe && <p className="text-[12.5px] leading-snug text-faint">{detalhe}</p>}
    </Card>
  )
}

/* ---------------- Dica (tooltip dos gráficos) ---------------- */

/** Mostra o número ao passar o mouse (ou focar com o teclado) em qualquer parte colorida de um gráfico. */
export function Dica({ conteudo, children, className, style }: { conteudo: ReactNode; children?: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span tabIndex={0} className={cx('group/dica relative outline-none', className)} style={style}>
      {children}
      <span
        role="tooltip"
        className="entra-dica pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 hidden w-max max-w-[220px] -translate-x-1/2 rounded-[8px] border border-line bg-panel px-2.5 py-1.5 text-[12.5px] leading-snug font-medium text-ink shadow-pop group-hover/dica:block group-focus-visible/dica:block"
      >
        {conteudo}
      </span>
    </span>
  )
}

/** Conteúdo do tooltip do Recharts no mesmo estilo da Dica. */
export function DicaGrafico({ active, payload, label, rotuloX }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; fill?: string }>; label?: ReactNode; rotuloX?: (l: ReactNode) => ReactNode }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[150px] rounded-[9px] border border-line bg-panel px-3 py-2.5 shadow-pop">
      <p className="mb-1.5 text-[12px] text-dim">{rotuloX ? rotuloX(label) : label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-[13px] text-ink">
          <span className="h-2 w-2 rounded-[3px]" style={{ background: p.color ?? p.fill }} />
          <span className="flex-1 text-soft">{p.name}</span>
          <b className="font-mono font-semibold">{p.value}</b>
        </p>
      ))}
    </div>
  )
}

/* ---------------- Número que conta ---------------- */

function semMovimento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Anima de 0 (ou do valor anterior) até o alvo. Curto e uma vez só: dá vida sem distrair. */
export function useContagem(alvo: number, duracao = 800) {
  const [v, setV] = useState(0)
  const de = useRef(0)
  useEffect(() => {
    if (semMovimento()) {
      setV(alvo)
      de.current = alvo
      return
    }
    const ini = performance.now()
    const origem = de.current
    let raf = 0
    const passo = (t: number) => {
      const k = Math.min(1, (t - ini) / duracao)
      const e = 1 - Math.pow(1 - k, 3)
      setV(origem + (alvo - origem) * e)
      if (k < 1) raf = requestAnimationFrame(passo)
      else de.current = alvo
    }
    raf = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(raf)
      de.current = alvo
    }
  }, [alvo, duracao])
  return v
}

export function Numero({ valor, formato = (n: number) => String(Math.round(n)), duracao }: { valor: number; formato?: (n: number) => string; duracao?: number }) {
  const v = useContagem(valor, duracao)
  return <span className="tabular-nums">{formato(Math.round(v))}</span>
}
