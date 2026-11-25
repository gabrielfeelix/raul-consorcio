'use client'

import { Copy, Mail, MessageCircle } from 'lucide-react'
import { Botao } from '@/components/ds'
import { useAvisar } from '@/components/ds/Avisos'
import type { Parceiro } from '@/lib/tipos'
import { linkWhatsApp } from '@/lib/regras'

export function linkConvite(p: Parceiro) {
  return typeof window === 'undefined' ? `/convite/${p.convite}` : `${window.location.origin}/convite/${p.convite}`
}

export function textoConvite(p: Parceiro) {
  return `Oi, ${p.nome.split(' ')[0]}! Aqui é o Raul. Você agora faz parte do meu programa de parceiros: você indica quem conhece e recebe por cada contrato fechado. Crie sua senha por este link: ${linkConvite(p)}`
}

export function ConviteAcoes({ p }: { p: Parceiro }) {
  const avisar = useAvisar()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl bg-sunken p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-soft">{linkConvite(p)}</span>
        <Botao
          tamanho="sm"
          variante="secundario"
          onClick={() => {
            navigator.clipboard?.writeText(linkConvite(p))
            avisar('Link copiado')
          }}
        >
          <Copy /> Copiar
        </Botao>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <a href={linkWhatsApp(p.telefone, textoConvite(p))} target="_blank" rel="noreferrer" className="clicavel flex h-10 items-center justify-center gap-2 rounded-xl bg-whats-weak text-[13.5px] font-semibold text-whats hover:bg-whats-weak-2">
          <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
        </a>
        <button onClick={() => avisar(`Convite reenviado para ${p.email}`, { tipo: 'email' })} className="clicavel flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-[13.5px] font-semibold hover:bg-sunken">
          <Mail className="h-4 w-4" /> Reenviar e-mail
        </button>
      </div>
    </div>
  )
}

