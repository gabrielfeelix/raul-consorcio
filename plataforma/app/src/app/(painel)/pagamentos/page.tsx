'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarClock, Check, CheckCircle2, Pencil, RotateCcw, Wallet } from 'lucide-react'
import { Avatar, Botao, BotaoIcone, CampoData, Card, cx, Medalha, Metrica, Modal, Numero, PageHeader, Paginacao, Segmentado, Selecao, useLinhaClicavel, usePaginacao, Vazio } from '@/components/ds'
import { useAvisar } from '@/components/ds/Avisos'
import { useLoja } from '@/lib/loja'
import type { Indicacao } from '@/lib/tipos'
import { data, diasAte, niveisOrdenados, pagamentos, plural, reais, type Pagamento } from '@/lib/regras'

type Status = 'apagar' | 'pagos' | 'todos'
type Periodo = 'tudo' | 'mes' | 'prox30' | 'ult90' | 'ano'

const PERIODOS: { id: Periodo; rotulo: string }[] = [
  { id: 'tudo', rotulo: 'Qualquer data' },
  { id: 'mes', rotulo: 'Este mês' },
  { id: 'prox30', rotulo: 'Próximos 30 dias' },
  { id: 'ult90', rotulo: 'Últimos 90 dias' },
  { id: 'ano', rotulo: 'Este ano' },
]

/** Data que importa para o filtro: vencimento se a pagar, data do pagamento se pago. */
function dataRef(p: Pagamento) {
  return p.pago ? p.indicacao.pagoEm ?? p.previsto : p.previsto
}

function noPeriodo(iso: string, per: Periodo) {
  if (per === 'tudo') return true
  const d = new Date(iso)
  const h = new Date()
  if (per === 'mes') return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear()
  if (per === 'ano') return d.getFullYear() === h.getFullYear()
  const dias = diasAte(iso)
  if (per === 'prox30') return dias <= 30
  return dias >= -90 && dias <= 0
}

function Urgencia({ p }: { p: Pagamento }) {
  if (p.pago)
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-ok">
        <Check className="h-3.5 w-3.5" /> Pago em {data(p.indicacao.pagoEm)}
      </span>
    )
  const d = diasAte(p.previsto)
  const [tom, texto] = d < 0 ? ['danger', `Atrasado ${plural(-d, 'dia', 'dias')}`] : d === 0 ? ['warn', 'Vence hoje'] : d <= 7 ? ['warn', `Vence em ${plural(d, 'dia', 'dias')}`] : ['neutro', `No prazo · em ${d} dias`]
  return (
    <span className={cx('flex items-center gap-1.5 text-[12px]', tom === 'danger' ? 'font-medium text-danger' : tom === 'warn' ? 'font-medium text-warn' : 'text-faint')}>
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', tom === 'danger' ? 'bg-danger' : tom === 'warn' ? 'bg-warn' : 'bg-line')} />
      {texto}
    </span>
  )
}

