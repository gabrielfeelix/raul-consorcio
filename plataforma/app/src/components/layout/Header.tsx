'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, LogOut, Moon, Search, Sun, Compass, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { abrirAcao, abrirPaleta, GatilhoBusca, Paleta } from '@/components/busca/Paleta'
import { Avatar, cx, Medalha, Modal } from '@/components/ds'
import { useLoja, useParceiroAtual } from '@/lib/loja'
import { haQuanto, nivelDoParceiro, primeiroNome } from '@/lib/regras'
import { NAV, itemAtivo } from './navegacao'
import { Selo } from './Marca'

function useFora(ref: React.RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && fn()
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, fn])
}

function Notificacoes() {
  const { dados, sessao } = useLoja()
  const [aberta, setAberta] = useState(false)
  const [vistoEm, setVistoEm] = useState<string>('')
  const ref = useRef<HTMLDivElement>(null)
  useFora(ref, () => setAberta(false))

  useEffect(() => {
    try {
      setVistoEm(localStorage.getItem('rc-notif-visto') ?? '')
    } catch {}
  }, [])

  const itens = useMemo(() => {
    const lista: { id: string; em: string; texto: string; quem: string; href: string }[] = []
    for (const i of dados.indicacoes) {
      if (sessao?.papel === 'parceiro' && i.parceiroId !== sessao.parceiroId) continue
      for (const e of i.eventos) {
        if (sessao?.papel === 'parceiro' && (!e.visivelParceiro || e.tipo === 'criada')) continue
        if (sessao?.papel === 'raul' && e.tipo !== 'criada') continue
        lista.push({ id: e.id, em: e.em, texto: e.texto, quem: i.nome, href: `/indicacoes/${i.id}` })
      }
    }
    return lista.filter((x) => new Date(x.em) <= new Date()).sort((a, b) => b.em.localeCompare(a.em)).slice(0, 12)
  }, [dados, sessao])

  const novas = itens.filter((x) => x.em > vistoEm).length

  function abrir() {
    setAberta(!aberta)
    if (!aberta) {
      const agora = new Date().toISOString()
      setTimeout(() => setVistoEm(agora), 1500)
      try {
        localStorage.setItem('rc-notif-visto', agora)
      } catch {}
    }
  }

  return (
    <div ref={ref} className="relative" data-tour="notificacoes">
      <button onClick={abrir} aria-label="Atualizações" aria-expanded={aberta} className="clicavel relative flex h-10 w-10 items-center justify-center rounded-[9px] text-ink hover:bg-ink/[0.07]">
        <Bell className="h-[19px] w-[19px]" strokeWidth={1.8} />
        {novas > 0 && <span className="absolute top-[9px] right-[9px] h-[7px] w-[7px] rounded-full bg-brand ring-2 ring-canvas" />}
      </button>
      {aberta && (
        <div className="entra-menu absolute top-[calc(100%+6px)] right-0 z-40 w-[380px] overflow-hidden rounded-[12px] border border-line bg-panel shadow-pop max-sm:fixed max-sm:inset-x-3 max-sm:top-[64px] max-sm:w-auto">
          <div className="flex items-baseline justify-between gap-3 border-b border-line-soft px-4 pt-3.5 pb-3">
            <p className="font-title text-[15px] font-semibold text-ink">{sessao?.papel === 'raul' ? 'Indicações recebidas' : 'Atualizações das suas indicações'}</p>
            {novas > 0 && <span className="shrink-0 text-[12px] font-medium text-dim">{novas} {novas === 1 ? 'nova' : 'novas'}</span>}
          </div>
          <div className="rolagem-fina max-h-[min(420px,60dvh)] overflow-y-auto p-1.5">
            {itens.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[13.5px] font-medium text-ink">Nenhuma atualização</p>
                <p className="mt-1 text-[12.5px] text-dim">{sessao?.papel === 'raul' ? 'Novas indicações aparecem aqui.' : 'Cada passo das suas indicações aparece aqui e no seu e-mail.'}</p>
              </div>
            )}
            {itens.map((n) => {
              const nova = n.em > vistoEm
              return (
                <Link key={n.id} href={n.href} onClick={() => setAberta(false)} className="clicavel flex items-start gap-3 rounded-[9px] px-2.5 py-2.5 hover:bg-sunken">
                  <Avatar nome={n.quem} tamanho={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] leading-snug text-soft">
                      <b className="font-semibold text-ink">{n.quem}</b> · {n.texto.replace('Movido para', 'passou para')}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-faint">{haQuanto(n.em)}</span>
                  </span>
                  <span className={cx('mt-2 h-[7px] w-[7px] shrink-0 rounded-full', nova ? 'bg-brand' : 'bg-transparent')} aria-label={nova ? 'Nova' : undefined} />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function alternarTema() {
  const escuro = document.documentElement.classList.toggle('dark')
  try {
    localStorage.setItem('rc-tema', escuro ? 'dark' : 'light')
  } catch {}
}

function MenuUsuario() {
  const { sessao, sair, dados, restaurarExemplo } = useLoja()
  const parceiro = useParceiroAtual()
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [trocando, setTrocando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useFora(ref, () => setAberto(false))
  const nome = sessao?.papel === 'raul' ? 'Raul Carvalho' : parceiro?.nome ?? ''
  const nivel = parceiro ? nivelDoParceiro(dados, parceiro.id).atual : undefined

  const item = 'clicavel flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] font-medium text-soft hover:bg-sunken hover:text-ink [&_svg]:size-4 [&_svg]:text-dim'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setAberto(!aberto)} className="clicavel flex items-center gap-2 rounded-[9px] py-1 pr-2 pl-1 hover:bg-ink/[0.07]">
        <Avatar nome={nome} tamanho={32} />
        <span className="hidden text-left lg:block">
          <span className="block text-[13px] leading-tight font-semibold text-ink">{primeiroNome(nome)}</span>
          <span className="block text-[11.5px] leading-tight text-dim">{sessao?.papel === 'raul' ? 'Administrador' : nivel?.nome}</span>
        </span>
      </button>
      {aberto && (
        <div className="entra-menu absolute top-[calc(100%+6px)] right-0 z-40 w-[264px] rounded-[12px] border border-line bg-panel p-1.5 shadow-pop">
          <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
            <Avatar nome={nome} tamanho={38} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{nome}</p>
              {nivel ? <Medalha nivel={nivel} /> : <p className="text-[12px] text-dim">Raul Consórcio</p>}
            </div>
          </div>
          <div className="h-px bg-line-soft" />
          <div className="pt-1.5">
            {sessao?.papel === 'parceiro' && (
              <button
                className={item}
                onClick={() => {
                  setAberto(false)
                  window.dispatchEvent(new Event('rc-tour'))
                }}
              >
                <Compass /> Rever o onboarding
              </button>
            )}
            <button className={item} onClick={alternarTema}>
              <Moon className="dark:hidden" />
              <Sun className="hidden dark:block" />
              <span className="dark:hidden">Tema escuro</span>
              <span className="hidden dark:inline">Tema claro</span>
            </button>
            <button
              className={item}
              onClick={() => {
                setAberto(false)
                setTrocando(true)
              }}
            >
              <ArrowRightLeft /> Trocar de perfil
            </button>
            {sessao?.papel === 'raul' && (
              <button
                className={item}
                onClick={() => {
                  restaurarExemplo()
                  setAberto(false)
                }}
              >
                <RefreshCw /> Restaurar dados de exemplo
              </button>
            )}
            <button
              className={item}
              onClick={() => {
                sair()
                router.push('/login')
              }}
            >
              <LogOut /> Sair
            </button>
          </div>
        </div>
      )}
      <TrocarPerfil aberto={trocando} onFechar={() => setTrocando(false)} />
    </div>
  )
}

/** Escolhe qual visão abrir: a do Raul ou a de um parceiro. Sem sair da plataforma. */
function TrocarPerfil({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { dados, sessao, entrar } = useLoja()
  const router = useRouter()
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const parceiros = dados.parceiros.filter((p) => !t || p.nome.toLowerCase().includes(t))
  const escolher = (s: { papel: 'raul' } | { papel: 'parceiro'; parceiroId: string }) => {
    entrar(s)
    onFechar()
    setQ('')
    router.push('/inicio')
  }
  const atual = (id?: string) => (id ? sessao?.papel === 'parceiro' && sessao.parceiroId === id : sessao?.papel === 'raul')
  const linha = 'clicavel flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left hover:bg-sunken'
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Trocar de perfil" subtitulo="Veja a plataforma como o Raul ou como qualquer parceiro." largura={460}>
      <p className="mb-1.5 text-[12px] font-medium text-faint">Administrador</p>
      <button className={linha} onClick={() => escolher({ papel: 'raul' })}>
        <Selo tamanho={32} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">Raul Carvalho</span>
          <span className="block text-[12.5px] text-dim">Vê e gere todas as indicações</span>
        </span>
        {atual() && <span className="text-[12px] font-semibold text-dim">Atual</span>}
      </button>
      <div className="mt-4 mb-1.5 flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-faint">Parceiros</p>
      </div>
      <input className="campo mb-1.5 h-9" placeholder="Buscar parceiro" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-col">
        {parceiros.map((p) => {
          const n = nivelDoParceiro(dados, p.id).atual
          return (
            <button key={p.id} className={linha} onClick={() => escolher({ papel: 'parceiro', parceiroId: p.id })}>
              <Avatar nome={p.nome} tamanho={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{p.nome}</span>
                <span className="block truncate text-[12.5px] text-dim">{p.status === 'convidado' ? 'Primeiro acesso, com onboarding guiado' : `${p.cidade} · ${dados.indicacoes.filter((i) => i.parceiroId === p.id).length} indicações`}</span>
              </span>
              {atual(p.id) ? <span className="text-[12px] font-semibold text-dim">Atual</span> : <Medalha nivel={n} />}
            </button>
          )
        })}
        {parceiros.length === 0 && <p className="px-3 py-4 text-[13px] text-dim">Nenhum parceiro encontrado.</p>}
      </div>
    </Modal>
  )
}

export function Header() {
  return (
    <header className="relative z-30 hidden h-16 shrink-0 items-center gap-3 md:flex">
      <GatilhoBusca />
      <Paleta />
      <div className="ml-auto flex items-center gap-1">
        <Notificacoes />
        <div className="ml-1.5">
          <MenuUsuario />
        </div>
      </div>
    </header>
  )
}

/** Celular: topo + barra de baixo. */
export function BarraCelular() {
  const { sessao } = useLoja()
  const caminho = usePathname()
  const ativo = itemAtivo(caminho)
  if (!sessao) return null
  const itens = NAV[sessao.papel].flatMap((g) => g.itens).slice(0, 5)
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-[60px] items-center gap-2 border-b border-line-soft bg-panel/90 px-3 backdrop-blur md:hidden">
        <Selo tamanho={30} />
        <span className="font-title text-[15px]"><span className="font-semibold">Raul</span> Consórcio</span>
        <div className="ml-auto flex items-center">
          <button onClick={abrirPaleta} aria-label="Buscar" className="clicavel flex h-10 w-10 items-center justify-center rounded-[9px] text-ink hover:bg-ink/[0.07]">
            <Search className="h-[19px] w-[19px]" strokeWidth={1.8} />
          </button>
          <Notificacoes />
          <MenuUsuario />
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line-soft bg-panel/95 px-1 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        {itens.map((it) => {
          const Icone = it.icone
          const aceso = ativo === it.chave
          const acao = (it as { acao?: string }).acao
          const rotulo = it.rotulo.replace('Minhas indicações', 'Indicações').replace('Níveis e prêmios', 'Prêmios').replace('Indicar alguém', 'Indicar')
          const miolo = (
            <>
              <span className={cx('flex h-7 w-11 items-center justify-center rounded-full transition-colors', aceso && 'bg-ink text-on-ink')}>
                <Icone className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
              <span className="max-w-full truncate px-0.5">{rotulo}</span>
            </>
          )
          const classe = cx('flex flex-1 flex-col items-center gap-1 rounded-[9px] py-1 text-[10.5px] font-medium', aceso ? 'text-ink' : 'text-faint')
          return acao ? (
            <button key={it.chave} onClick={() => abrirAcao(acao as 'nova-indicacao')} className={classe}>
              {miolo}
            </button>
          ) : (
            <Link key={it.chave} href={it.href} aria-current={aceso ? 'page' : undefined} className={classe}>
              {miolo}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
