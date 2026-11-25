import type { Dados, Etapa, Indicacao, Nivel, Parceiro, TipoBem } from './tipos'

export const ETAPAS: { id: Etapa; rotulo: string; rotuloParceiro: string; descricao: string }[] = [
  { id: 'nova', rotulo: 'Novas', rotuloParceiro: 'Recebida', descricao: 'Chegou e ainda não teve contato' },
  { id: 'contato', rotulo: 'Em contato', rotuloParceiro: 'Raul fez contato', descricao: 'Primeira conversa em andamento' },
  { id: 'sem_resposta', rotulo: 'Sem resposta', rotuloParceiro: 'Aguardando resposta', descricao: 'Tentou contato e a pessoa não respondeu' },
  { id: 'negociacao', rotulo: 'Em negociação', rotuloParceiro: 'Em negociação', descricao: 'Montando a proposta' },
  { id: 'fechado', rotulo: 'Contrato fechado', rotuloParceiro: 'Contrato fechado', descricao: 'Comissão agendada' },
  { id: 'pago', rotulo: 'Comissão paga', rotuloParceiro: 'Comissão recebida', descricao: 'Parceiro já recebeu' },
  { id: 'perdido', rotulo: 'Não avançou', rotuloParceiro: 'Não avançou', descricao: 'Desistiu ou não era o momento' },
]

export const ETAPA_POR_ID = Object.fromEntries(ETAPAS.map((e) => [e.id, e])) as Record<Etapa, (typeof ETAPAS)[number]>

/** Ordem usada no passo a passo que o parceiro vê. */
export const TRILHA_PARCEIRO: Etapa[] = ['nova', 'contato', 'negociacao', 'fechado', 'pago']

export const TIPOS_BEM: { id: TipoBem; rotulo: string }[] = [
  { id: 'imovel', rotulo: 'Imóvel' },
  { id: 'veiculo', rotulo: 'Carro' },
  { id: 'moto', rotulo: 'Moto' },
  { id: 'pesados', rotulo: 'Pesados' },
  { id: 'servicos', rotulo: 'Serviços' },
  { id: 'outro', rotulo: 'Outro' },
]

export function fechouContrato(i: Indicacao) {
  return i.etapa === 'fechado' || i.etapa === 'pago'
}

export function niveisOrdenados(niveis: Nivel[]) {
  return [...niveis].sort((a, b) => a.minFechadas - b.minFechadas)
}

export function fechadasDoParceiro(dados: Dados, parceiroId: string) {
  return dados.indicacoes.filter((i) => i.parceiroId === parceiroId && fechouContrato(i)).length
}

export function nivelPorFechadas(niveis: Nivel[], fechadas: number): Nivel {
  const ord = niveisOrdenados(niveis)
  let atual = ord[0]
  for (const n of ord) if (fechadas >= n.minFechadas) atual = n
  return atual
}

export function progressoNivel(niveis: Nivel[], fechadas: number) {
  const ord = niveisOrdenados(niveis)
  const atual = nivelPorFechadas(niveis, fechadas)
  const idx = ord.findIndex((n) => n.id === atual.id)
  const proximo = ord[idx + 1]
  if (!proximo) return { atual, proximo: undefined, faltam: 0, pct: 100, indice: idx }
  const faltam = proximo.minFechadas - fechadas
  // Progresso rumo ao próximo nível sobre o total acumulado (6 de 10), para a barra não zerar ao subir.
  const pct = (fechadas / proximo.minFechadas) * 100
  return { atual, proximo, faltam, pct, indice: idx }
}

export function nivelDoParceiro(dados: Dados, parceiroId: string) {
  return progressoNivel(dados.niveis, fechadasDoParceiro(dados, parceiroId))
}

/** Valor base para comissão: valor do contrato fechado, senão o crédito informado. */
export function baseComissao(i: Indicacao) {
  return i.valorContrato ?? i.credito ?? 0
}

export function comissao(nivel: Nivel, valorCarta: number) {
  return Math.round(nivel.valorFixo + (valorCarta / 100_000) * nivel.valorPor100k)
}

export function dataPagamento(nivel: Nivel, fechadoEm: string) {
  const d = new Date(fechadoEm)
  if (nivel.mesmoMes) return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).toISOString()
  const p = new Date(d)
  p.setDate(p.getDate() + nivel.prazoDias)
  return p.toISOString()
}

export function nivelDaIndicacao(dados: Dados, i: Indicacao): Nivel | undefined {
  if (!i.parceiroId) return undefined
  if (i.nivelNoFechamento) {
    const n = dados.niveis.find((x) => x.id === i.nivelNoFechamento)
    if (n) return n
  }
  return nivelDoParceiro(dados, i.parceiroId).atual
}

