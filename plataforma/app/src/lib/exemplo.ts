/**
 * Dados de exemplo para o protótipo. Tudo é gerado relativo à data de hoje,
 * para o dashboard sempre ter movimento. Nomes fictícios.
 */
import type { Dados, Etapa, Evento, Indicacao, Nivel, Parceiro, TipoBem } from './tipos'
import { comissao, dataPagamento, ETAPA_POR_ID, nivelPorFechadas } from './regras'

export const VERSAO_DADOS = 3

/** Proposta inicial de níveis. Valores provisórios: o Raul vai passar os definitivos. */
export const NIVEIS_PADRAO: Nivel[] = [
  { id: 'bronze', nome: 'Bronze', minFechadas: 0, valorFixo: 200, valorPor100k: 150, prazoDias: 60, mesmoMes: false, cor: '#A86B3C', premios: ['Comissão por contrato fechado'] },
  { id: 'prata', nome: 'Prata', minFechadas: 3, valorFixo: 300, valorPor100k: 200, prazoDias: 30, mesmoMes: false, cor: '#8A8F98', premios: ['Comissão maior', 'Recebe em 30 dias'] },
  { id: 'ouro', nome: 'Ouro', minFechadas: 6, valorFixo: 400, valorPor100k: 250, prazoDias: 0, mesmoMes: true, cor: '#B8892B', premios: ['Recebe no mesmo mês', 'Jantar para dois'] },
  { id: 'platinum', nome: 'Platinum', minFechadas: 10, valorFixo: 500, valorPor100k: 300, prazoDias: 0, mesmoMes: true, cor: '#3E4A5C', premios: ['Maior comissão', 'Recebe no mesmo mês', 'Final de semana com acompanhante'] },
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const PARCEIROS: Array<Omit<Parceiro, 'id' | 'desde' | 'convite' | 'viuTour'> & { diasDesde: number }> = [
  { nome: 'Mariana Albuquerque', telefone: '44999120034', email: 'mariana.alb@email.com', cidade: 'Maringá/PR', status: 'ativo', diasDesde: 300 },
  { nome: 'Carlos Henrique Prado', telefone: '44998771203', email: 'carlos.prado@email.com', cidade: 'Maringá/PR', status: 'ativo', diasDesde: 260 },
  { nome: 'Juliana Tavares', telefone: '44991345566', email: 'ju.tavares@email.com', cidade: 'Sarandi/PR', status: 'ativo', diasDesde: 210 },
  { nome: 'Rafael Monteiro', telefone: '44997650012', email: 'rafa.monteiro@email.com', cidade: 'Maringá/PR', status: 'ativo', diasDesde: 180 },
  { nome: 'Patrícia Nogueira', telefone: '44996234478', email: 'patricia.n@email.com', cidade: 'Paiçandu/PR', status: 'ativo', diasDesde: 140 },
  { nome: 'Eduardo Siqueira', telefone: '44995509981', email: 'edu.siqueira@email.com', cidade: 'Maringá/PR', status: 'ativo', diasDesde: 95 },
  { nome: 'Fernanda Lima', telefone: '44993128840', email: 'fe.lima@email.com', cidade: 'Londrina/PR', status: 'ativo', diasDesde: 50 },
  { nome: 'Thiago Barreto', telefone: '44992017735', email: 'thiago.b@email.com', cidade: 'Maringá/PR', status: 'convidado', diasDesde: 2 },
]

const INDICADOS = [
  ['Antônio Albuquerque', 'Meu pai. Quer sair do aluguel e comprar um apartamento perto de mim. Tem dúvida se consórcio demora muito pra sair.', 'imovel', 500000, 'masculino', 62],
  ['Lúcia Albuquerque', 'Minha mãe. Quer trocar de carro no ano que vem, nunca fez consórcio.', 'veiculo', 90000, 'feminino', 58],
  ['Bruno Prado', 'Meu irmão, mora em Sarandi. Quer investir em imóvel pra alugar.', 'imovel', 350000, 'masculino', 34],
  ['Renata Cardoso', 'Colega do trabalho. Perguntou como funciona o lance.', 'imovel', 280000, 'feminino', 41],
  ['Gustavo Ferraz', 'Cunhado. Ouviu falar no churrasco, quer uma moto pra trabalhar.', 'moto', 25000, 'masculino', 29],
  ['Helena Duarte', 'Vizinha. Já tem uma carta de 200 mil em outra administradora e quer entender se vale outra.', 'imovel', 200000, 'feminino', 47],
  ['Marcos Vinícius Rocha', 'Amigo da faculdade. Quer caminhão pra frota, tem pressa.', 'pesados', 450000, 'masculino', 38],
  ['Sílvia Moreira', 'Minha sogra. Quer reformar a casa, perguntou se consórcio serve pra reforma.', 'servicos', 60000, 'feminino', 66],
  ['Diego Antunes', 'Primo. Quer o primeiro apartamento, ganha uns 8 mil por mês.', 'imovel', 320000, 'masculino', 27],
  ['Camila Rezende', 'Cliente da minha loja. Quer carro elétrico.', 'veiculo', 180000, 'feminino', 36],
  ['Otávio Bastos', 'Conheci no futebol. Já investe em CDB e quer comparar com consórcio.', 'imovel', 600000, 'masculino', 45],
  ['Paula Fontes', 'Amiga da minha esposa. Quer terreno pra construir.', 'imovel', 250000, 'feminino', 33],
  ['Ricardo Lemos', 'Meu chefe. Pensa em carta grande pra alavancagem.', 'imovel', 800000, 'masculino', 52],
  ['Tatiane Correia', 'Irmã. Quer carro pra ela e moto pro filho.', 'veiculo', 110000, 'feminino', 39],
  ['Vinícius Arruda', 'Sócio da academia. Quer sala comercial.', 'imovel', 400000, 'masculino', 44],
  ['Beatriz Souto', 'Prima. Dúvida principal: quanto fica a parcela.', 'imovel', 300000, 'feminino', 31],
  ['Fábio Guedes', 'Vizinho de chácara. Quer trator.', 'pesados', 350000, 'masculino', 57],
  ['Laura Pires', 'Amiga do pilates. Quer sair do financiamento atual.', 'imovel', 380000, 'feminino', 42],
  ['Henrique Matos', 'Colega de igreja. Quer carro pra família.', 'veiculo', 120000, 'masculino', 35],
  ['Natália Brito', 'Filha de uma cliente minha. Quer o primeiro carro.', 'veiculo', 70000, 'feminino', 24],
  ['Sérgio Valente', 'Cunhado. Já tem carta de 500 mil contemplada e quer outra.', 'imovel', 500000, 'masculino', 49],
  ['Aline Castro', 'Amiga. Quer casa na praia daqui uns anos.', 'imovel', 450000, 'feminino', 37],
  ['Rodrigo Pacheco', 'Meu dentista. Quer equipamento novo pro consultório.', 'servicos', 150000, 'masculino', 46],
  ['Isabela Franco', 'Vizinha. Ouviu falar pelo Instagram do Raul, pediu meu contato.', 'imovel', 270000, 'feminino', 30],
  ['Leonardo Teixeira', 'Primo. Quer moto grande.', 'moto', 60000, 'masculino', 33],
  ['Mônica Azevedo', 'Tia. Quer apartamento pra aposentadoria.', 'imovel', 350000, 'feminino', 61],
  ['Paulo Sérgio Neves', 'Amigo do meu pai. Investidor, quer várias cartas.', 'imovel', 1000000, 'masculino', 59],
  ['Gabriela Mota', 'Colega. Quer carro e não quer pagar juros.', 'veiculo', 95000, 'feminino', 28],
] as const

const SITE = [
  ['Ana Carolina Ruiz', 'Veio pela simulação do site. Objetivo: sair do aluguel. Parcela que cabe: até R$ 2.000.', 'imovel', 300000, 'feminino', 32],
  ['João Pedro Salles', 'Veio pela simulação do site. Objetivo: trocar de carro em 12 meses.', 'veiculo', 85000, 'masculino', 40],
  ['Cláudia Ramos', 'Veio pela simulação do site. Objetivo: investir. Já tem reserva de R$ 50 mil para lance.', 'imovel', 400000, 'feminino', 50],
] as const

/** [índice do parceiro, etapa final, dias atrás da criação, dias atrás do fechamento?] */
const PLANO: Array<[number, Etapa, number, number?]> = [
  [0, 'pago', 240, 200], [0, 'pago', 190, 150], [0, 'pago', 130, 100], [0, 'fechado', 80, 40], [0, 'fechado', 40, 12], [0, 'pago', 160, 120], [0, 'negociacao', 9],
  [1, 'pago', 200, 170], [1, 'fechado', 60, 20], [1, 'fechado', 35, 6], [1, 'negociacao', 14], [1, 'sem_resposta', 6],
  [2, 'pago', 150, 110], [2, 'fechado', 45, 3], [2, 'contato', 3], [2, 'perdido', 70],
  [3, 'fechado', 50, 25], [3, 'negociacao', 18], [3, 'nova', 0],
  [4, 'contato', 5], [4, 'sem_resposta', 11], [4, 'nova', 1],
  [5, 'negociacao', 22], [5, 'perdido', 40], [5, 'nova', 0],
  [6, 'contato', 2], [6, 'nova', 4],
  [3, 'contato', 8],
]

function iso(diasAtras: number, hora = 10, agora = new Date()) {
  const d = new Date(agora)
  d.setDate(d.getDate() - diasAtras)
  d.setHours(hora, Math.floor((diasAtras * 37) % 60), 0, 0)
  return d.toISOString()
}

let seq = 0
const eid = () => `ev_${(++seq).toString(36)}`

function eventosAte(etapa: Etapa, criado: number, fechado: number | undefined, nomeParceiro: string | null, r: () => number): Evento[] {
  const ev: Evento[] = [
    {
      id: eid(),
      tipo: 'criada',
      em: iso(criado, 9),
      texto: nomeParceiro ? `${nomeParceiro} indicou` : 'Chegou pela simulação do site',
      visivelParceiro: true,
    },
  ]
  if (etapa === 'nova') return ev
  const d1 = Math.max(0, criado - 1)
  ev.push({ id: eid(), tipo: 'contato', em: iso(d1, 11), texto: 'Raul fez contato pelo WhatsApp', canal: 'whatsapp', visivelParceiro: true })
  ev.push({ id: eid(), tipo: 'etapa', em: iso(d1, 11), texto: `Movido para ${ETAPA_POR_ID.contato.rotulo}`, visivelParceiro: true })
  if (etapa === 'contato') return ev
  if (etapa === 'sem_resposta') {
    ev.push({ id: eid(), tipo: 'sem_resposta', em: iso(Math.max(0, d1 - 2), 15), texto: 'Tentou contato e não respondeu', canal: 'whatsapp', visivelParceiro: true })
    ev.push({ id: eid(), tipo: 'etapa', em: iso(Math.max(0, d1 - 2), 15), texto: `Movido para ${ETAPA_POR_ID.sem_resposta.rotulo}`, visivelParceiro: true })
    return ev
  }
  if (etapa === 'perdido') {
    ev.push({ id: eid(), tipo: 'nota', em: iso(Math.max(0, d1 - 5), 16), texto: 'Disse que agora não é o momento. Retomar em 6 meses.', visivelParceiro: false })
    ev.push({ id: eid(), tipo: 'etapa', em: iso(Math.max(0, d1 - 5), 16), texto: `Movido para ${ETAPA_POR_ID.perdido.rotulo}`, visivelParceiro: true })
    return ev
  }
  const dn = Math.max(0, d1 - Math.ceil(r() * 4) - 1)
  ev.push({ id: eid(), tipo: 'contato', em: iso(dn, 14), texto: 'Reunião para apresentar a proposta', canal: 'presencial', visivelParceiro: false })
  ev.push({ id: eid(), tipo: 'etapa', em: iso(dn, 14), texto: `Movido para ${ETAPA_POR_ID.negociacao.rotulo}`, visivelParceiro: true })
  if (etapa === 'negociacao') return ev
  ev.push({ id: eid(), tipo: 'fechado', em: iso(fechado!, 17), texto: 'Contrato fechado', visivelParceiro: true })
  return ev
}

export function gerarExemplo(agora = new Date()): Dados {
  seq = 0
  const r = rng(42)
  const parceiros: Parceiro[] = PARCEIROS.map((p, i) => ({
    id: `p${i + 1}`,
    nome: p.nome,
    telefone: p.telefone,
    email: p.email,
    cidade: p.cidade,
    status: p.status,
    desde: iso(p.diasDesde, 10, agora),
    clienteDesde: iso(p.diasDesde + 30, 10, agora),
    convite: `cv${(i + 7) * 7919}`,
    viuTour: i !== 7,
  }))

  const indicacoes: Indicacao[] = []
  const fechadasPorParceiro: Record<string, number> = {}

  // Ordena por data de fechamento para congelar o nível certo no momento do fechamento.
  const plano = PLANO.map((p, k) => ({ p, k })).sort((a, b) => (b.p[3] ?? -1) - (a.p[3] ?? -1))
  const tmp: Array<{ k: number; ind: Indicacao }> = []
  for (const { p, k } of plano) {
    const [pi, etapa, criado, fechado] = p
    const parceiro = parceiros[pi]
    const [nome, quemE, tipo, credito, genero, idade] = INDICADOS[k % INDICADOS.length]
    const ind: Indicacao = {
      id: `i${k + 1}`,
      parceiroId: parceiro.id,
      nome,
      telefone: `4499${(1000000 + Math.floor(r() * 8999999)).toString()}`,
      quemE,
      email: r() > 0.5 ? `${nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com` : undefined,
      credito,
      genero,
      idade,
      tipoBem: tipo as TipoBem,
      etapa,
      criadoEm: iso(criado, 9, agora),
      eventos: eventosAte(etapa, criado, fechado, parceiro.nome.split(' ')[0], r),
    }
    if (fechado !== undefined) {
      const fechadas = fechadasPorParceiro[parceiro.id] ?? 0
      const nivel = nivelPorFechadas(NIVEIS_PADRAO, fechadas)
      fechadasPorParceiro[parceiro.id] = fechadas + 1
      ind.fechadoEm = iso(fechado, 17, agora)
      ind.valorContrato = credito
      ind.nivelNoFechamento = nivel.id
      if (etapa === 'pago') {
        const prev = dataPagamento(nivel, ind.fechadoEm)
        ind.pagoEm = prev
        ind.eventos.push({
          id: eid(),
          tipo: 'pago',
          em: prev,
          texto: `Comissão de ${comissao(nivel, credito).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} paga`,
          visivelParceiro: true,
        })
      }
    }
    tmp.push({ k, ind })
  }
  tmp.sort((a, b) => a.k - b.k).forEach((t) => indicacoes.push(t.ind))

  SITE.forEach(([nome, quemE, tipo, credito, genero, idade], j) => {
    const criado = j
    indicacoes.push({
      id: `s${j + 1}`,
      parceiroId: null,
      nome,
      telefone: `4498${(2000000 + Math.floor(r() * 7999999)).toString()}`,
      quemE,
      credito,
      genero,
      idade,
      tipoBem: tipo as TipoBem,
      etapa: j === 2 ? 'contato' : 'nova',
      criadoEm: iso(criado, 20, agora),
      eventos: eventosAte(j === 2 ? 'contato' : 'nova', criado, undefined, null, r),
    })
  })

  return { versao: VERSAO_DADOS, niveis: NIVEIS_PADRAO, parceiros, indicacoes }
}
