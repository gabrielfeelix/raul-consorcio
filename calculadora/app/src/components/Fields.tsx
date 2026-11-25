import { useEffect, useId, useState } from 'react';
import { lerNumero } from '../lib/format';

const fmt = (v: number, casas: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas }).format(v);

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  casas?: number;
  min?: number;
  max?: number;
  hint?: string;
  size?: 'lg' | 'sm';
}

export function NumberField({ label, value, onChange, prefix, suffix, casas = 0, min = 0, max = Infinity, hint, size = 'sm' }: NumberFieldProps) {
  const id = useId();
  const [texto, setTexto] = useState(fmt(value, casas));
  const [foco, setFoco] = useState(false);

  useEffect(() => {
    if (!foco) setTexto(fmt(value, casas));
  }, [value, casas, foco]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <label className={`field field--${size}`} htmlFor={id}>
      <span className="field__label">{label}</span>
      <span className="field__box">
        {prefix && <span className="field__affix">{prefix}</span>}
        <input
          id={id}
          className="field__input"
          inputMode="decimal"
          autoComplete="off"
          value={texto}
          style={size === 'lg' ? { width: `${Math.max(2, texto.length) + 0.2}ch`, flex: 'none' } : undefined}
          onFocus={(e) => {
            setFoco(true);
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => {
            setTexto(e.target.value);
            const n = lerNumero(e.target.value);
            if (n !== null && n >= min && n <= max) onChange(n);
          }}
          onBlur={() => {
            setFoco(false);
            const n = lerNumero(texto);
            const final = n === null ? value : clamp(n);
            onChange(final);
            setTexto(fmt(final, casas));
          }}
        />
        {suffix && <span className="field__affix field__affix--suffix">{suffix}</span>}
      </span>
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}

export function Toggle({ label, checked, onChange, hint }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="toggle" onClick={() => onChange(!checked)}>
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__knob" />
      </span>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
    </button>
  );
}
