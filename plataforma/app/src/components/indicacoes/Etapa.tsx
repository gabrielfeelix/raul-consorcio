import { Check } from 'lucide-react'
import { cx, Pilula } from '@/components/ds'
import type { Etapa } from '@/lib/tipos'
import { ETAPA_POR_ID, TRILHA_PARCEIRO } from '@/lib/regras'

export const TOM_ETAPA: Record<Etapa, 'neutro' | 'ok' | 'aviso' | 'perigo' | 'escuro' | 'marca' | 'info'> = {
  nova: 'marca',
  contato: 'info',
  sem_resposta: 'aviso',
  negociacao: 'escuro',
  fechado: 'ok',
  pago: 'ok',
  perdido: 'neutro',
}

export function EtapaPilula({ etapa }: { etapa: Etapa }) {
  return <Pilula tom={TOM_ETAPA[etapa]}>{ETAPA_POR_ID[etapa].rotulo}</Pilula>
}

export function EtapaParceiro({ etapa }: { etapa: Etapa }) {
  return <Pilula tom={TOM_ETAPA[etapa]}>{ETAPA_POR_ID[etapa].rotuloParceiro}</Pilula>
}

/** Passo a passo que o parceiro vê: Recebida → Raul fez contato → Negociação → Contrato fechado → Comissão recebida. */
export function PassosParceiro({ etapa, className, rotulos = false }: { etapa: Etapa; className?: string; rotulos?: boolean }) {
  const pos = etapa === 'sem_resposta' ? 1 : etapa === 'perdido' ? -1 : TRILHA_PARCEIRO.indexOf(etapa)
  return (
    <div className={cx('flex items-start gap-1', className)}>
      {TRILHA_PARCEIRO.map((e, k) => {
        const feito = pos >= 0 && k <= pos
        return (
          <div key={e} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="block h-1 overflow-hidden rounded-full bg-sunken-2">
              {feito && <span className={cx('cresce-x block h-full rounded-full', etapa === 'sem_resposta' && k === pos ? 'bg-warn' : k >= 3 ? 'bg-ok' : 'bg-ink')} style={{ animationDelay: `${k * 90}ms` }} />}
            </span>
            {rotulos && (
              <span className={cx('hidden min-w-0 items-center gap-1 text-[11.5px] leading-tight sm:flex', feito ? 'font-medium text-ink' : 'text-faint')}>
                {feito && k < pos && <Check className="h-3 w-3" />}
                <span className="truncate">{ETAPA_POR_ID[e].rotuloParceiro}</span>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
