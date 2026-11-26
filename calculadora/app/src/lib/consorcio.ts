import { planoParcelas } from './antecipacao';
import {
  aplicarAportes,
  fatorCorrecao,
  resumoFinanciamento,
  tabelaPrice,
  tabelaSAC,
  type LinhaFinanciamento,
  type ModoReajuste,
} from './finance';

/** Parâmetros como o usuário digita: percentuais em "pontos" (22 = 22%). */
export interface Parametros {
  valorCarta: number;
  prazo: number;
  mesContemplacao: number;
  taxaAdm: number;
  fundoReserva: number;
  seguroAtivo: boolean;
  /** % ao mês sobre o saldo devedor. */
  seguroPctMes: number;
  reajuste: ModoReajuste;
  incc: number;
  selic: number;
  cdi: number;
  cdbPctCdi: number;
  tesouroSelic: number;
  descontarIR: boolean;
  jurosFinanciamento: number;
  entradaFinanciamento: number;
  antecipar: boolean;
  antecipPctPorParcela: number;
  antecipParcelas: number;
  antecipTaxaResultante: number;
}

export interface Simulacao {
  prazo: number;
  contemplacao: number;
  /** Parcela paga em cada mês (índice 1..prazo; índice 0 = 0), já reajustada e com seguro. */
  parcela: number[];
  /** Crédito corrigido no fim de cada mês (0..prazo). */
  credito: number[];
  /** Total desembolsado acumulado (0..prazo). */
  desembolsado: number[];
  /** Total pago acumulado em reais de hoje, sem reajuste (0..prazo). */
  pagoHoje: number[];
  /** Taxa de administração + fundo de reserva pagos, acumulados (0..prazo). */
  taxasPagas: number[];
  /** Saldo líquido se as mesmas parcelas fossem para o CDB (0..prazo). */
  cdb: number[];
  /** Saldo líquido se as mesmas parcelas fossem para o Tesouro Selic (0..prazo). */
  tesouro: number[];
  taxaAdmTotal: number;
  /** Custo das taxas do plano inteiro, em reais de hoje (adm + fundo + seguro). */
  custoTaxasHoje: number;
  /** Soma de todas as parcelas em reais de hoje (sem reajuste). */
  totalPagoHoje: number;
  /** Primeiro mês em que a correção acumulada da carta já cobre todas as taxas do plano. */
  mesCobreTaxas: number | null;
  /** Taxa anual efetiva do CDB usada (decimal). */
  taxaCdb: number;
}

const pct = (v: number) => v / 100;

export function simular(p: Parametros, antecipar: boolean = p.antecipar): Simulacao {
  const prazo = Math.max(1, Math.round(p.prazo));
  const c = Math.min(prazo, Math.max(1, Math.round(p.mesContemplacao)));
  const plano = planoParcelas(
    p.valorCarta,
    prazo,
    pct(p.taxaAdm),
    pct(p.fundoReserva),
    antecipar
      ? {
          pctPorParcela: pct(p.antecipPctPorParcela),
          parcelasAntecipadas: p.antecipParcelas,
          taxaAdmResultante: pct(p.antecipTaxaResultante),
        }
      : null,
  );

  // saldo devedor (reais de hoje) antes de cada parcela, para o seguro
  const restante: number[] = new Array(prazo + 1).fill(0);
  for (let k = prazo - 1; k >= 0; k--) restante[k] = restante[k + 1] + plano.parcelas[k];

  const incc = pct(p.incc);
  const seguro = p.seguroAtivo ? pct(p.seguroPctMes) : 0;

  const parcela = [0];
  const desembolsado = [0];
  const pagoHoje = [0];
  const taxasPagas = [0];
  let seguroHoje = 0;
  for (let k = 1; k <= prazo; k++) {
    const f = fatorCorrecao(incc, k - 1, p.reajuste);
    const seg = restante[k - 1] * seguro;
    seguroHoje += seg;
    const valor = (plano.parcelas[k - 1] + seg) * f;
    parcela.push(valor);
    desembolsado.push(desembolsado[k - 1] + valor);
    pagoHoje.push(pagoHoje[k - 1] + plano.parcelas[k - 1] + seg);
    taxasPagas.push(taxasPagas[k - 1] + (plano.taxaAdm[k - 1] + plano.fundoReserva[k - 1] + seg) * f);
  }

  const credito: number[] = [];
  // Até a contemplação: a carta corrigida pelo INCC. Depois: a carta vira o imóvel, e o INCC segue como
  // estimativa do valor dele. (A carta não "rende" depois de usada.)
  for (let m = 0; m <= prazo; m++) credito.push(p.valorCarta * fatorCorrecao(incc, m, p.reajuste));

  const aportes = parcela.slice(1);
  const taxaCdb = pct(p.cdi) * pct(p.cdbPctCdi);
  const cdb = aplicarAportes(aportes, taxaCdb, p.descontarIR);
  const tesouro = aplicarAportes(aportes, pct(p.tesouroSelic), p.descontarIR);

  const totalPagoHoje = plano.parcelas.reduce((s, v) => s + v, 0) + seguroHoje;
  const custoTaxasHoje = totalPagoHoje - p.valorCarta;
  let mesCobreTaxas: number | null = null;
  for (let m = 1; m <= prazo; m++) {
    if (credito[m] - p.valorCarta >= custoTaxasHoje) {
      mesCobreTaxas = m;
      break;
    }
  }

  return {
    prazo,
    contemplacao: c,
    parcela,
    credito,
    desembolsado,
    pagoHoje,
    taxasPagas,
    cdb,
    tesouro,
    taxaAdmTotal: plano.taxaAdmTotal,
    custoTaxasHoje,
    totalPagoHoje,
    mesCobreTaxas,
    taxaCdb,
  };
}

export interface ComparacaoFinanciamento {
  entrada: number;
  financiado: number;
  sac: ReturnType<typeof resumoFinanciamento> & { tabela: LinhaFinanciamento[] };
  price: ReturnType<typeof resumoFinanciamento> & { tabela: LinhaFinanciamento[] };
}

/** Financiamento do mesmo imóvel (valor da carta), com entrada, no mesmo prazo. */
export function compararFinanciamento(p: Parametros): ComparacaoFinanciamento {
  const entrada = p.valorCarta * pct(p.entradaFinanciamento);
  const financiado = p.valorCarta - entrada;
  const n = Math.max(1, Math.round(p.prazo));
  const sac = tabelaSAC(financiado, pct(p.jurosFinanciamento), n);
  const price = tabelaPrice(financiado, pct(p.jurosFinanciamento), n);
  return {
    entrada,
    financiado,
    sac: { ...resumoFinanciamento(sac), tabela: sac },
    price: { ...resumoFinanciamento(price), tabela: price },
  };
}
