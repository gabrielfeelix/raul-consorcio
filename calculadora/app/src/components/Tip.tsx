import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface TipState {
  x: number;
  y: number;
  content: ReactNode;
}

const Ctx = createContext<(s: TipState | null) => void>(() => {});

/** Balão flutuante único da página, que segue o ponteiro (mouse ou toque). */
export function TipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<TipState | null>(null);
  return (
    <Ctx.Provider value={setTip}>
      {children}
      {tip && (
        <div
          className="tip"
          role="tooltip"
          style={{
            left: Math.min(tip.x, window.innerWidth - 12),
            top: tip.y,
            transform: `translate(${tip.x > window.innerWidth - 220 ? '-100%' : tip.x < 120 ? '0' : '-50%'}, calc(-100% - 14px))`,
          }}
        >
          {tip.content}
        </div>
      )}
    </Ctx.Provider>
  );
}

/** Props para tornar qualquer elemento "explicável": hover, toque e foco mostram o balão. */
export function useTip() {
  const set = useContext(Ctx);
  const timer = useRef<number>(0);
  return useCallback(
    (content: ReactNode) => ({
      tabIndex: 0,
      onPointerEnter: (e: React.PointerEvent) => set({ x: e.clientX, y: e.clientY, content }),
      onPointerMove: (e: React.PointerEvent) => set({ x: e.clientX, y: e.clientY, content }),
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse') set(null);
      },
      onPointerDown: (e: React.PointerEvent) => {
        set({ x: e.clientX, y: e.clientY, content });
        window.clearTimeout(timer.current);
        if (e.pointerType !== 'mouse') timer.current = window.setTimeout(() => set(null), 2600);
      },
      onFocus: (e: React.FocusEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        set({ x: r.left + r.width / 2, y: r.top, content });
      },
      onBlur: () => set(null),
    }),
    [set],
  );
}
