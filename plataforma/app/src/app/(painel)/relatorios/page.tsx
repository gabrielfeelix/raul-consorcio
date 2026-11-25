'use client'

import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Avatar, Botao, Card, CardHeader, Dica, Medalha, Numero, PageHeader, Paginacao, Progresso, Segmentado, useLinhaClicavel, usePaginacao } from '@/components/ds'
import { useLoja } from '@/lib/loja'
import { dentro, fechouContrato, inicioPeriodo, nivelDoParceiro, pagamentos, PERIODOS, reais, reaisCurto, TIPOS_BEM, type Periodo } from '@/lib/regras'

export default function Relatorios() {
  const { dados, sessao } = useLoja()
  const linha = useLinhaClicavel()
  const [periodo, setPeriodo] = useState<Periodo>('90d')

  const r = useMemo(() => {
    const de = inicioPeriodo(periodo)
    const ind = dados.indicacoes.filter((i) => dentro(i.criadoEm, de))
    const fech = dados.indicacoes.filter((i) => fechouContrato(i) && dentro(i.fechadoEm, de))
    const pags = pagamentos(dados).filter((p) => dentro(p.indicacao.fechadoEm, de))
    const linhas = dados.parceiros
      .map((p) => {
        const mi = ind.filter((i) => i.parceiroId === p.id)
        const mf = fech.filter((i) => i.parceiroId === p.id)
        const n = nivelDoParceiro(dados, p.id)
        return {
          p,
          n,
          indicacoes: mi.length,
          fechadas: mf.length,
          conversao: mi.length ? (mi.filter(fechouContrato).length / mi.length) * 100 : 0,
          volume: mf.reduce((s, i) => s + (i.valorContrato ?? 0), 0),
          interesse: mi.reduce((s, i) => s + (i.credito ?? 0), 0),
          comissao: pags.filter((x) => x.parceiro.id === p.id).reduce((s, x) => s + x.valor, 0),
        }
      })
      .sort((a, b) => b.fechadas - a.fechadas || b.indicacoes - a.indicacoes)
    const porTipo = TIPOS_BEM.map((t) => ({ t, qtd: ind.filter((i) => i.tipoBem === t.id).length, valor: ind.filter((i) => i.tipoBem === t.id).reduce((s, i) => s + (i.credito ?? 0), 0) })).filter((x) => x.qtd)
    const porGenero = [
      { g: 'Feminino', qtd: ind.filter((i) => i.genero === 'feminino').length, cor: 'var(--serie-1)' },
      { g: 'Masculino', qtd: ind.filter((i) => i.genero === 'masculino').length, cor: 'var(--serie-2)' },
      { g: 'Outro', qtd: ind.filter((i) => i.genero === 'outro').length, cor: 'var(--serie-3)' },
      { g: 'Não informado', qtd: ind.filter((i) => !i.genero).length, cor: 'var(--serie-4)' },
    ].filter((x) => x.qtd > 0)
    const idades = ind.map((i) => i.idade).filter(Boolean) as number[]
    const faixas = [
      ['até 30', idades.filter((x) => x <= 30).length],
      ['31 a 45', idades.filter((x) => x > 30 && x <= 45).length],
      ['46 a 60', idades.filter((x) => x > 45 && x <= 60).length],
      ['60+', idades.filter((x) => x > 60).length],
    ] as const
    const semIdade = ind.length - idades.length
    return { ind, fech, linhas, porTipo, porGenero, faixas, semIdade, comissoes: pags.reduce((s, p) => s + p.valor, 0) }
  }, [dados, periodo])

  const pag = usePaginacao(r.linhas, 20)
  if (sessao?.papel !== 'raul') return null

  function exportar() {
    const cab = ['Parceiro', 'Nível', 'Faltam para o próximo', 'Indicações', 'Fechados', 'Conversão %', 'Crédito indicado', 'Volume fechado', 'Comissão']
    const lin = r.linhas.map((l) => [l.p.nome, l.n.atual.nome, l.n.proximo ? `${l.n.faltam} para ${l.n.proximo.nome}` : 'máximo', l.indicacoes, l.fechadas, Math.round(l.conversao), l.interesse, l.volume, l.comissao])
    const csv = [cab, ...lin].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `relatorio-parceiros-${periodo}.csv`
    a.click()
  }

  const maxTipo = Math.max(...r.porTipo.map((x) => x.qtd), 1)
  const totalGen = r.porGenero.reduce((s, x) => s + x.qtd, 0) || 1
  const totalTipo = r.porTipo.reduce((s, x) => s + x.qtd, 0) || 1
  const maxFaixa = Math.max(...r.faixas.map((x) => x[1]), 1)
  const ativos = r.linhas.filter((l) => l.indicacoes > 0).length

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Quem indicou, quanto, quanto falta para cada um subir e quanto vale cada indicação."
        actions={
          <>
            <Segmentado opcoes={PERIODOS.map((p) => ({ id: p.id, rotulo: p.curto }))} valor={periodo} onChange={setPeriodo} className="max-w-full overflow-x-auto" />
            <Botao variante="secundario" onClick={exportar}>
              <Download /> Exportar planilha
            </Botao>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Parceiros que indicaram', `${ativos} de ${dados.parceiros.length}`],
          ['Indicações', <Numero key="i" valor={r.ind.length} />],
          ['Crédito indicado', <Numero key="c" valor={r.ind.reduce((s, i) => s + (i.credito ?? 0), 0)} formato={reaisCurto} />],
          ['Contratos fechados', <Numero key="f" valor={r.fech.length} />],
          ['Comissões geradas', <Numero key="m" valor={r.comissoes} formato={reais} />],
        ].map(([a, b], k) => (
          <Card key={a as string} className={k === 4 ? 'col-span-2 p-4 lg:col-span-1' : 'p-4'}>
            <p className="text-[12.5px] text-dim">{a}</p>
            <p className="mt-1 font-title text-[22px] leading-tight font-bold">{b}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Por parceiro" extra="clique em uma linha para abrir o parceiro" />
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-[13.5px]">
          <thead>
            <tr className="border-t border-line-soft text-left text-[12px] text-faint">
              <th className="px-5 py-2.5 font-medium">Parceiro</th>
              <th className="px-3 py-2.5 font-medium">Nível</th>
              <th className="px-3 py-2.5 font-medium">Falta para subir</th>
              <th className="px-3 py-2.5 text-right font-medium">Indicações</th>
              <th className="px-3 py-2.5 text-right font-medium">Fechados</th>
              <th className="px-3 py-2.5 text-right font-medium">Conversão</th>
              <th className="px-3 py-2.5 text-right font-medium">Crédito indicado</th>
              <th className="px-3 py-2.5 text-right font-medium">Volume fechado</th>
              <th className="px-5 py-2.5 text-right font-medium">Comissão</th>
            </tr>
          </thead>
          <tbody>
            {pag.itens.map((l) => (
              <tr key={l.p.id} {...linha(`/parceiros/${l.p.id}`)}>
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-2.5 font-medium">
                    <Avatar nome={l.p.nome} tamanho={26} /> {l.p.nome}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Medalha nivel={l.n.atual} />
                </td>
                <td className="w-[180px] px-3 py-2.5">
                  {l.n.proximo ? (
                    <>
                      <span className="text-[12px] text-dim">
                        {l.n.faltam} para {l.n.proximo.nome}
                      </span>
                      <Progresso valor={l.n.pct} className="mt-1" />
                    </>
                  ) : (
                    <span className="text-[12px] font-medium text-soft">Nível máximo</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">{l.indicacoes}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold">{l.fechadas}</td>
                <td className="px-3 py-2.5 text-right font-mono text-dim">{l.indicacoes ? `${Math.round(l.conversao)}%` : '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono">{l.interesse ? reaisCurto(l.interesse) : '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono">{l.volume ? reaisCurto(l.volume) : '—'}</td>
                <td className="px-5 py-2.5 text-right font-mono font-semibold">{l.comissao ? reais(l.comissao) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Paginacao p={pag} rotulo="parceiros" />
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader title="Interesse" extra="indicações e crédito pretendido" />
          <div className="flex flex-1 flex-col gap-4 px-4 pb-5 sm:px-5">
            {r.porTipo
              .sort((a, b) => b.qtd - a.qtd)
              .map(({ t, qtd, valor }) => (
                <div key={t.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="text-soft">{t.rotulo}</span>
                    <span className="font-mono text-[12.5px]">
                      <b className="font-semibold text-ink">{qtd}</b> <span className="text-faint">· {reaisCurto(valor)}</span>
                    </span>
                  </div>
                  <span className="mt-1.5 block h-2.5 rounded-full bg-sunken">
                    <Dica
                      className="cresce-x block h-full rounded-full bg-serie-1"
                      style={{ width: `${Math.max(3, (qtd / maxTipo) * 100)}%` }}
                      conteudo={
                        <>
                          {t.rotulo}: {qtd} {qtd === 1 ? 'indicação' : 'indicações'} ({Math.round((qtd / totalTipo) * 100)}%)
                          <span className="block text-[12px] font-normal text-dim">{reaisCurto(valor)} em crédito pretendido</span>
                        </>
                      }
                    />
                  </span>
                </div>
              ))}
            {r.porTipo.length === 0 && <p className="text-[13px] text-dim">Sem indicações com interesse informado no período.</p>}
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader title="Gênero" extra={`${r.ind.length} indicações`} />
          <div className="flex flex-1 flex-col px-4 pb-5 sm:px-5">
            <div className="flex h-10 gap-1">
              {r.porGenero.map((x) => (
                <Dica
                  key={x.g}
                  className="cresce-x block h-full rounded-[8px] first:rounded-l-xl last:rounded-r-xl"
                  style={{ width: `${(x.qtd / totalGen) * 100}%`, background: x.cor, minWidth: 6 }}
                  conteudo={
                    <>
                      {x.g}: {x.qtd} ({Math.round((x.qtd / totalGen) * 100)}%)
                    </>
                  }
                />
              ))}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {r.porGenero.map((x) => (
                <li key={x.g} className="flex flex-col">
                  <span className="flex items-center gap-2 text-[12.5px] text-dim">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: x.cor }} /> {x.g}
                  </span>
                  <span className="mt-0.5 pl-[18px] font-title text-[20px] leading-tight font-bold">
                    {Math.round((x.qtd / totalGen) * 100)}%<span className="ml-1.5 font-mono text-[12px] font-medium text-faint">{x.qtd}</span>
                  </span>
                </li>
              ))}
            </ul>
            {r.porGenero.length === 0 && <p className="text-[13px] text-dim">Sem indicações no período.</p>}
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader title="Idade" extra={r.semIdade ? `${r.semIdade} sem idade informada` : undefined} />
          <div className="flex h-[220px] items-end gap-3 px-4 pb-5 sm:px-5">
            {r.faixas.map(([rot, q]) => (
              <div key={rot} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-[12.5px] font-semibold">{q}</span>
                <Dica
                  className="block w-full origin-bottom rounded-t-[10px] rounded-b-[4px] bg-serie-1 transition-[height] duration-700 ease-suave"
                  style={{ height: `${Math.max(4, (q / maxFaixa) * 140)}px`, opacity: q ? 1 : 0.25 }}
                  conteudo={
                    <>
                      {rot} anos: {q} {q === 1 ? 'pessoa' : 'pessoas'}
                    </>
                  }
                />
                <span className="text-[12px] text-dim">{rot}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
