import { describe, expect, it } from 'vitest';
import { aliquotaIR, aplicarAportes, corrigir, fatorCorrecao, resumoFinanciamento, tabelaPrice, tabelaSAC, taxaMensal } from './finance';

describe('correção composta', () => {
  it('taxa mensal equivalente recompõe a anual', () => {
    expect(Math.pow(1 + taxaMensal(0.12), 12)).toBeCloseTo(1.12, 10);
  });
  it('corrige 6% a.a. sobre R$ 150 mil em 12 meses', () => {
    expect(corrigir(150_000, 0.06, 12)).toBeCloseTo(159_000, 6);
  });
  it('reajuste anual só muda no aniversário', () => {
    expect(fatorCorrecao(0.06, 11, 'anual')).toBe(1);
    expect(fatorCorrecao(0.06, 12, 'anual')).toBeCloseTo(1.06, 10);
    expect(fatorCorrecao(0.06, 24, 'anual')).toBeCloseTo(1.1236, 10);
  });
  it('reajuste mensal é pró-rata', () => {
    expect(fatorCorrecao(0.06, 6, 'mensal')).toBeCloseTo(Math.sqrt(1.06), 10);
  });
});

describe('Price', () => {
  it('parcela fixa bate com a fórmula PMT', () => {
    const i = 0.01;
    const anual = Math.pow(1.01, 12) - 1;
    const t = tabelaPrice(100_000, anual, 120);
    const pmt = (100_000 * i) / (1 - Math.pow(1 + i, -120));
    expect(t[0].parcela).toBeCloseTo(pmt, 6);
    expect(t[119].parcela).toBeCloseTo(pmt, 6);
    expect(t[119].saldo).toBeCloseTo(0, 4);
    expect(resumoFinanciamento(t).totalPago).toBeCloseTo(pmt * 120, 4);
  });
  it('juros zero divide igualmente', () => {
    expect(tabelaPrice(1200, 0, 12)[0].parcela).toBeCloseTo(100, 10);
  });
});

describe('SAC', () => {
  it('amortização constante, parcela decrescente e saldo zerado', () => {
    const anual = Math.pow(1.01, 12) - 1;
    const t = tabelaSAC(120_000, anual, 120);
    expect(t[0].amortizacao).toBeCloseTo(1000, 6);
    expect(t[0].parcela).toBeCloseTo(1000 + 1200, 6);
    expect(t[1].parcela).toBeLessThan(t[0].parcela);
    expect(t[119].saldo).toBeCloseTo(0, 6);
    // juros totais SAC = P*i*(n+1)/2
    expect(resumoFinanciamento(t).totalJuros).toBeCloseTo(120_000 * 0.01 * 121 / 2, 4);
  });
  it('SAC paga menos juros que Price', () => {
    const s = resumoFinanciamento(tabelaSAC(120_000, 0.12, 240));
    const p = resumoFinanciamento(tabelaPrice(120_000, 0.12, 240));
    expect(s.totalJuros).toBeLessThan(p.totalJuros);
  });
});

describe('renda fixa', () => {
  it('tabela regressiva de IR', () => {
    expect(aliquotaIR(30)).toBe(0.225);
    expect(aliquotaIR(200)).toBe(0.2);
    expect(aliquotaIR(500)).toBe(0.175);
    expect(aliquotaIR(800)).toBe(0.15);
  });
  it('sem IR, um aporte único rende juros compostos', () => {
    const aportes = [1000, ...new Array(12).fill(0)];
    const s = aplicarAportes(aportes, 0.12, false);
    expect(s[0]).toBe(0);
    expect(s[1]).toBeCloseTo(1000, 8);
    expect(s[13]).toBeCloseTo(1120, 6);
  });
  it('com IR desconta só sobre o ganho', () => {
    const aportes = [1000, ...new Array(12).fill(0)];
    const s = aplicarAportes(aportes, 0.12, true);
    expect(s[13]).toBeCloseTo(1000 + 120 * (1 - 0.2), 6);
  });
});
