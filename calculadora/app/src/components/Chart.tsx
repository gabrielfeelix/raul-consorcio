import { useLayoutEffect, useRef, useState } from 'react';
import type { Simulacao } from '../lib/consorcio';
import { reaisCurto } from '../lib/format';

interface Props {
  sim: Simulacao;
  mes: number;
  onMes?: (m: number) => void;
  height?: number;
  /** largura fixa (usado no PDF); sem ela, mede o contêiner */
  width?: number;
  variant?: 'screen' | 'print';
  /** último mês visível no eixo x (zoom); padrão = prazo */
  ate?: number;
}

function passoBonito(max: number, n = 4): number {
  const bruto = max / n;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const r = bruto / pot;
  const m = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
  return m * pot;
}

const TOP = 22;
const BOTTOM = 26;

export function Chart({ sim, mes, onMes, height = 340, width, variant = 'screen', ate }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState(width ?? 800);
  const arrastando = useRef(false);

  useLayoutEffect(() => {
    if (width) return;
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMedida(el.clientWidth));
    ro.observe(el);
    setMedida(el.clientWidth);
    return () => ro.disconnect();
  }, [width]);

  const W = width ?? medida;
  const H = height;
  const { contemplacao } = sim;
  const prazo = Math.min(sim.prazo, Math.max(12, ate ?? sim.prazo));
  const credito = sim.credito.slice(0, prazo + 1);
  const desembolsado = sim.desembolsado.slice(0, prazo + 1);
  const cdb = sim.cdb.slice(0, prazo + 1);
  const mostraCursor = mes <= prazo;
  const maxV = Math.max(...credito, ...cdb, ...desembolsado);
  const passo = passoBonito(maxV);
  const yMax = Math.ceil((maxV * 1.04) / passo) * passo;
  const x = (m: number) => (m / prazo) * W;
  const y = (v: number) => TOP + (1 - v / yMax) * (H - TOP - BOTTOM);

  const linha = (s: number[]) => s.map((v, m) => `${m === 0 ? 'M' : 'L'}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${linha(desembolsado)}L${x(prazo)},${y(0)}L${x(0)},${y(0)}Z`;

  const grades: number[] = [];
  for (let v = passo; v <= yMax; v += passo) grades.push(v);

  const anosPasso = prazo <= 36 ? 1 : prazo <= 120 ? 2 : 5;
  const xticks: number[] = [];
  for (let a = anosPasso; a * 12 < prazo; a += anosPasso) xticks.push(a * 12);

  const mesDoPonteiro = (clientX: number, alvo: Element) => {
    const r = alvo.getBoundingClientRect();
    const m = Math.round(((clientX - r.left) / r.width) * prazo);
    return Math.min(prazo, Math.max(1, m));
  };

  const cx = x(Math.min(mes, prazo));

  return (
    <div className={`chart chart--${variant}`} ref={ref}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Gráfico: crédito corrigido, dinheiro no CDB e total pago ao longo de ${prazo} meses`}
        onPointerDown={
          onMes
            ? (e) => {
                arrastando.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                onMes(mesDoPonteiro(e.clientX, e.currentTarget));
              }
            : undefined
        }
        onPointerMove={onMes ? (e) => arrastando.current && onMes(mesDoPonteiro(e.clientX, e.currentTarget)) : undefined}
        onPointerUp={() => (arrastando.current = false)}
        onPointerCancel={() => (arrastando.current = false)}
      >
        {grades.map((v) => (
          <g key={v}>
            <line x1={0} x2={W} y1={y(v)} y2={y(v)} className="chart__grid" />
            <text x={0} y={y(v) - 6} className="chart__ylabel">
              {reaisCurto(v)}
            </text>
          </g>
        ))}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="chart__base" />
        {xticks.map((m) => (
          <text key={m} x={x(m)} y={H - 6} className="chart__xlabel" textAnchor="middle">
            {m / 12} anos
          </text>
        ))}

        {contemplacao <= prazo && (<>
        <line x1={x(contemplacao)} x2={x(contemplacao)} y1={TOP - 8} y2={y(0)} className="chart__contemplacao" />
        <text
          x={x(contemplacao) + (contemplacao / prazo > 0.8 ? -8 : 8)}
          y={TOP}
          className="chart__note"
          textAnchor={contemplacao / prazo > 0.8 ? 'end' : 'start'}
        >
          Contemplação
        </text>
        </>)}

        <path d={area} className="chart__paid-area" />
        <path d={linha(desembolsado)} className="chart__paid-line" />
        <path d={linha(cdb)} className="chart__cdb" />
        <path d={linha(credito)} className="chart__credit" pathLength={1} />

        {mostraCursor && (
          <g>
            <line x1={cx} x2={cx} y1={TOP - 8} y2={y(0)} className="chart__cursor" />
            <circle cx={cx} cy={y(desembolsado[mes])} r={4.5} className="chart__dot chart__dot--paid" />
            <circle cx={cx} cy={y(cdb[mes])} r={4.5} className="chart__dot chart__dot--cdb" />
            <circle cx={cx} cy={y(credito[mes])} r={6} className="chart__dot chart__dot--credit" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function ChartLegend({ sim, mes }: { sim: Simulacao; mes: number }) {
  return (
    <ul className="legend">
      <li>
        <span className="legend__swatch legend__swatch--credit" />
        <span className="legend__name">Crédito corrigido</span>
        <span className="legend__value">{reaisCurto(sim.credito[mes])}</span>
      </li>
      <li>
        <span className="legend__swatch legend__swatch--cdb" />
        <span className="legend__name">As mesmas parcelas no CDB</span>
        <span className="legend__value">{reaisCurto(sim.cdb[mes])}</span>
      </li>
      <li>
        <span className="legend__swatch legend__swatch--paid" />
        <span className="legend__name">Você pagou</span>
        <span className="legend__value">{reaisCurto(sim.desembolsado[mes])}</span>
      </li>
    </ul>
  );
}
