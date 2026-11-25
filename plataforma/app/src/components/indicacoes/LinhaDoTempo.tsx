'use client'

import { ArrowRightLeft, Banknote, CheckCircle2, Eye, EyeOff, MessageCircle, PhoneMissed, Send, StickyNote, Users } from 'lucide-react'
import { cx } from '@/components/ds'
import type { Evento } from '@/lib/tipos'

const ICONES = {
  criada: Send,
  etapa: ArrowRightLeft,
  contato: MessageCircle,
  sem_resposta: PhoneMissed,
  nota: StickyNote,
  fechado: CheckCircle2,
  pago: Banknote,
} as const

const CANAL: Record<string, string> = { whatsapp: 'WhatsApp', ligacao: 'Ligação', email: 'E-mail', presencial: 'Presencial' }

export function LinhaDoTempo({ eventos, editavel, onAlternar }: { eventos: Evento[]; editavel?: boolean; onAlternar?: (id: string) => void }) {
  const lista = [...eventos].filter((e) => new Date(e.em) <= new Date()).sort((a, b) => b.em.localeCompare(a.em))
  return (
    <ol className="relative">
      {lista.map((e, k) => {
        const Icone = e.tipo === 'contato' && e.canal === 'presencial' ? Users : ICONES[e.tipo]
        return (
          <li key={e.id} className="group relative flex gap-3 pb-4">
            {k < lista.length - 1 && <span className="absolute top-8 left-[15px] h-[calc(100%-28px)] w-px bg-line" />}
            <span
              className={cx(
                'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                e.tipo === 'fechado' || e.tipo === 'pago' ? 'bg-ok-weak text-ok' : e.tipo === 'sem_resposta' ? 'bg-warn-weak text-warn' : e.tipo === 'nota' ? 'bg-sunken text-dim' : e.tipo === 'contato' ? 'bg-info-weak text-info' : 'bg-sunken text-soft',
              )}
            >
              <Icone className="h-[15px] w-[15px]" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[13.5px] text-ink">
                {e.texto}
                {e.canal && e.tipo !== 'contato' && <span className="text-dim"> · {CANAL[e.canal]}</span>}
              </p>
              <p className="text-[12px] text-faint">
                {new Date(e.em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '')}
                {editavel && !e.visivelParceiro && <span className="ml-1.5 text-faint">· só você vê</span>}
              </p>
            </div>
            {editavel && onAlternar && e.tipo !== 'criada' && (
              <button
                onClick={() => onAlternar(e.id)}
                title={e.visivelParceiro ? 'Parceiro vê. Clique para esconder.' : 'Só você vê. Clique para mostrar ao parceiro.'}
                className={cx('clicavel flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-sunken', e.visivelParceiro ? 'text-soft' : 'text-faint opacity-60')}
              >
                {e.visivelParceiro ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
