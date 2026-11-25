'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { Avatar, Botao, Card, PageHeader, Paginacao, Segmentado, usePaginacao, Vazio } from '@/components/ds'
import { abrirNovaIndicacao } from '@/components/acoes/Acoes'
import { useLoja, useParceiroAtual } from '@/lib/loja'
import { dataCurta, haQuanto, previsaoParaIndicacao, reais } from '@/lib/regras'
import { EtapaParceiro, PassosParceiro } from './Etapa'

type Filtro = 'todas' | 'andamento' | 'fechadas' | 'encerradas'

export function ListaParceiro() {
  const { dados } = useLoja()
  const parceiro = useParceiroAtual()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const minhas = dados.indicacoes
    .filter((i) => i.parceiroId === parceiro?.id)
    .filter((i) =>
      filtro === 'todas' ? true : filtro === 'andamento' ? ['nova', 'contato', 'sem_resposta', 'negociacao'].includes(i.etapa) : filtro === 'fechadas' ? ['fechado', 'pago'].includes(i.etapa) : i.etapa === 'perdido',
    )
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  const pag = usePaginacao(minhas, 20)
  if (!parceiro) return null

  return (
    <>
      <PageHeader
        title="Minhas indicações"
        subtitle="O Raul atualiza cada etapa da conversa, e você acompanha por aqui."
        actions={
          <Botao onClick={() => abrirNovaIndicacao()}>
            <Plus /> Indicar alguém
          </Botao>
        }
      />
      <Segmentado
        className="sem-barra mb-3 max-w-full overflow-x-auto"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { id: 'todas', rotulo: 'Todas' },
          { id: 'andamento', rotulo: 'Em andamento' },
          { id: 'fechadas', rotulo: 'Fechadas' },
          { id: 'encerradas', rotulo: 'Não avançaram' },
        ]}
      />
      <Card>
        {minhas.length === 0 ? (
          <Vazio
            icone={<Plus />}
            titulo={filtro === 'todas' ? 'Nenhuma indicação ainda' : 'Nenhuma indicação neste filtro'}
            texto="Cada pessoa que você indicar aparece aqui, com o andamento de cada etapa."
            acao={filtro === 'todas' ? <Botao onClick={() => abrirNovaIndicacao()}>Fazer a primeira indicação</Botao> : undefined}
          />
        ) : (
          <ul>
            {pag.itens.map((i, k) => {
              const prev = previsaoParaIndicacao(dados, i)
              const ultimo = [...i.eventos].reverse().find((e) => e.visivelParceiro && new Date(e.em) <= new Date())
              return (
                <li key={i.id} className={k > 0 ? 'border-t border-line-soft' : ''}>
                  <Link href={`/indicacoes/${i.id}`} className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-sunken/60 sm:items-center sm:gap-4 sm:px-5">
                    <Avatar nome={i.nome} tamanho={36} className="mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14.5px] font-semibold">{i.nome}</p>
                        <EtapaParceiro etapa={i.etapa} />
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-dim">{i.quemE}</p>
                      {(i.etapa === 'fechado' || i.etapa === 'pago') && prev && (
                        <p className="mt-1 text-[12.5px] sm:hidden">
                          <b className="font-mono font-semibold">{reais(prev.valor)}</b> <span className="text-dim">{i.etapa === 'pago' ? `recebido em ${dataCurta(i.pagoEm)}` : `previsto para ${dataCurta(prev.previsto)}`}</span>
                        </p>
                      )}
                      <PassosParceiro etapa={i.etapa} rotulos className="mt-3 max-w-[560px]" />
                    </div>
                    <div className="hidden w-[170px] shrink-0 text-right sm:block">
                      {(i.etapa === 'fechado' || i.etapa === 'pago') && prev ? (
                        <>
                          <p className="font-mono text-[15px] font-semibold">{reais(prev.valor)}</p>
                          <p className="text-[12px] text-dim">{i.etapa === 'pago' ? `recebido ${dataCurta(i.pagoEm)}` : `previsto para ${dataCurta(prev.previsto)}`}</p>
                        </>
                      ) : (
                        <p className="text-[12px] text-faint">{ultimo ? `Atualizado ${haQuanto(ultimo.em)}` : ''}</p>
                      )}
                    </div>
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-faint sm:block" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {minhas.length > 20 && <Paginacao p={pag} rotulo="indicações" />}
      </Card>
    </>
  )
}
