/**
 * Funções financeiras puras. Todas as taxas aqui são DECIMAIS (0.06 = 6%).
 */

/** Converte taxa anual efetiva em taxa mensal equivalente (juros compostos). */
export function taxaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

export type ModoReajuste = 'anual' | 'mensal';

/**
 * Fator de correção composta depois de `meses` meses.
 * - 'mensal': pró-rata todo mês, (1 + i)^(meses/12)
 * - 'anual': degrau a cada 12 meses completos, (1 + i)^floor(meses/12)
 *   (é como as administradoras reajustam carta e parcela, no aniversário do grupo)
 */
export function fatorCorrecao(taxaAnual: number, meses: number, modo: ModoReajuste = 'mensal'): number {
  const anos = modo === 'anual' ? Math.floor(meses / 12) : meses / 12;
  return Math.pow(1 + taxaAnual, anos);
}

export function corrigir(valor: number, taxaAnual: number, meses: number, modo: ModoReajuste = 'mensal'): number {
  return valor * fatorCorrecao(taxaAnual, meses, modo);
}

export interface LinhaFinanciamento {
  mes: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldo: number;
}

/** Tabela Price: parcela fixa. PMT = P * i / (1 - (1 + i)^-n). */
export function tabelaPrice(principal: number, taxaAnual: number, n: number): LinhaFinanciamento[] {
  const i = taxaMensal(taxaAnual);
  const pmt = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
  const linhas: LinhaFinanciamento[] = [];
  let saldo = principal;
  for (let mes = 1; mes <= n; mes++) {
    const juros = saldo * i;
    const amortizacao = pmt - juros;
    saldo = Math.max(0, saldo - amortizacao);
    linhas.push({ mes, parcela: pmt, juros, amortizacao, saldo });
  }
  return linhas;
}

/** SAC: amortização constante P/n, juros sobre o saldo, parcela decrescente. */
export function tabelaSAC(principal: number, taxaAnual: number, n: number): LinhaFinanciamento[] {
  const i = taxaMensal(taxaAnual);
  const amortizacao = principal / n;
  const linhas: LinhaFinanciamento[] = [];
  let saldo = principal;
  for (let mes = 1; mes <= n; mes++) {
    const juros = saldo * i;
    saldo = Math.max(0, saldo - amortizacao);
    linhas.push({ mes, parcela: amortizacao + juros, juros, amortizacao, saldo });
  }
  return linhas;
}

export function resumoFinanciamento(tabela: LinhaFinanciamento[]) {
  const totalPago = tabela.reduce((s, l) => s + l.parcela, 0);
  const totalJuros = tabela.reduce((s, l) => s + l.juros, 0);
  return {
    totalPago,
    totalJuros,
    primeiraParcela: tabela[0]?.parcela ?? 0,
    ultimaParcela: tabela[tabela.length - 1]?.parcela ?? 0,
  };
}

/** Alíquota regressiva de IR da renda fixa (CDB, Tesouro), pelo prazo em dias. */
export function aliquotaIR(dias: number): number {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.2;
  if (dias <= 720) return 0.175;
  return 0.15;
}

/**
 * Aplica uma sequência de aportes mensais numa renda fixa pós-fixada.
 * aportes[k] é depositado no fim do mês k+1. Devolve o saldo no fim de cada
 * mês m = 0..aportes.length (índice 0 = antes de tudo, saldo 0).
 * Com descontarIR, cada aporte é tratado como um lote com seu próprio prazo
 * (tabela regressiva), e o saldo devolvido é o líquido de resgate.
 */
export function aplicarAportes(aportes: number[], taxaAnual: number, descontarIR: boolean): number[] {
  const n = aportes.length;
  const i = taxaMensal(taxaAnual);
  const pot: number[] = [1];
  for (let k = 1; k <= n; k++) pot.push(pot[k - 1] * (1 + i));
  const saldos: number[] = [0];
  for (let m = 1; m <= n; m++) {
    let total = 0;
    for (let k = 0; k < m; k++) {
      const meses = m - (k + 1);
      const bruto = aportes[k] * pot[meses];
      const ganho = bruto - aportes[k];
      total += descontarIR ? bruto - ganho * aliquotaIR(meses * 30) : bruto;
    }
    saldos.push(total);
  }
  return saldos;
}
