'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { cx, Marcador } from '@/components/ds'
import { CascaAcesso, botaoAcesso, campoAcesso } from '@/components/acesso/CascaAcesso'
import { useLoja } from '@/lib/loja'
import { niveisOrdenados } from '@/lib/regras'

export default function Convite({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params)
  const { dados, pronto, ativarParceiro, entrar } = useLoja()
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [conf, setConf] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState('')
  const parceiro = dados.parceiros.find((p) => p.convite === codigo)

  if (!pronto) return <div className="min-h-dvh bg-[#0e0f11]" />

  if (!parceiro) {
    return (
      <CascaAcesso titulo="Convite não encontrado" subtitulo="O link pode ter expirado ou já ter sido usado.">
        <h2 className="font-title text-[22px] font-bold tracking-[-0.02em]">Link inválido</h2>
        <p className="mt-2 text-[14px] text-dim">Solicite ao Raul um novo convite. Se você já criou sua senha, entre pela tela de login.</p>
        <button type="button" onClick={() => router.push('/login')} className={cx(botaoAcesso, 'mt-6')}>
          Ir para o login
        </button>
      </CascaAcesso>
    )
  }

  function criar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== conf) return setErro('As senhas não conferem.')
    if (!aceite) return setErro('Para continuar, aceite as regras do programa e o aviso de privacidade.')
    const p = ativarParceiro(codigo)
    if (!p) return
    entrar({ papel: 'parceiro', parceiroId: p.id })
    router.push('/inicio')
  }

  const niveis = niveisOrdenados(dados.niveis)
  const primeiro = parceiro.nome.split(' ')[0]

  return (
    <CascaAcesso
      titulo={
        <>
          {primeiro}, <span className="whitespace-nowrap">boas-vindas</span> ao programa de parceiros
        </>
      }
      subtitulo={
        <>
          Como cliente do Raul, você pode indicar pessoas e receber comissão por contrato fechado. Os níveis vão de {niveis[0]?.nome} a {niveis[niveis.length - 1]?.nome}: quanto mais contratos, maior a comissão e mais rápido o pagamento.
        </>
      }
    >
      <form onSubmit={criar} noValidate>
        <p className="text-[12.5px] font-medium text-dim">Convite de Raul Carvalho</p>
        <h2 className="mt-1 font-title text-[24px] font-bold tracking-[-0.02em]">Crie sua senha</h2>
        <p className="mt-1 mb-6 text-[14px] text-dim">
          Seu acesso: <span className="font-medium text-ink">{parceiro.email}</span>
        </p>

        <label htmlFor="senha" className="mb-1.5 block text-[13px] font-semibold text-soft">
          Senha
        </label>
        <div className="relative mb-4">
          <input id="senha" type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Pelo menos 6 caracteres" className={cx(campoAcesso, 'pr-20')} />
          <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg px-2.5 text-[13px] font-semibold text-dim transition-colors hover:bg-sunken hover:text-ink">
            {mostrar ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <label htmlFor="conf" className="mb-1.5 block text-[13px] font-semibold text-soft">
          Confirme a senha
        </label>
        <input id="conf" type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} className={campoAcesso} />

        <Marcador marcado={aceite} onChange={setAceite} className="mt-5 leading-snug">
          Li e aceito as regras do programa e o aviso de privacidade. Só indico pessoas que autorizaram o contato do Raul.
        </Marcador>

        {erro && (
          <p role="alert" className="entra-pop mt-4 flex items-start gap-2 rounded-[8px] bg-danger-weak px-3 py-2 text-[13px] font-medium text-danger">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" />
            {erro}
          </p>
        )}

        <button type="submit" className={cx(botaoAcesso, 'mt-6')}>
          Criar acesso
        </button>
      </form>
    </CascaAcesso>
  )
}
