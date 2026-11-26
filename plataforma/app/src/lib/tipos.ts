export type Papel = 'raul' | 'parceiro'

export type Etapa = 'nova' | 'contato' | 'sem_resposta' | 'negociacao' | 'fechado' | 'pago' | 'perdido'

export type TipoBem = 'imovel' | 'veiculo' | 'moto' | 'pesados' | 'servicos' | 'outro'

export type Genero = 'feminino' | 'masculino' | 'outro' | ''

export interface Nivel {
  id: string
  nome: string
  /** Contratos fechados necessários para chegar neste nível. */
  minFechadas: number
  /** Valor fixo por contrato fechado (R$). */
  valorFixo: number
  /** Valor a cada R$ 100 mil de carta (R$). */
  valorPor100k: number
  /** Dias depois do fechamento para pagar. Ignorado se mesmoMes. */
  prazoDias: number
  /** Paga no último dia do mês do fechamento. */
  mesmoMes: boolean
  cor: string
  premios: string[]
  /** Ilustração do nível. Sem valor: medalha, e troféu no último nível. */
  ilustracao?: 'medalha' | 'trofeu'
}

export interface Parceiro {
  id: string
  nome: string
  telefone: string
  email: string
  cidade: string
  desde: string // ISO
  status: 'ativo' | 'convidado'
  convite: string
  /** Cliente do Raul desde (contrato que ele próprio comprou). */
  clienteDesde?: string
  viuTour: boolean
  /** URL da foto de perfil (sem foto, mostra as iniciais). */
  foto?: string
}

export type TipoEvento = 'criada' | 'etapa' | 'contato' | 'sem_resposta' | 'nota' | 'fechado' | 'pago'

export interface Evento {
  id: string
  tipo: TipoEvento
  em: string // ISO
  texto: string
  /** O parceiro vê este evento na linha do tempo dele. */
  visivelParceiro: boolean
  canal?: 'whatsapp' | 'ligacao' | 'email' | 'presencial'
}

export interface Indicacao {
  id: string
  /** null = veio pelo site (simulação da LP), sem parceiro. */
  parceiroId: string | null
  nome: string
  telefone: string
  quemE: string
  email?: string
  credito?: number
  genero?: Genero
  idade?: number
  tipoBem?: TipoBem
  etapa: Etapa
  criadoEm: string
  fechadoEm?: string
  valorContrato?: number
  pagoEm?: string
  /** Nível do parceiro congelado no fechamento (define valor e prazo). */
  nivelNoFechamento?: string
  /** Valor de comissão definido à mão pelo Raul, no lugar do cálculo do nível. */
  comissaoManual?: { valor: number; motivo: string }
  eventos: Evento[]
}

/** E-mail automático (simulado no protótipo: fica registrado, não sai de verdade). */
export interface Email {
  id: string
  em: string
  para: string
  assunto: string
  parceiroId?: string
  indicacaoId?: string
}

export interface Dados {
  versao: number
  niveis: Nivel[]
  parceiros: Parceiro[]
  indicacoes: Indicacao[]
  emails?: Email[]
}

export interface Sessao {
  papel: Papel
  parceiroId?: string
}
