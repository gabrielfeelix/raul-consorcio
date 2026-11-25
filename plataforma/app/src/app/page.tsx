'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLoja } from '@/lib/loja'

export default function Raiz() {
  const { pronto, sessao } = useLoja()
  const router = useRouter()
  useEffect(() => {
    if (pronto) router.replace(sessao ? '/inicio' : '/login')
  }, [pronto, sessao, router])
  return <div className="min-h-dvh bg-canvas" />
}
