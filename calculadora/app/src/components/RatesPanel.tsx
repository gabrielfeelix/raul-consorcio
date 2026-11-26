import type { Parametros } from '../lib/consorcio';
import { NumberField, Toggle } from './Fields';

interface Props {
  p: Parametros;
  set: <K extends keyof Parametros>(k: K, v: Parametros[K]) => void;
  onReset: () => void;
}

export function RatesPanel({ p, set, onReset }: Props) {
  return (
    <div className="rates" id="ajustar-taxas">
      <div className="rates__head">
        <p className="rates__note">
          Valores padrão estimados para novembro de 2026. Confira Selic, CDI e juros do financiamento no dia da conversa e edite aqui.
        </p>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
          Restaurar padrões
        </button>
      </div>

      <div className="rates__grid">
        <fieldset className="rates__group">
          <legend>Consórcio</legend>
          <NumberField label="Fundo de reserva" value={p.fundoReserva} onChange={(v) => set('fundoReserva', v)} suffix="%" casas={2} max={10} />
          <Toggle label="Incluir seguro" checked={p.seguroAtivo} onChange={(v) => set('seguroAtivo', v)} hint="Sobre o saldo devedor" />
          {p.seguroAtivo && (
            <NumberField label="Seguro ao mês" value={p.seguroPctMes} onChange={(v) => set('seguroPctMes', v)} suffix="% a.m." casas={4} max={1} />
          )}
          <div className="segmented" role="radiogroup" aria-label="Reajuste da carta e da parcela">
            <span className="field__label">Reajuste</span>
            <div className="segmented__row">
              {(['anual', 'mensal'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={p.reajuste === m} className="segmented__opt" onClick={() => set('reajuste', m)}>
                  {m === 'anual' ? 'Anual' : 'Mensal'}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="rates__group">
          <legend>Correção da carta</legend>
          <NumberField label="INCC, corrige carta e parcelas" value={p.incc} onChange={(v) => set('incc', v)} suffix="% a.a." casas={2} max={50} />
        </fieldset>

        <fieldset className="rates__group">
          <legend>Renda fixa</legend>
          <NumberField label="CDI" value={p.cdi} onChange={(v) => set('cdi', v)} suffix="% a.a." casas={2} max={50} />
          <NumberField label="CDB rende" value={p.cdbPctCdi} onChange={(v) => set('cdbPctCdi', v)} suffix="% do CDI" casas={1} max={200} />
          <NumberField label="Tesouro Selic" value={p.tesouroSelic} onChange={(v) => set('tesouroSelic', v)} suffix="% a.a." casas={2} max={50} />
          <Toggle label="Descontar IR" checked={p.descontarIR} onChange={(v) => set('descontarIR', v)} hint="Tabela regressiva, 22,5% a 15%" />
        </fieldset>

        <fieldset className="rates__group">
          <legend>Financiamento</legend>
          <NumberField label="Juros" value={p.jurosFinanciamento} onChange={(v) => set('jurosFinanciamento', v)} suffix="% a.a." casas={2} max={50} />
          <NumberField label="Entrada" value={p.entradaFinanciamento} onChange={(v) => set('entradaFinanciamento', v)} suffix="%" casas={1} max={90} />
        </fieldset>

        <fieldset className="rates__group">
          <legend>Antecipação da taxa</legend>
          <NumberField label="Antecipa em cada parcela" value={p.antecipPctPorParcela} onChange={(v) => set('antecipPctPorParcela', v)} suffix="% da carta" casas={2} max={10} />
          <NumberField label="Parcelas antecipadas" value={p.antecipParcelas} onChange={(v) => set('antecipParcelas', Math.round(v))} suffix="parcelas" max={12} />
          <NumberField label="Taxa total com antecipação" value={p.antecipTaxaResultante} onChange={(v) => set('antecipTaxaResultante', v)} suffix="%" casas={2} max={50} />
          <p className="rates__warn">Regra provisória. Validar com uma simulação real da Ademicon.</p>
        </fieldset>
      </div>
    </div>
  );
}
