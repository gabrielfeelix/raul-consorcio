import { useRef, useState } from 'react';
import type { Simulacao } from '../lib/consorcio';
import { duracao, reais, reaisCurto } from '../lib/format';
import { useLargura } from '../hooks/useTween';

interface Props {
  sim: Simulacao;
  mes: number;
  onMes: (m: number) => void;
  /** último mês visível no eixo x */
  ate: number;
  incc: number;
  selic: number;
}

function passoBonito(max: number, n = 3): number {
  const bruto = max / n;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const r = bruto / pot;
  const m = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
  return m * pot;
}

const T = 46;
const B = 46;
const L = 6;
const R = 14;

/** Gráfico do tempo: crédito corrigido × total pago, com a bolinha arrastável no eixo. */
export function TimeChart({ sim, mes, onMes, ate }: Props) {
  const [ref, { w, h }] = useLargura<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const arrastando = useRef(false);
  const [ativo, setAtivo] = useState(false);

  const fim = Math.min(sim.prazo, Math.max(12, ate));
  const W = Math.max(200, w);
  const H = Math.max(180, h);
  const cred = sim.credito.slice(0, fim + 1);
  const pago = sim.desembolsado.slice(0, fim + 1);
  const maxV = Math.max(...cred, ...pago);
  const passo = passoBonito(maxV);
  const yMax = Math.ceil((maxV * 1.06) / passo) * passo;
  const x = (m: number) => L + (m / fim) * (W - L - R);
  const y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const baseY = y(0);

  const linha = (s: number[]) => s.map((v, m) => `${m ? 'L' : 'M'}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const areaPago = `${linha(pago)}L${x(fim)},${baseY}L${x(0)},${baseY}Z`;
  const areaCred = `${linha(cred)}L${x(fim)},${baseY}L${x(0)},${baseY}Z`;

  const grades: number[] = [];
  for (let v = passo; v <= yMax; v += passo) grades.push(v);
  const anosPasso = fim <= 36 ? 1 : fim <= 120 ? 2 : 5;
  const xt: number[] = [];
  for (let a = anosPasso; a * 12 < fim; a += anosPasso) xt.push(a * 12);

  const m = Math.min(mes, fim);
  const cx = x(m);
  const c = sim.contemplacao;
  const temC = c <= fim;

  const mesDe = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    const k = Math.round(((clientX - r.left - L) / (r.width - L - R)) * fim);
    return Math.min(fim, Math.max(1, k));
  };

  const onKey = (e: React.KeyboardEvent) => {
    const passoK = e.shiftKey ? 12 : 1;
    let novo: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') novo = mes + passoK;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') novo = mes - passoK;
    if (e.key === 'PageUp') novo = mes + 12;
    if (e.key === 'PageDown') novo = mes - 12;
    if (e.key === 'Home') novo = 1;
    if (e.key === 'End') novo = sim.prazo;
    if (novo !== null) {
      e.preventDefault();
      e.stopPropagation();
      onMes(Math.min(sim.prazo, Math.max(1, novo)));
    }
  };

  // rótulos dos pontos no mês escolhido
  const yc = y(cred[m]);
  const yp = y(pago[m]);
  const labelLado = cx > W - 150 ? 'end' : 'start';
  const lx = labelLado === 'end' ? cx - 14 : cx + 14;
  const hv = hover !== null && hover !== m ? hover : null;
  // rótulo do pago: abaixo do ponto, a menos que caia em cima da bolinha (perto da base); aí vai para cima
  const pagoBaixo = Math.max(yc + 22, yp + 20);
  const pagoY = pagoBaixo <= baseY - 28 ? pagoBaixo : yp - 12;
  const credY = pagoY < yp ? Math.min(yc - 10, pagoY - 20) : yc - 10;

  return (
    <div
      className={`tchart${ativo ? ' is-dragging' : ''}`}
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Mês da simulação"
      aria-valuemin={1}
      aria-valuemax={sim.prazo}
      aria-valuenow={mes}
      aria-valuetext={`Mês ${mes}: você pagou ${reais(sim.desembolsado[mes])}, a carta vale ${reais(sim.credito[mes])}`}
      onKeyDown={onKey}
    >
      {w > 0 && (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          onPointerDown={(e) => {
            arrastando.current = true;
            setAtivo(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            onMes(mesDe(e.clientX, e.currentTarget));
          }}
          onPointerMove={(e) => {
            const k = mesDe(e.clientX, e.currentTarget);
            if (arrastando.current) onMes(k);
            else if (e.pointerType === 'mouse') setHover(k);
          }}
          onPointerUp={() => {
            arrastando.current = false;
            setAtivo(false);
          }}
          onPointerCancel={() => {
            arrastando.current = false;
            setAtivo(false);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {temC && <rect x={x(c)} y={0} width={x(fim) - x(c)} height={baseY} className="tchart__fase" />}
          {grades.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="tchart__grid" />
              <text x={L} y={y(v) - 7} className="tchart__ylabel">
                {reaisCurto(v)}
              </text>
            </g>
          ))}
          {xt.map((k) => (
            <text key={k} x={x(k)} y={H - 6} className="tchart__xlabel" textAnchor="middle">
              {k / 12} anos
            </text>
          ))}

          {(!temC || x(c) - L > 270) && (
            <text x={L} y={14} className="tchart__fasel">
              Antes da contemplação
            </text>
          )}
          {temC && (
            <>
              <line x1={x(c)} x2={x(c)} y1={22} y2={baseY} className="tchart__contem" />
              <text x={x(c) + 10} y={14} className="tchart__fasel tchart__fasel--sel" textAnchor={x(c) + (W < 560 ? 150 : 330) > W ? 'end' : 'start'} dx={x(c) + (W < 560 ? 150 : 330) > W ? -20 : 0}>
                {`Contemplação, mês ${c}`}
              </text>
            </>
          )}

          <path d={areaCred} className="tchart__cred-area" />
          <path d={areaPago} className="tchart__pago-area" />
          <path d={linha(pago)} className="tchart__pago" />
          <path d={linha(cred)} className="tchart__cred" />

          {hv !== null && (
            <g className="tchart__hover">
              <line x1={x(hv)} x2={x(hv)} y1={T} y2={baseY} />
              <circle cx={x(hv)} cy={y(cred[hv])} r={3.5} className="is-cred" />
              <circle cx={x(hv)} cy={y(pago[hv])} r={3.5} className="is-pago" />
            </g>
          )}

          <line x1={cx} x2={cx} y1={T - 4} y2={baseY} className="tchart__cursor" />
          <circle cx={cx} cy={yp} r={4.5} className="tchart__dot tchart__dot--pago" />
          <circle cx={cx} cy={yc} r={5.5} className="tchart__dot tchart__dot--cred" />
          <text x={lx} y={credY} textAnchor={labelLado} className="tchart__val tchart__val--cred">
            {reais(cred[m])}
          </text>
          <text x={lx} y={pagoY} textAnchor={labelLado} className="tchart__val tchart__val--pago">
            {reais(pago[m])}
          </text>

          <line x1={L} x2={W - R} y1={baseY} y2={baseY} className="tchart__base" />
          <line x1={L} x2={cx} y1={baseY} y2={baseY} className="tchart__trilho" />
          <g className="tchart__knob" transform={`translate(${cx},${baseY})`}>
            <circle r={14} className="tchart__knob-halo" />
            <circle r={8} className="tchart__knob-dot" />
          </g>
        </svg>
      )}
      {hv !== null && (
        <div className="tchart__tip" style={{ left: Math.min(Math.max(x(hv), 90), W - 90), top: Math.min(y(cred[hv]), y(pago[hv])) - 12 }}>
          <strong>
            Mês {hv} <span>({duracao(hv)})</span>
          </strong>
          <span className="is-cred">Carta vale {reais(cred[hv])}</span>
          <span className="is-pago">Você pagou {reais(pago[hv])}</span>
        </div>
      )}
    </div>
  );
}
