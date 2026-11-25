'use client'

/**
 * Controles do design system que substituem os nativos do navegador:
 * Portal, Flutuante (popover ancorado), Selecao (select/combobox com busca),
 * CampoData (calendário), Paginacao e linhas de tabela clicáveis.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cx } from './index'

/* ---------------- Portal ---------------- */

/** Tudo que cobre a tela (modal, menu, calendário) vai direto para o <body>,
 *  fora das animações com transform que criariam um novo bloco de contenção. */
export function Portal({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  return montado ? createPortal(children, document.body) : null
}

/* ---------------- Flutuante (popover ancorado) ---------------- */

export function Flutuante({
  ancora,
  aberto,
  onFechar,
  children,
  largura,
  alinhar = 'inicio',
  className,
}: {
  ancora: React.RefObject<HTMLElement | null>
  aberto: boolean
  onFechar: () => void
  children: ReactNode
  largura?: number | 'ancora'
  alinhar?: 'inicio' | 'fim'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width?: number; acima: boolean } | null>(null)

  const medir = useCallback(() => {
    const a = ancora.current
    if (!a) return
    const r = a.getBoundingClientRect()
    const w = largura === 'ancora' ? Math.max(r.width, 200) : largura ?? 0
    const alturaMenu = ref.current?.offsetHeight ?? 280
    const acima = r.bottom + alturaMenu + 12 > window.innerHeight && r.top > alturaMenu + 12
    const larguraReal = w || ref.current?.offsetWidth || 240
    let left = alinhar === 'fim' ? r.right - larguraReal : r.left
    left = Math.max(8, Math.min(left, window.innerWidth - larguraReal - 8))
    setPos({ top: acima ? r.top - alturaMenu - 6 : r.bottom + 6, left, width: w || undefined, acima })
  }, [ancora, largura, alinhar])

  useLayoutEffect(() => {
    if (!aberto) return setPos(null)
    medir()
    const raf = requestAnimationFrame(medir)
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [aberto, medir])

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || ancora.current?.contains(t)) return
      onFechar()
    }
    const esc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('mousedown', fora)
    window.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      window.removeEventListener('keydown', esc)
    }
  }, [aberto, onFechar, ancora])

  if (!aberto) return null
  return (
    <Portal>
      <div
        ref={ref}
        className={cx('entra-menu fixed z-[80] rounded-2xl border border-line bg-panel p-1.5 shadow-pop', className)}
        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.width, transformOrigin: pos?.acima ? 'bottom left' : 'top left' }}
      >
        {children}
      </div>
    </Portal>
  )
}

/* ---------------- Seleção (select / combobox) ---------------- */

export interface OpcaoSelecao<T extends string> {
  id: T
  rotulo: string
  detalhe?: string
  icone?: ReactNode
  grupo?: string
}

