'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Botao, Modal } from '@/components/ds'
import { InsigniaNivel } from '@/components/niveis/Insignia'
import { useLoja } from '@/lib/loja'
import type { Nivel, Parceiro } from '@/lib/tipos'
import { fechouContrato, nivelPorFechadas, primeiroNome, reais } from '@/lib/regras'

const CHAVE = (id: string) => `rc-nivel-comemorado-${id}`

/**
 * Momento de conquista: quando o contrato mais recente (últimos 21 dias) fez o parceiro subir de nível,
 * mostra uma vez só a nova insígnia e o que muda. Contido, sem confete.
 */
export function NovoNivel({ parceiro }: { parceiro: Parceiro }) {
  const { dados } = useLoja()
  const router = useRouter()
  const [nivel, setNivel] = useState<{ novo: Nivel; antigo: Nivel } | null>(null)

  useEffect(() => {
    const fechadas = dados.indicacoes.filter((i) => i.parceiroId === parceiro.id && fechouContrato(i) && i.fechadoEm).sort((a, b) => b.fechadoEm!.localeCompare(a.fechadoEm!))
    const ultima = fechadas[0]
    if (!ultima || Date.now() - new Date(ultima.fechadoEm!).getTime() > 21 * 86_400_000) return
    const novo = nivelPorFechadas(dados.niveis, fechadas.length)
    const antigo = nivelPorFechadas(dados.niveis, fechadas.length - 1)
    if (novo.id === antigo.id) return
    try {
      if (localStorage.getItem(CHAVE(parceiro.id)) === novo.id) return
    } catch {}
    const t = setTimeout(() => setNivel({ novo, antigo }), 700)
    return () => clearTimeout(t)
  }, [dados, parceiro.id])

  function fechar() {
    try {
      if (nivel) localStorage.setItem(CHAVE(parceiro.id), nivel.novo.id)
    } catch {}
    setNivel(null)
  }

  if (!nivel) return null
  const { novo, antigo } = nivel
  const novidades = [
    novo.valorFixo > antigo.valorFixo || novo.valorPor100k > antigo.valorPor100k ? `Comissão de ${reais(novo.valorFixo)} + ${reais(novo.valorPor100k)} a cada R$ 100 mil` : null,
    novo.mesmoMes && !antigo.mesmoMes ? 'Você recebe no mesmo mês do fechamento' : !novo.mesmoMes && novo.prazoDias < antigo.prazoDias ? `Recebe em ${novo.prazoDias} dias após o fechamento` : null,
    ...novo.premios.filter((p) => !antigo.premios.includes(p)),
  ]
    .filter(Boolean)
    .filter((t, k, l) => !(novo.mesmoMes && /mesmo m[eê]s/i.test(t as string) && l.findIndex((x) => /mesmo m[eê]s/i.test(x as string)) !== k)) as string[]

  return (
    <Modal aberto onFechar={fechar} titulo="" largura={420}>
      <div className="flex flex-col items-center pb-1 text-center">
        <div className="relative mt-1">
          <span className="anel absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${novo.cor}` }} />
          <InsigniaNivel nivel={novo} niveis={dados.niveis} tamanho={96} className="sobe-nivel relative" />
        </div>
        <p className="mt-5 text-[13px] font-medium text-dim">Novo nível, {primeiroNome(parceiro.nome)}</p>
        <h2 className="mt-1 font-title text-[28px] leading-tight font-bold tracking-[-0.02em]">Você chegou ao {novo.nome}</h2>
        <p className="mt-2 max-w-[32ch] text-[14px] text-dim">Seu último contrato fechado fez você subir do {antigo.nome}. A partir de agora:</p>
        <ul className="mt-4 flex w-full flex-col gap-2 text-left">
          {novidades.map((n) => (
            <li key={n} className="flex items-center gap-2.5 rounded-xl bg-sunken px-3.5 py-2.5 text-[13.5px] text-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: novo.cor }} />
              {n}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
          <Botao
            variante="secundario"
            className="flex-1"
            onClick={() => {
              fechar()
              router.push('/premios')
            }}
          >
            Ver níveis e prêmios
          </Botao>
          <Botao className="flex-1" onClick={fechar}>
            Continuar
          </Botao>
        </div>
      </div>
    </Modal>
  )
}
