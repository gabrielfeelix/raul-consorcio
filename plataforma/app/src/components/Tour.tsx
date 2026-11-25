'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Botao, cx, Portal } from '@/components/ds'
import { useLoja, useParceiroAtual } from '@/lib/loja'
import { niveisOrdenados } from '@/lib/regras'
import { Selo } from './layout/Marca'

interface Passo {
  alvo?: string
  titulo: string
  texto: string
}

/**
 * Onboarding guiado do parceiro. O Raul conduz o primeiro acesso ao vivo e o passo a passo acompanha;
 * depois o parceiro pode rever pelo menu ("Rever o onboarding").
 */
export function Tour() {
  const { dados, marcarTourVisto } = useLoja()
  const parceiro = useParceiroAtual()
  const caminho = usePathname()
  const router = useRouter()
  const [ativo, setAtivo] = useState(false)
  const [i, setI] = useState(0)
  const [ret, setRet] = useState<DOMRect | null>(null)

  const niveis = niveisOrdenados(dados.niveis)
  const passos: Passo[] = [
    {
      titulo: `Bem-vindo, ${parceiro?.nome.split(' ')[0] ?? ''}`,
      texto: 'Todo cliente do Raul pode ser parceiro: você indica quem conhece, o Raul conduz a conversa e você recebe quando o contrato fecha. Em seis passos, veja onde fica cada coisa.',
    },
    { alvo: 'btn-indicar', titulo: 'Indicar leva cerca de 1 minuto', texto: 'Basta o nome, o telefone e quem é a pessoa: “meu pai”, “cunhado, quer sair do aluguel”. Quanto mais contexto, melhor o Raul conduz a conversa.' },
    {
      alvo: 'card-nivel',
      titulo: 'Seu nível',
      texto: `Você começa no ${niveis[0]?.nome} e sobe a cada contrato fechado: ${niveis.map((n) => n.nome).join(' → ')}. Quanto mais alto, maior a comissão e mais rápido você recebe.`,
    },
    { alvo: 'card-receber', titulo: 'Quando e quanto você recebe', texto: 'Quando o contrato fecha, a comissão aparece aqui com valor e data. A data é o dia do fechamento mais o prazo do seu nível.' },
    { alvo: 'lista-indicacoes', titulo: 'Acompanhe cada indicação', texto: 'O Raul atualiza as etapas e você acompanha: se ele já fez contato, se a pessoa respondeu, se está em negociação ou se fechou.' },
    { alvo: 'notificacoes', titulo: 'Atualizações', texto: 'Cada avanço das suas indicações aparece aqui. Você também recebe um e-mail a cada mudança relevante.' },
    { alvo: 'nav-premios', titulo: 'Níveis e prêmios', texto: 'Todos os níveis, o que cada um paga e os prêmios. Você pode rever este onboarding a qualquer momento pelo menu com o seu nome.' },
  ]
  const passo = passos[i]

  const iniciar = useCallback(() => {
    if (caminho !== '/inicio') router.push('/inicio')
    setI(0)
    setAtivo(true)
  }, [caminho, router])

  useEffect(() => {
    const h = () => iniciar()
    window.addEventListener('rc-tour', h)
    return () => window.removeEventListener('rc-tour', h)
  }, [iniciar])

  useEffect(() => {
    if (parceiro && !parceiro.viuTour && caminho === '/inicio') {
      const t = setTimeout(() => setAtivo(true), 600)
      return () => clearTimeout(t)
    }
  }, [parceiro, caminho])

  const medir = useCallback(() => {
    if (!passo?.alvo) return setRet(null)
    const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${passo.alvo}"]`)).find((e) => e.offsetParent !== null)
    if (!el) return setRet(null)
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => setRet(el.getBoundingClientRect()), 320)
  }, [passo])

  useLayoutEffect(() => {
    if (!ativo) return
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [ativo, i, medir])

  function fechar() {
    setAtivo(false)
    if (parceiro) marcarTourVisto(parceiro.id)
  }

  if (!ativo || !passo) return null

  const pad = 8
  const largura = 340
  let estiloBalao: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  if (ret) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const direita = ret.right + 16 + largura < vw
    if (ret.width < 300 && direita) {
      estiloBalao = { left: ret.right + 16, top: Math.min(Math.max(12, ret.top), vh - 260) }
    } else if (ret.bottom + 240 < vh) {
      estiloBalao = { left: Math.min(Math.max(12, ret.left), vw - largura - 12), top: ret.bottom + 14 }
    } else {
      estiloBalao = { left: Math.min(Math.max(12, ret.left), vw - largura - 12), top: Math.max(12, ret.top - 240) }
    }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-[85]">
      {ret ? (
        <div
          className="pointer-events-none absolute rounded-2xl transition-all duration-300 ease-suave"
          style={{ left: ret.left - pad, top: ret.top - pad, width: ret.width + pad * 2, height: ret.height + pad * 2, boxShadow: '0 0 0 9999px rgb(10 10 12 / 0.55), 0 0 0 2px rgb(255 255 255 / 0.9)' }}
        />
      ) : (
        <div className="entra-fundo absolute inset-0 bg-[rgb(10_10_12/0.55)]" />
      )}
      <div key={i} className="entra-pop absolute w-[340px] max-w-[calc(100vw-24px)] rounded-3xl bg-panel p-5 shadow-modal" style={estiloBalao}>
        <div className="mb-3 flex items-center gap-2.5">
          {!passo.alvo && <Selo tamanho={30} />}
          <span className="font-mono text-[11.5px] font-semibold text-faint">
            {i + 1} de {passos.length}
          </span>
          <button onClick={fechar} aria-label="Fechar onboarding" className="clicavel ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-sunken hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-title text-[18px] font-bold tracking-[-0.01em] text-ink">{passo.titulo}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-soft">{passo.texto}</p>
        <div className="mt-4 flex items-center gap-1.5">
          {passos.map((_, k) => (
            <span key={k} className={cx('h-1.5 rounded-full transition-all duration-300', k === i ? 'w-5 bg-ink' : 'w-1.5 bg-line')} />
          ))}
          <div className="ml-auto flex gap-1.5">
            {i > 0 && (
              <Botao variante="fantasma" tamanho="sm" onClick={() => setI(i - 1)} aria-label="Voltar">
                <ArrowLeft />
              </Botao>
            )}
            {i < passos.length - 1 ? (
              <Botao tamanho="sm" onClick={() => setI(i + 1)}>
                {i === 0 ? 'Começar' : 'Próximo'} <ArrowRight />
              </Botao>
            ) : (
              <Botao variante="primario" tamanho="sm" onClick={fechar}>
                Entendi
              </Botao>
            )}
          </div>
        </div>
      </div>
    </div>
    </Portal>
  )
}
