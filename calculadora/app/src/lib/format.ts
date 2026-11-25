const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const num1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** R$ 150.000 (mantém o espaço não separável para o valor não quebrar). */
export const reais = (v: number) => brl0.format(Math.round(v));
export const reaisCentavos = (v: number) => brl2.format(v);
export const numero = (v: number) => num.format(v);
export const porcento = (v: number) => `${num1.format(v)}%`;

/** R$ 150 mil, R$ 1,6 mi */
export function reaisCurto(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `R$\u00a0${num1.format(v / 1_000_000)}\u00a0mi`;
  if (a >= 1_000) return `R$\u00a0${Math.round(v / 1_000)}\u00a0mil`;
  return reais(v);
}

/** "5 anos", "1 ano e 6 meses", "8 meses" */
export function duracao(meses: number): string {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const ta = a === 1 ? '1 ano' : `${a} anos`;
  const tm = m === 1 ? '1 mês' : `${m} meses`;
  if (a === 0) return tm;
  if (m === 0) return ta;
  return `${ta} e ${tm}`;
}

/** Converte texto digitado em pt-BR ("150.000,50", "6,5") em número. */
export function lerNumero(txt: string): number | null {
  const limpo = txt.replace(/[^\d,.-]/g, '');
  if (!limpo) return null;
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo.replace(/\.(?=\d{3}(\D|$))/g, '');
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}
