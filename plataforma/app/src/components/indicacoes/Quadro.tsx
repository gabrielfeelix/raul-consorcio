'use client'

import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Globe, MessageCircle, MoreHorizontal, Plus, Search, X } from 'lucide-react'
import { Avatar, Botao, Card, Contagem, cx, Flutuante, PageHeader, Paginacao, Segmentado, Selecao, useLinhaClicavel, usePaginacao } from '@/components/ds'
import { useAvisar } from '@/components/ds/Avisos'
import { abrirNovaIndicacao } from '@/components/acoes/Acoes'
import { useLoja } from '@/lib/loja'
import type { Etapa, Indicacao } from '@/lib/tipos'
import { ETAPAS, ETAPA_POR_ID, formatarTelefone, haQuanto, linkWhatsApp, primeiroNome, reaisCurto, TIPOS_BEM } from '@/lib/regras'
import { EtapaPilula } from './Etapa'
import { ModalFechamento } from './ModaisLead'

function ultimaMudanca(i: Indicacao) {
  const ev = [...i.eventos].reverse().find((e) => e.tipo === 'etapa' || e.tipo === 'criada')
  return ev?.em ?? i.criadoEm
}

/** Parada: nova há 1 dia ou mais sem ninguém chamar, sem resposta, ou 14+ dias sem mudar de etapa enquanto aberta. */
export function estaParada(i: Indicacao) {
  if (['fechado', 'pago', 'perdido'].includes(i.etapa)) return false
  const dias = (Date.now() - new Date(ultimaMudanca(i)).getTime()) / 86_400_000
  return i.etapa === 'sem_resposta' || (i.etapa === 'nova' && dias >= 1) || dias >= 14
}

const COR_COLUNA: Record<Etapa, string> = {
  nova: 'bg-brand',
  contato: 'bg-info',
  sem_resposta: 'bg-warn',
  negociacao: 'bg-ink',
  fechado: 'bg-ok',
  pago: 'bg-ok',
  perdido: 'bg-faint',
}

