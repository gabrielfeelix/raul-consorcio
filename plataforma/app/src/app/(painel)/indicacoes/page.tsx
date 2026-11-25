'use client'

import { Suspense } from 'react'
import { Quadro } from '@/components/indicacoes/Quadro'
import { ListaParceiro } from '@/components/indicacoes/ListaParceiro'
import { useLoja } from '@/lib/loja'

export default function Indicacoes() {
  const { sessao } = useLoja()
  return sessao?.papel === 'raul' ? (
    <Suspense>
      <Quadro />
    </Suspense>
  ) : (
    <ListaParceiro />
  )
}
