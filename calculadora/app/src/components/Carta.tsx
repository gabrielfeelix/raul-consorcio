import type { ReactNode } from 'react';
import { reais } from '../lib/format';
import { Num } from './Num';

/** Padrão guilhochê (o desenho de linhas finas de cédulas e cheques), gerado uma vez. */
function guilloche(): string[] {
  const paths: string[] = [];
  const cx = 300;
  const cy = 190;
  for (let j = 0; j < 9; j++) {
    const R = 70 + j * 16;
    const a = 10 + j * 1.6;
    const k = 18;
    let d = '';
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      const r = R + a * Math.sin(k * t + j * 0.45);
      d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`;
    }
    paths.push(d + 'Z');
  }
  return paths;
}
const GUILLOCHE = guilloche();

interface Props {
  valor: number;
  prazo: number;
  /** linha pequena embaixo do valor */
  nota?: ReactNode;
  selo?: string | null;
  compacta?: boolean;
}

export function Carta({ valor, prazo, nota, selo, compacta }: Props) {
  return (
    <figure className={`carta${compacta ? ' carta--compacta' : ''}`} aria-label={`Carta de crédito de ${reais(valor)} em ${prazo} meses`}>
      <svg className="carta__guilloche" viewBox="0 0 400 252" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        {GUILLOCHE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
      <div className="carta__top">
        <span className="carta__tipo">
          Carta de crédito
          <small>Imóvel</small>
        </span>
        <span className="carta__marca">
          <span>
            <b>Raul</b> Consórcio
          </span>
        </span>
      </div>
      <div className="carta__valor">
        <Num value={valor} format={reais} />
      </div>
      <div className="carta__base">
        <span>{nota ?? `${prazo} meses`}</span>
        {selo && <span className="carta__selo">{selo}</span>}
      </div>
    </figure>
  );
}
