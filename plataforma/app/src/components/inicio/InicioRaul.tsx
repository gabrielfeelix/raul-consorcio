'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowUpRight, Banknote, CheckCircle2, ChevronRight, Clock, Globe, Hourglass, Plus, Send, TrendingUp, UserPlus, Users } from 'lucide-react'
import { abrirNovaIndicacao, abrirNovoParceiro } from '@/components/acoes/Acoes'
import { estaParada } from '@/components/indicacoes/Quadro'
import { Avatar, Card, CardHeader, cx, Dica, DicaGrafico, Medalha, Metrica, Numero, PageHeader, Pilula, Progresso, Segmentado } from '@/components/ds'
import { useLoja } from '@/lib/loja'
import {
  dataCurta,
  dentro,
  diasAte,
  ETAPAS,
  fechouContrato,
  haQuanto,
  inicioPeriodo,
  nivelDoParceiro,
  pagamentos,
  PERIODOS,
  periodoAnterior,
  reais,
  reaisCurto,
  type Periodo,
} from '@/lib/regras'

/** Sem base de comparação (anterior = 0) não mostra porcentagem: "+100%" do nada engana. */
function variacao(atual: number, anterior: number) {
  if (anterior === 0) return undefined
  return ((atual - anterior) / anterior) * 100
}

