'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { abrirNovaIndicacao } from '@/components/acoes/Acoes'
import { useLoja } from '@/lib/loja'

/** Link direto antigo: abre o modal de nova indicação sobre a lista. */
export default function NovaIndicacao() {
  const router = useRouter()
  const { sessao } = useLoja()
  useEffect(() => {
    router.replace(sessao?.papel === 'parceiro' ? '/inicio' : '/indicacoes')
    const t = setTimeout(() => abrirNovaIndicacao(), 150)
    return () => clearTimeout(t)
  }, [router, sessao])
  return null
}
