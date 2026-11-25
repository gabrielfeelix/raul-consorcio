'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { cx } from '@/components/ds'
import { useLoja } from '@/lib/loja'
import { pagamentos } from '@/lib/regras'
import { NAV, itemAtivo, type ItemNav } from './navegacao'
import { Marca, Selo } from './Marca'
import { abrirNovaIndicacao } from '@/components/acoes/Acoes'

export function Sidebar() {
  const caminho = usePathname()
  const ativo = itemAtivo(caminho)
  const { sessao, dados } = useLoja()
  const [recolhida, setRecolhida] = useState(false)
  if (!sessao) return null

  const contagens = {
    novas: dados.indicacoes.filter((i) => i.etapa === 'nova').length,
    aPagar: pagamentos(dados).filter((p) => !p.pago).length,
  }

  const link = (item: ItemNav) => {
    const aceso = ativo === item.chave
    const Icone = item.icone
    const valor = sessao.papel === 'raul' && item.contagem ? contagens[item.contagem] : 0
    const classe = cx(
          'clicavel relative flex h-[38px] shrink-0 items-center gap-[11px] rounded-[10px] text-[14px]',
          recolhida ? 'mx-auto w-[42px] justify-center' : 'px-2.5',
          aceso ? 'bg-ink font-semibold text-on-ink' : 'font-medium text-soft hover:bg-sunken hover:text-ink',
        )
    const conteudo = (
      <>
        <Icone aria-hidden className={cx('h-[18px] w-[18px] shrink-0', aceso ? 'text-on-ink' : 'text-dim')} strokeWidth={1.8} />
        {!recolhida && <span className="truncate">{item.rotulo}</span>}
        {valor > 0 &&
          (recolhida ? (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-ink ring-2 ring-panel" />
          ) : (
            <span className={cx('ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold', aceso ? 'bg-on-ink/20 text-on-ink' : 'bg-sunken text-soft')}>
              {valor}
            </span>
          ))}
      </>
    )
    if (item.acao)
      return (
        <button key={item.chave} type="button" data-tour={item.tour} title={recolhida ? item.rotulo : undefined} onClick={() => abrirNovaIndicacao()} className={classe}>
          {conteudo}
        </button>
      )
    return (
      <Link key={item.chave} href={item.href} data-tour={item.tour} aria-current={aceso ? 'page' : undefined} title={recolhida ? item.rotulo : undefined} className={classe}>
        {conteudo}
      </Link>
    )
  }

  return (
    <aside className={cx('sticky top-3 m-3 mr-0 hidden h-[calc(100dvh-24px)] shrink-0 flex-col rounded-[20px] bg-panel py-4 shadow-ilha transition-[width] duration-300 ease-suave md:flex', recolhida ? 'w-[68px] px-2' : 'w-[248px] px-3')}>
      <div className={cx('mb-3 flex items-center gap-2', recolhida ? 'flex-col' : 'pl-1.5')}>
        <Link href="/inicio" className="min-w-0 rounded-lg">
          {recolhida ? <Selo /> : <Marca sub={sessao.papel === 'raul' ? 'Painel do Raul' : 'Programa de parceiros'} />}
        </Link>
        <button
          onClick={() => setRecolhida(!recolhida)}
          aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
          className={cx('clicavel flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-sunken hover:text-ink', !recolhida && 'ml-auto')}
        >
          <PanelLeft className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </button>
      </div>

      <nav aria-label="Seções" className="sem-barra flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV[sessao.papel].map((g, i) => (
          <div key={g.nome ?? i} className="flex flex-col gap-0.5">
            {g.nome && (recolhida ? <span className="mx-auto my-2.5 h-px w-6 bg-line" /> : <p className="px-2.5 pt-4 pb-1.5 text-[11.5px] font-medium text-faint">{g.nome}</p>)}
            {g.itens.map(link)}
          </div>
        ))}
      </nav>

    </aside>
  )
}
