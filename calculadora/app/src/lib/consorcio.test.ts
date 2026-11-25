import { describe, expect, it } from 'vitest';
import { planoParcelas } from './antecipacao';
import { compararFinanciamento, simular } from './consorcio';
import { PADRAO } from './defaults';

describe('plano de parcelas', () => {
  it('sem antecipação: carta × (1 + adm + fundo) / prazo', () => {
    const p = planoParcelas(150_000, 240, 0.22, 0.02);
    expect(p.parcelas[0]).toBeCloseTo((150_000 * 1.24) / 240, 8);
    expect(p.parcelas.reduce((a, b) => a + b, 0)).toBeCloseTo(150_000 * 1.24, 4);
  });
  it('com antecipação: 2 primeiras mais caras, demais mais baratas, taxa total menor', () => {
    const sem = planoParcelas(150_000, 240, 0.22, 0.02);
    const com = planoParcelas(150_000, 240, 0.22, 0.02, { pctPorParcela: 0.01, parcelasAntecipadas: 2, taxaAdmResultante: 0.19 });
    expect(com.parcelas[0]).toBeGreaterThan(sem.parcelas[0]);
    expect(com.parcelas[0]).toBeCloseTo(com.parcelas[2] + 1500, 8);
    expect(com.parcelas[2]).toBeLessThan(sem.parcelas[2]);
    expect(com.taxaAdm.reduce((a, b) => a + b, 0)).toBeCloseTo(150_000 * 0.19, 4);
    expect(com.taxaAdmTotal).toBe(0.19);
  });
});

describe('simulação', () => {
  const s = simular(PADRAO);
  it('crédito corrige pelo INCC até a contemplação', () => {
    expect(s.credito[0]).toBe(150_000);
    expect(s.credito[12]).toBeCloseTo(159_000, 6);
    expect(s.credito[60]).toBeCloseTo(150_000 * Math.pow(1.06, 5), 4);
  });
  it('depois da contemplação corrige pela Selic', () => {
    expect(s.credito[72]).toBeCloseTo(s.credito[60] * 1.15, 4);
  });
  it('parcela reajusta no aniversário', () => {
    expect(s.parcela[12]).toBeCloseTo(s.parcela[1], 8);
    expect(s.parcela[13]).toBeCloseTo(s.parcela[1] * 1.06, 8);
  });
  it('desembolso é a soma das parcelas', () => {
    expect(s.desembolsado[3]).toBeCloseTo(s.parcela[1] * 3, 8);
  });
  it('mês em que a correção cobre as taxas', () => {
    expect(s.mesCobreTaxas).toBe(48);
  });
});

describe('financiamento', () => {
  it('financia carta menos entrada', () => {
    const f = compararFinanciamento(PADRAO);
    expect(f.financiado).toBe(120_000);
    expect(f.price.totalJuros).toBeGreaterThan(f.sac.totalJuros);
  });
});
