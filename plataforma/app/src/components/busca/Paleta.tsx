'use client'

/**
 * Paleta de comandos (Ctrl/Cmd + K): busca indicações e parceiros, mostra recentes
 * e dá atalhos para as ações mais comuns. Toda pelo teclado.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Clock, Compass, CornerDownLeft, Gift, ListChecks, PauseCircle, Plus, Search, UserPlus, Wallet } from 'lucide-react'
import { Avatar, cx, Medalha, Portal } from '@/components/ds'
import { EtapaParceiro, EtapaPilula } from '@/components/indicacoes/Etapa'
import { useLoja } from '@/lib/loja'
import { formatarTelefone, nivelDoParceiro } from '@/lib/regras'

const CHAVE_RECENTES = 'rc-recentes'

type Recente = { tipo: 'indicacao' | 'parceiro'; id: string }

function lerRecentes(): Recente[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
function guardarRecente(r: Recente) {
  try {
    const lista = [r, ...lerRecentes().filter((x) => !(x.tipo === r.tipo && x.id === r.id))].slice(0, 6)
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify(lista))
  } catch {}
}

function normal(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function abrirAcao(tipo: 'nova-indicacao' | 'novo-parceiro') {
  window.dispatchEvent(new CustomEvent('rc-acao', { detail: { tipo } }))
}

export function abrirPaleta() {
  window.dispatchEvent(new Event('rc-paleta'))
}

interface Item {
  chave: string
  grupo: string
  icone: ReactNode
  titulo: ReactNode
  detalhe?: ReactNode
  fim?: ReactNode
  executar: () => void
}

function IconeAcao({ children }: { children: ReactNode }) {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-sunken text-soft [&_svg]:size-4">{children}</span>
}

export function Paleta() {
  const { dados, sessao } = useLoja()
  const router = useRouter()
  const [aberta, setAberta] = useState(false)
  const [q, setQ] = useState('')
  const [ativo, setAtivo] = useState(0)
  const [recentes, setRecentes] = useState<Recente[]>([])
  const input = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const ehRaul = sessao?.papel === 'raul'

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAberta((a) => !a)
      }
    }
    const abrir = () => setAberta(true)
    window.addEventListener('keydown', k)
    window.addEventListener('rc-paleta', abrir)
    return () => {
      window.removeEventListener('keydown', k)
      window.removeEventListener('rc-paleta', abrir)
    }
  }, [])

  useEffect(() => {
    if (!aberta) return
    setQ('')
    setAtivo(0)
    setRecentes(lerRecentes())
    const anterior = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => input.current?.focus(), 30)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false)
    window.addEventListener('keydown', esc)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
      anterior?.focus?.({ preventScroll: true })
    }
  }, [aberta])

  const fechar = () => setAberta(false)
  const ir = (href: string, r?: Recente) => {
    if (r) guardarRecente(r)
    setAberta(false)
    router.push(href)
  }

  const itens = useMemo<Item[]>(() => {
    if (!sessao) return []
    const t = normal(q.trim())
    const minhas = ehRaul ? dados.indicacoes : dados.indicacoes.filter((i) => i.parceiroId === sessao.parceiroId)

    const acoes: Item[] = (
      ehRaul
        ? [
            { chave: 'a-nova', icone: <Plus />, titulo: 'Nova indicação', detalhe: 'Cadastrar em nome de um parceiro', executar: () => (fechar(), abrirAcao('nova-indicacao')) },
            { chave: 'a-parceiro', icone: <UserPlus />, titulo: 'Novo parceiro', detalhe: 'Criar acesso e enviar convite', executar: () => (fechar(), abrirAcao('novo-parceiro')) },
            { chave: 'a-pagar', icone: <Wallet />, titulo: 'Ver comissões a pagar', detalhe: 'Pagamentos', executar: () => ir('/pagamentos') },
            { chave: 'a-parados', icone: <PauseCircle />, titulo: 'Leads parados', detalhe: 'Indicações sem movimento', executar: () => ir('/indicacoes?filtro=parados') },
            { chave: 'a-relatorios', icone: <BarChart3 />, titulo: 'Relatórios', detalhe: 'Por parceiro, interesse e perfil', executar: () => ir('/relatorios') },
            { chave: 'a-niveis', icone: <Gift />, titulo: 'Níveis e prêmios', detalhe: 'Comissões, prazos e prêmios', executar: () => ir('/premios') },
          ]
        : [
            { chave: 'a-indicar', icone: <Plus />, titulo: 'Indicar alguém', detalhe: 'Leva cerca de 1 minuto', executar: () => (fechar(), abrirAcao('nova-indicacao')) },
            { chave: 'a-minhas', icone: <ListChecks />, titulo: 'Minhas indicações', detalhe: 'Acompanhe cada etapa', executar: () => ir('/indicacoes') },
            { chave: 'a-niveis', icone: <Gift />, titulo: 'Níveis e prêmios', detalhe: 'Quanto falta para o próximo nível', executar: () => ir('/premios') },
            {
              chave: 'a-onboarding',
              icone: <Compass />,
              titulo: 'Rever o onboarding',
              detalhe: 'Apresentação guiada da plataforma',
              executar: () => {
                fechar()
                window.dispatchEvent(new Event('rc-tour'))
              },
            },
          ]
    )
      .filter((a) => !t || normal(`${a.titulo} ${a.detalhe}`).includes(t))
      .map((a) => ({ ...a, grupo: 'Ações rápidas', icone: <IconeAcao>{a.icone}</IconeAcao> }))

    const itemIndicacao = (i: (typeof minhas)[number], grupo: string): Item => {
      const p = dados.parceiros.find((x) => x.id === i.parceiroId)
      return {
        chave: `i-${i.id}-${grupo}`,
        grupo,
        icone: <Avatar nome={i.nome} tamanho={32} />,
        titulo: i.nome,
        detalhe: (
          <>
            <span className="font-mono">{formatarTelefone(i.telefone)}</span>
            {ehRaul && <span> · {p ? `de ${p.nome.split(' ')[0]}` : 'pelo site'}</span>}
          </>
        ),
        fim: ehRaul ? <EtapaPilula etapa={i.etapa} /> : <EtapaParceiro etapa={i.etapa} />,
        executar: () => ir(`/indicacoes/${i.id}`, { tipo: 'indicacao', id: i.id }),
      }
    }
    const itemParceiro = (p: (typeof dados.parceiros)[number], grupo: string): Item => ({
      chave: `p-${p.id}-${grupo}`,
      grupo,
      icone: <Avatar nome={p.nome} tamanho={32} />,
      titulo: p.nome,
      detalhe: (
        <>
          <span className="font-mono">{formatarTelefone(p.telefone)}</span> · {p.cidade}
        </>
      ),
      fim: <Medalha nivel={nivelDoParceiro(dados, p.id).atual} />,
      executar: () => ir(`/parceiros/${p.id}`, { tipo: 'parceiro', id: p.id }),
    })

    if (!t) {
      const rec: Item[] = []
      for (const r of recentes) {
        if (r.tipo === 'indicacao') {
          const i = minhas.find((x) => x.id === r.id)
          if (i) rec.push({ ...itemIndicacao(i, 'Recentes'), icone: <IconeAcao><Clock /></IconeAcao> })
        } else if (ehRaul) {
          const p = dados.parceiros.find((x) => x.id === r.id)
          if (p) rec.push({ ...itemParceiro(p, 'Recentes'), icone: <IconeAcao><Clock /></IconeAcao> })
        }
      }
      return [...acoes, ...rec]
    }

    const digitos = q.replace(/\D/g, '')
    const ind = minhas
      .filter((i) => normal(`${i.nome} ${i.quemE}`).includes(t) || (digitos.length >= 3 && i.telefone.includes(digitos)))
      .slice(0, 6)
      .map((i) => itemIndicacao(i, 'Indicações'))
    const par = ehRaul
      ? dados.parceiros
          .filter((p) => normal(`${p.nome} ${p.cidade} ${p.email}`).includes(t) || (digitos.length >= 3 && p.telefone.includes(digitos)))
          .slice(0, 4)
          .map((p) => itemParceiro(p, 'Parceiros'))
      : []
    return [...ind, ...par, ...acoes]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dados, sessao, recentes, ehRaul])

  useEffect(() => {
    if (ativo >= itens.length) setAtivo(Math.max(0, itens.length - 1))
  }, [itens.length, ativo])

  useEffect(() => {
    lista.current?.querySelector(`[data-i="${ativo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [ativo])

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAtivo((a) => (itens.length ? (a + 1) % itens.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((a) => (itens.length ? (a - 1 + itens.length) % itens.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      itens[ativo]?.executar()
    } else if (e.key === 'Tab') {
      e.preventDefault()
    }
  }

  if (!aberta || !sessao) return null

  let grupoAnterior = ''
  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[12dvh] sm:px-6">
        <div className="entra-fundo absolute inset-0 bg-overlay backdrop-blur-[2px]" onClick={fechar} />
        <div role="dialog" aria-modal aria-label="Buscar" onKeyDown={teclas} className="entra-pop relative flex max-h-[min(560px,76dvh)] w-full max-w-[600px] flex-col overflow-hidden rounded-[14px] bg-panel shadow-modal">
          <div className="flex items-center gap-3 border-b border-line-soft px-4">
            <Search className="h-[18px] w-[18px] shrink-0 text-faint" />
            <input
              ref={input}
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setAtivo(0)
              }}
              role="combobox"
              aria-expanded
              aria-controls="paleta-lista"
              aria-activedescendant={itens[ativo] ? `paleta-${ativo}` : undefined}
              placeholder={ehRaul ? 'Buscar indicação, parceiro, telefone ou ação' : 'Buscar nas minhas indicações ou ação'}
              className="h-14 min-w-0 flex-1 bg-transparent text-[15.5px] text-ink outline-none placeholder:text-faint"
            />
            <button onClick={fechar} className="clicavel hidden rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-[10.5px] text-faint hover:text-ink sm:block">
              Esc
            </button>
          </div>

          <div ref={lista} id="paleta-lista" role="listbox" className="rolagem-fina min-h-0 flex-1 overflow-y-auto p-2">
            {itens.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-[14px] font-medium text-ink">Nenhum resultado para “{q.trim()}”</p>
                <p className="mt-1 text-[13px] text-dim">Tente pelo nome, pelo telefone com DDD ou pelo que a pessoa procura.</p>
              </div>
            )}
            {itens.map((it, i) => {
              const cab = it.grupo !== grupoAnterior ? it.grupo : null
              grupoAnterior = it.grupo
              return (
                <div key={it.chave}>
                  {cab && <p className={cx('px-2.5 pb-1.5 text-[11.5px] font-medium text-faint', i > 0 ? 'pt-3' : 'pt-1')}>{cab}</p>}
                  <button
                    id={`paleta-${i}`}
                    role="option"
                    aria-selected={i === ativo}
                    data-i={i}
                    onMouseMove={() => i !== ativo && setAtivo(i)}
                    onClick={it.executar}
                    className={cx('flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left transition-colors duration-100', i === ativo ? 'bg-sunken' : '')}
                  >
                    {it.icone}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{it.titulo}</span>
                      {it.detalhe && <span className="block truncate text-[12.5px] text-dim">{it.detalhe}</span>}
                    </span>
                    {it.fim && <span className="hidden shrink-0 sm:block">{it.fim}</span>}
                    <CornerDownLeft className={cx('h-4 w-4 shrink-0 text-faint transition-opacity', i === ativo ? 'opacity-100' : 'opacity-0')} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="hidden items-center gap-4 border-t border-line-soft px-4 py-2.5 text-[12px] text-faint sm:flex">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md border border-line bg-sunken px-1.5 font-mono text-[10.5px]">↑</kbd>
              <kbd className="rounded-md border border-line bg-sunken px-1.5 font-mono text-[10.5px]">↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md border border-line bg-sunken px-1.5 font-mono text-[10.5px]">Enter</kbd> abrir
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md border border-line bg-sunken px-1.5 font-mono text-[10.5px]">Esc</kbd> fechar
            </span>
          </div>
        </div>
      </div>
    </Portal>
  )
}

/** Gatilho no topo (desktop): parece um campo de busca, abre a paleta. */
export function GatilhoBusca() {
  const { sessao } = useLoja()
  const [mac, setMac] = useState(false)
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), [])
  return (
    <button
      onClick={abrirPaleta}
      className="clicavel group flex h-11 w-full max-w-[440px] items-center gap-2.5 rounded-[9px] bg-panel pr-3 pl-3.5 text-left text-[14px] text-faint shadow-card hover:text-dim"
    >
      <Search className="h-[17px] w-[17px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{sessao?.papel === 'raul' ? 'Buscar indicação, parceiro ou telefone' : 'Buscar nas minhas indicações'}</span>
      <kbd className="rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-[10.5px] text-faint">{mac ? '⌘ K' : 'Ctrl K'}</kbd>
    </button>
  )
}
