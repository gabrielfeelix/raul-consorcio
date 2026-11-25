'use client'

import { useEffect, useState } from 'react'
import { Check, Gift, LayoutGrid, Lock, Pencil, Plus, Rows3 } from 'lucide-react'
import { Botao, Card, CardHeader, cx, PageHeader, Pilula, Progresso } from '@/components/ds'
import { useAvisar } from '@/components/ds/Avisos'
import { InsigniaNivel } from '@/components/niveis/Insignia'
import { ModalNivel } from '@/components/niveis/ModalNivel'
import { useLoja, useParceiroAtual } from '@/lib/loja'
import type { Nivel } from '@/lib/tipos'
import { comissao, fechadasDoParceiro, niveisOrdenados, nivelDoParceiro, reais, soDigitos } from '@/lib/regras'

function prazoTexto(n: Nivel) {
  return n.mesmoMes ? 'No mesmo mês do fechamento' : `${n.prazoDias} dias após o fechamento`
}
function aPartir(n: Nivel) {
  return n.minFechadas === 0 ? 'Nível inicial' : `A partir de ${n.minFechadas} contrato${n.minFechadas === 1 ? '' : 's'} fechado${n.minFechadas === 1 ? '' : 's'}`
}

/* ---------------- Visão do parceiro ---------------- */

