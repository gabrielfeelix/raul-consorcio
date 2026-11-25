'use client'

import { use } from 'react'
import { SearchX } from 'lucide-react'
import { BotaoLink, Card, Vazio } from '@/components/ds'
import { FichaRaul } from '@/components/indicacoes/FichaRaul'
import { FichaParceiro } from '@/components/indicacoes/FichaParceiro'
import { useLoja } from '@/lib/loja'

export default function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { dados, sessao } = useLoja()
  const ind = dados.indicacoes.find((i) => i.id === id)
  const permitido = ind && (sessao?.papel === 'raul' || ind.parceiroId === sessao?.parceiroId)

  if (!ind || !permitido) {
    return (
      <Card>
        <Vazio icone={<SearchX />} titulo="Indicação não encontrada" acao={<BotaoLink href="/indicacoes">Voltar</BotaoLink>} />
      </Card>
    )
  }
  return sessao?.papel === 'raul' ? <FichaRaul key={ind.id} ind={ind} /> : <FichaParceiro ind={ind} />
}