const COR_FUNIL: Record<string, string> = {
  nova: 'var(--serie-3)',
  contato: 'var(--serie-2)',
  sem_resposta: 'var(--warn)',
  negociacao: 'var(--soft)',
  fechado: 'var(--serie-1)',
  pago: 'var(--serie-1)',
  perdido: 'var(--serie-4)',
}

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function InicioRaul() {
  const { dados } = useLoja()
  const [periodo, setPeriodo] = useState<Periodo>('30d')

  const m = useMemo(() => {
    const agora = new Date()
    const de = inicioPeriodo(periodo, agora)
    const ant = periodoAnterior(periodo, agora)
    const ind = dados.indicacoes
    const doPeriodo = ind.filter((i) => dentro(i.criadoEm, de, agora))
    const doAnterior = ind.filter((i) => dentro(i.criadoEm, ant.de, ant.ate))
    const fechadas = ind.filter((i) => fechouContrato(i) && dentro(i.fechadoEm, de, agora))
    const fechadasAnt = ind.filter((i) => fechouContrato(i) && dentro(i.fechadoEm, ant.de, ant.ate))
    const parceirosAtivos = new Set(doPeriodo.map((i) => i.parceiroId).filter(Boolean))
    const parceirosAnt = new Set(doAnterior.map((i) => i.parceiroId).filter(Boolean))
    const volume = fechadas.reduce((s, i) => s + (i.valorContrato ?? 0), 0)
    const volumeAnt = fechadasAnt.reduce((s, i) => s + (i.valorContrato ?? 0), 0)
    const pags = pagamentos(dados)
    const aPagar = pags.filter((p) => !p.pago)
    const aPagar30 = aPagar.filter((p) => diasAte(p.previsto) <= 30)

    // gráfico: dias (até 30d) ou semanas
    const porSemana = periodo === '90d' || periodo === 'ano'
    const baldes: { rotulo: string; completo: string; ini: Date; fim: Date; indicacoes: number; fechados: number }[] = []
    if (periodo === 'hoje') {
      for (let h = 8; h <= 20; h += 2) {
        const ini = new Date(de)
        ini.setHours(h)
        const fim = new Date(de)
        fim.setHours(h + 2)
        baldes.push({ rotulo: `${h}h`, completo: `Hoje, das ${h}h às ${h + 2}h`, ini, fim, indicacoes: 0, fechados: 0 })
      }
    } else {
      const passo = porSemana ? 7 : 1
      for (let d = new Date(de); d <= agora; d = new Date(d.getTime() + passo * 86_400_000)) {
        const fim = new Date(d.getTime() + passo * 86_400_000)
        const fmt = (x: Date) => x.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
        const completo = porSemana ? `Semana de ${fmt(d)} a ${fmt(new Date(fim.getTime() - 86_400_000))}` : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        baldes.push({ rotulo: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), completo, ini: new Date(d), fim, indicacoes: 0, fechados: 0 })
      }
    }
    for (const b of baldes) {
      b.indicacoes = ind.filter((i) => dentro(i.criadoEm, b.ini, b.fim)).length
      b.fechados = ind.filter((i) => fechouContrato(i) && dentro(i.fechadoEm, b.ini, b.fim)).length
    }

    const funil = ETAPAS.map((e) => ({ ...e, total: ind.filter((i) => i.etapa === e.id).length }))

    const paradas = ind.filter(estaParada).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
    const atencao = paradas.slice(0, 5)
    const atrasados = aPagar.filter((p) => diasAte(p.previsto) < 0)

    const quaseSubindo = dados.parceiros
      .map((p) => ({ p, n: nivelDoParceiro(dados, p.id) }))
      .filter((x) => x.n.proximo && x.n.faltam <= 2)
      .sort((a, b) => a.n.faltam - b.n.faltam)
      .slice(0, 4)

    const ranking = dados.parceiros
      .map((p) => ({ p, qtd: doPeriodo.filter((i) => i.parceiroId === p.id).length, fech: fechadas.filter((i) => i.parceiroId === p.id).length }))
      .filter((x) => x.qtd > 0 || x.fech > 0)
      .sort((a, b) => b.fech - a.fech || b.qtd - a.qtd)
      .slice(0, 5)

    const doSite = doPeriodo.filter((i) => !i.parceiroId).length
    const conversao = doPeriodo.length ? (doPeriodo.filter(fechouContrato).length / doPeriodo.length) * 100 : 0
    const ticket = fechadas.length ? volume / fechadas.length : 0

    return { doPeriodo, doAnterior, fechadas, fechadasAnt, parceirosAtivos, parceirosAnt, volume, volumeAnt, aPagar, aPagar30, baldes, funil, atencao, paradas, atrasados, quaseSubindo, ranking, doSite, conversao, ticket }
  }, [dados, periodo])

  const maxFunil = Math.max(...m.funil.map((f) => f.total), 1)
  const totalFunil = m.funil.reduce((s, f) => s + f.total, 0) || 1
  const totIndic = m.baldes.reduce((s, b) => s + b.indicacoes, 0)
  const totFech = m.baldes.reduce((s, b) => s + b.fechados, 0)
  const rotuloPeriodo = PERIODOS.find((p) => p.id === periodo)!.rotulo.toLowerCase()

  return (
    <>
      <PageHeader
        title={`${saudacao()}, Raul`}
        subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={<Segmentado opcoes={PERIODOS.map((p) => ({ id: p.id, rotulo: p.curto }))} valor={periodo} onChange={setPeriodo} className="sem-barra max-w-full overflow-x-auto" />}
      />

      <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <AcaoRapida icone={<Plus />} titulo="Nova indicação" detalhe="Em nome de um parceiro" onClick={() => abrirNovaIndicacao()} principal />
        <AcaoRapida icone={<UserPlus />} titulo="Novo parceiro" detalhe="Acesso e convite" onClick={abrirNovoParceiro} />
        <AcaoRapida
          icone={<Banknote />}
          titulo="Comissões a pagar"
          detalhe={m.aPagar.length ? `${reais(m.aPagar.reduce((s, p) => s + p.valor, 0))}${m.atrasados.length ? ` · ${m.atrasados.length} atrasada${m.atrasados.length > 1 ? 's' : ''}` : ''}` : 'Nada pendente'}
          alerta={m.atrasados.length > 0}
          href="/pagamentos"
        />
        <AcaoRapida icone={<Hourglass />} titulo="Leads parados" detalhe={m.paradas.length ? `${m.paradas.length} precisam de contato` : 'Nenhum parado'} alerta={m.paradas.length > 0} href="/indicacoes?filtro=parados" />
      </div>

      <div className="cascata grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica rotulo="Indicações recebidas" icone={<Send />} valor={<Numero valor={m.doPeriodo.length} />} variacao={variacao(m.doPeriodo.length, m.doAnterior.length)} detalhe={m.doSite ? `${m.doSite} pela simulação do site` : 'Todas vieram de parceiros'} />
        <Metrica rotulo="Parceiros que indicaram" icone={<Users />} valor={<Numero valor={m.parceirosAtivos.size} />} variacao={variacao(m.parceirosAtivos.size, m.parceirosAnt.size)} detalhe={`de ${dados.parceiros.filter((p) => p.status === 'ativo').length} parceiros ativos`} />
        <Metrica
          rotulo="Contratos fechados"
          icone={<CheckCircle2 />}
          valor={<Numero valor={m.fechadas.length} />}
          variacao={variacao(m.fechadas.length, m.fechadasAnt.length)}
          detalhe={m.conversao > 0 ? `${Math.round(m.conversao)}% das indicações do período já fecharam` : m.doPeriodo.length ? 'As indicações do período ainda estão em conversa' : 'Nenhuma indicação no período'}
        />
        <Metrica rotulo="Volume em cartas" icone={<TrendingUp />} valor={<Numero valor={m.volume} formato={reaisCurto} />} variacao={variacao(m.volume, m.volumeAnt)} detalhe={m.ticket ? `Carta média de ${reaisCurto(m.ticket)}` : 'Soma dos contratos fechados'} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_380px]">
        <Card className="flex flex-col">
          <CardHeader title="Indicações e fechamentos" extra={rotuloPeriodo} />
          <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 pb-1 sm:px-5">
            <span className="flex items-baseline gap-2 text-[12.5px] text-dim">
              <span className="h-2.5 w-2.5 translate-y-px rounded-[3px] bg-serie-3" /> Indicações <b className="font-mono text-[13px] font-semibold text-ink">{totIndic}</b>
            </span>
            <span className="flex items-baseline gap-2 text-[12.5px] text-dim">
              <span className="h-2.5 w-2.5 translate-y-px rounded-[3px] bg-serie-1" /> Contratos fechados <b className="font-mono text-[13px] font-semibold text-ink">{totFech}</b>
            </span>
          </div>
          <div className="h-[300px] min-h-[260px] flex-1 px-1 pb-3 sm:px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.baldes} barGap={1} barCategoryGap={periodo === "30d" ? "10%" : "24%"} margin={{ top: 16, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line-soft)" />
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} interval="preserveStartEnd" minTickGap={22} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} width={44} />
                <Tooltip
                  cursor={{ fill: 'var(--sunken)', radius: 6 }}
                  content={<DicaGrafico rotuloX={(l) => m.baldes.find((b) => b.rotulo === l)?.completo ?? l} />}
                  isAnimationActive={false}
                />
                <Bar dataKey="indicacoes" name="Indicações" fill="var(--serie-3)" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={700} />
                <Bar dataKey="fechados" name="Fechados" fill="var(--serie-1)" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Onde estão as indicações" extra="hoje" action={{ label: 'Quadro', href: '/indicacoes' }} />
          <div className="flex flex-col gap-3.5 px-4 pt-1 pb-5 sm:px-5">
            {m.funil.map((f) => (
              <Link key={f.id} href="/indicacoes" className="group flex flex-col gap-1.5 rounded-lg">
                <span className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="truncate text-soft transition-colors group-hover:text-ink">{f.rotulo}</span>
                  <span className="font-mono text-[13px] font-semibold text-ink">{f.total}</span>
                </span>
                <span className="block h-2 rounded-full bg-sunken">
                  <Dica
                    className="cresce-x block h-full rounded-full"
                    style={{ width: `${f.total ? Math.max(3, (f.total / maxFunil) * 100) : 0}%`, background: COR_FUNIL[f.id] }}
                    conteudo={
                      <>
                        {f.total} {f.total === 1 ? 'indicação' : 'indicações'} · {Math.round((f.total / totalFunil) * 100)}% do total
                      </>
                    }
                  />
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader title="Precisa de atenção" count={m.paradas.length} action={{ label: 'Ver todas', href: '/indicacoes?filtro=parados' }} />
          {m.atencao.length === 0 ? (
            <p className="px-5 pb-6 text-[13px] text-dim">Tudo em dia: nenhuma indicação parada.</p>
          ) : (
            <ul className="pb-2">
              {m.atencao.map((i) => (
                <li key={i.id}>
                  <Link href={`/indicacoes/${i.id}`} className="flex items-center gap-3 border-t border-line-soft px-5 py-2.5 hover:bg-sunken/60">
                    <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', i.etapa === 'nova' ? 'bg-sunken text-soft' : 'bg-warn-weak text-warn')}>
                      {i.etapa === 'nova' ? <Clock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{i.nome}</span>
                      <span className="block truncate text-[12px] text-dim">{i.etapa === 'nova' ? `Ainda sem contato · chegou ${haQuanto(i.criadoEm)}` : i.etapa === 'sem_resposta' ? 'Não respondeu · tentar de novo' : `${ETAPAS.find((e) => e.id === i.etapa)?.rotulo} · sem movimento há dias`}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Próximos pagamentos" extra={reais(m.aPagar30.reduce((s, p) => s + p.valor, 0)) + ' em 30 dias'} action={{ label: 'Ver todos', href: '/pagamentos' }} />
          <ul className="pb-2">
            {m.aPagar.slice(0, 5).map((p) => {
              const d = diasAte(p.previsto)
              return (
                <li key={p.indicacao.id} className="flex items-center gap-3 border-t border-line-soft px-5 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-soft">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{p.parceiro.nome}</span>
                    <span className="block truncate text-[12px] text-dim">Indicou {p.indicacao.nome.split(' ')[0]} · {p.nivel.nome}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[13px] font-semibold">{reais(p.valor)}</span>
                    <span className={cx('block text-[11.5px]', d < 0 ? 'font-semibold text-danger' : d <= 7 ? 'text-warn' : 'text-faint')}>{d < 0 ? `atrasado ${-d}d` : d === 0 ? 'hoje' : dataCurta(p.previsto)}</span>
                  </span>
                </li>
              )
            })}
            {m.aPagar.length === 0 && <p className="px-5 pb-6 text-[13px] text-dim">Nenhuma comissão pendente.</p>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Perto de subir de nível" action={{ label: 'Parceiros', href: '/parceiros' }} />
          <ul className="pb-3">
            {m.quaseSubindo.map(({ p, n }) => (
              <li key={p.id}>
                <Link href={`/parceiros/${p.id}`} className="flex items-center gap-3 border-t border-line-soft px-5 py-3 hover:bg-sunken/60">
                  <Avatar nome={p.nome} tamanho={32} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-medium">{p.nome}</span>
                      <span className="shrink-0 text-[12px] text-dim">
                        falta{n.faltam > 1 ? 'm' : ''} <b className="font-semibold text-ink">{n.faltam}</b> para {n.proximo!.nome}
                      </span>
                    </span>
                    <Progresso valor={n.pct} className="mt-2" />
                  </span>
                </Link>
              </li>
            ))}
            {m.quaseSubindo.length === 0 && <p className="px-5 pb-3 text-[13px] text-dim">Nenhum parceiro a até 2 contratos do próximo nível.</p>}
          </ul>
        </Card>
      </div>

      <Card className="mt-3">
        <CardHeader title="Quem mais indicou" extra={rotuloPeriodo} action={{ label: 'Relatório completo', href: '/relatorios' }} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] sm:min-w-[640px]">
            <thead>
              <tr className="border-t border-line-soft text-left text-[12px] text-faint">
                <th className="px-5 py-2.5 font-medium">Parceiro</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Nível</th>
                <th className="px-3 py-2.5 text-right font-medium">Indicações</th>
                <th className="px-3 py-2.5 text-right font-medium sm:pr-3">Fechados</th>
                <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Próximo nível</th>
              </tr>
            </thead>
            <tbody>
              {m.ranking.map(({ p, qtd, fech }) => {
                const n = nivelDoParceiro(dados, p.id)
                return (
                  <tr key={p.id} className="border-t border-line-soft">
                    <td className="px-5 py-2.5">
                      <Link href={`/parceiros/${p.id}`} className="flex min-w-0 items-center gap-2.5 font-medium hover:underline">
                        <Avatar nome={p.nome} tamanho={26} /> <span className="truncate">{p.nome}</span>
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <Medalha nivel={n.atual} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{qtd}</td>
                    <td className="px-3 py-2.5 pr-5 text-right font-mono font-semibold sm:pr-3">{fech}</td>
                    <td className="hidden px-5 py-2.5 text-dim sm:table-cell">{n.proximo ? `faltam ${n.faltam} para ${n.proximo.nome}` : <Pilula tom="escuro">Nível máximo</Pilula>}</td>
                  </tr>
                )
              })}
              {m.ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-dim">
                    Nenhuma indicação de parceiro neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {m.doSite > 0 && (
          <p className="flex items-center gap-2 border-t border-line-soft px-5 py-3 text-[12.5px] text-dim">
            <Globe className="h-4 w-4" /> {m.doSite === 1 ? '1 indicação chegou' : `${m.doSite} indicações chegaram`} pela simulação do site no período.
          </p>
        )}
      </Card>
    </>
  )
}

function AcaoRapida({ icone, titulo, detalhe, onClick, href, principal, alerta }: { icone: React.ReactNode; titulo: string; detalhe: string; onClick?: () => void; href?: string; principal?: boolean; alerta?: boolean }) {
  const corpo = (
    <>
      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] [&_svg]:size-[17px]', principal ? 'bg-ink text-on-ink' : 'bg-sunken text-soft')}>{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] leading-tight font-semibold text-ink sm:truncate">{titulo}</span>
        <span className={cx('mt-0.5 line-clamp-2 block text-[12px] leading-snug sm:truncate', alerta ? 'font-medium text-warn' : 'text-dim')}>{detalhe}</span>
      </span>
      <ChevronRight className="hidden h-4 w-4 shrink-0 text-faint transition-transform duration-200 ease-suave group-hover:translate-x-0.5 sm:block" />
    </>
  )
  const classe = 'clicavel group flex items-center gap-3 rounded-2xl bg-panel p-3 text-left shadow-card hover:shadow-pop sm:p-3.5'
  return href ? (
    <Link href={href} className={classe}>
      {corpo}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classe}>
      {corpo}
    </button>
  )
}
