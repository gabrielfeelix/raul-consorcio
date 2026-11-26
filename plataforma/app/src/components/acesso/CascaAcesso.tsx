import type { ReactNode } from 'react'
import { Selo } from '@/components/layout/Marca'
import { FundoAcesso } from './FundoAcesso'

/** Casca das telas de acesso (login e convite): fundo de cartas de crédito + cartão branco flutuante. */
export function CascaAcesso({ titulo, subtitulo, children, rodape }: { titulo: ReactNode; subtitulo: ReactNode; children: ReactNode; rodape?: ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#0e0f11] text-white">
      <FundoAcesso />
      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1180px] gap-8 px-4 pt-6 pb-10 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-16 lg:px-12 lg:py-10">
        <div className="flex flex-col lg:h-full lg:py-4">
          <div className="flex items-center gap-3">
            <Selo tamanho={38} className="text-white" />
            <div>
              <p className="font-title text-[16px] leading-tight tracking-[-0.01em]"><span className="font-semibold">Raul</span> Consórcio</p>
              <p className="text-[12px] text-white/50">Planejamento patrimonial</p>
            </div>
          </div>
          <div className="mt-8 lg:mt-auto lg:mb-auto">
            <h1 className="max-w-[16ch] font-title text-[28px] leading-[1.08] font-bold tracking-[-0.025em] sm:text-[38px] lg:text-[48px]">{titulo}</h1>
            <p className="mt-3 max-w-[46ch] text-[14px] sm:mt-4 sm:text-[14.5px] leading-relaxed text-white/60 lg:text-[15.5px]">{subtitulo}</p>
          </div>
        </div>

        <div className="w-full lg:justify-self-end">
          <div
            className="entra-pop w-full rounded-[14px] bg-panel p-6 text-ink sm:p-8"
            style={{ boxShadow: '0 0 0 1px rgb(255 255 255 / 0.06), 0 40px 80px -30px rgb(0 0 0 / 0.85)' }}
          >
            {children}
          </div>
          {rodape}
        </div>
      </div>
    </div>
  )
}

export const campoAcesso =
  'h-11 w-full rounded-[9px] border border-line bg-panel px-3.5 text-[14.5px] text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint hover:border-faint/60 focus:border-ink focus:shadow-[0_0_0_3px_rgb(17_17_17/0.08)]'

export const botaoAcesso =
  'clicavel flex h-[46px] w-full items-center justify-center gap-2 rounded-[9px] bg-brand text-[15px] font-semibold text-white hover:bg-brand-press disabled:opacity-60'
