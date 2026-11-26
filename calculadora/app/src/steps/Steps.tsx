import { useEffect, useRef, useState } from 'react';
import type { ComparacaoFinanciamento, Parametros, Simulacao } from '../lib/consorcio';
import { baseDeCalculo, composicaoParcela, ganhoConsorcio, mesVirada } from '../lib/derivados';
import { duracao, porcento, reais, reaisCentavos } from '../lib/format';
import { Carta } from '../components/Carta';
import { NumberField, Toggle } from '../components/Fields';
import { Num } from '../components/Num';
import { TimeChart } from '../components/TimeChart';
import { useTip } from '../components/Tip';
import { AVISO } from '../components/Aviso';

export interface StepProps {
  p: Parametros;
  set: <K extends keyof Parametros>(k: K, v: Parametros[K]) => void;
  setP: React.Dispatch<React.SetStateAction<Parametros>>;
  sim: Simulacao;
  sem: Simulacao;
  com: Simulacao;
  fin: ComparacaoFinanciamento;
  mes: number;
  setMes: (m: number) => void;
  comparar: Comparar;
  setComparar: (c: Comparar) => void;
  cliente: string;
  setCliente: (c: string) => void;
  gerarPdf: () => void;
}

export type Comparar = 'cdb' | 'tesouro' | 'financiamento';

const pctBR = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

/* ================= 1. A carta ================= */

const VALORES = [150_000, 300_000, 500_000, 1_000_000];
const PRAZOS = [120, 180, 200, 240];

export function CartaStage({ p }: StepProps) {
  return (
    <div className="st st--carta">
      <Carta valor={p.valorCarta} prazo={p.prazo} nota={`${p.prazo} meses, ou ${duracao(p.prazo)}`} />
    </div>
  );
}

function Chips<T extends number>({ opcoes, valor, onChange, rotulo, nome }: { opcoes: T[]; valor: number; onChange: (v: T) => void; rotulo: (v: T) => string; nome: string }) {
  return (
    <div className="chips" role="radiogroup" aria-label={nome}>
      {opcoes.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={valor === o} className="chip" onClick={() => onChange(o)}>
          {rotulo(o)}
        </button>
      ))}
    </div>
  );
}

export function CartaPanel({ p, set, setP }: StepProps) {
  const setPrazo = (v: number) => {
    const prazo = Math.round(v);
    setP((old) => ({ ...old, prazo, mesContemplacao: Math.min(old.mesContemplacao, prazo) }));
  };
  return (
    <>
      <div className="grupo">
        <span className="grupo__t">Valor da carta</span>
        <Chips nome="Valor da carta" opcoes={VALORES} valor={p.valorCarta} onChange={(v) => set('valorCarta', v)} rotulo={(v) => (v >= 1_000_000 ? '1 milhão' : `${v / 1000} mil`)} />
        <NumberField label="Outro valor" prefix="R$" value={p.valorCarta} onChange={(v) => set('valorCarta', v)} min={10_000} max={10_000_000} />
      </div>
      <div className="grupo">
        <span className="grupo__t">Prazo</span>
        <Chips nome="Prazo" opcoes={PRAZOS} valor={p.prazo} onChange={setPrazo} rotulo={(v) => `${v} meses`} />
        <NumberField label="Outro prazo" suffix="meses" value={p.prazo} onChange={setPrazo} min={12} max={300} />
      </div>
    </>
  );
}

/* ================= 2. A parcela ================= */

