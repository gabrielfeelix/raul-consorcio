import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { compararFinanciamento, simular, type Parametros } from './lib/consorcio';
import { PADRAO } from './lib/defaults';
import { reais, reaisCentavos } from './lib/format';
import { RatesPanel } from './components/RatesPanel';
import { PrintReport } from './components/PrintReport';
import { TipProvider } from './components/Tip';
import { AVISO } from './components/Aviso';
import {
  CartaPanel,
  CartaStage,
  ComparePanel,
  CompareStage,
  ParcelaPanel,
  ParcelaStage,
  ResumoPanel,
  ResumoStage,
  TempoPanel,
  TempoStage,
  type Comparar,
  type StepProps,
} from './steps/Steps';

const CHAVE = 'raul-calculadora-v1';

interface Passo {
  id: string;
  nome: string;
  titulo: string;
  frase: string;
  Stage: ComponentType<StepProps>;
  Panel: ComponentType<StepProps>;
}

const PASSOS: Passo[] = [
  { id: 'carta', nome: 'A carta', titulo: 'Quanto vale o seu imóvel?', frase: 'A carta de crédito é o valor que você recebe para comprar o imóvel.', Stage: CartaStage, Panel: CartaPanel },
  { id: 'parcela', nome: 'A parcela', titulo: 'Quanto você paga por mês', frase: 'A maior parte da parcela vira a sua carta. O resto são as taxas.', Stage: ParcelaStage, Panel: ParcelaPanel },
  { id: 'tempo', nome: 'O tempo', titulo: 'A carta cresce com o tempo', frase: 'Arraste a bolinha e compare o valor da carta com o que você pagou.', Stage: TempoStage, Panel: TempoPanel },
  { id: 'compare', nome: 'Compare', titulo: 'Com o mesmo dinheiro', frase: 'O que aconteceria se você fizesse outra coisa com as mesmas parcelas.', Stage: CompareStage, Panel: ComparePanel },
  { id: 'resumo', nome: 'Resumo', titulo: 'A sua simulação', frase: 'Os números principais, prontos para levar.', Stage: ResumoStage, Panel: ResumoPanel },
];

function carregar(): Parametros {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return { ...PADRAO, ...JSON.parse(salvo) };
  } catch {
    /* sem storage: usa o padrão */
  }
  return PADRAO;
}

const ehCampo = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  return el.closest('input, textarea, select, [role="slider"], [role="radiogroup"], .sheet') !== null;
};

