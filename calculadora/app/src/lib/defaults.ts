import type { Parametros } from './consorcio';

/**
 * Valores padrão. São estimativas editáveis no painel "Ajustar taxas":
 * o Raul deve conferir Selic, CDI e juros de financiamento no dia da reunião.
 */
export const PADRAO: Parametros = {
  valorCarta: 150_000,
  prazo: 240,
  mesContemplacao: 60,
  taxaAdm: 22,
  fundoReserva: 2,
  seguroAtivo: false,
  seguroPctMes: 0.035,
  reajuste: 'anual',
  incc: 6,
  selic: 15,
  cdi: 14.9,
  cdbPctCdi: 100,
  tesouroSelic: 15,
  descontarIR: true,
  jurosFinanciamento: 12,
  entradaFinanciamento: 20,
  antecipar: false,
  antecipPctPorParcela: 1,
  antecipParcelas: 2,
  antecipTaxaResultante: 19,
};
