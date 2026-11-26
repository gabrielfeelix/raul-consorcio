'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header, BarraCelular } from '@/components/layout/Header'
import { Tour } from '@/components/Tour'
import { useLoja } from '@/lib/loja'
import { AcoesGlobais } from '@/components/acoes/Acoes'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { pronto, sessao } = useLoja()
  const router = useRouter()

  useEffect(() => {
    if (pronto && !sessao) router.replace('/login')
  }, [pronto, sessao, router])

  if (!pronto || !sessao) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <span className="esqueleto h-10 w-10 rounded-[12px]" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-canvas md:h-dvh md:overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
        <div className="hidden px-5 pt-3 md:block lg:px-6">
          <Header />
        </div>
        <BarraCelular />
        <main className="rolagem-fina min-w-0 flex-1 px-3 pt-[76px] pb-[96px] text-ink md:overflow-y-auto md:px-5 md:pt-2 md:pb-8 lg:px-6">
          <div className="entra-pagina mx-auto w-full max-w-[1400px] [&_.grid>*]:min-w-0">{children}</div>
        </main>
      </div>
      <AcoesGlobais />
      {sessao.papel === 'parceiro' && <Tour />}
    </div>
  )
}
