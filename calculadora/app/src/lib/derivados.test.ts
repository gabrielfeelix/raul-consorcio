import { describe, expect, it } from 'vitest';
import { simular } from './consorcio';
import { PADRAO } from './defaults';
import { baseDeCalculo, composicaoParcela, ganhoConsorcio } from './derivados';

describe('derivados', () => {
  const sim = simular(PADRAO);
  it('ganho do consórcio = crédito − carta − taxas pagas', () => {
    expect(ganhoConsorcio(sim, PADRAO.valorCarta, 24)).toBeCloseTo(sim.credito[24] - 150_000 - sim.taxasPagas[24], 6);
  });
  it('base de cálculo: CDB sobre o aportado, carta sobre o crédito inteiro', () => {
    const b = baseDeCalculo(sim, 24, sim.taxaCdb, 0.06);
    expect(b.baseRF).toBe(sim.desembolsado[24]);
    expect(b.baseCarta).toBe(sim.credito[24]);
    expect(b.taxaCarta).toBe(0.06);
    expect(b.vezes).toBeGreaterThan(1);
    // depois da contemplação o imóvel segue o INCC, não a Selic
    expect(baseDeCalculo(sim, sim.contemplacao + 1, sim.taxaCdb, 0.06).taxaCarta).toBe(0.06);
  });
});

describe('composição da parcela', () => {
  it('as partes somam a parcela', () => {
    const s = simular({ ...PADRAO, seguroAtivo: true });
    const c = composicaoParcela({ ...PADRAO, seguroAtivo: true }, s, false, 3);
    expect(c.fundoComum + c.adm + c.reserva + c.seguro).toBeCloseTo(s.parcela[3], 6);
    expect(c.fundoComum).toBeCloseTo(150_000 / 240, 6);
    expect(c.seguro).toBeGreaterThan(0);
  });
});
