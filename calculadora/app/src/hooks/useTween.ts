import { useEffect, useRef, useState } from 'react';

const reduz = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Anima um número até o valor alvo (ease-out). Respeita prefers-reduced-motion. */
export function useTween(alvo: number, dur = 520): number {
  const [v, setV] = useState(alvo);
  const atual = useRef(alvo);
  useEffect(() => {
    if (reduz() || !Number.isFinite(alvo)) {
      atual.current = alvo;
      setV(alvo);
      return;
    }
    const de = atual.current;
    if (de === alvo) return;
    const t0 = performance.now();
    let raf = 0;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      atual.current = de + (alvo - de) * e;
      setV(atual.current);
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, dur]);
  return v;
}

export function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTam({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setTam({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, tam] as const;
}
