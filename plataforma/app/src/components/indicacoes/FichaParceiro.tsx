'use client'

import { CalendarClock, Info } from 'lucide-react'
import { Card, CardHeader, PageHeader, Pilula } from '@/components/ds'
import { useLoja } from '@/lib/loja'
import type { Indicacao } from '@/lib/tipos'
import { data, diasAte, formatarTelefone, haQuanto, previsaoParaIndicacao, reais, TIPOS_BEM } from '@/lib/regras'
import { EtapaParceiro, PassosParceiro } from './Etapa'
import { LinhaDoTempo } from './LinhaDoTempo'

export function FichaParceiro({ ind }: { ind: Indicacao }) {
  const { dados } = useLoja()
  const prev = previsaoParaIndicacao(dados, ind)
  const visiveis = ind.eventos.filter((e) => e.visivelParceiro)
  const fechou = ind.etapa === 'fechado' || ind.etapa === 'pago'

  return (
    <>
      <PageHeader
        trilha={[{ rotulo: 'Minhas indicações', href: '/indicacoes' }, { rotulo: ind.nome }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {ind.nome} <EtapaParceiro etapa={ind.etapa} />
          </span>
        }
        subtitle={`Você indicou ${haQuanto(ind.criadoEm)}`}
      />

      <Card className="p-5 sm:p-6">
        <PassosParceiro etapa={ind.etapa} rotulos />
        {ind.etapa === 'sem_resposta' && (
          <p className="mt-4 flex items-start gap-2 rounded-[9px] bg-warn-weak p-3 text-[13px] text-warn">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> O Raul tentou contato com {ind.nome.split(' ')[0]} e ainda não teve resposta. Se puder, avise que ele vai entrar em contato.
          </p>
        )}
        {ind.etapa === 'perdido' && <p className="mt-4 rounded-[9px] bg-sunken p-3 text-[13px] text-dim">Desta vez a negociação não avançou; às vezes não é o momento. O Raul pode retomar o contato mais adiante.</p>}
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Andamento" />
          <div className="px-5 pb-2">
            <LinhaDoTempo eventos={visiveis} />
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          {prev && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-medium text-dim">{fechou ? 'Você recebe' : 'Se fechar, você recebe'}</p>
                {ind.etapa === 'pago' ? <Pilula tom="ok">Recebido</Pilula> : ind.etapa === 'fechado' ? <Pilula tom="aviso">Agendado</Pilula> : <Pilula>Estimativa</Pilula>}
              </div>
              <p className="mt-2 font-title text-[32px] leading-none font-bold tracking-[-0.02em]">{reais(prev.valor)}</p>
              {fechou && prev.previsto ? (
                <div className="mt-4 flex items-center gap-3 rounded-[9px] bg-sunken p-3">
                  <CalendarClock className="h-5 w-5 text-soft" />
                  <div>
                    <p className="text-[13.5px] font-semibold">{ind.etapa === 'pago' ? `Pago em ${data(ind.pagoEm)}` : data(prev.previsto)}</p>
                    {ind.etapa === 'fechado' && (
                      <p className="text-[12px] text-dim">
                        {diasAte(prev.previsto) > 0 ? `daqui a ${diasAte(prev.previsto)} dias · ` : ''}contrato fechado em {data(ind.fechadoEm)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] text-dim">
                  Valor estimado pelo seu nível ({prev.nivel.nome}){ind.credito ? ` e pelo crédito informado` : ''}. O valor final depende do contrato fechado.
                </p>
              )}
            </Card>
          )}

          <Card className="p-5">
            <p className="text-[12.5px] font-medium text-dim">O que você enviou</p>
            <dl className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
              <div>
                <dt className="text-[12px] text-faint">Telefone</dt>
                <dd className="font-mono">{formatarTelefone(ind.telefone)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-faint">Quem é</dt>
                <dd className="leading-relaxed">{ind.quemE}</dd>
              </div>
              {ind.credito ? (
                <div>
                  <dt className="text-[12px] text-faint">Crédito pretendido</dt>
                  <dd className="font-mono">{reais(ind.credito)}</dd>
                </div>
              ) : null}
              {ind.tipoBem && (
                <div>
                  <dt className="text-[12px] text-faint">Interesse</dt>
                  <dd>{TIPOS_BEM.find((t) => t.id === ind.tipoBem)?.rotulo}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
