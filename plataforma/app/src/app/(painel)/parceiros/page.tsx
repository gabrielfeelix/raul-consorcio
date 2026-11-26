'use client'

import { useMemo, useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { Avatar, Botao, Card, cx, Medalha, PageHeader, Paginacao, Pilula, Progresso, useLinhaClicavel, usePaginacao, Vazio } from '@/components/ds'
import { abrirNovoParceiro } from '@/components/acoes/Acoes'
import { InsigniaNivel } from '@/components/niveis/Insignia'
import { useLoja } from '@/lib/loja'
import { data, fechouContrato, formatarTelefone, niveisOrdenados, nivelDoParceiro, pagamentos, reais } from '@/lib/regras'

export default function Parceiros() {
  const { dados, sessao } = useLoja()
  const linha = useLinhaClicavel()
  const [q, setQ] = useState('')
  const [nivelF, setNivelF] = useState('todos')

  const niveis = niveisOrdenados(dados.niveis)

  const linhas = useMemo(() => {
    const pags = pagamentos(dados)
    const t = q.trim().toLowerCase()
    return dados.parceiros
      .map((p) => {
        const ind = dados.indicacoes.filter((i) => i.parceiroId === p.id)
        const n = nivelDoParceiro(dados, p.id)
        const meus = pags.filter((x) => x.parceiro.id === p.id)
        const ultima = ind.map((i) => i.criadoEm).sort().pop()
        return { p, n, total: ind.length, fechadas: ind.filter(fechouContrato).length, aPagar: meus.filter((x) => !x.pago).reduce((s, x) => s + x.valor, 0), pago: meus.filter((x) => x.pago).reduce((s, x) => s + x.valor, 0), ultima }
      })
      .filter((l) => !t || l.p.nome.toLowerCase().includes(t) || l.p.telefone.includes(t) || l.p.email.toLowerCase().includes(t))
      .filter((l) => nivelF === 'todos' || l.n.atual.id === nivelF)
      .sort((a, b) => b.fechadas - a.fechadas || b.total - a.total)
  }, [dados, q, nivelF])
  const pag = usePaginacao(linhas, 20)

  if (sessao?.papel !== 'raul') return null
  const porNivel = niveis.map((n) => ({ n, qtd: dados.parceiros.filter((p) => nivelDoParceiro(dados, p.id).atual.id === n.id).length }))
  const pendentes = dados.parceiros.filter((p) => p.status === 'convidado').length

  return (
    <>
      <PageHeader
        title="Parceiros"
        subtitle={`Clientes que indicam. ${dados.parceiros.length} parceiros${pendentes ? `, ${pendentes === 1 ? '1 convite pendente' : `${pendentes} convites pendentes`}` : ''}.`}
        actions={
          <Botao variante="marca" onClick={abrirNovoParceiro}>
            <UserPlus /> Novo parceiro
          </Botao>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {porNivel.map(({ n, qtd }) => (
          <button
            key={n.id}
            aria-pressed={nivelF === n.id}
            onClick={() => setNivelF(nivelF === n.id ? 'todos' : n.id)}
            className={cx('clicavel flex items-center gap-3 rounded-[12px] bg-panel p-4 text-left shadow-card hover:shadow-pop', nivelF === n.id && 'ring-2 ring-ink')}
          >
            <InsigniaNivel nivel={n} niveis={dados.niveis} tamanho={40} />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-dim">{n.nome}</span>
              <span className="block font-title text-[24px] leading-tight font-bold">{qtd}</span>
              <span className="block truncate text-[11.5px] text-faint">{n.minFechadas === 0 ? 'nível inicial' : `a partir de ${n.minFechadas} contratos`}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[320px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
          <input className="campo pl-9" placeholder="Buscar por nome, telefone ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {nivelF !== 'todos' && (
          <button onClick={() => setNivelF('todos')} className="clicavel flex h-10 items-center gap-2 rounded-[9px] border border-line bg-panel px-3 text-[13.5px] font-medium text-soft hover:text-ink">
            Nível {niveis.find((n) => n.id === nivelF)?.nome} <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] md:min-w-[900px]">
            <thead>
              <tr className="text-left text-[12px] text-faint">
                <th className="px-4 py-3 font-medium sm:px-5">Parceiro</th>
                <th className="hidden px-3 py-3 font-medium md:table-cell">Nível</th>
                <th className="hidden px-3 py-3 font-medium lg:table-cell">Próximo nível</th>
                <th className="px-3 py-3 text-right font-medium">Indicações</th>
                <th className="hidden px-3 py-3 text-right font-medium sm:table-cell">Fechados</th>
                <th className="hidden px-3 py-3 text-right font-medium md:table-cell">A pagar</th>
                <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Já pago</th>
              </tr>
            </thead>
            <tbody>
              {pag.itens.map(({ p, n, total, fechadas, aPagar, pago, ultima }) => (
                <tr key={p.id} {...linha(`/parceiros/${p.id}`)}>
                  <td className="px-4 py-3 sm:px-5">
                    <span className="flex items-center gap-3">
                      <Avatar nome={p.nome} tamanho={34} />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold">
                          {p.nome} {p.status === 'convidado' && <Pilula tom="aviso">Convite pendente</Pilula>}
                        </span>
                        <span className="block truncate text-[12px] text-dim">
                          <span className="font-mono">{formatarTelefone(p.telefone)}</span>
                          <span className="hidden sm:inline"> · {ultima ? `última indicação em ${data(ultima)}` : 'ainda não indicou'}</span>
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <Medalha nivel={n.atual} />
                  </td>
                  <td className="hidden w-[200px] px-3 py-3 lg:table-cell">
                    {n.proximo ? (
                      <>
                        <span className="text-[12px] text-dim">
                          faltam <b className="font-semibold text-ink">{n.faltam}</b> para {n.proximo.nome}
                        </span>
                        <Progresso valor={n.pct} className="mt-1.5" />
                      </>
                    ) : (
                      <span className="text-[12.5px] font-medium text-soft">Nível máximo</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono sm:pr-3">{total}</td>
                  <td className="hidden px-3 py-3 text-right font-mono font-semibold sm:table-cell">{fechadas}</td>
                  <td className="hidden px-3 py-3 text-right font-mono md:table-cell">{aPagar ? reais(aPagar) : <span className="text-faint">—</span>}</td>
                  <td className="hidden px-5 py-3 text-right font-mono text-dim md:table-cell">{pago ? reais(pago) : <span className="text-faint">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {linhas.length === 0 ? (
          <Vazio icone={<Search />} titulo="Nenhum parceiro encontrado" texto="Confira a busca ou o filtro de nível. Para cadastrar alguém novo, use Novo parceiro." />
        ) : (
          <Paginacao p={pag} rotulo="parceiros" />
        )}
      </Card>
    </>
  )
}
