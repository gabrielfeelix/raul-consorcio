'use client'

import { use, useState } from 'react'
import { Mail, MapPin, Phone, Plus, SearchX } from 'lucide-react'
import { Avatar, Botao, BotaoLink, Card, CardHeader, cx, Numero, PageHeader, Paginacao, Pilula, Progresso, Segmentado, useLinhaClicavel, usePaginacao, Vazio } from '@/components/ds'
import { EtapaPilula } from '@/components/indicacoes/Etapa'
import { abrirNovaIndicacao } from '@/components/acoes/Acoes'
import { InsigniaNivel } from '@/components/niveis/Insignia'
import { useLoja } from '@/lib/loja'
import { data, dataCurta, fechouContrato, formatarTelefone, haQuanto, linkWhatsApp, niveisOrdenados, nivelDoParceiro, pagamentos, primeiroNome, reais, reaisCurto, TIPOS_BEM } from '@/lib/regras'
import { ConviteAcoes } from '@/components/parceiros/Convite'
import { BOTAO_WHATS, IconeWhatsApp } from '@/components/ds/WhatsApp'

type Filtro = 'todas' | 'andamento' | 'fechadas'

export default function ParceiroDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { dados, sessao } = useLoja()
  const linha = useLinhaClicavel()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const p = dados.parceiros.find((x) => x.id === id)
  const todas = dados.indicacoes.filter((i) => i.parceiroId === id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  const ind = todas.filter((i) => (filtro === 'todas' ? true : filtro === 'fechadas' ? fechouContrato(i) : !fechouContrato(i) && i.etapa !== 'perdido'))
  const pag = usePaginacao(ind, 20)

  if (sessao?.papel !== 'raul') return null
  if (!p)
    return (
      <Card>
        <Vazio icone={<SearchX />} titulo="Parceiro não encontrado" texto="O link pode estar desatualizado." acao={<BotaoLink href="/parceiros">Ver parceiros</BotaoLink>} />
      </Card>
    )

  const n = nivelDoParceiro(dados, p.id)
  const niveis = niveisOrdenados(dados.niveis)
  const pags = pagamentos(dados).filter((x) => x.parceiro.id === p.id)
  const fechadas = todas.filter(fechouContrato)
  const volume = fechadas.reduce((s, i) => s + (i.valorContrato ?? 0), 0)
  const aPagar = pags.filter((x) => !x.pago).reduce((s, x) => s + x.valor, 0)
  const pago = pags.filter((x) => x.pago).reduce((s, x) => s + x.valor, 0)
  const emails = (dados.emails ?? []).filter((e) => e.parceiroId === p.id).slice(0, 5)

  return (
    <>
      <PageHeader
        trilha={[{ rotulo: 'Parceiros', href: '/parceiros' }, { rotulo: p.nome }]}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Avatar nome={p.nome} tamanho={40} /> {p.nome}
            {p.status === 'convidado' && <Pilula tom="aviso">Convite pendente</Pilula>}
          </span>
        }
        subtitle={`${p.cidade} · parceiro desde ${data(p.desde)}`}
        actions={
          <>
            <a href={linkWhatsApp(p.telefone)} target="_blank" rel="noreferrer" className={cx(BOTAO_WHATS, 'h-9')}>
              <IconeWhatsApp /> WhatsApp
            </a>
            <Botao variante="marca" onClick={() => abrirNovaIndicacao(p.id)}>
              <Plus /> Indicação em nome de {primeiroNome(p.nome)}
            </Botao>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(
              [
                ['Indicações', <Numero key="a" valor={todas.length} />],
                ['Contratos fechados', <Numero key="b" valor={fechadas.length} />],
                ['Volume em cartas', <Numero key="c" valor={volume} formato={reaisCurto} />],
                ['Comissões', <Numero key="d" valor={aPagar + pago} formato={reais} />],
              ] as const
            ).map(([r, v], k) => (
              <Card key={r} className="p-4">
                <p className="text-[12.5px] text-dim">{r}</p>
                <p className="mt-1 font-title text-[22px] leading-tight font-bold">{v}</p>
                {k === 3 && <p className="mt-0.5 text-[11.5px] text-faint">{aPagar ? `${reais(aPagar)} a pagar` : 'nada pendente'}</p>}
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="Indicações"
              count={todas.length}
              action={
                <Segmentado
                  valor={filtro}
                  onChange={setFiltro}
                  opcoes={[
                    { id: 'todas', rotulo: 'Todas' },
                    { id: 'andamento', rotulo: 'Em andamento' },
                    { id: 'fechadas', rotulo: 'Fechadas' },
                  ]}
                  className="max-w-[calc(100vw-60px)] overflow-x-auto"
                />
              }
              className="flex-wrap"
            />
            {ind.length === 0 ? (
              <Vazio titulo={todas.length ? 'Nenhuma indicação neste filtro' : `${primeiroNome(p.nome)} ainda não indicou ninguém`} texto={todas.length ? undefined : 'Você pode cadastrar uma indicação em nome dele pelo botão acima.'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px] md:min-w-[720px]">
                  <thead>
                    <tr className="text-left text-[12px] text-faint">
                      <th className="px-4 py-2.5 font-medium sm:px-5">Indicado</th>
                      <th className="px-3 py-2.5 font-medium">Etapa</th>
                      <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Carta</th>
                      <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Comissão</th>
                      <th className="hidden px-5 py-2.5 text-right font-medium md:table-cell">Indicado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pag.itens.map((i) => {
                      const pg = pags.find((x) => x.indicacao.id === i.id)
                      const tipo = TIPOS_BEM.find((t) => t.id === i.tipoBem)?.rotulo
                      return (
                        <tr key={i.id} {...linha(`/indicacoes/${i.id}`)}>
                          <td className="px-4 py-3 sm:px-5">
                            <span className="flex items-center gap-3">
                              <Avatar nome={i.nome} tamanho={34} />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{i.nome}</span>
                                <span className="block max-w-[340px] truncate text-[12px] text-dim">
                                  {tipo ? `${tipo} · ` : ''}
                                  {i.quemE}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <EtapaPilula etapa={i.etapa} />
                          </td>
                          <td className="hidden px-3 py-3 text-right font-mono sm:table-cell">
                            {i.valorContrato ? reaisCurto(i.valorContrato) : i.credito ? <span className="text-dim">~{reaisCurto(i.credito)}</span> : <span className="text-faint">—</span>}
                          </td>
                          <td className="hidden px-3 py-3 text-right md:table-cell">
                            {pg ? (
                              <>
                                <span className="block font-mono font-semibold">{reais(pg.valor)}</span>
                                <span className={cx('block text-[11.5px]', pg.pago ? 'text-ok' : 'text-faint')}>{pg.pago ? `paga em ${dataCurta(pg.indicacao.pagoEm)}` : `prevista ${dataCurta(pg.previsto)}`}</span>
                              </>
                            ) : (
                              <span className="text-faint">—</span>
                            )}
                          </td>
                          <td className="hidden px-5 py-3 text-right text-dim md:table-cell">{dataCurta(i.criadoEm)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {ind.length > 20 && <Paginacao p={pag} rotulo="indicações" />}
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <InsigniaNivel nivel={n.atual} niveis={dados.niveis} tamanho={52} />
              <div>
                <p className="text-[12.5px] text-dim">Nível atual</p>
                <p className="font-title text-[20px] leading-tight font-bold">{n.atual.nome}</p>
              </div>
            </div>
            {n.proximo ? (
              <>
                <Progresso valor={n.pct} className="mt-4" />
                <p className="mt-2 text-[12.5px] text-dim">
                  Faltam <b className="font-semibold text-ink">{n.faltam === 1 ? '1 contrato' : `${n.faltam} contratos`}</b> para {n.proximo.nome}
                </p>
              </>
            ) : (
              <p className="mt-3 text-[12.5px] text-dim">Está no nível mais alto do programa.</p>
            )}
            <div className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4">
              {niveis.map((nv, k) => (
                <div key={nv.id} className="flex items-center gap-2.5 text-[13px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: nv.cor, opacity: k <= n.indice ? 1 : 0.3 }} />
                  <span className={k === n.indice ? 'font-semibold' : k < n.indice ? 'text-soft' : 'text-faint'}>{nv.nome}</span>
                  <span className="ml-auto text-[12px] text-faint">{nv.minFechadas === 0 ? 'início' : `${nv.minFechadas} contratos`}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-medium text-dim">Contato</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-faint" /> <span className="font-mono">{formatarTelefone(p.telefone)}</span>
              </li>
              <li className="flex min-w-0 items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-faint" /> <span className="truncate">{p.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-faint" /> {p.cidade}
              </li>
            </ul>
            {p.clienteDesde && <p className="mt-4 text-[12px] text-faint">Cliente desde {data(p.clienteDesde)}</p>}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-dim">Acesso</p>
              {p.status === 'convidado' ? <Pilula tom="aviso">Convite pendente</Pilula> : <Pilula tom="ok">Ativo</Pilula>}
            </div>
            {p.status === 'convidado' ? <ConviteAcoes p={p} /> : <p className="text-[13px] text-dim">{p.viuTour ? 'Concluiu o onboarding guiado.' : 'Ainda não concluiu o onboarding guiado.'}</p>}
          </Card>

          {emails.length > 0 && (
            <Card className="p-5">
              <p className="text-[13px] font-medium text-dim">E-mails automáticos enviados</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {emails.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-[13px]">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                    <span className="min-w-0">
                      <span className="block text-soft">{e.assunto}</span>
                      <span className="text-[12px] text-faint">{haQuanto(e.em)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