export interface Pagamento {
  indicacao: Indicacao
  parceiro: Parceiro
  nivel: Nivel
  valor: number
  previsto: string
  pago: boolean
}

export function pagamentos(dados: Dados): Pagamento[] {
  const lista: Pagamento[] = []
  for (const i of dados.indicacoes) {
    if (!fechouContrato(i) || !i.fechadoEm || !i.parceiroId) continue
    const parceiro = dados.parceiros.find((p) => p.id === i.parceiroId)
    const nivel = nivelDaIndicacao(dados, i)
    if (!parceiro || !nivel) continue
    lista.push({
      indicacao: i,
      parceiro,
      nivel,
      valor: i.comissaoManual?.valor ?? comissao(nivel, baseComissao(i)),
      previsto: dataPagamento(nivel, i.fechadoEm),
      pago: i.etapa === 'pago',
    })
  }
  return lista.sort((a, b) => a.previsto.localeCompare(b.previsto))
}

export function previsaoParaIndicacao(dados: Dados, i: Indicacao) {
  const nivel = nivelDaIndicacao(dados, i)
  if (!nivel) return undefined
  const base = baseComissao(i)
  const calculada = base ? comissao(nivel, base) : nivel.valorFixo
  return {
    nivel,
    calculada,
    manual: i.comissaoManual,
    valor: i.comissaoManual?.valor ?? calculada,
    previsto: i.fechadoEm ? dataPagamento(nivel, i.fechadoEm) : undefined,
  }
}

/* ---------------- Período do dashboard ---------------- */

export type Periodo = 'hoje' | '7d' | '30d' | '90d' | 'ano'

export const PERIODOS: { id: Periodo; rotulo: string; curto: string }[] = [
  { id: 'hoje', rotulo: 'Hoje', curto: 'Hoje' },
  { id: '7d', rotulo: 'Últimos 7 dias', curto: '7 dias' },
  { id: '30d', rotulo: 'Últimos 30 dias', curto: '30 dias' },
  { id: '90d', rotulo: 'Últimos 90 dias', curto: '90 dias' },
  { id: 'ano', rotulo: 'Este ano', curto: 'Ano' },
]

export function inicioPeriodo(p: Periodo, agora = new Date()) {
  const d = new Date(agora)
  d.setHours(0, 0, 0, 0)
  if (p === 'hoje') return d
  if (p === 'ano') return new Date(agora.getFullYear(), 0, 1)
  const dias = p === '7d' ? 6 : p === '30d' ? 29 : 89
  d.setDate(d.getDate() - dias)
  return d
}

/** Período anterior de mesmo tamanho, para comparar. */
export function periodoAnterior(p: Periodo, agora = new Date()) {
  const ini = inicioPeriodo(p, agora)
  const dur = agora.getTime() - ini.getTime()
  return { de: new Date(ini.getTime() - dur), ate: ini }
}

export function dentro(iso: string | undefined, de: Date, ate: Date = new Date()) {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= de.getTime() && t <= ate.getTime()
}

/* ---------------- Formatação ---------------- */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const reais = (v: number) => brl.format(v)

export function reaisCurto(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (v >= 1_000) return `R$ ${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return reais(v)
}

export function data(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

export function dataCurta(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function haQuanto(iso: string, agora = new Date()) {
  const s = Math.round((agora.getTime() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  if (d === 1) return 'ontem'
  if (d < 30) return `há ${d} dias`
  const me = Math.round(d / 30)
  return me === 1 ? 'há 1 mês' : `há ${me} meses`
}

export function diasAte(iso: string, agora = new Date()) {
  const a = new Date(agora)
  a.setHours(0, 0, 0, 0)
  const b = new Date(iso)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0]
}

export function soDigitos(t: string) {
  return t.replace(/\D/g, '')
}

export function linkWhatsApp(telefone: string, texto?: string) {
  let n = soDigitos(telefone)
  if (n.length <= 11) n = '55' + n
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
}

export function formatarTelefone(t: string) {
  const n = soDigitos(t).slice(-11)
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return t
}

export function novoId(prefixo = 'id') {
  return `${prefixo}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

export function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`
}

/** Ilustração efetiva do nível (medalha, e troféu no topo da escada). */
export function ilustracaoDoNivel(niveis: Nivel[], nivel: Nivel) {
  if (nivel.ilustracao) return nivel.ilustracao
  const ord = niveisOrdenados(niveis)
  return ord[ord.length - 1]?.id === nivel.id ? 'trofeu' : 'medalha'
}
