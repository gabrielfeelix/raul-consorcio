'use client'

import Link from 'next/link'
import { ArrowRight, Gift, Lock, Plus } from 'lucide-react'
import { abrirNovaIndicacao } from '@/components/acoes/Acoes'
import { InsigniaNivel } from '@/components/niveis/Insignia'
import { NovoNivel } from './NovoNivel'
import { Botao, Card, CardHeader, cx, Numero, PageHeader, Vazio } from '@/components/ds'
import { EtapaParceiro, PassosParceiro } from '@/components/indicacoes/Etapa'
import { useLoja, useParceiroAtual } from '@/lib/loja'
import { dataCurta, diasAte, fechouContrato, haQuanto, niveisOrdenados, nivelDoParceiro, pagamentos, primeiroNome, reais } from '@/lib/regras'

export function InicioParceiro() {
  const { dados } = useLoja()
  const parceiro = useParceiroAtual()
  if (!parceiro) return null

  const minhas = dados.indicacoes.filter((i) => i.parceiroId === parceiro.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  const nivel = nivelDoParceiro(dados, parceiro.id)
  const niveis = niveisOrdenados(dados.niveis)
  const fechadas = minhas.filter(fechouContrato).length
  const meusPags = pagamentos(dados).filter((p) => p.parceiro.id === parceiro.id)
  const aReceber = meusPags.filter((p) => !p.pago)
  const recebido = meusPags.filter((p) => p.pago).reduce((s, p) => s + p.valor, 0)
  const proximoPag = aReceber[0]
  const emAndamento = minhas.filter((i) => ['nova', 'contato', 'sem_resposta', 'negociacao'].includes(i.etapa)).length

  const novidades = minhas
    .flatMap((i) => i.eventos.filter((e) => e.visivelParceiro && e.tipo !== 'criada' && new Date(e.em) <= new Date()).map((e) => ({ e, i })))
    .sort((a, b) => b.e.em.localeCompare(a.e.em))
    .slice(0, 6)

  return (
    <>
      <PageHeader
        title={`Olá, ${primeiroNome(parceiro.nome)}`}
        subtitle="Aqui você acompanha suas indicações e o que vai receber."
        actions={
          <Botao variante="marca" tamanho="lg" data-tour="btn-indicar" onClick={() => abrirNovaIndicacao()}>
            <Plus /> Indicar alguém
          </Botao>
        }
      />

      {/* 1ª linha: onde estou (nível) e o que vou receber */}
      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <section data-tour="card-nivel" className="relative overflow-hidden rounded-[12px] bg-[#141518] p-5 text-white shadow-card ring-1 ring-white/[0.06] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <InsigniaNivel nivel={nivel.atual} niveis={dados.niveis} tamanho={56} className="sobe-nivel" />
              <div>
                <p className="text-[13px] font-medium text-white/55">Seu nível</p>
                <p className="mt-1 font-title text-[30px] leading-none font-bold tracking-[-0.02em]">{nivel.atual.nome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-title text-[30px] leading-none font-bold">
                <Numero valor={fechadas} />
              </p>
              <p className="mt-1 text-[12px] text-white/55">contrato{fechadas === 1 ? '' : 's'} fechado{fechadas === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[14px] text-white/80">
              {nivel.proximo ? (
                <>
                  Faltam <b className="text-white">{nivel.faltam} contrato{nivel.faltam > 1 ? 's' : ''}</b> para o <b className="text-white">{nivel.proximo.nome}</b>
                </>
              ) : (
                'Você está no nível mais alto do programa.'
              )}
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              {niveis.map((n, k) => {
                const passou = k < nivel.indice
                const atual = k === nivel.indice
                return (
                  <div key={n.id} className="flex flex-1 flex-col gap-2">
                    <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="cresce-x-lento block h-full rounded-full bg-white" style={{ width: passou ? '100%' : atual ? `${nivel.proximo ? Math.max(6, ((fechadas - nivel.atual.minFechadas) / (nivel.proximo.minFechadas - nivel.atual.minFechadas)) * 100) : 100}%` : '0%', animationDelay: `${250 + k * 180}ms` }} />
                    </span>
                    <span className={cx('flex items-center gap-1.5 text-[11.5px] font-medium', k <= nivel.indice ? 'text-white' : 'text-white/40')}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: n.cor }} />
                      {n.nome}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/[0.08] pt-5 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-white/50">Hoje você ganha</dt>
              <dd className="mt-1 font-semibold">
                {reais(nivel.atual.valorFixo)} + {reais(nivel.atual.valorPor100k)} a cada R$ 100 mil
              </dd>
              <dd className="mt-0.5 text-white/60">{nivel.atual.mesmoMes ? 'Recebe no mesmo mês do fechamento' : `Recebe ${nivel.atual.prazoDias} dias após o fechamento`}</dd>
            </div>
            <div>
              <dt className="flex items-center justify-between text-white/50">
                Seus prêmios
                <Link href="/premios" className="text-[12px] font-medium text-white/60 hover:text-white">
                  Ver níveis
                </Link>
              </dt>
              <dd className="mt-1 flex flex-col gap-1">
                {nivel.atual.premios.map((p) => (
                  <span key={p} className="flex items-center gap-2 font-medium">
                    <Gift className="h-3.5 w-3.5 text-white/60" /> {p}
                  </span>
                ))}
                {nivel.proximo?.premios
                  .filter((p) => !nivel.atual.premios.includes(p))
                  .slice(0, 2)
                  .map((p) => (
                    <span key={p} className="flex items-center gap-2 text-white/45">
                      <Lock className="h-3.5 w-3.5" /> {p} <span className="text-[11.5px]">no {nivel.proximo!.nome}</span>
                    </span>
                  ))}
              </dd>
            </div>
          </dl>
        </section>

        <Card data-tour="card-receber" className="flex flex-col p-5 sm:p-6">
          <p className="text-[13px] font-medium text-dim">A receber</p>
          <p className="mt-1.5 font-title text-[34px] leading-none font-bold tracking-[-0.02em]">
            <Numero valor={aReceber.reduce((s, p) => s + p.valor, 0)} formato={reais} />
          </p>
          <p className="mt-2 text-[13px] text-dim">
            Já recebeu <b className="font-semibold text-ink">{reais(recebido)}</b>
          </p>

          {proximoPag ? (
            <div className="mt-5 flex items-center gap-3 rounded-[9px] bg-sunken p-3.5">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[8px] bg-panel shadow-card">
                <span className="text-[10px] leading-none text-dim uppercase">{new Date(proximoPag.previsto).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                <span className="font-title text-[17px] leading-tight font-bold">{new Date(proximoPag.previsto).getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">Próximo pagamento: {reais(proximoPag.valor)}</p>
                <p className="truncate text-[12.5px] text-dim">
                  Indicação de {proximoPag.indicacao.nome.split(' ')[0]} · {diasAte(proximoPag.previsto) === 0 ? 'previsto para hoje' : diasAte(proximoPag.previsto) < 0 ? 'em processamento' : diasAte(proximoPag.previsto) === 1 ? 'amanhã' : `em ${diasAte(proximoPag.previsto)} dias`}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-[9px] border border-dashed border-line p-4 text-[13px] text-dim">Quando um contrato de indicação sua fechar, a data e o valor aparecem aqui.</p>
          )}

          {aReceber.length > 1 && (
            <ul className="mt-auto pt-4">
              {aReceber.slice(1, 4).map((p) => (
                <li key={p.indicacao.id} className="flex items-center justify-between border-t border-line-soft py-2.5 text-[13px]">
                  <span className="text-soft">{p.indicacao.nome}</span>
                  <span className="font-mono">
                    {reais(p.valor)} <span className="text-faint">· {dataCurta(p.previsto)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* 2ª linha: minhas indicações e o que aconteceu com elas */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <Card data-tour="lista-indicacoes" className="flex flex-col">
          <CardHeader
            title="Suas indicações"
            extra={minhas.length ? `${minhas.length} no total · ${emAndamento} em andamento · ${fechadas} fechada${fechadas === 1 ? '' : 's'}` : undefined}
            action={{ label: 'Ver todas', href: '/indicacoes' }}
          />
          {minhas.length === 0 ? (
            <Vazio icone={<Plus />} titulo="Você ainda não indicou ninguém" texto="Pense em quem quer sair do aluguel, trocar de carro ou investir. Leva 1 minuto." acao={<Botao onClick={() => abrirNovaIndicacao()}>Fazer a primeira indicação</Botao>} />
          ) : (
            <>
              <ul>
                {minhas.slice(0, 5).map((i) => (
                  <li key={i.id}>
                    <Link href={`/indicacoes/${i.id}`} className="block border-t border-line-soft px-5 py-3.5 hover:bg-sunken/60">
                      <div className="flex items-center gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{i.nome}</span>
                          <span className="block truncate text-[12.5px] text-dim">{i.quemE}</span>
                        </span>
                        <EtapaParceiro etapa={i.etapa} />
                      </div>
                      <PassosParceiro etapa={i.etapa} className="mt-3" />
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => abrirNovaIndicacao()} className="clicavel mt-auto flex items-center gap-3 border-t border-line-soft px-5 py-3.5 text-left hover:bg-sunken/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-dashed border-line text-dim">
                  <Plus className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold">Quem mais você conhece?</span>
                  <span className="block truncate text-[12.5px] text-dim">Alguém que quer sair do aluguel, comprar o primeiro imóvel ou investir.</span>
                </span>
                <ArrowRight className="h-4 w-4 text-faint" />
              </button>
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Atualizações" />
          {novidades.length === 0 ? (
            <p className="px-5 pb-5 text-[13px] text-dim">Cada avanço nas suas indicações aparece aqui.</p>
          ) : (
            <ul className="relative px-5 pb-4">
              {novidades.map(({ e, i }, k) => (
                <li key={e.id} className="relative flex gap-3 pb-3.5">
                  {k < novidades.length - 1 && <span className="absolute top-3 left-[5px] h-full w-px bg-line" />}
                  <span className={cx('relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-panel', e.tipo === 'fechado' || e.tipo === 'pago' ? 'bg-ok' : e.tipo === 'sem_resposta' ? 'bg-warn' : 'bg-ink')} />
                  <span className="min-w-0">
                    <Link href={`/indicacoes/${i.id}`} className="block text-[13.5px] hover:underline">
                      <b className="font-semibold">{i.nome.split(' ')[0]}</b> · {e.texto.replace('Movido para', 'agora está em')}
                    </Link>
                    <span className="text-[12px] text-faint">{haQuanto(e.em)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {parceiro.viuTour && <NovoNivel parceiro={parceiro} />}
    </>
  )
}
