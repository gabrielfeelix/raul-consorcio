import { planoParcelas } from './antecipacao';
import type { Parametros, Simulacao } from './consorcio';
import { fatorCorrecao } from './finance';

/** Ganho do consórcio até o mês: correção da carta menos as taxas pagas. */
export function ganhoConsorcio(sim: Simulacao, valorCarta: number, m: number) {
  return sim.credito[m] - valorCarta - sim.taxasPagas[m];
}

/** Mês em que o CDB passa o consórcio (só conta se o consórcio liderou antes). */
export function mesVirada(sim: Simulacao, valorCarta: number): number | null {
  let liderou = false;
  for (let m = 1; m <= sim.prazo; m++) {
    const frente = ganhoConsorcio(sim, valorCarta, m) >= sim.cdb[m] - sim.desembolsado[m];
    if (frente) liderou = true;
    else if (liderou) return m;
  }
  return null;
}

/**
 * Base de cálculo da tese: sobre quanto cada um rende/corrige num ano a partir do mês.
 * Renda fixa: taxa × o que já foi aportado. Carta: índice da fase × crédito corrigido.
 */
export function baseDeCalculo(sim: Simulacao, mes: number, taxaRendaFixa: number, incc: number, selic: number) {
  const depois = mes > sim.contemplacao;
  const baseRF = sim.desembolsado[mes];
  const baseCarta = sim.credito[mes];
  const taxaCarta = depois ? selic : incc;
  const rendeRF = baseRF * taxaRendaFixa;
  const rendeCarta = baseCarta * taxaCarta;
  return { depois, baseRF, baseCarta, taxaCarta, rendeRF, rendeCarta, vezes: rendeRF > 0 ? rendeCarta / rendeRF : 0 };
}


/** Para onde vai a parcela do mês k (valores do mês, já com reajuste). */
export function composicaoParcela(p: Parametros, sim: Simulacao, antecipar: boolean, k: number) {
  const prazo = sim.prazo;
  const plano = planoParcelas(
    p.valorCarta,
    prazo,
    p.taxaAdm / 100,
    p.fundoReserva / 100,
    antecipar ? { pctPorParcela: p.antecipPctPorParcela / 100, parcelasAntecipadas: p.antecipParcelas, taxaAdmResultante: p.antecipTaxaResultante / 100 } : null,
  );
  const i = Math.min(prazo, Math.max(1, k));
  const f = fatorCorrecao(p.incc / 100, i - 1, p.reajuste);
  const fundoComum = plano.fundoComum[i - 1] * f;
  const adm = plano.taxaAdm[i - 1] * f;
  const reserva = plano.fundoReserva[i - 1] * f;
  const seguro = Math.max(0, sim.parcela[i] - fundoComum - adm - reserva);
  return { total: sim.parcela[i], fundoComum, adm, reserva, seguro };
}
