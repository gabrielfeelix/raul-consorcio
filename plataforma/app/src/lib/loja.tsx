'use client'

/**
 * Loja do protótipo: guarda tudo no localStorage do navegador.
 * Quando entrar o banco (Supabase), estas ações viram chamadas à API, e as telas não mudam.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Dados, Email, Etapa, Evento, Indicacao, Nivel, Parceiro, Sessao } from './tipos'
import { gerarExemplo, VERSAO_DADOS } from './exemplo'
import { ETAPA_POR_ID, fechadasDoParceiro, nivelPorFechadas, novoId } from './regras'

const CHAVE_DADOS = 'rc-plataforma-dados'
const CHAVE_SESSAO = 'rc-plataforma-sessao'

type NovaIndicacao = Omit<Indicacao, 'id' | 'etapa' | 'criadoEm' | 'eventos'>

interface Loja {
  pronto: boolean
  dados: Dados
  sessao: Sessao | null
  entrar: (s: Sessao) => void
  sair: () => void
  moverEtapa: (id: string, etapa: Etapa, extra?: { fechadoEm?: string; valorContrato?: number }) => void
  atualizarIndicacao: (id: string, patch: Partial<Indicacao>) => void
  registrarEvento: (id: string, ev: Omit<Evento, 'id' | 'em'> & { em?: string }) => void
  alternarVisibilidade: (id: string, eventoId: string) => void
  criarIndicacao: (nova: NovaIndicacao, autor: 'raul' | 'parceiro') => Indicacao
  criarParceiro: (p: Pick<Parceiro, 'nome' | 'telefone' | 'email' | 'cidade'>) => Parceiro
  ativarParceiro: (convite: string) => Parceiro | undefined
  salvarNiveis: (niveis: Nivel[]) => void
  marcarTourVisto: (parceiroId: string) => void
  restaurarExemplo: () => void
  /** Troca a indicação inteira (usado pelo "Desfazer"). */
  substituirIndicacao: (ind: Indicacao) => void
  /** Volta uma comissão paga para "a pagar". */
  reverterPagamento: (id: string) => void
  editarPagamento: (id: string, pagoEm: string) => void
  /** Ajuste do negócio fechado: valor da carta, data e comissão manual (opcional). */
  ajustarContrato: (id: string, p: { valorContrato: number; fechadoEm: string; comissaoManual?: { valor: number; motivo: string } }) => void
  atualizarParceiro: (id: string, patch: Partial<Parceiro>) => void
}

const ASSUNTO: Partial<Record<Etapa, (nome: string) => string>> = {
  contato: (n) => `O Raul fez contato com ${n}`,
  sem_resposta: (n) => `${n} ainda não respondeu o Raul`,
  negociacao: (n) => `${n} está em negociação`,
  fechado: (n) => `Contrato de ${n} fechado: sua comissão foi agendada`,
  pago: (n) => `Comissão da indicação de ${n} paga`,
  perdido: (n) => `A indicação de ${n} não avançou`,
}

function comEmail(d: Dados, e: Omit<Email, 'id' | 'em'>): Dados {
  return { ...d, emails: [{ ...e, id: novoId('em'), em: new Date().toISOString() }, ...(d.emails ?? [])].slice(0, 200) }
}

const Ctx = createContext<Loja | null>(null)

function ler<T>(chave: string): T | null {
  try {
    const v = localStorage.getItem(chave)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}
function gravar(chave: string, valor: unknown) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, JSON.stringify(valor))
  } catch {}
}