export default function App() {
  const [p, setP] = useState<Parametros>(carregar);
  const [mes, setMesRaw] = useState(24);
  const [passo, setPasso] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [taxasAbertas, setTaxasAbertas] = useState(false);
  const [cliente, setCliente] = useState('');
  const [comparar, setComparar] = useState<Comparar>('financiamento');

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(p));
    } catch {
      /* ignora */
    }
  }, [p]);

  const set = useCallback(<K extends keyof Parametros>(k: K, v: Parametros[K]) => setP((old) => ({ ...old, [k]: v })), []);
  const sim = useMemo(() => simular(p), [p]);
  const sem = useMemo(() => simular(p, false), [p]);
  const com = useMemo(() => simular(p, true), [p]);
  const fin = useMemo(() => compararFinanciamento(p), [p]);
  const m = Math.min(Math.max(1, mes), sim.prazo);
  const setMes = useCallback((v: number) => setMesRaw(Math.round(v)), []);

  const ir = useCallback(
    (alvo: number) => {
      const n = Math.min(PASSOS.length - 1, Math.max(0, alvo));
      setDir(n >= passo ? 1 : -1);
      setPasso(n);
    },
    [passo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (taxasAbertas) {
        if (e.key === 'Escape') setTaxasAbertas(false);
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey || ehCampo(e.target)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        ir(passo + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        ir(passo - 1);
      } else if (/^[1-5]$/.test(e.key)) {
        ir(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [passo, ir, taxasAbertas]);

  const gerarPdf = () => window.print();
  const atual = PASSOS[passo];
  const props: StepProps = { p, set, setP, sim, sem, com, fin, mes: m, setMes, comparar, setComparar, cliente, setCliente, gerarPdf };
  const parcelaRef = p.antecipar ? sim.parcela[Math.min(sim.prazo, Math.round(p.antecipParcelas) + 1)] : sim.parcela[1];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <TipProvider>
      <div className="app">
        <header className="bar">
          <div className="marca">
            <span className="marca__nome">
              <span>
                <b>Raul</b> Consórcio
              </span>
            </span>
            <span className="marca__sub">Menos impulsividade. Mais estratégia.</span>
          </div>

          <nav className="passos" aria-label="Etapas da simulação">
            <ol>
              {PASSOS.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`passo${i === passo ? ' is-atual' : ''}${i < passo ? ' is-feito' : ''}`}
                    aria-current={i === passo ? 'step' : undefined}
                    onClick={() => ir(i)}
                  >
                    <span className="passo__n">{i + 1}</span>
                    <span className="passo__nome">{s.nome}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <button type="button" className="ajustar" onClick={() => setTaxasAbertas(true)} aria-haspopup="dialog">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h7M13 4h1M2 12h1M7 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="11" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="5" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Ajustar taxas</span>
          </button>
        </header>

        <main className="palco">
          <section className="stage" aria-label={atual.nome}>
            <div key={atual.id} className={`stage__in anim-${dir > 0 ? 'fwd' : 'back'}`}>
              <atual.Stage {...props} />
            </div>
            {!ultimo && <p className="stage__aviso">{AVISO}</p>}
          </section>

          <aside className="painel">
            <div key={atual.id} className={`painel__in anim-${dir > 0 ? 'fwd' : 'back'}`}>
              <p className="painel__n">
                {passo + 1} de {PASSOS.length}
              </p>
              <h1 className="painel__t">{atual.titulo}</h1>
              <p className="painel__frase">{atual.frase}</p>
              <div className="painel__corpo">
                <atual.Panel {...props} />
              </div>
            </div>

            {!ultimo && (
              <dl className="resumo-mini" aria-label="Resumo da simulação">
                <div>
                  <dt>Carta</dt>
                  <dd>{reais(p.valorCarta)}</dd>
                </div>
                <div>
                  <dt>Prazo</dt>
                  <dd>{p.prazo} meses</dd>
                </div>
                <div>
                  <dt>Parcela</dt>
                  <dd>{reaisCentavos(parcelaRef)}</dd>
                </div>
                <div>
                  <dt>Mês {m}</dt>
                  <dd className="is-red">{reais(sim.credito[m])}</dd>
                </div>
              </dl>
            )}

            <div className="nav">
              <button type="button" className="btn btn--ghost" onClick={() => ir(passo - 1)} disabled={passo === 0}>
                Voltar
              </button>
              {!ultimo ? (
                <button type="button" className="btn btn--primary" onClick={() => ir(passo + 1)}>
                  {PASSOS[passo + 1].nome}
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M5 2.5 9.5 7 5 11.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={() => ir(0)}>
                  Nova simulação
                </button>
              )}
            </div>
          </aside>
        </main>

        <div className={`sheet-bg${taxasAbertas ? ' is-open' : ''}`} onClick={() => setTaxasAbertas(false)} aria-hidden="true" />
        <div className={`sheet${taxasAbertas ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Ajustar taxas" aria-hidden={!taxasAbertas} {...(taxasAbertas ? {} : { inert: "" })}>
          <div className="sheet__head">
            <h2>Ajustar taxas</h2>
            <button type="button" className="sheet__x" onClick={() => setTaxasAbertas(false)} aria-label="Fechar">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="sheet__body">
            <RatesPanel p={p} set={set} onReset={() => setP(PADRAO)} />
          </div>
        </div>
      </div>

      <PrintReport p={p} sim={sim} sem={sem} com={com} fin={fin} mes={m} cliente={cliente} />
    </TipProvider>
  );
}
