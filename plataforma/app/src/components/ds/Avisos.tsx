'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'

type Opcoes = { acao?: { rotulo: string; fn: () => void }; tipo?: 'ok' | 'email' }
type Aviso = { id: number; texto: string } & Opcoes
const Ctx = createContext<(texto: string, opcoes?: Opcoes) => void>(() => {})

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const tirar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), [])
  const avisar = useCallback(
    (texto: string, opcoes?: Opcoes) => {
      const id = Date.now() + Math.random()
      setAvisos((a) => [...a.slice(-2), { id, texto, ...opcoes }])
      setTimeout(() => tirar(id), opcoes?.acao ? 6500 : 3400)
    },
    [tirar],
  )
  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-24 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end md:bottom-5">
        {avisos.map((a) => (
          <div key={a.id} className="entra-pop pointer-events-auto flex max-w-full items-center gap-2.5 rounded-[12px] border border-line bg-panel py-2.5 pr-2.5 pl-4 text-[13.5px] font-medium text-ink shadow-pop">
            {a.tipo === 'email' ? <Mail className="h-[17px] w-[17px] shrink-0 text-dim" /> : <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-ok" />}
            <span className="min-w-0 py-0.5 pr-1.5">{a.texto}</span>
            {a.acao && (
              <button
                onClick={() => {
                  a.acao!.fn()
                  tirar(a.id)
                }}
                className="clicavel h-8 shrink-0 rounded-[9px] bg-sunken px-3 text-[13px] font-semibold text-ink hover:bg-sunken-2"
              >
                {a.acao.rotulo}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useAvisar = () => useContext(Ctx)