export function LojaProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<Dados>(() => gerarExemplo())
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const salvo = ler<Dados>(CHAVE_DADOS)
    if (salvo && salvo.versao === VERSAO_DADOS) setDados(salvo)
    setSessao(ler<Sessao>(CHAVE_SESSAO))
    setPronto(true)
  }, [])

  useEffect(() => {
    if (pronto) gravar(CHAVE_DADOS, dados)
  }, [dados, pronto])

  const mudarIndicacao = useCallback((id: string, fn: (i: Indicacao, d: Dados) => Indicacao) => {
    setDados((d) => ({ ...d, indicacoes: d.indicacoes.map((i) => (i.id === id ? fn(i, d) : i)) }))
  }, [])

  const loja = useMemo<Loja>(
    () => ({
      pronto,
      dados,
      sessao,
      entrar(s) {
        setSessao(s)
        gravar(CHAVE_SESSAO, s)
      },
      sair() {
        setSessao(null)
        gravar(CHAVE_SESSAO, null)
      },
      moverEtapa(id, etapa, extra) {
        mudarIndicacao(id, (i, d) => {
          if (i.etapa === etapa) return i
          const agora = new Date().toISOString()
          const ev: Evento[] = [...i.eventos, { id: novoId('ev'), tipo: 'etapa', em: agora, texto: `Movido para ${ETAPA_POR_ID[etapa].rotulo}`, visivelParceiro: true }]
          const novo: Indicacao = { ...i, etapa }
          if (etapa === 'fechado' || (etapa === 'pago' && !i.fechadoEm)) {
            novo.fechadoEm = extra?.fechadoEm ?? i.fechadoEm ?? agora
            novo.valorContrato = extra?.valorContrato ?? i.valorContrato ?? i.credito
            if (i.parceiroId && !i.nivelNoFechamento) {
              novo.nivelNoFechamento = nivelPorFechadas(d.niveis, fechadasDoParceiro(d, i.parceiroId)).id
            }
            ev.push({ id: novoId('ev'), tipo: 'fechado', em: novo.fechadoEm, texto: 'Contrato fechado', visivelParceiro: true })
          }
          if (etapa === 'pago') {
            novo.pagoEm = agora
            ev.push({ id: novoId('ev'), tipo: 'pago', em: agora, texto: 'Comissão paga', visivelParceiro: true })
          }
          if (etapa !== 'pago' && i.etapa === 'pago') novo.pagoEm = undefined
          if (etapa !== 'fechado' && etapa !== 'pago') {
            novo.fechadoEm = undefined
            novo.nivelNoFechamento = undefined
            novo.pagoEm = undefined
          }
          novo.eventos = ev
          return novo
        })
        setDados((d) => {
          const i = d.indicacoes.find((x) => x.id === id)
          const p = i?.parceiroId ? d.parceiros.find((x) => x.id === i.parceiroId) : undefined
          const assunto = ASSUNTO[etapa]
          if (!i || !p || !assunto) return d
          return comEmail(d, { para: p.email, assunto: assunto(i.nome.split(' ')[0]), parceiroId: p.id, indicacaoId: i.id })
        })
      },
      atualizarIndicacao(id, patch) {
        mudarIndicacao(id, (i) => ({ ...i, ...patch }))
      },
      registrarEvento(id, ev) {
        mudarIndicacao(id, (i) => ({ ...i, eventos: [...i.eventos, { ...ev, id: novoId('ev'), em: ev.em ?? new Date().toISOString() }] }))
      },
      alternarVisibilidade(id, eventoId) {
        mudarIndicacao(id, (i) => ({ ...i, eventos: i.eventos.map((e) => (e.id === eventoId ? { ...e, visivelParceiro: !e.visivelParceiro } : e)) }))
      },
      criarIndicacao(nova, autor) {
        const agora = new Date().toISOString()
        const parceiro = dados.parceiros.find((p) => p.id === nova.parceiroId)
        const ind: Indicacao = {
          ...nova,
          id: novoId('i'),
          etapa: 'nova',
          criadoEm: agora,
          eventos: [
            {
              id: novoId('ev'),
              tipo: 'criada',
              em: agora,
              texto: parceiro ? (autor === 'raul' ? `Raul cadastrou a indicação de ${parceiro.nome.split(' ')[0]}` : `${parceiro.nome.split(' ')[0]} indicou`) : 'Cadastrada pelo Raul',
              visivelParceiro: true,
            },
          ],
        }
        setDados((d) => comEmail({ ...d, indicacoes: [ind, ...d.indicacoes] }, { para: 'raul@raulconsorcios.com.br', assunto: `Nova indicação: ${ind.nome}${parceiro ? `, de ${parceiro.nome.split(' ')[0]}` : ''}`, indicacaoId: ind.id, parceiroId: parceiro?.id }))
        return ind
      },
      criarParceiro(p) {
        const novo: Parceiro = {
          ...p,
          id: novoId('p'),
          desde: new Date().toISOString(),
          status: 'convidado',
          convite: novoId('cv').replace('cv_', ''),
          viuTour: false,
        }
        setDados((d) => comEmail({ ...d, parceiros: [...d.parceiros, novo] }, { para: novo.email, assunto: 'Convite: crie seu acesso ao programa de parceiros', parceiroId: novo.id }))
        return novo
      },
      ativarParceiro(convite) {
        const p = dados.parceiros.find((x) => x.convite === convite)
        if (!p) return undefined
        setDados((d) => ({ ...d, parceiros: d.parceiros.map((x) => (x.id === p.id ? { ...x, status: 'ativo' } : x)) }))
        return p
      },
      salvarNiveis(niveis) {
        setDados((d) => ({ ...d, niveis }))
      },
      marcarTourVisto(parceiroId) {
        setDados((d) => ({ ...d, parceiros: d.parceiros.map((p) => (p.id === parceiroId ? { ...p, viuTour: true } : p)) }))
      },
      restaurarExemplo() {
        setDados(gerarExemplo())
      },
      substituirIndicacao(ind) {
        setDados((d) => ({ ...d, indicacoes: d.indicacoes.map((i) => (i.id === ind.id ? ind : i)) }))
      },
      reverterPagamento(id) {
        mudarIndicacao(id, (i) => {
          if (i.etapa !== 'pago') return i
          return {
            ...i,
            etapa: 'fechado',
            pagoEm: undefined,
            eventos: [...i.eventos.filter((e) => e.tipo !== 'pago'), { id: novoId('ev'), tipo: 'nota', em: new Date().toISOString(), texto: 'Pagamento da comissão desfeito: voltou para a pagar', visivelParceiro: false }],
          }
        })
      },
      editarPagamento(id, pagoEm) {
        mudarIndicacao(id, (i) => ({ ...i, pagoEm, eventos: i.eventos.map((e) => (e.tipo === 'pago' ? { ...e, em: pagoEm } : e)) }))
      },
      ajustarContrato(id, p) {
        mudarIndicacao(id, (i) => {
          const mudou: string[] = []
          if (p.valorContrato !== i.valorContrato) mudou.push('valor da carta')
          if (p.fechadoEm.slice(0, 10) !== i.fechadoEm?.slice(0, 10)) mudou.push('data do fechamento')
          if (p.comissaoManual?.valor !== i.comissaoManual?.valor) mudou.push(p.comissaoManual ? 'comissão (valor manual)' : 'comissão (volta ao cálculo do nível)')
          if (!mudou.length) return i
          return {
            ...i,
            valorContrato: p.valorContrato,
            fechadoEm: p.fechadoEm,
            comissaoManual: p.comissaoManual,
            eventos: [
              ...i.eventos.map((e) => (e.tipo === 'fechado' ? { ...e, em: p.fechadoEm } : e)),
              { id: novoId('ev'), tipo: 'nota', em: new Date().toISOString(), texto: `Negócio ajustado: ${mudou.join(', ')}${p.comissaoManual?.motivo ? `. Motivo: ${p.comissaoManual.motivo}` : ''}`, visivelParceiro: false },
            ],
          }
        })
      },
      atualizarParceiro(id, patch) {
        setDados((d) => ({ ...d, parceiros: d.parceiros.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
      },
    }),
    [dados, sessao, pronto, mudarIndicacao],
  )

  return <Ctx.Provider value={loja}>{children}</Ctx.Provider>
}

export function useLoja() {
  const l = useContext(Ctx)
  if (!l) throw new Error('useLoja fora do LojaProvider')
  return l
}

/** Parceiro logado (se a sessão for de parceiro). */
export function useParceiroAtual() {
  const { dados, sessao } = useLoja()
  return sessao?.papel === 'parceiro' ? dados.parceiros.find((p) => p.id === sessao.parceiroId) : undefined
}