function Cartao({ i, onMover, arrastando, setArrastando }: { i: Indicacao; onMover: (id: string, e: Etapa) => void; arrastando: string | null; setArrastando: (id: string | null) => void }) {
  const { dados } = useLoja()
  const [menu, setMenu] = useState(false)
  const botaoMenu = useRef<HTMLButtonElement>(null)
  const parceiro = dados.parceiros.find((p) => p.id === i.parceiroId)
  const tipo = TIPOS_BEM.find((t) => t.id === i.tipoBem)?.rotulo
  const tentativas = i.eventos.filter((e) => e.tipo === 'sem_resposta').length
  const parada = estaParada(i)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', i.id)
        e.dataTransfer.effectAllowed = 'move'
        setArrastando(i.id)
      }}
      onDragEnd={() => setArrastando(null)}
      className={cx('group relative cursor-grab rounded-[9px] bg-panel p-3 shadow-card transition-[opacity,transform,box-shadow] hover:shadow-pop active:cursor-grabbing', arrastando === i.id && 'rotate-[1.5deg] opacity-40')}
    >
      <div className="flex items-start gap-2">
        <Link href={`/indicacoes/${i.id}`} className="min-w-0 flex-1" draggable={false}>
          <p className="truncate text-[13.5px] font-semibold hover:underline">{i.nome}</p>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-dim">{i.quemE}</p>
        </Link>
        <button ref={botaoMenu} onClick={() => setMenu(!menu)} aria-label="Mover para outra etapa" aria-expanded={menu} className="clicavel -mt-1 -mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-faint opacity-60 group-hover:opacity-100 hover:bg-sunken hover:text-ink">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <Flutuante ancora={botaoMenu} aberto={menu} onFechar={() => setMenu(false)} largura={200} alinhar="fim" className="p-1">
          <p className="px-2.5 pt-1.5 pb-1 text-[11.5px] font-medium text-faint">Mover para</p>
          {ETAPAS.filter((e) => e.id !== i.etapa).map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setMenu(false)
                onMover(i.id, e.id)
              }}
              className="clicavel flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-soft hover:bg-sunken hover:text-ink"
            >
              <span className={cx('h-1.5 w-1.5 rounded-full', COR_COLUNA[e.id])} />
              {e.rotulo}
            </button>
          ))}
        </Flutuante>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {i.credito || i.valorContrato ? <span className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-soft">{reaisCurto(i.valorContrato ?? i.credito ?? 0)}</span> : null}
        {tipo && <span className="rounded-md bg-sunken px-1.5 py-0.5 text-[11.5px] text-dim">{tipo}</span>}
        {tentativas > 0 && <span className="rounded-md bg-warn-weak px-1.5 py-0.5 text-[11.5px] font-medium text-warn">{tentativas}× sem resposta</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-line-soft pt-2.5">
        {parceiro ? (
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-dim">
            <Avatar nome={parceiro.nome} tamanho={18} /> <span className="truncate">{primeiroNome(parceiro.nome)}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[12px] text-dim">
            <Globe className="h-3.5 w-3.5" /> Site
          </span>
        )}
        <span className={cx('ml-auto text-[11.5px]', parada ? 'font-medium text-warn' : 'text-faint')} title={parada ? 'Parada: precisa de atenção' : undefined}>
          {haQuanto(ultimaMudanca(i))}
        </span>
        <a
          href={linkWhatsApp(i.telefone, `Olá, ${primeiroNome(i.nome)}! Aqui é o Raul, da Raul Consórcio.`)}
          target="_blank"
          rel="noreferrer"
          draggable={false}
          aria-label={`WhatsApp de ${i.nome}`}
          title={formatarTelefone(i.telefone)}
          className="clicavel flex h-6 w-6 items-center justify-center rounded-md text-whats hover:bg-whats-weak"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}

export function Quadro() {
  const { dados, moverEtapa, substituirIndicacao } = useLoja()
  const avisar = useAvisar()
  const busca = useSearchParams()
  const linha = useLinhaClicavel()
  const [parados, setParados] = useState(busca.get('filtro') === 'parados')
  const [vista, setVista] = useState<'quadro' | 'lista'>(busca.get('filtro') === 'parados' ? 'lista' : 'quadro')
  const [q, setQ] = useState('')
  const [parceiro, setParceiro] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<Etapa | null>(null)
  const [fechando, setFechando] = useState<Indicacao | null>(null)

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return dados.indicacoes
      .filter((i) => (parceiro === 'todos' ? true : parceiro === 'site' ? !i.parceiroId : i.parceiroId === parceiro))
      .filter((i) => tipo === 'todos' || i.tipoBem === tipo)
      .filter((i) => !t || i.nome.toLowerCase().includes(t) || i.quemE.toLowerCase().includes(t) || i.telefone.includes(t))
      .filter((i) => !parados || estaParada(i))
      .sort((a, b) => ultimaMudanca(b).localeCompare(ultimaMudanca(a)))
  }, [dados.indicacoes, q, parceiro, tipo, parados])
  const pag = usePaginacao(filtradas, 20)
  const totalParados = dados.indicacoes.filter(estaParada).length

  function mover(id: string, etapa: Etapa) {
    const ind = dados.indicacoes.find((i) => i.id === id)
    if (!ind || ind.etapa === etapa) return
    if (etapa === 'fechado' && !ind.fechadoEm) return setFechando(ind)
    moverEtapa(id, etapa)
    avisar(`${primeiroNome(ind.nome)} movido para ${ETAPA_POR_ID[etapa].rotulo}${ind.parceiroId ? '. Parceiro avisado por e-mail.' : ''}`, { acao: { rotulo: 'Desfazer', fn: () => substituirIndicacao(ind) } })
  }

  return (
    <>
      <PageHeader
        title="Indicações"
        subtitle="Arraste os cartões entre as etapas. O parceiro acompanha cada mudança."
        actions={
          <>
            <Segmentado
              opcoes={[
                { id: 'quadro', rotulo: 'Quadro' },
                { id: 'lista', rotulo: 'Lista' },
              ]}
              valor={vista}
              onChange={setVista}
            />
            <Botao variante="marca" onClick={() => abrirNovaIndicacao()}>
              <Plus /> Nova indicação
            </Botao>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full min-w-[220px] sm:w-auto sm:max-w-[320px] sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
          <input className="campo pl-9" placeholder="Filtrar por nome, telefone ou contexto" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="w-[calc(50%-4px)] sm:w-[220px]">
          <Selecao
            rotuloAria="Parceiro"
            valor={parceiro}
            onChange={setParceiro}
            busca
            opcoes={[
              { id: 'todos', rotulo: 'Todos os parceiros' },
              { id: 'site', rotulo: 'Contato direto (site)', icone: <Globe className="h-4 w-4 text-dim" /> },
              ...dados.parceiros.map((p) => ({ id: p.id, rotulo: p.nome, icone: <Avatar nome={p.nome} tamanho={20} /> })),
            ]}
          />
        </div>
        <div className="w-[calc(50%-4px)] sm:w-[180px]">
          <Selecao rotuloAria="Interesse" valor={tipo} onChange={setTipo} opcoes={[{ id: 'todos', rotulo: 'Todo interesse' }, ...TIPOS_BEM.map((t) => ({ id: t.id as string, rotulo: t.rotulo }))]} />
        </div>
        <button
          type="button"
          aria-pressed={parados}
          onClick={() => setParados(!parados)}
          className={cx('clicavel flex h-10 items-center gap-2 rounded-[9px] border px-3 text-[13.5px] font-medium', parados ? 'border-ink bg-ink text-on-ink' : 'border-line bg-panel text-soft hover:text-ink')}
        >
          Só parados
          {parados ? <X className="h-3.5 w-3.5" /> : <span className="font-mono text-[12px] text-faint">{totalParados}</span>}
        </button>
      </div>

      {vista === 'quadro' ? (
        <div className="rolagem-fina -mx-3 flex gap-3 overflow-x-auto px-3 pb-3 md:-mx-5 md:px-5 lg:-mx-6 lg:px-6">
          {ETAPAS.map((e) => {
            const cards = filtradas.filter((i) => i.etapa === e.id)
            const soma = cards.reduce((s, i) => s + (i.valorContrato ?? i.credito ?? 0), 0)
            return (
              <div
                key={e.id}
                onDragOver={(ev) => {
                  ev.preventDefault()
                  setSobre(e.id)
                }}
                onDragLeave={() => setSobre((s) => (s === e.id ? null : s))}
                onDrop={(ev) => {
                  ev.preventDefault()
                  setSobre(null)
                  // o card muda de coluna e é remontado: o dragend do elemento antigo não chega, então limpa aqui
                  setArrastando(null)
                  mover(ev.dataTransfer.getData('text/plain'), e.id)
                }}
                className={cx('flex w-[272px] shrink-0 flex-col rounded-[12px] bg-sunken-2/60 p-2 transition-colors dark:bg-sunken/60', sobre === e.id && 'bg-sunken-2 ring-2 ring-ink/15')}
              >
                <div className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
                  <span className={cx('h-2 w-2 rounded-full', COR_COLUNA[e.id])} />
                  <h3 className="text-[13.5px] font-semibold">{e.rotulo}</h3>
                  <Contagem>{cards.length}</Contagem>
                  {soma > 0 && <span className="ml-auto font-mono text-[11.5px] text-faint">{reaisCurto(soma)}</span>}
                </div>
                <div className="flex min-h-[120px] flex-col gap-2">
                  {cards.map((i) => (
                    <Cartao key={i.id} i={i} onMover={mover} arrastando={arrastando} setArrastando={setArrastando} />
                  ))}
                  {cards.length === 0 && <p className="rounded-[9px] border border-dashed border-line px-3 py-6 text-center text-[12px] text-faint">{e.descricao}</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] sm:min-w-[760px]">
              <thead>
                <tr className="text-left text-[12px] text-faint">
                  <th className="px-4 py-3 font-medium sm:px-5">Indicado</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">Indicado por</th>
                  <th className="px-3 py-3 font-medium">Etapa</th>
                  <th className="hidden px-3 py-3 text-right font-medium sm:table-cell">Crédito</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Última mudança</th>
                </tr>
              </thead>
              <tbody>
                {pag.itens.map((i) => {
                  const p = dados.parceiros.find((x) => x.id === i.parceiroId)
                  return (
                    <tr key={i.id} {...linha(`/indicacoes/${i.id}`)}>
                      <td className="px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-3">
                          <Avatar nome={i.nome} tamanho={32} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{i.nome}</span>
                            <span className="block truncate font-mono text-[12px] text-dim">{formatarTelefone(i.telefone)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 text-soft md:table-cell">{p ? p.nome : 'Contato direto'}</td>
                      <td className="px-3 py-3">
                        <span className="flex flex-col items-start gap-1">
                          <EtapaPilula etapa={i.etapa} />
                          {estaParada(i) && <span className="text-[11.5px] font-medium text-warn">parada</span>}
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 text-right font-mono sm:table-cell">{i.credito || i.valorContrato ? reaisCurto(i.valorContrato ?? i.credito ?? 0) : '—'}</td>
                      <td className="hidden px-5 py-3 text-dim sm:table-cell">{haQuanto(ultimaMudanca(i))}</td>
                    </tr>
                  )
                })}
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-dim">
                      {parados ? 'Nenhuma indicação parada. Tudo em andamento.' : 'Nenhuma indicação com esses filtros.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacao p={pag} rotulo="indicações" />
        </Card>
      )}

      <ModalFechamento
        indicacao={fechando}
        onFechar={() => setFechando(null)}
        onConfirmar={(fechadoEm, valor) => {
          if (!fechando) return
          moverEtapa(fechando.id, 'fechado', { fechadoEm, valorContrato: valor })
          avisar(`Contrato de ${primeiroNome(fechando.nome)} fechado. Comissão agendada.`, { acao: { rotulo: 'Desfazer', fn: () => substituirIndicacao(fechando) } })
          setFechando(null)
        }}
      />

      {vista === 'quadro' && <p className="mt-2 text-[12px] text-faint md:hidden">No celular, use o botão de opções do cartão para mudar a etapa.</p>}
    </>
  )
}