function Rosca({ partes, total }: { partes: { k: string; nome: string; desc?: string; v: number; cor: string }[]; total: number }) {
  const tip = useTip();
  const R = 84;
  const C = 2 * Math.PI * R;
  const gap = 3;
  let acc = 0;
  const principal = partes[0];
  return (
    <div className="rosca">
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle cx="110" cy="110" r={R} className="rosca__trilho" />
        {partes.map((pt) => {
          const len = Math.max(0, (pt.v / total) * C - gap);
          const el = (
            <circle
              key={pt.k}
              cx="110"
              cy="110"
              r={R}
              className="rosca__seg"
              style={{ stroke: pt.cor, strokeDasharray: `${len} ${C}`, strokeDashoffset: -acc }}
              {...tip(
                <>
                  <strong>{pt.nome}</strong>
                  <span>{reaisCentavos(pt.v)} por mês</span>
                  <small>{pt.desc ?? `${porcento((pt.v / total) * 100)} da parcela`}</small>
                </>,
              )}
            />
          );
          acc += (pt.v / total) * C;
          return el;
        })}
      </svg>
      <div className="rosca__centro">
        <Num className="rosca__pct" value={(principal.v / total) * 100} format={(v) => `${Math.round(v)}%`} />
        <span>da parcela vai para o seu imóvel</span>
      </div>
    </div>
  );
}

function MiniParcelas({ s, n, destaque }: { s: Simulacao; n: number; destaque: boolean }) {
  const tip = useTip();
  const meses = Array.from({ length: Math.min(24, s.prazo) }, (_, i) => i + 1);
  const max = Math.max(...meses.map((k) => s.parcela[k]));
  return (
    <div className="mini" aria-hidden="true">
      {meses.map((k) => (
        <span
          key={k}
          className={`mini__c${destaque && k <= n ? ' is-alta' : ''}`}
          style={{ height: `${Math.max(8, (s.parcela[k] / max) * 100)}%` }}
          {...tip(
            <>
              <strong>Parcela {k}</strong>
              <span>{reaisCentavos(s.parcela[k])}</span>
              {k === 13 && <small>Reajuste anual pelo INCC</small>}
            </>,
          )}
        />
      ))}
    </div>
  );
}

