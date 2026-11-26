'use client'

/**
 * Ações de criação abertas em modal, de qualquer tela (dashboard, quadro, parceiro, paleta, menu).
 * Qualquer componente dispara com abrirNovaIndicacao() / abrirNovoParceiro().
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Globe, Send, UserPlus } from 'lucide-react'
import { Avatar, Botao, Campo, cx, Marcador, Modal, Selecao } from '@/components/ds'
import { useAvisar } from '@/components/ds/Avisos'
import { ConviteAcoes } from '@/components/parceiros/Convite'
import { useLoja, useParceiroAtual } from '@/lib/loja'
import type { Genero, Parceiro, TipoBem } from '@/lib/tipos'
import { formatarTelefone, nivelDoParceiro, primeiroNome, soDigitos, TIPOS_BEM } from '@/lib/regras'

type Detalhe = { tipo: 'nova-indicacao' | 'novo-parceiro'; parceiroId?: string }

export function abrirNovaIndicacao(parceiroId?: string) {
  window.dispatchEvent(new CustomEvent<Detalhe>('rc-acao', { detail: { tipo: 'nova-indicacao', parceiroId } }))
}
export function abrirNovoParceiro() {
  window.dispatchEvent(new CustomEvent<Detalhe>('rc-acao', { detail: { tipo: 'novo-parceiro' } }))
}

export function AcoesGlobais() {
  const [aberta, setAberta] = useState<Detalhe | null>(null)
  useEffect(() => {
    const h = (e: Event) => setAberta((e as CustomEvent<Detalhe>).detail)
    window.addEventListener('rc-acao', h)
    return () => window.removeEventListener('rc-acao', h)
  }, [])
  return (
    <>
      {aberta?.tipo === 'nova-indicacao' && <ModalNovaIndicacao parceiroInicial={aberta.parceiroId} onFechar={() => setAberta(null)} />}
      {aberta?.tipo === 'novo-parceiro' && <ModalNovoParceiro onFechar={() => setAberta(null)} />}
    </>
  )
}

/* ---------------- Nova indicação ---------------- */

const RELACOES = [
  { id: 'Pai', rotulo: 'Pai' },
  { id: 'Mãe', rotulo: 'Mãe' },
  { id: 'Irmão(ã)', rotulo: 'Irmão(ã)' },
  { id: 'Cunhado(a)', rotulo: 'Cunhado(a)' },
  { id: 'Amigo(a)', rotulo: 'Amigo(a)' },
  { id: 'Colega de trabalho', rotulo: 'Colega de trabalho' },
  { id: 'Vizinho(a)', rotulo: 'Vizinho(a)' },
  { id: 'outro', rotulo: 'Outro' },
]

