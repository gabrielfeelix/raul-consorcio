'use client'

import { InicioRaul } from '@/components/inicio/InicioRaul'
import { InicioParceiro } from '@/components/inicio/InicioParceiro'
import { useLoja } from '@/lib/loja'

export default function Inicio() {
  const { sessao } = useLoja()
  return sessao?.papel === 'raul' ? <InicioRaul /> : <InicioParceiro />
}