export function ParcelaStage({ p, sim, sem, com }: StepProps) {
  const n = Math.max(0, Math.round(p.antecipParcelas));
  const kRef = p.antecipar ? Math.min(sim.prazo, n + 1) : 1;
  const c = composicaoParcela(p, sim, p.antecipar, kRef);
  const partes = [
    { k: 'fc', nome: 'Para o seu imóvel', desc: 'Vai para o fundo do grupo e paga a sua carta de crédito. É dinheiro seu.', v: c.fundoComum, cor: 'var(--c-fc)' },
    { k: 'adm', nome: 'Taxa de administração', desc: 'O que a administradora cobra pelo serviço.', v: c.adm, cor: 'var(--c-adm)' },
    { k: 'fr', nome: 'Fundo de reserva', desc: 'Uma reserva que protege o grupo de imprevistos.', v: c.reserva, cor: 'var(--c-fr)' },
    ...(c.seguro > 0.005 ? [{ k: 'seg', nome: 'Seguro', desc: 'Proteção em caso de morte ou invalidez.', v: c.seguro, cor: 'var(--c-seg)' }] : []),
  ];
  const opcoes = [
    { k: 'sem', titulo: 'Sem antecipar', s: sem, ativo: !p.antecipar, depois: sem.parcela[1], antes: null as number | null },
    { k: 'com', titulo: 'Antecipando a taxa', s: com, ativo: p.antecipar, depois: com.parcela[Math.min(com.prazo, n + 1)], antes: n > 0 ? com.parcela[1] : null },
  ];

  return (
    <div className="st st--parcela">
      <div className="parc">
        <div className="parc__esq">
          <p className="olho">Sua parcela</p>
          <div className="parcela__valor">
            <Num value={c.total} format={reaisCentavos} />
            <span className="parcela__mes">por mês</span>
          </div>
          <p className="parcela__sub">
            {p.antecipar && n > 0
              ? `A partir da ${n + 1}ª parcela. ${n === 1 ? 'A 1ª fica' : `As ${n} primeiras ficam`} em ${reaisCentavos(com.parcela[1])}.`
              : 'O mesmo valor todo mês, com reajuste uma vez por ano.'}
          </p>
          <ul className="compo">
            {partes.map((pt) => (
              <li key={pt.k}>
                <i style={{ background: pt.cor }} />
                <span>
                  {pt.nome}
                  <small>{pt.desc}</small>
                </span>
                <strong>{reaisCentavos(pt.v)}</strong>
                <em>{porcento((pt.v / c.total) * 100)}</em>
              </li>
            ))}
          </ul>
        </div>
        <Rosca partes={partes} total={c.total} />
      </div>

      <div className="ant">
        {opcoes.map((o) => (
          <div key={o.k} className={`antc${o.ativo ? ' is-ativo' : ''}`}>
            <div className="antc__top">
              <span>{o.titulo}</span>
              {o.ativo && <b>Na simulação</b>}
            </div>
            <div className="antc__v">
              {reaisCentavos(o.depois)}
              <small>/mês</small>
            </div>
            <p className="antc__sub">
              {o.antes !== null ? `${n === 1 ? '1ª parcela' : `${n} primeiras`} de ${reaisCentavos(o.antes)} · ` : ''}taxa total {porcento(o.s.taxaAdmTotal * 100)}
            </p>
            <MiniParcelas s={o.s} n={n} destaque={o.k === 'com'} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ParcelaPanel({ p, set, sem, com }: StepProps) {
  const n = Math.max(0, Math.round(p.antecipParcelas));
  const economia = sem.totalPagoHoje - com.totalPagoHoje;
  return (
    <>
      <dl className="explica">
        <div>
          <dt>Reajuste uma vez por ano</dt>
          <dd>A parcela e a carta sobem juntas pelo INCC, o índice da construção. Assim a carta acompanha o preço dos imóveis.</dd>
        </div>
        <div>
          <dt>O que é antecipar a taxa</dt>
          <dd>Você paga uma parte da taxa de administração logo nas primeiras parcelas. Em troca, a taxa total do plano fica menor.</dd>
        </div>
      </dl>
      <div className="grupo">
        <Toggle
          label="Antecipar a taxa de administração"
          hint={`Paga ${pctBR(p.antecipPctPorParcela)} da carta a mais ${n === 1 ? 'na 1ª parcela' : `nas ${n} primeiras`}.`}
          checked={p.antecipar}
          onChange={(v) => set('antecipar', v)}
        />
        {economia > 0 && (
          <p className="destaque">
            Antecipando, a taxa cai de {pctBR(sem.taxaAdmTotal * 100)} para {pctBR(com.taxaAdmTotal * 100)} e o plano custa{' '}
            <strong>{reais(economia)} a menos</strong>.
          </p>
        )}
        <p className="nota">Regra provisória da antecipação, a confirmar com a Ademicon.</p>
      </div>
    </>
  );
}

/* ================= 3. O tempo ================= */

function usePlay(mes: number, setMes: (m: number) => void, prazo: number) {
  const [tocando, setTocando] = useState(false);
  const raf = useRef(0);
  const ref = useRef({ mes, setMes });
  ref.current = { mes, setMes };
  useEffect(() => {
    if (!tocando) return;
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduz) {
      ref.current.setMes(prazo);
      setTocando(false);
      return;
    }
    let inicio = ref.current.mes >= prazo ? 1 : ref.current.mes;
    const t0 = performance.now();
    const dur = 6000 * ((prazo - inicio) / prazo) + 400;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      ref.current.setMes(Math.round(inicio + (prazo - inicio) * k));
      if (k < 1) raf.current = requestAnimationFrame(passo);
      else setTocando(false);
    };
    raf.current = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf.current);
      inicio = 0;
    };
  }, [tocando, prazo]);
  return [tocando, setTocando] as const;
}

export function TempoStage({ p, sim, mes, setMes }: StepProps) {
  const [visao, setVisao] = useState<'inicio' | 'plano'>('inicio');
  const ateInicio = Math.min(sim.prazo, Math.ceil((sim.contemplacao + 24) / 12) * 12);
  const zoomUtil = ateInicio < sim.prazo;
  const ate = visao === 'plano' || !zoomUtil || mes > ateInicio ? sim.prazo : ateInicio;
  const pago = sim.desembolsado[mes];
  const credito = sim.credito[mes];
  const contemplada = mes >= sim.contemplacao;
  const correcao = credito - p.valorCarta;

  return (
    <div className="st st--tempo">
      <div className="tempo__topo">
        <Carta
          compacta
          valor={credito}
          prazo={p.prazo}
          nota={
            <>
              <Num value={correcao} format={(v) => `+${reais(v)}`} /> de valorização
            </>
          }
          selo={contemplada ? 'Contemplada' : null}
        />
        <div className="tempo__nums">
          <div>
            <span>Você pagou até aqui</span>
            <Num className="big" value={pago} format={reais} />
          </div>
          <div>
            <span>Cada R$ 1 que você pagou vale na carta</span>
            <Num className="big big--green" value={pago > 0 ? credito / pago : 0} format={reaisCentavos} />
          </div>
        </div>
      </div>
      <div className="tempo__chart">
        <div className="tempo__legend">
          <span>
            <i className="lk lk--cred" />
            Quanto a sua carta vale
          </span>
          <span>
            <i className="lk lk--pago" />
            Quanto você já pagou
          </span>
          {zoomUtil && (
            <div className="seg-ctl seg-ctl--sm" role="radiogroup" aria-label="Período do gráfico">
              <button type="button" role="radio" aria-checked={ate !== sim.prazo} onClick={() => setVisao('inicio')} disabled={mes > ateInicio}>
                {ateInicio / 12} anos
              </button>
              <button type="button" role="radio" aria-checked={ate === sim.prazo} onClick={() => setVisao('plano')}>
                Plano inteiro
              </button>
            </div>
          )}
        </div>
        <TimeChart sim={sim} mes={mes} onMes={setMes} ate={ate} incc={p.incc} selic={p.selic} />
      </div>
    </div>
  );
}

export function TempoPanel({ p, set, sim, mes, setMes }: StepProps) {
  const [tocando, setTocando] = usePlay(mes, setMes, sim.prazo);
  const depois = mes > sim.contemplacao;
  return (
    <>
      <div className="mesbox">
        <div className="mesbox__mes">
          <Num value={mes} format={(v) => `Mês ${Math.round(v)}`} />
          <span>{duracao(mes)}</span>
        </div>
        <button type="button" className="play" onClick={() => setTocando(!tocando)} aria-pressed={tocando}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {tocando ? <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /> : <path d="M3 1.5v11L12.5 7z" fill="currentColor" />}
          </svg>
          {tocando ? 'Pausar' : 'Reproduzir'}
        </button>
      </div>
      <p className="frase">
        {depois
          ? `Depois da contemplação, o valor da carta passa a render pela Selic, ${pctBR(p.selic)} ao ano.`
          : `Até a contemplação, a carta se valoriza pelo INCC, ${pctBR(p.incc)} ao ano, sobre o valor inteiro dela.`}
      </p>
      <div className="grupo">
        <span className="grupo__t">Contemplação</span>
        <p className="nota">É quando você recebe a carta para comprar o imóvel, por sorteio ou por lance. O mês aqui é uma simulação.</p>
        <div className="stepper">
          <button type="button" aria-label="Contemplar um ano antes" onClick={() => set('mesContemplacao', Math.max(1, p.mesContemplacao - 12))}>
            −
          </button>
          <NumberField label="No mês" value={p.mesContemplacao} onChange={(v) => set('mesContemplacao', Math.round(v))} min={1} max={p.prazo} />
          <button type="button" aria-label="Contemplar um ano depois" onClick={() => set('mesContemplacao', Math.min(p.prazo, p.mesContemplacao + 12))}>
            +
          </button>
        </div>
      </div>
      {sim.mesCobreTaxas && <p className="nota">No mês {sim.mesCobreTaxas}, a correção da carta já cobre todas as taxas do plano.</p>}
      <p className="nota nota--dica">Arraste a bolinha no gráfico ou use as setas do teclado.</p>
    </>
  );
}

/* ================= 4. Compare ================= */

function MesSlider({ mes, setMes, sim }: { mes: number; setMes: (m: number) => void; sim: Simulacao }) {
  const pct = ((mes - 1) / Math.max(1, sim.prazo - 1)) * 100;
  const cpct = ((sim.contemplacao - 1) / Math.max(1, sim.prazo - 1)) * 100;
  return (
    <label className="mslider">
      <span className="mslider__t">
        No mês <strong>{mes}</strong> <span>({duracao(mes)})</span>
      </span>
      <span className="mslider__track" style={{ ['--p' as string]: `${pct}%`, ['--c' as string]: `${cpct}%` }}>
        <input
          type="range"
          min={1}
          max={sim.prazo}
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="Mês da comparação"
        />
      </span>
    </label>
  );
}

interface Linha {
  k: string;
  nome: string;
  total: number;
  destaque?: boolean;
  partes: { nome: string; v: number; cls: string; rotulo: string }[];
}

/** Barras deitadas: lê-se de cima para baixo, nome primeiro, depois o valor, depois a barra. */
function Barras({ linhas }: { linhas: Linha[] }) {
  const tip = useTip();
  const max = Math.max(...linhas.map((l) => l.total));
  return (
    <div className="hbars">
      {linhas.map((l) => (
        <div key={l.k} className={`hbar${l.destaque ? ' is-destaque' : ''}`}>
          <div className="hbar__top">
            <span className="hbar__nome">{l.nome}</span>
            <Num className="hbar__total" value={l.total} format={reais} />
          </div>
          <div className="hbar__track">
            <div className="hbar__fill" style={{ width: `${Math.max(2, (l.total / max) * 100)}%` }}>
              {l.partes.map((pt) => (
                <span
                  key={pt.nome}
                  className={`hbar__part ${pt.cls}`}
                  style={{ flexGrow: Math.max(0.0001, pt.v) }}
                  role="img"
                  aria-label={`${l.nome}: ${pt.rotulo}`}
                  {...tip(
                    <>
                      <strong>{pt.nome}</strong>
                      <span>{reais(pt.v)}</span>
                    </>,
                  )}
                />
              ))}
            </div>
          </div>
          <div className="hbar__leg">
            {l.partes.map((pt) => (
              <span key={pt.nome}>
                <i className={`dot ${pt.cls}`} />
                {pt.rotulo}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RendaFixaStage({ p, sim, mes, tipo }: StepProps & { tipo: 'cdb' | 'tesouro' }) {
  const curto = tipo === 'cdb' ? 'CDB' : 'Tesouro Selic';
  const taxa = tipo === 'cdb' ? sim.taxaCdb : p.tesouroSelic / 100;
  const b = baseDeCalculo(sim, mes, taxa, p.incc / 100, p.selic / 100);
  const pago = sim.desembolsado[mes];
  const gC = ganhoConsorcio(sim, p.valorCarta, mes);
  const gR = (tipo === 'cdb' ? sim.cdb[mes] : sim.tesouro[mes]) - pago;
  const dif = gC - gR;
  const linhas: Linha[] = [
    {
      k: 'c',
      nome: 'Consórcio',
      total: pago + Math.max(0, gC),
      destaque: true,
      partes: [
        { nome: 'Você pagou', v: pago, cls: 'is-pago', rotulo: `${reais(pago)} que você pagou` },
        { nome: 'Ganho da carta (correção menos taxas)', v: Math.max(0, gC), cls: 'is-ganho', rotulo: `${gC >= 0 ? '+' : '−'}${reais(Math.abs(gC))} de valorização, já sem as taxas` },
      ],
    },
    {
      k: 'r',
      nome: curto,
      total: pago + Math.max(0, gR),
      partes: [
        { nome: 'Você pagou', v: pago, cls: 'is-pago', rotulo: `${reais(pago)} que você pagou` },
        { nome: `Rendimento do ${curto}`, v: Math.max(0, gR), cls: 'is-outro', rotulo: `+${reais(gR)} de rendimento${p.descontarIR ? ', já sem imposto' : ''}` },
      ],
    },
  ];
  return (
    <div className="st st--cmp">
      <div className="cmp">
        <div>
          <p className="olho">
            Até o mês {mes} ({duracao(mes)}), pagando as mesmas parcelas
          </p>
          <p className="cmp__big">
            {dif >= 0 ? 'O consórcio rendeu' : `O ${curto} rendeu`} <Num className={dif >= 0 ? 'is-green' : 'is-red'} value={Math.abs(dif)} format={reais} /> a mais
          </p>
        </div>
        <Barras linhas={linhas} />
        <p className="porque">
          <b>Por que a diferença?</b> O {curto} só rende sobre o dinheiro que você já depositou, <span>{reais(b.baseRF)}</span>. A carta é corrigida sobre o valor total dela,{' '}
          <span>{reais(b.baseCarta)}</span>, mesmo que você ainda não tenha pago tudo.
        </p>
      </div>
    </div>
  );
}

function FinStage({ p, sim, fin }: StepProps) {
  const ops = [
    { k: 'c', nome: 'Consórcio', custo: sim.custoTaxasHoje, consorcio: true },
    { k: 's', nome: 'Financiamento SAC', custo: fin.sac.totalJuros, consorcio: false },
    { k: 'p', nome: 'Financiamento Price', custo: fin.price.totalJuros, consorcio: false },
  ];
  const linhas: Linha[] = ops.map((o) => ({
    k: o.k,
    nome: o.nome,
    total: p.valorCarta + o.custo,
    destaque: o.consorcio,
    partes: [
      { nome: 'Imóvel', v: p.valorCarta, cls: 'is-pago', rotulo: `${reais(p.valorCarta)} do imóvel` },
      {
        nome: o.consorcio ? 'Taxas do consórcio' : 'Juros do financiamento',
        v: o.custo,
        cls: o.consorcio ? 'is-custo' : 'is-outro',
        rotulo: `${reais(o.custo)} ${o.consorcio ? 'de taxas' : 'de juros'}`,
      },
    ],
  }));
  const eco = fin.sac.totalJuros - sim.custoTaxasHoje;
  return (
    <div className="st st--cmp">
      <div className="cmp">
        <div>
          <p className="olho">
            O mesmo imóvel de {reais(p.valorCarta)}, em {p.prazo} meses. Quanto sai no total:
          </p>
          <p className="cmp__big">
            {eco >= 0 ? 'No consórcio você economiza' : 'O financiamento sai'} <Num className={eco >= 0 ? 'is-green' : 'is-red'} value={Math.abs(eco)} format={reais} />
            {eco >= 0 ? '' : ' mais barato'}
          </p>
        </div>
        <Barras linhas={linhas} />
        <p className="porque">
          <b>Por que a diferença?</b> No financiamento você paga juros sobre o dinheiro emprestado. No consórcio não existe juros: você paga só as taxas da administradora.
        </p>
      </div>
    </div>
  );
}

export function CompareStage(props: StepProps) {
  if (props.comparar === 'financiamento') return <FinStage {...props} />;
  return <RendaFixaStage {...props} tipo={props.comparar} />;
}

export function ComparePanel(props: StepProps) {
  const { p, sim, fin, mes, setMes, comparar, setComparar } = props;
  const opcoes: { v: Comparar; t: string }[] = [
    { v: 'cdb', t: 'CDB' },
    { v: 'tesouro', t: 'Tesouro Selic' },
    { v: 'financiamento', t: 'Financiamento' },
  ];
  const taxa = comparar === 'cdb' ? sim.taxaCdb : p.tesouroSelic / 100;
  const b = baseDeCalculo(sim, mes, taxa, p.incc / 100, p.selic / 100);
  const vezes = b.vezes >= 10 ? Math.round(b.vezes).toString() : b.vezes.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const virada = comparar === 'cdb' ? mesVirada(sim, p.valorCarta) : null;
  const economiaSac = fin.sac.totalJuros - sim.custoTaxasHoje;

  return (
    <>
      <div className="seg-ctl" role="radiogroup" aria-label="Comparar com">
        {opcoes.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={comparar === o.v} onClick={() => setComparar(o.v)}>
            {o.t}
          </button>
        ))}
      </div>
      {comparar !== 'financiamento' ? (
        <>
          <p className="frase">Arraste para escolher o mês da comparação.</p>
          <MesSlider mes={mes} setMes={setMes} sim={sim} />
          {b.vezes > 1 && (
            <p className="destaque">
              Neste mês, a correção da carta é <strong>{vezes} vezes</strong> o que {comparar === 'cdb' ? 'o CDB' : 'o Tesouro'} renderia sobre o seu dinheiro.
            </p>
          )}
          {virada && <p className="nota">Se a carta não for usada, o CDB passa o consórcio no mês {virada}.</p>}
        </>
      ) : (
        <>
          <p className="frase">O mesmo imóvel, pago em consórcio ou financiado no banco.</p>
          {economiaSac > 0 && (
            <p className="destaque">
              O consórcio custa <strong>{reais(economiaSac)} a menos</strong> que o financiamento SAC.
            </p>
          )}
          <p className="nota">
            Financiamento com {pctBR(p.entradaFinanciamento)} de entrada e juros de {pctBR(p.jurosFinanciamento)} ao ano. Valores de hoje, sem seguros nem TR. No
            financiamento você mora desde o início; no consórcio, após a contemplação.
          </p>
        </>
      )}
    </>
  );
}

/* ================= 5. Resumo ================= */

export function ResumoStage({ p, sim, fin, mes, cliente }: StepProps) {
  const pago = sim.desembolsado[mes];
  const vsCdb = ganhoConsorcio(sim, p.valorCarta, mes) - (sim.cdb[mes] - pago);
  const vsSac = fin.sac.totalJuros - sim.custoTaxasHoje;
  const parcela = sim.parcela[p.antecipar ? Math.min(sim.prazo, p.antecipParcelas + 1) : 1];
  const sinal = (v: number) => (v >= 0 ? reais(v) : `−${reais(-v)}`);
  const stats: [string, string, string][] = [
    ['Carta de crédito', reais(p.valorCarta), `${p.prazo} meses`],
    ['Parcela', reaisCentavos(parcela), p.antecipar ? 'com antecipação da taxa' : 'por mês'],
    ['A mais que o CDB', sinal(vsCdb), `até o mês ${mes}`],
    ['Economia contra o SAC', sinal(vsSac), 'no plano inteiro'],
  ];
  return (
    <div className="st st--resumo">
      <article className="folha">
        <header className="folha__head">
          <div>
            <p className="folha__para">{cliente.trim() ? `Simulação para ${cliente.trim()}` : 'Sua simulação'}</p>
            <p className="folha__data">
              {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} · imóvel · contemplação no mês {sim.contemplacao}
            </p>
          </div>
          <span className="folha__marca">Raul Consórcio</span>
        </header>
        <div className="folha__hero">
          <div>
            <span>No mês {mes} ({duracao(mes)}), a sua carta vale</span>
            <strong className="is-red">{reais(sim.credito[mes])}</strong>
          </div>
          <div>
            <span>E você terá pago</span>
            <strong>{reais(pago)}</strong>
          </div>
        </div>
        <dl className="folha__stats">
          {stats.map(([k, v, sub]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
              <small>{sub}</small>
            </div>
          ))}
        </dl>
        <p className="folha__aviso">{AVISO}</p>
      </article>
    </div>
  );
}

export function ResumoPanel({ cliente, setCliente, gerarPdf }: StepProps) {
  return (
    <>
      <label className="field field--sm">
        <span className="field__label">Nome do cliente</span>
        <span className="field__box">
          <input className="field__input" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: Ana Souza" autoComplete="off" />
        </span>
      </label>
      <button type="button" className="btn btn--red btn--full" onClick={gerarPdf}>
        Gerar PDF
      </button>
      <p className="nota">Na janela de impressão, escolha Salvar como PDF.</p>
      <p className="aviso">{AVISO}</p>
    </>
  );
}