export default function Pagamentos() {
  const { dados, moverEtapa, sessao, substituirIndicacao, reverterPagamento, editarPagamento } = useLoja()
  const avisar = useAvisar()
  const linha = useLinhaClicavel()
  const [status, setStatus] = useState<Status>('apagar')
  const [parceiroF, setParceiroF] = useState('todos')
  const [nivelF, setNivelF] = useState('todos')
  const [periodo, setPeriodo] = useState<Periodo>('tudo')
  const [editando, setEditando] = useState<Pagamento | null>(null)
  const [diaPago, setDiaPago] = useState('')

  const todos = useMemo(() => pagamentos(dados), [dados])
  const niveis = niveisOrdenados(dados.niveis)

  const lista = useMemo(
    () =>
      todos
        .filter((p) => (status === 'todos' ? true : status === 'pagos' ? p.pago : !p.pago))
        .filter((p) => parceiroF === 'todos' || p.parceiro.id === parceiroF)
        .filter((p) => nivelF === 'todos' || p.nivel.id === nivelF)
        .filter((p) => noPeriodo(dataRef(p), periodo))
        // a pagar primeiro, por urgência; pagos depois, do mais recente
        .sort((a, b) => (a.pago !== b.pago ? (a.pago ? 1 : -1) : a.pago ? dataRef(b).localeCompare(dataRef(a)) : a.previsto.localeCompare(b.previsto))),
    [todos, status, parceiroF, nivelF, periodo],
  )
  const pag = usePaginacao(lista, 20)

  if (sessao?.papel !== 'raul') return null

  const aPagar = todos.filter((p) => !p.pago)
  const atrasados = aPagar.filter((p) => diasAte(p.previsto) < 0)
  const semana = aPagar.filter((p) => diasAte(p.previsto) >= 0 && diasAte(p.previsto) <= 7)
  const pagoAno = todos.filter((p) => p.pago && new Date(p.indicacao.pagoEm!).getFullYear() === new Date().getFullYear())
  const soma = (l: Pagamento[]) => l.reduce((s, p) => s + p.valor, 0)
  const filtrando = parceiroF !== 'todos' || nivelF !== 'todos' || periodo !== 'tudo'

  function marcarPago(p: Pagamento) {
    const antes: Indicacao = p.indicacao
    moverEtapa(p.indicacao.id, 'pago')
    avisar(`Comissão de ${p.parceiro.nome.split(' ')[0]} marcada como paga`, { acao: { rotulo: 'Desfazer', fn: () => substituirIndicacao(antes) } })
  }

  function abrirEdicao(p: Pagamento) {
    setEditando(p)
    setDiaPago((p.indicacao.pagoEm ?? new Date().toISOString()).slice(0, 10))
  }

  function voltarParaAPagar() {
    if (!editando) return
    const antes = editando.indicacao
    reverterPagamento(antes.id)
    setEditando(null)
    avisar(`Comissão de ${editando.parceiro.nome.split(' ')[0]} voltou para a pagar`, { acao: { rotulo: 'Desfazer', fn: () => substituirIndicacao(antes) } })
  }

  function salvarData() {
    if (!editando || !diaPago) return
    editarPagamento(editando.indicacao.id, new Date(`${diaPago}T12:00:00`).toISOString())
    setEditando(null)
    avisar('Data do pagamento atualizada')
  }

  const acao = (p: Pagamento) =>
    p.pago ? (
      <BotaoIcone rotulo="Editar pagamento" onClick={() => abrirEdicao(p)}>
        <Pencil />
      </BotaoIcone>
    ) : (
      <Botao tamanho="sm" variante="secundario" onClick={() => marcarPago(p)}>
        <Check /> Marcar pago
      </Botao>
    )

  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Comissões dos parceiros. O vencimento é a data do fechamento mais o prazo do nível." />

      <div className="cascata mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica rotulo="A pagar" icone={<Wallet />} valor={<Numero valor={soma(aPagar)} formato={reais} />} detalhe={aPagar.length ? `${plural(aPagar.length, 'comissão agendada', 'comissões agendadas')}` : 'Nada pendente'} />
        <Metrica rotulo="Atrasado" icone={<AlertCircle />} valor={<Numero valor={soma(atrasados)} formato={reais} />} detalhe={atrasados.length ? plural(atrasados.length, 'comissão passou do prazo', 'comissões passaram do prazo') : 'Nenhum atraso'} />
        <Metrica rotulo="Vence em 7 dias" icone={<CalendarClock />} valor={<Numero valor={soma(semana)} formato={reais} />} detalhe={semana.length ? plural(semana.length, 'pagamento nesta semana', 'pagamentos nesta semana') : 'Nada vence nesta semana'} />
        <Metrica rotulo="Pago no ano" icone={<CheckCircle2 />} valor={<Numero valor={soma(pagoAno)} formato={reais} />} detalhe={plural(pagoAno.length, 'comissão paga', 'comissões pagas')} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmentado
          valor={status}
          onChange={setStatus}
          opcoes={[
            { id: 'apagar', rotulo: `A pagar · ${aPagar.length}` },
            { id: 'pagos', rotulo: 'Pagos' },
            { id: 'todos', rotulo: 'Todos' },
          ]}
        />
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-1 sm:flex-wrap sm:justify-end">
          <div className="col-span-2 sm:w-[220px]">
            <Selecao
              rotuloAria="Parceiro"
              busca
              valor={parceiroF}
              onChange={setParceiroF}
              opcoes={[{ id: 'todos', rotulo: 'Todos os parceiros' }, ...dados.parceiros.map((p) => ({ id: p.id, rotulo: p.nome, icone: <Avatar nome={p.nome} tamanho={20} /> }))]}
            />
          </div>
          <div className="sm:w-[170px]">
            <Selecao
              rotuloAria="Nível"
              valor={nivelF}
              onChange={setNivelF}
              opcoes={[{ id: 'todos', rotulo: 'Todos os níveis' }, ...niveis.map((n) => ({ id: n.id, rotulo: n.nome, icone: <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: n.cor }} /> }))]}
            />
          </div>
          <div className="sm:w-[180px]">
            <Selecao rotuloAria="Período" valor={periodo} onChange={setPeriodo} opcoes={PERIODOS} alinhar="fim" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        {lista.length === 0 ? (
          <Vazio
            icone={<Wallet />}
            titulo={filtrando ? 'Nenhuma comissão com esses filtros' : status === 'apagar' ? 'Nenhuma comissão a pagar' : 'Nenhum pagamento registrado'}
            texto={filtrando ? 'Ajuste o parceiro, o nível ou o período para ver mais.' : status === 'apagar' ? 'Quando um contrato fechar, a comissão entra aqui com valor e vencimento.' : 'As comissões marcadas como pagas aparecem aqui.'}
            acao={
              filtrando ? (
                <Botao
                  variante="secundario"
                  onClick={() => {
                    setParceiroF('todos')
                    setNivelF('todos')
                    setPeriodo('tudo')
                  }}
                >
                  Limpar filtros
                </Botao>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop: tabela */}
            <table className="hidden w-full text-[13.5px] md:table">
              <thead>
                <tr className="text-left text-[12px] text-faint">
                  <th className="w-[170px] py-3 pr-3 pl-5 font-medium">Comissão</th>
                  <th className="px-3 py-3 font-medium">Parceiro</th>
                  <th className="px-3 py-3 font-medium">Indicação</th>
                  <th className="w-[210px] px-3 py-3 font-medium">Vencimento</th>
                  <th className="w-[150px] py-3 pr-5 pl-3"><span className="sr-only">Ação</span></th>
                </tr>
              </thead>
              <tbody>
                {pag.itens.map((p) => (
                  <tr key={p.indicacao.id} {...linha(`/indicacoes/${p.indicacao.id}`)}>
                    <td className="py-3.5 pr-3 pl-5 align-middle">
                      <span className={cx('font-mono text-[16px] font-semibold tracking-[-0.01em]', p.pago ? 'text-dim' : 'text-ink')}>{reais(p.valor)}</span>
                      {p.indicacao.comissaoManual && (
                        <span title={p.indicacao.comissaoManual.motivo} className="ml-2 rounded-md bg-sunken px-1.5 py-0.5 align-middle text-[11px] font-medium text-dim">
                          manual
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="flex items-center gap-2.5">
                        <Avatar nome={p.parceiro.nome} tamanho={30} />
                        <span className="min-w-0">
                          <Link href={`/parceiros/${p.parceiro.id}`} className="block truncate font-medium text-ink hover:underline">
                            {p.parceiro.nome}
                          </Link>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-faint">
                            <span className="h-2 w-2 rounded-full" style={{ background: p.nivel.cor }} />
                            {p.nivel.nome} no fechamento
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block truncate text-ink">{p.indicacao.nome}</span>
                      <span className="block font-mono text-[12px] text-faint">carta de {reais(p.indicacao.valorContrato ?? 0)}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block font-medium text-ink">{data(p.pago ? p.indicacao.pagoEm : p.previsto)}</span>
                      <Urgencia p={p} />
                    </td>
                    <td className="py-3.5 pr-5 pl-3 text-right">{acao(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Celular: cartões empilhados */}
            <ul className="md:hidden">
              {pag.itens.map((p, k) => (
                <li key={p.indicacao.id} {...linha(`/indicacoes/${p.indicacao.id}`)} className={cx('cursor-pointer px-4 py-3.5 active:bg-sunken/70', k > 0 && 'border-t border-line-soft')}>
                  <div className="flex items-start gap-3">
                    <Avatar nome={p.parceiro.nome} tamanho={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{p.parceiro.nome}</p>
                      <p className="truncate text-[12.5px] text-dim">
                        Indicou {p.indicacao.nome} · {p.nivel.nome}
                      </p>
                    </div>
                    <span className={cx('shrink-0 font-mono text-[15px] font-semibold', p.pago ? 'text-dim' : 'text-ink')}>{reais(p.valor)}</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 pl-[44px]">
                    <div className="min-w-0 flex-1">
                      <Urgencia p={p} />
                      {!p.pago && <p className="text-[12px] text-faint">Vence {data(p.previsto)}</p>}
                    </div>
                    {acao(p)}
                  </div>
                </li>
              ))}
            </ul>
            <Paginacao p={pag} rotulo={lista.length === 1 ? 'comissão' : 'comissões'} />
          </>
        )}
      </Card>

      <Modal
        aberto={!!editando}
        onFechar={() => setEditando(null)}
        icone={<Pencil />}
        titulo="Editar pagamento"
        subtitulo={editando ? `${reais(editando.valor)} para ${editando.parceiro.nome} · indicação de ${editando.indicacao.nome}` : undefined}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={salvarData} disabled={!diaPago}>
              Salvar data
            </Botao>
          </>
        }
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-soft">Data do pagamento</span>
          <CampoData valor={diaPago} onChange={setDiaPago} rotuloAria="Data do pagamento" max={new Date().toISOString().slice(0, 10)} />
        </label>
        <div className="mt-5 flex flex-col gap-3 rounded-[12px] bg-sunken p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-ink">Marcou como pago por engano?</p>
            <p className="text-[12.5px] text-dim">A comissão volta para a lista a pagar, com o vencimento original. O parceiro deixa de ver como recebida.</p>
          </div>
          <Botao variante="secundario" onClick={voltarParaAPagar}>
            <RotateCcw /> Voltar para a pagar
          </Botao>
        </div>
      </Modal>
    </>
  )
}
