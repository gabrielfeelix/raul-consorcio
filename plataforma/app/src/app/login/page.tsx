'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { cx } from '@/components/ds'
import { CascaAcesso, botaoAcesso, campoAcesso } from '@/components/acesso/CascaAcesso'
import { useLoja } from '@/lib/loja'
import type { Sessao } from '@/lib/tipos'

export default function Login() {
  const { dados, entrar } = useLoja()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState('')
  const [recuperar, setRecuperar] = useState(false)

  function ir(s: Sessao) {
    entrar(s)
    router.push('/inicio')
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const t = email.trim().toLowerCase()
    if (!t || !senha) return setErro('Informe o e-mail e a senha.')
    // Sem banco ainda: qualquer acesso entra. E-mail de parceiro cadastrado abre a visão dele; o resto, a do Raul.
    // O perfil pode ser trocado depois pelo menu do usuário.
    const p = dados.parceiros.find((x) => x.email.toLowerCase() === t)
    ir(p ? { papel: 'parceiro', parceiroId: p.id } : { papel: 'raul' })
  }

  return (
    <CascaAcesso
      titulo="Programa de parceiros Raul Consórcios"
      subtitulo="Indique quem você conhece, acompanhe cada etapa da negociação e saiba exatamente quando e quanto vai receber."
    >
      {recuperar ? (
        <div>
          <h2 className="font-title text-[24px] font-bold tracking-[-0.02em]">Recuperar senha</h2>
          <p className="mt-1 mb-6 text-[14px] text-dim">Enviaremos um link para criar uma nova senha no e-mail cadastrado.</p>
          <label htmlFor="email-rec" className="mb-1.5 block text-[13px] font-semibold text-soft">
            E-mail
          </label>
          <input id="email-rec" type="email" className={campoAcesso} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" />
          <button type="button" className={cx(botaoAcesso, 'mt-5')} onClick={() => setRecuperar(false)}>
            Enviar link
          </button>
          <button type="button" onClick={() => setRecuperar(false)} className="mt-4 w-full text-center text-[13px] font-medium text-dim hover:text-ink">
            Voltar para o login
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <h2 className="font-title text-[24px] font-bold tracking-[-0.02em]">Entrar</h2>
          <p className="mt-1 mb-6 text-[14px] text-dim">Use o e-mail cadastrado no convite.</p>

          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-soft">
            E-mail
          </label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className={cx(campoAcesso, 'mb-4')} />

          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="senha" className="block text-[13px] font-semibold text-soft">
              Senha
            </label>
            <button type="button" onClick={() => setRecuperar(true)} className="text-[13px] font-medium text-dim underline decoration-line underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink">
              Esqueci a senha
            </button>
          </div>
          <div className="relative">
            <input id="senha" type={mostrar ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" className={cx(campoAcesso, 'pr-20')} />
            <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg px-2.5 text-[13px] font-semibold text-dim transition-colors hover:bg-sunken hover:text-ink">
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {erro && (
            <p role="alert" className="entra-pop mt-3 flex items-start gap-2 rounded-[10px] bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              {erro}
            </p>
          )}

          <button type="submit" className={cx(botaoAcesso, 'mt-5')}>
            Entrar
          </button>

          <p className="mt-5 border-t border-line-soft pt-4 text-[12.5px] leading-snug text-dim">Ainda não tem acesso? O Raul envia o convite por e-mail ou WhatsApp quando você se torna parceiro.</p>
        </form>
      )}
    </CascaAcesso>
  )
}
