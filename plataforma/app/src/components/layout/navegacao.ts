import { BarChart3, Gift, Home, KanbanSquare, Plus, Users, Wallet, ListChecks, type LucideIcon } from 'lucide-react'
import type { Papel } from '@/lib/tipos'

export interface ItemNav {
  chave: string
  rotulo: string
  href: string
  icone: LucideIcon
  tour?: string
  contagem?: 'novas' | 'aPagar'
  /** Abre um modal em vez de navegar. */
  acao?: 'nova-indicacao'
}

export const NAV: Record<Papel, { nome?: string; itens: ItemNav[] }[]> = {
  raul: [
    {
      itens: [
        { chave: 'inicio', rotulo: 'Início', href: '/inicio', icone: Home },
        { chave: 'indicacoes', rotulo: 'Indicações', href: '/indicacoes', icone: KanbanSquare, contagem: 'novas' },
        { chave: 'parceiros', rotulo: 'Parceiros', href: '/parceiros', icone: Users },
      ],
    },
    {
      nome: 'Financeiro',
      itens: [
        { chave: 'pagamentos', rotulo: 'Pagamentos', href: '/pagamentos', icone: Wallet, contagem: 'aPagar' },
        { chave: 'relatorios', rotulo: 'Relatórios', href: '/relatorios', icone: BarChart3 },
      ],
    },
    {
      nome: 'Programa',
      itens: [{ chave: 'premios', rotulo: 'Níveis e prêmios', href: '/premios', icone: Gift }],
    },
  ],
  parceiro: [
    {
      itens: [
        { chave: 'inicio', rotulo: 'Início', href: '/inicio', icone: Home, tour: 'nav-inicio' },
        { chave: 'nova', rotulo: 'Indicar alguém', href: '/indicacoes/nova', icone: Plus, tour: 'nav-indicar', acao: 'nova-indicacao' },
        { chave: 'indicacoes', rotulo: 'Minhas indicações', href: '/indicacoes', icone: ListChecks, tour: 'nav-indicacoes' },
        { chave: 'premios', rotulo: 'Níveis e prêmios', href: '/premios', icone: Gift, tour: 'nav-premios' },
      ],
    },
  ],
}

export function itemAtivo(caminho: string) {
  if (caminho.startsWith('/indicacoes/nova')) return 'nova'
  const seg = caminho.split('/')[1]
  return seg || 'inicio'
}
