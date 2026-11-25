import { useTween } from '../hooks/useTween';

/** Número que anima entre valores. */
export function Num({ value, format, className }: { value: number; format: (v: number) => string; className?: string }) {
  const v = useTween(value);
  return <span className={className}>{format(v)}</span>;
}