function PremiosParceiro() {
  const { dados } = useLoja()
  const parceiro = useParceiroAtual()
  if (!parceiro) return null
  const niveis = niveisOrdenados(dados.niveis)
  const n = nivelDoParceiro(dados, parceiro.id)
  const fechadas = fechadasDoParceiro(dados, parceiro.id)

  return (
    <>
      <PageHeader title="Níveis e prêmios" subtitle="Cada contrato fechado conta para o próximo nível. Quanto mais alto, maior a comissão e mais rápido o pagamento." />

      <Card className="mb-3 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <InsigniaNivel nivel={n.atual} niveis={niveis} tamanho={88} className="sobe-nivel self-start sm:self-center" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-dim">Seu nível</p>
          <p className="font-title text-[30px] leading-tight font-bold tracking-[-0.02em]">{n.atual.nome}</p>
          <p className="mt-1 text-[13.5px] text-soft">
            {fechadas} contrato{fechadas === 1 ? '' : 's'} fechado{fechadas === 1 ? '' : 's'} até hoje
          </p>
        </div>
        <div className="w-full sm:w-[320px]">
          {n.proximo ? (
            <>
              <p className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-soft">
                  Faltam <b className="font-semibold text-ink">{n.faltam}</b> para o {n.proximo.nome}
                </span>
                <span className="font-mono text-[12px] text-faint">
                  {fechadas} de {n.proximo.minFechadas}
                </span>
              </p>
              <Progresso valor={(fechadas / n.proximo.minFechadas) * 100} className="mt-2 h-2" />
              <p className="mt-2 text-[12.5px] text-dim">
                No {n.proximo.nome}: {reais(comissao(n.proximo, 300_000))} numa carta de R$ 300 mil, {n.proximo.mesmoMes ? 'recebendo no mesmo mês' : `recebendo em ${n.proximo.prazoDias} dias`}.
              </p>
            </>
          ) : (
            <p className="text-[13.5px] text-soft">Você chegou ao nível mais alto do programa.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Todos os níveis" />
        <ol className="pb-2">
          {niveis.map((nv, k) => {
            const atual = k === n.indice
            const passou = k < n.indice
            const bloqueado = k > n.indice
            const faltam = nv.minFechadas - fechadas
            return (
              <li key={nv.id} className={cx('relative flex flex-col gap-4 border-t border-line-soft px-4 py-5 sm:flex-row sm:px-5', atual && 'bg-sunken/60')}>
                <div className="flex items-center gap-3.5 sm:w-[240px] sm:shrink-0">
                  <InsigniaNivel nivel={nv} niveis={niveis} tamanho={52} apagada={bloqueado} />
                  <div className="min-w-0">
                    <p className={cx('font-title text-[18px] leading-tight font-bold', bloqueado && 'text-soft')}>{nv.nome}</p>
                    <p className="text-[12.5px] text-dim">{aPartir(nv)}</p>
                    <div className="mt-1.5">
                      {atual ? (
                        <Pilula tom="escuro">Seu nível</Pilula>
                      ) : passou ? (
                        <Pilula tom="ok">
                          <Check className="h-3 w-3" /> Conquistado
                        </Pilula>
                      ) : (
                        <Pilula>
                          <Lock className="h-3 w-3" /> Faltam {faltam}
                        </Pilula>
                      )}
                    </div>
                  </div>
                </div>
                <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-[1fr_1fr_1.3fr]">
                  <div>
                    <dt className="text-[12px] text-dim">Por contrato</dt>
                    <dd className="mt-0.5 font-semibold">
                      {reais(nv.valorFixo)} + {reais(nv.valorPor100k)}
                      <span className="block text-[12px] font-normal text-dim">a cada R$ 100 mil de carta</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-dim">Você recebe</dt>
                    <dd className="mt-0.5 font-semibold">{nv.mesmoMes ? 'No mesmo mês' : `${nv.prazoDias} dias após fechar`}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-[12px] text-dim">Prêmios</dt>
                    <dd className="mt-1 flex flex-col gap-1.5">
                      {nv.premios.length === 0 && <span className="text-faint">—</span>}
                      {nv.premios.map((p) => (
                        <span key={p} className={cx('flex items-start gap-2', bloqueado ? 'text-faint' : 'text-ink')}>
                          {bloqueado ? <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />}
                          {p}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      </Card>

      <Card className="mt-3 p-5 sm:p-6">
        <h2 className="font-title text-[15.5px] font-semibold">Como funciona</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            ['Você indica', 'Nome, telefone e quem é a pessoa. Leva um minuto.'],
            ['O Raul conversa', 'Cada etapa da conversa aparece para você na plataforma.'],
            ['O contrato fecha', 'A comissão é calculada pelo seu nível no dia do fechamento.'],
            ['Você recebe', 'Na data do fechamento mais o prazo do seu nível.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken font-mono text-[12px] font-semibold text-soft">{i + 1}</span>
              <span>
                <span className="block text-[13.5px] font-semibold">{t}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-dim">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  )
}

/* ---------------- Visão do Raul ---------------- */

type Vista = 'cartoes' | 'tabela'

function ConfigNiveis() {
  const { dados, salvarNiveis } = useLoja()
  const avisar = useAvisar()
  const niveis = niveisOrdenados(dados.niveis)
  const [vista, setVista] = useState<Vista>('cartoes')
  const [carta, setCarta] = useState(300_000)
  const [editando, setEditando] = useState<Nivel | null | undefined>(undefined)

  useEffect(() => {
    try {
      const v = localStorage.getItem('rc-niveis-vista')
      if (v === 'tabela' || v === 'cartoes') setVista(v)
    } catch {}
  }, [])
  function mudarVista(v: Vista) {
    setVista(v)
    try {
      localStorage.setItem('rc-niveis-vista', v)
    } catch {}
  }

  const contagem = (id: string) => dados.parceiros.filter((p) => nivelDoParceiro(dados, p.id).atual.id === id).length
  const topo = niveis[niveis.length - 1]

  function salvar(n: Nivel) {
    const existe = dados.niveis.some((x) => x.id === n.id)
    salvarNiveis(existe ? dados.niveis.map((x) => (x.id === n.id ? n : x)) : [...dados.niveis, n])
    setEditando(undefined)
    avisar(existe ? 'Nível salvo' : `Nível ${n.nome} criado`)
  }
  function remover(id: string) {
    const n = dados.niveis.find((x) => x.id === id)
    salvarNiveis(dados.niveis.filter((x) => x.id !== id))
    setEditando(undefined)
    avisar(`Nível ${n?.nome ?? ''} removido`)
  }

  const BotaoEditar = ({ n, className }: { n: Nivel; className?: string }) => (
    <button
      type="button"
      onClick={() => setEditando(n)}
      aria-label={`Editar ${n.nome}`}
      title="Editar"
      className={cx('clicavel flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] font-semibold text-soft hover:bg-sunken hover:text-ink', className)}
    >
      <Pencil className="h-3.5 w-3.5" /> Editar
    </button>
  )

  return (
    <>
      <PageHeader
        title="Níveis e prêmios"
        subtitle="O que cada nível paga, em quanto tempo e quais prêmios dá. Os parceiros veem estas regras na área deles."
        actions={
          <>
            <div role="tablist" aria-label="Visualização" className="inline-flex rounded-xl bg-sunken-2/70 p-1">
              {(
                [
                  ['cartoes', 'Cartões', LayoutGrid],
                  ['tabela', 'Tabela', Rows3],
                ] as const
              ).map(([id, rot, Icone]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={vista === id}
                  onClick={() => mudarVista(id)}
                  className={cx('clicavel flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold', vista === id ? 'bg-panel text-ink shadow-[0_1px_3px_rgb(17_17_17/0.1)]' : 'text-dim hover:text-ink')}
                >
                  <Icone className="h-4 w-4" /> {rot}
                </button>
              ))}
            </div>
            <Botao onClick={() => setEditando(null)}>
              <Plus /> Novo nível
            </Botao>
          </>
        }
      />

      {vista === 'cartoes' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {niveis.map((n) => {
            const qtd = contagem(n.id)
            return (
              <Card key={n.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <InsigniaNivel nivel={n} niveis={niveis} tamanho={60} />
                  <BotaoEditar n={n} className="-mt-1 -mr-1.5" />
                </div>
                <p className="mt-3 font-title text-[20px] leading-tight font-bold tracking-[-0.01em]">{n.nome}</p>
                <p className="text-[12.5px] text-dim">{aPartir(n)}</p>
                <dl className="mt-4 flex flex-col gap-2.5 border-t border-line-soft pt-4 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Fixo por contrato</dt>
                    <dd className="font-mono font-semibold">{reais(n.valorFixo)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">A cada R$ 100 mil</dt>
                    <dd className="font-mono font-semibold">{reais(n.valorPor100k)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Pagamento</dt>
                    <dd className="text-right font-medium">{n.mesmoMes ? 'No mesmo mês' : `${n.prazoDias} dias após fechar`}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-dim">Parceiros</dt>
                    <dd className="font-mono font-semibold">{qtd}</dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-line-soft pt-4">
                  <p className="text-[12px] text-dim">Prêmios</p>
                  {n.premios.length === 0 ? (
                    <p className="mt-1.5 text-[13px] text-faint">Nenhum prêmio cadastrado</p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {n.premios.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[13px]">
                          <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" /> {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13.5px]">
            <thead>
              <tr className="text-left text-[12px] text-faint">
                <th className="px-5 py-3 font-medium">Nível</th>
                <th className="px-3 py-3 text-right font-medium">Contratos</th>
                <th className="px-3 py-3 text-right font-medium">Fixo</th>
                <th className="px-3 py-3 text-right font-medium">A cada R$ 100 mil</th>
                <th className="px-3 py-3 font-medium">Pagamento</th>
                <th className="px-3 py-3 font-medium">Prêmios</th>
                <th className="px-3 py-3 text-right font-medium">Parceiros</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {niveis.map((n) => (
                <tr key={n.id} className="border-t border-line-soft">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <InsigniaNivel nivel={n} niveis={niveis} tamanho={36} />
                      <span className="font-semibold">{n.nome}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{n.minFechadas === 0 ? 'início' : `${n.minFechadas}+`}</td>
                  <td className="px-3 py-3 text-right font-mono">{reais(n.valorFixo)}</td>
                  <td className="px-3 py-3 text-right font-mono">{reais(n.valorPor100k)}</td>
                  <td className="px-3 py-3 text-soft">{n.mesmoMes ? 'No mesmo mês' : `${n.prazoDias} dias após fechar`}</td>
                  <td className="max-w-[260px] px-3 py-3 text-soft">{n.premios.length ? n.premios.join(', ') : <span className="text-faint">—</span>}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold">{contagem(n.id)}</td>
                  <td className="px-5 py-3 text-right">
                    <BotaoEditar n={n} className="ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-3">
        <CardHeader title="Simular comissão" extra="mesma carta em cada nível" />
        <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5 lg:flex-row lg:items-center">
          <label className="flex shrink-0 flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-soft">Valor da carta</span>
            <span className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[13px] text-faint">R$</span>
              <input className="campo w-full pl-9 font-mono lg:w-[180px]" inputMode="numeric" value={carta ? carta.toLocaleString('pt-BR') : ''} onChange={(e) => setCarta(Number(soDigitos(e.target.value).slice(0, 9)) || 0)} placeholder="300.000" />
            </span>
          </label>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            {niveis.map((n) => (
              <div key={n.id} className="flex items-center gap-2.5 rounded-xl bg-sunken px-3 py-2.5">
                <InsigniaNivel nivel={n} niveis={niveis} tamanho={26} />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-dim">{n.nome}</span>
                  <span className="block font-mono text-[14px] font-semibold">{reais(comissao(n, carta))}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="border-t border-line-soft px-4 py-3 text-[12.5px] text-dim sm:px-5">
          Comissão = valor fixo + (valor da carta ÷ R$ 100 mil) × valor a cada R$ 100 mil. O nível fica registrado no dia do fechamento: mudanças aqui valem para os próximos contratos.
        </p>
      </Card>

      <ModalNivel
        aberto={editando !== undefined}
        nivel={editando ?? null}
        niveis={niveis}
        ehTopo={!!editando && editando.id === topo?.id}
        primeiro={!!editando && editando.id === niveis[0]?.id}
        onFechar={() => setEditando(undefined)}
        onSalvar={salvar}
        onRemover={remover}
      />
    </>
  )
}

export default function Premios() {
  const { sessao } = useLoja()
  return sessao?.papel === 'raul' ? <ConfigNiveis /> : <PremiosParceiro />
}