function Chips<T extends string>({ opcoes, valor, onChange }: { opcoes: { id: T; rotulo: string }[]; valor: T | ''; onChange: (v: T | '') => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => (
        <button
          type="button"
          key={o.id}
          aria-pressed={valor === o.id}
          onClick={() => onChange(valor === o.id ? '' : o.id)}
          className={cx('clicavel h-8 rounded-full border px-3 text-[13px] font-medium', valor === o.id ? 'border-ink bg-ink text-on-ink' : 'border-line bg-panel text-soft hover:border-ink/40 hover:text-ink')}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

function moedaDigitada(t: string) {
  const n = Number(soDigitos(t))
  return n ? n.toLocaleString('pt-BR') : ''
}

export function ModalNovaIndicacao({ parceiroInicial, onFechar }: { parceiroInicial?: string; onFechar: () => void }) {
  const { dados, sessao, criarIndicacao, criarParceiro } = useLoja()
  const parceiro = useParceiroAtual()
  const router = useRouter()
  const avisar = useAvisar()
  const ehRaul = sessao?.papel === 'raul'

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [relacao, setRelacao] = useState('')
  const [outraRelacao, setOutraRelacao] = useState('')
  const [contexto, setContexto] = useState('')
  const relacaoFinal = relacao === 'outro' ? outraRelacao.trim() : relacao
  const quemE = [relacaoFinal, contexto.trim()].filter(Boolean).join('. ')
  const [mais, setMais] = useState(false)
  const [email, setEmail] = useState('')
  const [credito, setCredito] = useState('')
  const [tipoBem, setTipoBem] = useState<TipoBem | ''>('')
  const [genero, setGenero] = useState<Genero>('')
  const [idade, setIdade] = useState('')
  const [parceiroId, setParceiroId] = useState<string>(parceiroInicial ?? '')
  // 'novo' = cadastra o parceiro junto com a indicação
  const [novoParceiro, setNovoParceiro] = useState({ nome: '', telefone: '', email: '' })
  const ehNovo = parceiroId === 'novo'
  const [consentiu, setConsentiu] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [feito, setFeito] = useState<string | null>(null)

  const erros = {
    parceiro: ehRaul && parceiroId === '' ? 'Escolha quem indicou (ou “Contato direto”).' : '',
    novoNome: ehNovo && !novoParceiro.nome.trim() ? 'Informe o nome do parceiro.' : '',
    novoTelefone: ehNovo && soDigitos(novoParceiro.telefone).length < 10 ? 'WhatsApp com DDD.' : '',
    novoEmail: ehNovo && !/^\S+@\S+\.\S+$/.test(novoParceiro.email) ? 'E-mail para o convite.' : '',
    nome: !nome.trim() ? 'Informe o nome.' : '',
    telefone: soDigitos(telefone).length < 10 ? 'Telefone com DDD.' : '',
    quemE: !relacao ? 'Escolha a relação com você.' : relacao === 'outro' && !outraRelacao.trim() ? 'Escreva qual é a relação.' : '',
    consentimento: !ehRaul && !consentiu ? 'Confirme que a pessoa autorizou o contato.' : '',
  }
  const valido = !Object.values(erros).some(Boolean)

  function enviar(e?: React.FormEvent) {
    e?.preventDefault()
    setTentou(true)
    if (!valido) return
    const criado = ehRaul && ehNovo ? criarParceiro({ nome: novoParceiro.nome.trim(), telefone: soDigitos(novoParceiro.telefone), email: novoParceiro.email.trim(), cidade: 'Maringá/PR' }) : null
    const ind = criarIndicacao(
      {
        parceiroId: ehRaul ? (criado ? criado.id : parceiroId === 'direto' ? null : parceiroId) : parceiro!.id,
        nome: nome.trim(),
        telefone: soDigitos(telefone),
        quemE: quemE.trim(),
        email: email.trim() || undefined,
        credito: Number(soDigitos(credito)) || undefined,
        tipoBem: tipoBem || undefined,
        genero,
        idade: Number(idade) || undefined,
      },
      ehRaul ? 'raul' : 'parceiro',
    )
    if (ehRaul) {
      onFechar()
      avisar(`Indicação de ${primeiroNome(ind.nome)} cadastrada`, { acao: { rotulo: 'Abrir', fn: () => router.push(`/indicacoes/${ind.id}`) } })
      if (criado) avisar(`Convite enviado para ${criado.email}`, { tipo: 'email' })
    } else {
      setFeito(ind.nome)
      avisar('E-mail de aviso enviado ao Raul', { tipo: 'email' })
    }
  }

  function limpar() {
    setNome('')
    setTelefone('')
    setRelacao('')
    setOutraRelacao('')
    setContexto('')
    setEmail('')
    setCredito('')
    setTipoBem('')
    setGenero('')
    setIdade('')
    setConsentiu(false)
    setTentou(false)
    setFeito(null)
  }

  const erro = (k: keyof typeof erros) => (tentou && erros[k] ? <span className="text-[12px] font-medium text-danger">{erros[k]}</span> : null)

  if (feito) {
    return (
      <Modal aberto onFechar={onFechar} titulo="" largura={440}>
        <div className="flex flex-col items-center pb-2 text-center">
          <span className="sobe-nivel flex h-14 w-14 items-center justify-center rounded-full bg-ok-weak text-ok">
            <Check className="h-7 w-7" strokeWidth={2.4} />
          </span>
          <h2 className="mt-5 font-title text-[22px] font-bold tracking-[-0.02em]">Indicação enviada</h2>
          <p className="mt-2 max-w-[34ch] text-[14px] text-dim">O Raul já recebeu o contato de {primeiroNome(feito)}. Cada etapa da conversa aparece em Minhas indicações.</p>
          <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Botao variante="secundario" onClick={limpar}>
              Indicar outra pessoa
            </Botao>
            <Botao
              onClick={() => {
                onFechar()
                router.push('/indicacoes')
              }}
            >
              Ver minhas indicações
            </Botao>
          </div>
        </div>
      </Modal>
    )
  }

  const opcoesParceiro = [
    ...dados.parceiros
      .map((p) => ({
        id: p.id,
        rotulo: p.nome,
        detalhe: p.status === 'convidado' ? `Convite pendente · ${p.cidade}` : `${nivelDoParceiro(dados, p.id).atual.nome} · ${p.cidade}`,
        icone: <Avatar nome={p.nome} foto={p.foto} tamanho={26} />,
        grupo: 'Parceiros',
      })),
    ...(ehNovo ? [{ id: 'novo', rotulo: novoParceiro.nome.trim() || 'Novo parceiro', detalhe: 'Será cadastrado junto com a indicação', icone: <UserPlus className="h-4 w-4 text-dim" />, grupo: 'Novo' }] : []),
    { id: 'direto', rotulo: 'Contato direto', detalhe: 'Sem parceiro: veio do site ou falou direto com você', icone: <Globe className="h-4 w-4 text-dim" />, grupo: 'Sem comissão' },
  ]

  return (
    <Modal
      aberto
      onFechar={onFechar}
      largura={620}
      icone={<Send />}
      titulo={ehRaul ? 'Nova indicação' : 'Indicar alguém'}
      subtitulo={ehRaul ? 'Cadastre em nome de um parceiro ou registre um contato direto.' : 'Leva cerca de 1 minuto. Quanto mais contexto, melhor o Raul conduz a conversa.'}
      rodape={
        <>
          <Botao variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao variante="marca" onClick={() => enviar()}>{ehRaul ? 'Cadastrar indicação' : 'Enviar indicação'}</Botao>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {ehRaul && (
          <Campo grupo rotulo="Indicado por" obrigatorio dica={erro('parceiro')}>
            <Selecao
              opcoes={opcoesParceiro}
              valor={parceiroId}
              onChange={setParceiroId}
              placeholder="Escolher parceiro"
              busca
              rotuloAria="Indicado por"
              acao={{
                rotulo: 'Cadastrar novo parceiro',
                icone: <UserPlus className="h-4 w-4" />,
                fn: (q) => {
                  setNovoParceiro((n) => ({ ...n, nome: q || n.nome }))
                  setParceiroId('novo')
                },
              }}
            />
            {ehNovo && (
              <div className="entra-pagina mt-2 grid gap-3 rounded-[10px] border border-line p-3.5 sm:grid-cols-3">
                <Campo rotulo="Nome do parceiro" obrigatorio dica={erro('novoNome')}>
                  <input className="campo" autoFocus={!novoParceiro.nome} value={novoParceiro.nome} onChange={(e) => setNovoParceiro({ ...novoParceiro, nome: e.target.value })} placeholder="Nome e sobrenome" />
                </Campo>
                <Campo rotulo="WhatsApp" obrigatorio dica={erro('novoTelefone')}>
                  <input className="campo font-mono" autoFocus={!!novoParceiro.nome} inputMode="tel" value={novoParceiro.telefone} onChange={(e) => setNovoParceiro({ ...novoParceiro, telefone: formatarTelefone(e.target.value) })} placeholder="(44) 99999-9999" />
                </Campo>
                <Campo rotulo="E-mail" obrigatorio dica={erro('novoEmail')}>
                  <input className="campo" type="email" value={novoParceiro.email} onChange={(e) => setNovoParceiro({ ...novoParceiro, email: e.target.value })} placeholder="parceiro@email.com" />
                </Campo>
                <p className="text-[12px] text-dim sm:col-span-3">Ao cadastrar a indicação, o parceiro recebe o convite por e-mail para criar a senha.</p>
              </div>
            )}
          </Campo>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome" obrigatorio dica={erro('nome')}>
            <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome e sobrenome" autoFocus={!ehRaul} />
          </Campo>
          <Campo rotulo="Telefone / WhatsApp" obrigatorio dica={erro('telefone')}>
            <input className="campo font-mono" inputMode="tel" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} placeholder="(44) 99999-9999" />
          </Campo>
        </div>
        <Campo grupo rotulo="Relação com você" obrigatorio dica={erro('quemE')}>
          <Chips opcoes={RELACOES} valor={relacao} onChange={(v) => setRelacao(v)} />
          {relacao === 'outro' && (
            <input className="campo entra-pagina mt-2" autoFocus value={outraRelacao} onChange={(e) => setOutraRelacao(e.target.value)} placeholder="Ex.: sogro, cliente da minha loja, primo da minha esposa" />
          )}
        </Campo>
        <Campo rotulo="Conte um pouco sobre ela" dica="De onde ouviu falar, o que procura, dúvidas que tem. Ajuda o Raul a chegar preparado na conversa.">
          <textarea className="campo" value={contexto} onChange={(e) => setContexto(e.target.value)} placeholder="Ex.: Quer sair do aluguel e tem dúvida sobre quanto tempo leva para usar a carta." />
        </Campo>

        <button type="button" onClick={() => setMais(!mais)} aria-expanded={mais} className="flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-soft hover:text-ink">
          <ChevronDown className={cx('h-4 w-4 transition-transform duration-200', mais && 'rotate-180')} /> Mais informações <span className="font-normal text-faint">(opcional)</span>
        </button>
        {mais && (
          <div className="entra-pagina grid gap-4 sm:grid-cols-2">
            <Campo grupo rotulo="Interesse" className="sm:col-span-2">
              <Chips opcoes={TIPOS_BEM} valor={tipoBem} onChange={setTipoBem} />
            </Campo>
            <Campo rotulo="Valor de crédito pretendido" dica="Se já tem um valor em mente.">
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13.5px] text-faint">R$</span>
                <input className="campo pl-9 font-mono" inputMode="numeric" value={credito} onChange={(e) => setCredito(moedaDigitada(e.target.value))} placeholder="300.000" />
              </div>
            </Campo>
            <Campo rotulo="E-mail">
              <input className="campo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </Campo>
            <Campo grupo rotulo="Gênero">
              <Chips
                opcoes={[
                  { id: 'feminino', rotulo: 'Feminino' },
                  { id: 'masculino', rotulo: 'Masculino' },
                  { id: 'outro', rotulo: 'Outro' },
                ]}
                valor={genero}
                onChange={(v) => setGenero(v as Genero)}
              />
            </Campo>
            <Campo rotulo="Idade">
              <input className="campo font-mono" inputMode="numeric" value={idade} onChange={(e) => setIdade(soDigitos(e.target.value).slice(0, 3))} placeholder="45" />
            </Campo>
          </div>
        )}

        {!ehRaul && (
          <div className="rounded-[9px] bg-sunken p-3.5">
            <Marcador marcado={consentiu} onChange={setConsentiu}>
              {nome.trim() ? primeiroNome(nome) : 'A pessoa'} sabe que estou passando o contato e autorizou receber uma mensagem do Raul.
              <span className="mt-0.5 block text-[12px] text-faint">Os dados são usados só para este contato, conforme a LGPD.</span>
            </Marcador>
            {erro('consentimento') && <div className="mt-2 pl-7">{erro('consentimento')}</div>}
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

/* ---------------- Novo parceiro ---------------- */

export function ModalNovoParceiro({ onFechar }: { onFechar: () => void }) {
  const { criarParceiro } = useLoja()
  const avisar = useAvisar()
  const router = useRouter()
  const [criado, setCriado] = useState<Parceiro | null>(null)
  const [tentou, setTentou] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cidade: 'Maringá/PR' })
  const erros = {
    nome: !form.nome.trim() ? 'Informe o nome.' : '',
    telefone: soDigitos(form.telefone).length < 10 ? 'WhatsApp com DDD.' : '',
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? 'E-mail válido para o convite.' : '',
  }
  const erro = (k: keyof typeof erros) => (tentou && erros[k] ? <span className="text-[12px] font-medium text-danger">{erros[k]}</span> : null)

  function criar() {
    setTentou(true)
    if (Object.values(erros).some(Boolean)) return
    const p = criarParceiro({ ...form, nome: form.nome.trim(), telefone: soDigitos(form.telefone) })
    setCriado(p)
    avisar(`Convite enviado para ${p.email}`, { tipo: 'email' })
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      icone={criado ? <Check /> : <UserPlus />}
      titulo={criado ? 'Convite enviado' : 'Novo parceiro'}
      subtitulo={criado ? `${primeiroNome(criado.nome)} recebeu o convite por e-mail. Se preferir, envie o link também pelo WhatsApp.` : 'O parceiro recebe um convite por e-mail para criar a senha. Você também pode enviar o link pelo WhatsApp.'}
      rodape={
        criado ? (
          <>
            <Botao
              variante="secundario"
              onClick={() => {
                onFechar()
                router.push(`/parceiros/${criado.id}`)
              }}
            >
              Abrir parceiro
            </Botao>
            <Botao onClick={onFechar}>Concluir</Botao>
          </>
        ) : (
          <>
            <Botao variante="secundario" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao variante="marca" onClick={criar}>Criar e enviar convite</Botao>
          </>
        )
      }
    >
      {criado ? (
        <ConviteAcoes p={criado} />
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            criar()
          }}
        >
          <Campo rotulo="Nome" obrigatorio dica={erro('nome')}>
            <input className="campo" autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do cliente" />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="WhatsApp" obrigatorio dica={erro('telefone')}>
              <input className="campo font-mono" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} placeholder="(44) 99999-9999" />
            </Campo>
            <Campo rotulo="E-mail" obrigatorio dica={erro('email')}>
              <input className="campo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" />
            </Campo>
          </div>
          <Campo rotulo="Cidade">
            <input className="campo" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
          </Campo>
          <p className="rounded-[9px] bg-sunken p-3.5 text-[12.5px] leading-relaxed text-dim">
            No primeiro acesso, o parceiro passa pelo onboarding guiado da plataforma: como indicar, como funcionam os níveis e quando recebe. O ideal é conduzir esse primeiro acesso junto com ele.
          </p>
          <button type="submit" hidden />
        </form>
      )}
    </Modal>
  )
}
