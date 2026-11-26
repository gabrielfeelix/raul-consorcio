'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Banknote, Check, Eye, Globe, Mail, MessageCircle, Pencil, Phone, PhoneMissed, SlidersHorizontal, StickyNote, Users } from 'lucide-react'
import { Avatar, Botao, BotaoIcone, Card, CardHeader, cx, Flutuante, Marcador, Medalha, Modal, PageHeader, Pilula, Progresso, Selecao } from '@/components/ds'
import { useAvisar } from '@/components/ds/Avisos'
import { useLoja } from '@/lib/loja'
import type { Etapa, Evento, Indicacao } from '@/lib/tipos'
import { data, ETAPAS, ETAPA_POR_ID, formatarTelefone, haQuanto, linkWhatsApp, nivelDoParceiro, previsaoParaIndicacao, primeiroNome, reais, TIPOS_BEM } from '@/lib/regras'
import { LinhaDoTempo } from './LinhaDoTempo'
import { ContaComissao, ModalAjusteNegocio, ModalEditarLead, ModalFechamento } from './ModaisLead'
import { EtapaPilula } from './Etapa'

const MODELOS = (nome: string, parceiro?: string) => [
  { rotulo: 'Primeiro contato', texto: `Olá, ${nome}! Aqui é o Raul, da Raul Consórcio.${parceiro ? ` O ${parceiro} me passou seu contato` : ''} e comentou que você tem interesse em consórcio. Posso te fazer algumas perguntas rápidas para entender o seu caso?` },
  { rotulo: 'Retomar contato', texto: `Olá, ${nome}! Tudo bem? Gostaria de retomar nossa conversa sobre o consórcio. Qual o melhor horário para você esta semana?` },
  { rotulo: 'Enviar simulação', texto: `${nome}, preparei uma simulação para o seu caso. Envio por aqui ou prefere que eu ligue para explicar?` },
]

const COR_ETAPA: Record<Etapa, string> = {
  nova: 'var(--brand)',
  contato: 'var(--info)',
  sem_resposta: 'var(--warn)',
  negociacao: 'var(--ink)',
  fechado: 'var(--ok)',
  pago: 'var(--ok)',
  perdido: 'var(--faint)',
}

function Dado({ rotulo, children, className }: { rotulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[12px] text-dim">{rotulo}</dt>
      <dd className="mt-0.5 text-[14px] text-ink">{children}</dd>
    </div>
  )
}

