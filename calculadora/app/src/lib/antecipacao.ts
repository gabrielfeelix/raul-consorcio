/**
 * PLANO DE PARCELAS DO CONSÓRCIO, COM E SEM ANTECIPAÇÃO DA TAXA DE ADMINISTRAÇÃO
 *
 * ATENÇÃO: a regra de antecipação abaixo é uma HIPÓTESE. Ela precisa ser
 * validada contra uma simulação real da Ademicon (com e sem antecipação, mesma
 * carta e mesmo prazo) antes de ser usada como valor oficial. Toda a fórmula
 * está concentrada neste arquivo para que a troca seja feita em um só lugar.
 *
 * Valores em "reais de hoje" (sem reajuste). O reajuste pelo INCC é aplicado
 * depois, em consorcio.ts.
 *
 * Sem antecipação:
 *   parcela = carta × (1 + taxaAdm + fundoReserva) / prazo   (todas iguais)
 *
 * Com antecipação (hipótese):
 *   - nas `parcelasAntecipadas` primeiras parcelas o cliente paga, a mais,
 *     `pctPorParcela` da carta de taxa de administração (ex.: 1% em cada uma
 *     das 2 primeiras = 2% da carta);
 *   - a taxa total do plano cai para `taxaAdmResultante` (ex.: 22% → 19%);
 *   - o que sobra da taxa (taxaAdmResultante − pctPorParcela × parcelasAntecipadas)
 *     é diluído igualmente em todas as parcelas.
 *   Logo:
 *     parcela_k = carta × (1 + restante + fundoReserva) / prazo
 *               + (k ≤ parcelasAntecipadas ? carta × pctPorParcela : 0)
 */

export interface ConfigAntecipacao {
  /** % da carta pago de taxa de adm em cada parcela antecipada (decimal, 0.01 = 1%). */
  pctPorParcela: number;
  /** Quantas parcelas iniciais carregam a antecipação. */
  parcelasAntecipadas: number;
  /** Taxa de administração total do plano quando há antecipação (decimal). */
  taxaAdmResultante: number;
}

export interface PlanoParcelas {
  /** Parcela base de cada mês (índice 0 = 1ª parcela), sem seguro e sem reajuste. */
  parcelas: number[];
  /** Parte de cada parcela que é taxa de administração. */
  taxaAdm: number[];
  /** Parte de cada parcela que é fundo de reserva. */
  fundoReserva: number[];
  /** Parte de cada parcela que é fundo comum (vira crédito). */
  fundoComum: number[];
  /** Taxa de administração total efetiva do plano (decimal). */
  taxaAdmTotal: number;
}

export function planoParcelas(
  valorCarta: number,
  prazo: number,
  taxaAdm: number,
  fundoReserva: number,
  antecipacao?: ConfigAntecipacao | null,
): PlanoParcelas {
  const fc = valorCarta / prazo;
  const fr = (valorCarta * fundoReserva) / prazo;
  const parcelas: number[] = [];
  const adm: number[] = [];
  const frs: number[] = [];
  const fcs: number[] = [];

  let taxaAdmTotal = taxaAdm;
  let admDiluida = (valorCarta * taxaAdm) / prazo;
  let antecipadas = 0;
  let extra = 0;

  if (antecipacao) {
    antecipadas = Math.min(prazo, Math.max(0, Math.round(antecipacao.parcelasAntecipadas)));
    const antecipado = antecipacao.pctPorParcela * antecipadas;
    taxaAdmTotal = Math.max(antecipacao.taxaAdmResultante, antecipado);
    const restante = taxaAdmTotal - antecipado;
    admDiluida = (valorCarta * restante) / prazo;
    extra = valorCarta * antecipacao.pctPorParcela;
  }

  for (let k = 1; k <= prazo; k++) {
    const a = admDiluida + (k <= antecipadas ? extra : 0);
    adm.push(a);
    frs.push(fr);
    fcs.push(fc);
    parcelas.push(fc + fr + a);
  }

  return { parcelas, taxaAdm: adm, fundoReserva: frs, fundoComum: fcs, taxaAdmTotal };
}