function semAcento(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function Selecao<T extends string>({
  opcoes,
  valor,
  onChange,
  placeholder = 'Selecionar',
  busca,
  className,
  tamanho = 'md',
  rotuloAria,
  prefixo,
  alinhar,
}: {
  opcoes: OpcaoSelecao<T>[]
  valor: T
  onChange: (v: T) => void
  placeholder?: string
  /** Campo de busca no topo. Liga sozinho com mais de 8 opções. */
  busca?: boolean
  className?: string
  tamanho?: 'sm' | 'md'
  rotuloAria?: string
  prefixo?: ReactNode
  alinhar?: 'inicio' | 'fim'
}) {
  const [aberto, setAberto] = useState(false)
  const [q, setQ] = useState('')
  const [ativo, setAtivo] = useState(0)
  const botao = useRef<HTMLButtonElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const id = useId()
  const comBusca = busca ?? opcoes.length > 8
  const atual = opcoes.find((o) => o.id === valor)

  const filtradas = useMemo(() => {
    const t = semAcento(q.trim())
    return t ? opcoes.filter((o) => semAcento(o.rotulo + ' ' + (o.detalhe ?? '')).includes(t)) : opcoes
  }, [opcoes, q])

  const abrir = () => {
    setQ('')
    setAtivo(Math.max(0, opcoes.findIndex((o) => o.id === valor)))
    setAberto(true)
  }
  const fechar = useCallback(() => {
    setAberto(false)
  }, [])
  const escolher = (o: OpcaoSelecao<T>) => {
    onChange(o.id)
    setAberto(false)
    botao.current?.focus()
  }

  useEffect(() => {
    if (!aberto) return
    lista.current?.querySelector(`[data-i="${ativo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [ativo, aberto])

  function teclas(e: KeyboardEvent) {
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        abrir()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAtivo((a) => Math.min(filtradas.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = filtradas[ativo]
      if (o) escolher(o)
    } else if (e.key === 'Tab') setAberto(false)
  }

  let grupoAnterior: string | undefined
  return (
    <>
      <button
        ref={botao}
        type="button"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={id}
        aria-label={rotuloAria}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclas}
        className={cx(
          'clicavel flex w-full min-w-0 items-center gap-2 rounded-[11px] border bg-panel text-left text-ink outline-none',
          tamanho === 'md' ? 'h-10 px-3 text-[14px]' : 'h-9 px-2.5 text-[13.5px]',
          aberto ? 'border-ink shadow-[0_0_0_3px_rgb(17_17_17/0.08)]' : 'border-line hover:border-[color-mix(in_oklab,var(--faint)_45%,var(--line))]',
          className,
        )}
      >
        {prefixo}
        {atual?.icone}
        <span className={cx('min-w-0 flex-1 truncate', !atual && 'text-faint')}>{atual?.rotulo ?? placeholder}</span>
        <ChevronDown className={cx('h-4 w-4 shrink-0 text-faint transition-transform duration-200', aberto && 'rotate-180')} />
      </button>
      <Flutuante ancora={botao} aberto={aberto} onFechar={fechar} largura="ancora" alinhar={alinhar}>
        {comBusca && (
          <div className="relative mb-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setAtivo(0)
              }}
              onKeyDown={teclas}
              placeholder="Buscar"
              className="h-9 w-full rounded-[10px] bg-sunken pr-2 pl-8 text-[13.5px] text-ink outline-none placeholder:text-faint"
            />
          </div>
        )}
        <div ref={lista} id={id} role="listbox" className="rolagem-fina max-h-[280px] overflow-y-auto" onKeyDown={teclas} tabIndex={-1}>
          {filtradas.map((o, i) => {
            const cab = o.grupo && o.grupo !== grupoAnterior ? o.grupo : null
            grupoAnterior = o.grupo
            return (
              <div key={o.id}>
                {cab && <p className="px-2.5 pt-2 pb-1 text-[11.5px] font-medium text-faint">{cab}</p>}
                <button
                  type="button"
                  role="option"
                  data-i={i}
                  aria-selected={o.id === valor}
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => escolher(o)}
                  className={cx('flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px]', i === ativo ? 'bg-sunken text-ink' : 'text-soft')}
                >
                  {o.icone}
                  <span className="min-w-0 flex-1">
                    <span className={cx('block truncate', o.id === valor && 'font-semibold text-ink')}>{o.rotulo}</span>
                    {o.detalhe && <span className="block truncate text-[12px] text-faint">{o.detalhe}</span>}
                  </span>
                  {o.id === valor && <Check className="h-4 w-4 shrink-0 text-ink" />}
                </button>
              </div>
            )
          })}
          {filtradas.length === 0 && <p className="px-3 py-4 text-center text-[13px] text-dim">Nada encontrado.</p>}
        </div>
      </Flutuante>
    </>
  )
}

/* ---------------- Campo de data (calendário) ---------------- */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function deIso(s: string) {
  const [a, m, d] = s.split('-').map(Number)
  return new Date(a, (m || 1) - 1, d || 1)
}

/** Valor no formato AAAA-MM-DD. */
export function CampoData({ valor, onChange, className, rotuloAria, max }: { valor: string; onChange: (v: string) => void; className?: string; rotuloAria?: string; max?: string }) {
  const [aberto, setAberto] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  const sel = valor ? deIso(valor) : null
  const [mes, setMes] = useState(() => (sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [foco, setFoco] = useState<Date>(sel ?? new Date())
  const hoje = iso(new Date())

  const abrir = () => {
    const base = sel ?? new Date()
    setMes(new Date(base.getFullYear(), base.getMonth(), 1))
    setFoco(base)
    setAberto(true)
  }
  const fechar = useCallback(() => setAberto(false), [])
  const escolher = (d: Date) => {
    if (max && iso(d) > max) return
    onChange(iso(d))
    setAberto(false)
    botao.current?.focus()
  }

  const dias = useMemo(() => {
    const ini = new Date(mes)
    ini.setDate(1 - ini.getDay())
    return Array.from({ length: 42 }, (_, k) => new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + k))
  }, [mes])

  function mover(delta: number) {
    const n = new Date(foco.getFullYear(), foco.getMonth(), foco.getDate() + delta)
    setFoco(n)
    if (n.getMonth() !== mes.getMonth() || n.getFullYear() !== mes.getFullYear()) setMes(new Date(n.getFullYear(), n.getMonth(), 1))
  }
  function teclas(e: KeyboardEvent) {
    const mapa: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (e.key in mapa) {
      e.preventDefault()
      mover(mapa[e.key])
    } else if (e.key === 'Enter') {
      e.preventDefault()
      escolher(foco)
    }
  }

  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-label={rotuloAria}
        aria-haspopup="dialog"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={(e) => {
          if (!aberto && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            abrir()
          }
        }}
        className={cx(
          'clicavel flex h-10 w-full items-center gap-2 rounded-[11px] border bg-panel px-3 text-left text-[14px] text-ink outline-none',
          aberto ? 'border-ink shadow-[0_0_0_3px_rgb(17_17_17/0.08)]' : 'border-line hover:border-[color-mix(in_oklab,var(--faint)_45%,var(--line))]',
          className,
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-faint" />
        <span className={cx('flex-1 truncate', !sel && 'text-faint')}>{sel ? sel.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Escolher data'}</span>
      </button>
      <Flutuante ancora={botao} aberto={aberto} onFechar={fechar} largura={288} className="p-3">
        <div role="dialog" aria-label="Calendário" tabIndex={-1} onKeyDown={teclas} ref={(el) => el?.focus({ preventScroll: true })} className="outline-none">
          <div className="mb-2 flex items-center">
            <button type="button" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="clicavel flex h-8 w-8 items-center justify-center rounded-lg text-dim hover:bg-sunken hover:text-ink">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="flex-1 text-center text-[13.5px] font-semibold text-ink capitalize">
              {MESES[mes.getMonth()]} {mes.getFullYear()}
            </p>
            <button type="button" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="clicavel flex h-8 w-8 items-center justify-center rounded-lg text-dim hover:bg-sunken hover:text-ink">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-faint">
            {DIAS.map((d, k) => (
              <span key={k} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {dias.map((d) => {
              const k = iso(d)
              const fora = d.getMonth() !== mes.getMonth()
              const escolhido = valor === k
              const bloqueado = !!max && k > max
              return (
                <button
                  key={k}
                  type="button"
                  tabIndex={-1}
                  disabled={bloqueado}
                  onClick={() => escolher(d)}
                  className={cx(
                    'flex h-9 items-center justify-center rounded-[9px] font-mono text-[12.5px] transition-colors',
                    escolhido ? 'bg-ink font-semibold text-on-ink' : iso(foco) === k ? 'bg-sunken-2 text-ink' : 'hover:bg-sunken',
                    !escolhido && (fora ? 'text-faint/60' : 'text-ink'),
                    k === hoje && !escolhido && 'font-semibold underline decoration-brand decoration-2 underline-offset-4',
                    bloqueado && 'opacity-30',
                  )}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between border-t border-line-soft pt-2">
            <button type="button" onClick={() => escolher(new Date())} className="clicavel rounded-lg px-2 py-1 text-[12.5px] font-semibold text-soft hover:bg-sunken hover:text-ink">
              Hoje
            </button>
            <button type="button" onClick={fechar} className="clicavel rounded-lg px-2 py-1 text-[12.5px] text-dim hover:bg-sunken hover:text-ink">
              Fechar
            </button>
          </div>
        </div>
      </Flutuante>
    </>
  )
}

/* ---------------- Paginação ---------------- */

export function usePaginacao<T>(lista: T[], porPagina = 20) {
  const [pagina, setPagina] = useState(1)
  const total = Math.max(1, Math.ceil(lista.length / porPagina))
  const atual = Math.min(pagina, total)
  useEffect(() => {
    if (pagina > total) setPagina(total)
  }, [pagina, total])
  return {
    itens: lista.slice((atual - 1) * porPagina, atual * porPagina),
    pagina: atual,
    total,
    setPagina,
    de: lista.length ? (atual - 1) * porPagina + 1 : 0,
    ate: Math.min(atual * porPagina, lista.length),
    quantidade: lista.length,
  }
}

export function Paginacao({ p, rotulo = 'itens' }: { p: ReturnType<typeof usePaginacao<unknown>>; rotulo?: string }) {
  if (p.quantidade === 0) return null
  return (
    <div className="flex items-center gap-2 border-t border-line-soft px-4 py-3 text-[12.5px] text-dim sm:px-5">
      <span>
        {p.total > 1 ? (
          <>
            {p.de}–{p.ate} de <b className="font-semibold text-ink">{p.quantidade}</b> {rotulo}
          </>
        ) : (
          <>
            <b className="font-semibold text-ink">{p.quantidade}</b> {rotulo}
          </>
        )}
      </span>
      {p.total > 1 && (
        <span className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={p.pagina <= 1} onClick={() => p.setPagina(p.pagina - 1)} className="clicavel flex h-8 w-8 items-center justify-center rounded-lg border border-line text-soft hover:bg-sunken disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[56px] text-center font-mono">
            {p.pagina}/{p.total}
          </span>
          <button type="button" aria-label="Próxima página" disabled={p.pagina >= p.total} onClick={() => p.setPagina(p.pagina + 1)} className="clicavel flex h-8 w-8 items-center justify-center rounded-lg border border-line text-soft hover:bg-sunken disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </span>
      )}
    </div>
  )
}

/* ---------------- Linha de tabela clicável ---------------- */

/** A linha inteira abre o detalhe (mouse, Enter ou Espaço). Links e botões dentro dela continuam funcionando. */
export function useLinhaClicavel() {
  const router = useRouter()
  return (href: string) => ({
    'data-href': href,
    tabIndex: 0,
    role: 'link' as const,
    onClick: (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('a,button,input,[role="combobox"]')) return
      if (e.metaKey || e.ctrlKey) window.open(href, '_blank')
      else router.push(href)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        router.push(href)
      }
    },
    className: 'cursor-pointer border-t border-line-soft transition-colors hover:bg-sunken/70 focus-visible:bg-sunken focus-visible:outline-none',
  })
}