export function FichaRaul({ ind }: { ind: Indicacao }) {
  const { dados, moverEtapa, registrarEvento, alternarVisibilidade, substituirIndicacao } = useLoja()
  const avisar = useAvisar()
  const parceiro = dados.parceiros.find((p) => p.id === ind.parceiroId)
  const nivel = parceiro ? nivelDoParceiro(dados, parceiro.id) : undefined
  const prev = previsaoParaIndicacao(dados, ind)
  const primeiro = primeiroNome(ind.nome)
  const fechou = ind.etapa === 'fechado' || ind.etapa === 'pago'

  const [fechando, setFechando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [ajustando, setAjustando] = useState(false)
  const [registro, setRegistro] = useState<null | 'contato' | 'nota'>(null)
  const [canal, setCanal] = useState<NonNullable<Evento['canal']>>('whatsapp')
  const [texto, setTexto] = useState('')
  const [visivel, setVisivel] = useState(true)
  const [modelos, setModelos] = useState(false)
  const botaoWhats = useRef<HTMLButtonElement>(null)

  const desfazer = (antes: Indicacao) => ({ rotulo: 'Desfazer', fn: () => substituirIndicacao(antes) })

  function mover(e: Etapa) {
    if (e === ind.etapa) return
    if (e === 'fechado' && !ind.fechadoEm) return setFechando(true)
    moverEtapa(ind.id, e)
    avisar(`Movido para ${ETAPA_POR_ID[e].rotulo}${parceiro ? `. ${primeiroNome(parceiro.nome)} recebeu um e-mail.` : ''}`, { acao: desfazer(ind) })
  }

  function semResposta() {
    registrarEvento(ind.id, { tipo: 'sem_resposta', texto: 'Tentou contato e não respondeu', canal: 'whatsapp', visivelParceiro: true })
    if (ind.etapa === 'nova' || ind.etapa === 'contato') moverEtapa(ind.id, 'sem_resposta')
    avisar('Tentativa sem resposta registrada', { acao: desfazer(ind) })
  }

  function abrirRegistro(tipo: 'contato' | 'nota') {
    setRegistro(tipo)
    setTexto('')
    setVisivel(tipo === 'contato')
  }

  const tentativas = ind.eventos.filter((e) => e.tipo === 'sem_resposta').length
  const ultimoContato = [...ind.eventos].reverse().find((e) => e.tipo === 'contato' || e.tipo === 'sem_resposta')
  const emails = (dados.emails ?? []).filter((e) => e.indicacaoId === ind.id).slice(0, 3)
  const tipo = TIPOS_BEM.find((t) => t.id === ind.tipoBem)?.rotulo

  const opcoesEtapa = ETAPAS.map((e) => ({
    id: e.id,
    rotulo: e.rotulo,
    detalhe: e.descricao,
    icone: <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COR_ETAPA[e.id] }} />,
  }))

  return (
    <>
      <PageHeader
        trilha={[{ rotulo: 'Indicações', href: '/indicacoes' }, { rotulo: ind.nome }]}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {ind.nome} <EtapaPilula etapa={ind.etapa} />
          </span>
        }
        subtitle={
          <>
            <span className="font-mono">{formatarTelefone(ind.telefone)}</span> · chegou {haQuanto(ind.criadoEm)}
            {ultimoContato ? ` · último contato ${haQuanto(ultimoContato.em)}` : ' · ainda sem contato'}
            {tentativas > 0 && <span className="text-warn"> · {tentativas === 1 ? '1 tentativa sem resposta' : `${tentativas} tentativas sem resposta`}</span>}
          </>
        }
        actions={
          <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            <BotaoIcone ref={botaoWhats} rotulo="WhatsApp" tom="whats" onClick={() => setModelos(!modelos)} aria-expanded={modelos}>
              <MessageCircle />
            </BotaoIcone>
            <a
              href={`tel:+55${ind.telefone}`}
              aria-label="Ligar"
              title="Ligar"
              onClick={() => registrarEvento(ind.id, { tipo: 'contato', texto: 'Raul ligou', canal: 'ligacao', visivelParceiro: true })}
              className="clicavel inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-line bg-panel text-soft hover:bg-sunken hover:text-ink"
            >
              <Phone className="h-[17px] w-[17px]" />
            </a>
            <BotaoIcone rotulo="Não respondeu" tom="aviso" onClick={semResposta}>
              <PhoneMissed />
            </BotaoIcone>
            <BotaoIcone rotulo="Registrar conversa" onClick={() => abrirRegistro('contato')}>
              <Users />
            </BotaoIcone>
            <BotaoIcone rotulo="Nota interna" onClick={() => abrirRegistro('nota')}>
              <StickyNote />
            </BotaoIcone>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <div className="min-w-[190px] flex-1 sm:w-[210px] sm:flex-none">
              <Selecao opcoes={opcoesEtapa} valor={ind.etapa} onChange={mover} rotuloAria="Etapa" tamanho="sm" alinhar="fim" className="font-semibold" />
            </div>
          </div>
        }
      />

      <Flutuante ancora={botaoWhats} aberto={modelos} onFechar={() => setModelos(false)} largura={320}>
        <p className="px-2.5 pt-1.5 pb-1 text-[11.5px] font-medium text-faint">Abrir conversa com mensagem pronta</p>
        {MODELOS(primeiro, parceiro ? primeiroNome(parceiro.nome) : undefined).map((m) => (
          <a
            key={m.rotulo}
            href={linkWhatsApp(ind.telefone, m.texto)}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setModelos(false)
              registrarEvento(ind.id, { tipo: 'contato', texto: `Raul fez contato pelo WhatsApp (${m.rotulo.toLowerCase()})`, canal: 'whatsapp', visivelParceiro: true })
              if (ind.etapa === 'nova') moverEtapa(ind.id, 'contato')
            }}
            className="clicavel block rounded-[9px] px-2.5 py-2 hover:bg-sunken"
          >
            <span className="block text-[13px] font-semibold text-ink">{m.rotulo}</span>
            <span className="line-clamp-2 block text-[12px] text-dim">{m.texto}</span>
          </a>
        ))}
        <a href={linkWhatsApp(ind.telefone)} target="_blank" rel="noreferrer" onClick={() => setModelos(false)} className="clicavel block rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-soft hover:bg-sunken">
          Abrir sem mensagem
        </a>
      </Flutuante>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Card>
            <CardHeader
              title="Dados do lead"
              action={
                <Botao tamanho="sm" variante="secundario" onClick={() => setEditando(true)}>
                  <Pencil /> Editar
                </Botao>
              }
            />
            <dl className="grid gap-x-6 gap-y-4 px-4 pb-5 sm:grid-cols-3 sm:px-5">
              <Dado rotulo="Quem é" className="sm:col-span-3">
                <span className="leading-relaxed">{ind.quemE}</span>
              </Dado>
              <Dado rotulo="Telefone / WhatsApp">
                <span className="font-mono">{formatarTelefone(ind.telefone)}</span>
              </Dado>
              <Dado rotulo="E-mail">{ind.email ? <span className="break-all">{ind.email}</span> : <span className="text-faint">Não informado</span>}</Dado>
              <Dado rotulo="Interesse">{tipo ?? <span className="text-faint">Não informado</span>}</Dado>
              <Dado rotulo="Crédito pretendido">{ind.credito ? <span className="font-mono">{reais(ind.credito)}</span> : <span className="text-faint">Não informado</span>}</Dado>
              <Dado rotulo="Gênero">{ind.genero ? { feminino: 'Feminino', masculino: 'Masculino', outro: 'Outro' }[ind.genero] : <span className="text-faint">Não informado</span>}</Dado>
              <Dado rotulo="Idade">{ind.idade ? `${ind.idade} anos` : <span className="text-faint">Não informada</span>}</Dado>
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Histórico"
              extra="O ícone de olho define o que o parceiro vê"
              action={
                <Botao tamanho="sm" variante="secundario" onClick={() => abrirRegistro('nota')}>
                  <StickyNote /> Nota
                </Botao>
              }
            />
            <div className="px-4 pb-2 sm:px-5">
              <LinhaDoTempo eventos={ind.eventos} editavel onAlternar={(id) => alternarVisibilidade(ind.id, id)} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-dim">{fechou ? 'Negócio' : 'Comissão estimada'}</p>
              {ind.etapa === 'pago' ? <Pilula tom="ok">Comissão paga</Pilula> : ind.etapa === 'fechado' ? <Pilula tom="aviso">A pagar</Pilula> : prev ? <Pilula>Estimativa</Pilula> : null}
            </div>
            {prev ? (
              <>
                <p className="mt-2 flex items-baseline gap-2 font-title text-[30px] leading-none font-bold tracking-[-0.02em]">
                  {reais(prev.valor)}
                  {prev.manual && <span className="font-sans text-[12px] font-medium tracking-normal text-dim">valor manual</span>}
                </p>
                <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2.5 text-[13px]">
                  <dt className="text-dim">Valor da carta</dt>
                  <dd className="text-right font-mono font-medium">{ind.valorContrato ? reais(ind.valorContrato) : ind.credito ? `~${reais(ind.credito)}` : '—'}</dd>
                  <dt className="text-dim">Nível {fechou ? 'no fechamento' : 'atual'}</dt>
                  <dd className="text-right font-medium">{prev.nivel.nome}</dd>
                  {fechou && (
                    <>
                      <dt className="text-dim">Fechamento</dt>
                      <dd className="text-right font-medium">{data(ind.fechadoEm)}</dd>
                    </>
                  )}
                  <dt className="text-dim">{ind.etapa === 'pago' ? 'Pago em' : 'Pagamento previsto'}</dt>
                  <dd className="text-right font-semibold">{ind.etapa === 'pago' ? data(ind.pagoEm) : prev.previsto ? data(prev.previsto) : 'após o fechamento'}</dd>
                </dl>
                {fechou && <ContaComissao nivel={prev.nivel} carta={ind.valorContrato ?? 0} manual={prev.manual?.valor} className="mt-4 p-3.5 text-[12.5px]" />}
                {prev.manual && <p className="mt-2 text-[12px] text-dim">Motivo: {prev.manual.motivo}</p>}
                <div className="mt-4 flex flex-col gap-2">
                  {ind.etapa === 'fechado' && (
                    <Botao
                      variante="marca"
                      onClick={() => {
                        moverEtapa(ind.id, 'pago')
                        avisar('Comissão marcada como paga', { acao: desfazer(ind) })
                      }}
                    >
                      <Banknote /> Marcar comissão como paga
                    </Botao>
                  )}
                  {fechou && (
                    <Botao variante="secundario" onClick={() => setAjustando(true)}>
                      <SlidersHorizontal /> Ajustar valor, data ou comissão
                    </Botao>
                  )}
                  {!['fechado', 'pago', 'perdido'].includes(ind.etapa) && (
                    <Botao variante="marca" onClick={() => setFechando(true)}>
                      <Check /> Registrar fechamento
                    </Botao>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-dim">Contato direto: não gera comissão.</p>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-medium text-dim">Indicado por</p>
            {parceiro && nivel ? (
              <>
                <Link href={`/parceiros/${parceiro.id}`} className="group mt-3 flex items-center gap-3">
                  <Avatar nome={parceiro.nome} tamanho={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold group-hover:underline">{parceiro.nome}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <Medalha nivel={nivel.atual} />
                      {nivel.proximo && <span className="text-[12px] text-dim">faltam {nivel.faltam} para {nivel.proximo.nome}</span>}
                    </span>
                  </span>
                </Link>
                {nivel.proximo && <Progresso valor={nivel.pct} className="mt-4" />}
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
                <Globe className="h-4 w-4 text-dim" /> Contato direto (site)
              </p>
            )}
          </Card>

          {parceiro && (
            <Card className="p-5">
              <p className="flex items-center gap-2 text-[13px] font-medium text-dim">
                <Eye className="h-4 w-4" /> O que {primeiroNome(parceiro.nome)} vê
              </p>
              <p className="mt-2 text-[14px] font-semibold">{ETAPA_POR_ID[ind.etapa].rotuloParceiro}</p>
              <p className="mt-1 text-[12.5px] text-dim">
                {ind.eventos.filter((e) => e.visivelParceiro).length} de {ind.eventos.length} registros visíveis. Notas internas ficam ocultas por padrão.
              </p>
              {emails.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5 border-t border-line-soft pt-3">
                  {emails.map((e) => (
                    <li key={e.id} className="flex items-start gap-2 text-[12.5px] text-soft">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                      <span className="min-w-0">
                        {e.assunto} <span className="text-faint">· {haQuanto(e.em)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>

      {fechando && (
        <ModalFechamento
          indicacao={ind}
          onFechar={() => setFechando(false)}
          onConfirmar={(fechadoEm, valor) => {
            moverEtapa(ind.id, 'fechado', { fechadoEm, valorContrato: valor })
            setFechando(false)
            avisar('Contrato fechado. Comissão agendada.', { acao: desfazer(ind) })
          }}
        />
      )}
      {editando && (
        <ModalEditarLead
          ind={ind}
          onFechar={() => setEditando(false)}
          onSalvo={() => {
            setEditando(false)
            avisar('Dados do lead salvos', { acao: desfazer(ind) })
          }}
        />
      )}
      {ajustando && (
        <ModalAjusteNegocio
          ind={ind}
          onFechar={() => setAjustando(false)}
          onSalvo={() => {
            setAjustando(false)
            avisar('Negócio ajustado. Comissão recalculada.', { acao: desfazer(ind) })
          }}
        />
      )}

      <Modal
        aberto={registro !== null}
        onFechar={() => setRegistro(null)}
        titulo={registro === 'nota' ? 'Nota interna' : 'Registrar conversa'}
        subtitulo={ind.nome}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setRegistro(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={!texto.trim()}
              onClick={() => {
                registrarEvento(ind.id, registro === 'nota' ? { tipo: 'nota', texto: texto.trim(), visivelParceiro: visivel } : { tipo: 'contato', texto: texto.trim(), canal, visivelParceiro: visivel })
                if (registro === 'contato' && (ind.etapa === 'nova' || ind.etapa === 'sem_resposta')) moverEtapa(ind.id, 'contato')
                setRegistro(null)
                avisar('Registrado no histórico', { acao: desfazer(ind) })
              }}
            >
              Salvar
            </Botao>
          </>
        }
      >
        {registro === 'contato' && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(['whatsapp', 'ligacao', 'presencial', 'email'] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCanal(c)} className={cx('clicavel h-8 rounded-full border px-3 text-[12.5px] font-semibold', canal === c ? 'border-ink bg-ink text-on-ink' : 'border-line text-soft hover:border-ink/40')}>
                {{ whatsapp: 'WhatsApp', ligacao: 'Ligação', presencial: 'Presencial', email: 'E-mail' }[c]}
              </button>
            ))}
          </div>
        )}
        <textarea className="campo" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={registro === 'nota' ? 'Ex.: Tem R$ 50 mil para lance. Retomar depois do dia 10.' : 'Ex.: Conversamos 20 minutos; quer simulação de R$ 300 mil em 180 meses.'} />
        {parceiro && (
          <Marcador marcado={visivel} onChange={setVisivel} className="mt-3">
            Mostrar para {primeiroNome(parceiro.nome)} no acompanhamento
          </Marcador>
        )}
      </Modal>
    </>
  )
}
