'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { Botao, Campo, cx, Modal, Segmentado } from '@/components/ds'
import type { Nivel } from '@/lib/tipos'
import { comissao, novoId, reais, soDigitos } from '@/lib/regras'
import { Insignia } from './Insignia'

/** Paleta curada: tons de metal e pedra, todos legíveis com o miolo branco. */
export const CORES_NIVEL = [
  { cor: '#A86B3C', nome: 'Bronze' },
  { cor: '#8A8F98', nome: 'Prata' },
  { cor: '#B8892B', nome: 'Ouro' },
  { cor: '#3E4A5C', nome: 'Platina' },
  { cor: '#2F6F5E', nome: 'Esmeralda' },
  { cor: '#2C5282', nome: 'Safira' },
  { cor: '#7A3E6E', nome: 'Ametista' },
  { cor: '#9B2C2C', nome: 'Rubi' },
  { cor: '#1F1F22', nome: 'Ônix' },
]

type Form = { nome: string; cor: string; ilustracao: 'medalha' | 'trofeu'; minFechadas: string; valorFixo: string; valorPor100k: string; mesmoMes: boolean; prazoDias: string; premios: string[] }

function paraForm(n: Nivel | null, sugestaoTopo: boolean): Form {
  return n
    ? {
        nome: n.nome,
        cor: n.cor,
        ilustracao: n.ilustracao ?? (sugestaoTopo ? 'trofeu' : 'medalha'),
        minFechadas: String(n.minFechadas),
        valorFixo: String(n.valorFixo),
        valorPor100k: String(n.valorPor100k),
        mesmoMes: n.mesmoMes,
        prazoDias: String(n.prazoDias),
        premios: [...n.premios],
      }
    : { nome: '', cor: CORES_NIVEL[4].cor, ilustracao: 'medalha', minFechadas: '', valorFixo: '', valorPor100k: '', mesmoMes: false, prazoDias: '30', premios: [] }
}

export function ModalNivel({
  aberto,
  nivel,
  niveis,
  ehTopo,
  primeiro,
  onFechar,
  onSalvar,
  onRemover,
}: {
  aberto: boolean
  /** null = novo nível */
  nivel: Nivel | null
  niveis: Nivel[]
  ehTopo: boolean
  primeiro: boolean
  onFechar: () => void
  onSalvar: (n: Nivel) => void
  onRemover: (id: string) => void
}) {
  const [f, setF] = useState<Form>(() => paraForm(nivel, ehTopo))
  const [premio, setPremio] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const [tentou, setTentou] = useState(false)

  useEffect(() => {
    if (aberto) {
      setF(paraForm(nivel, ehTopo))
      setPremio('')
      setConfirmar(false)
      setTentou(false)
    }
  }, [aberto, nivel, ehTopo])

  const min = Number(f.minFechadas || 0)
  const outros = niveis.filter((n) => n.id !== nivel?.id)
  const erros: string[] = []
  if (!f.nome.trim()) erros.push('Dê um nome ao nível.')
  if (outros.some((n) => n.nome.trim().toLowerCase() === f.nome.trim().toLowerCase())) erros.push('Já existe um nível com esse nome.')
  if (!primeiro && f.minFechadas === '') erros.push('Informe quantos contratos são necessários.')
  if (outros.some((n) => n.minFechadas === min)) erros.push(`Já existe um nível que começa em ${min} contratos.`)
  if (!f.mesmoMes && !Number(f.prazoDias)) erros.push('Informe o prazo de pagamento em dias.')

  const previa: Nivel = {
    id: nivel?.id ?? 'previa',
    nome: f.nome || 'Novo nível',
    cor: f.cor,
    ilustracao: f.ilustracao,
    minFechadas: min,
    valorFixo: Number(f.valorFixo) || 0,
    valorPor100k: Number(f.valorPor100k) || 0,
    mesmoMes: f.mesmoMes,
    prazoDias: Number(f.prazoDias) || 0,
    premios: f.premios,
  }

  function salvar() {
    setTentou(true)
    if (erros.length) return
    onSalvar({ ...previa, id: nivel?.id ?? novoId('nv'), nome: f.nome.trim(), minFechadas: primeiro ? 0 : min })
  }

  function addPremio() {
    const t = premio.trim()
    if (!t || f.premios.includes(t)) return
    setF({ ...f, premios: [...f.premios, t] })
    setPremio('')
  }

  const num = (v: string) => soDigitos(v).slice(0, 7)

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura={620}
      titulo={nivel ? `Editar ${nivel.nome}` : 'Novo nível'}
      subtitulo="As mudanças valem para os próximos fechamentos. Contratos já fechados mantêm o nível congelado."
      rodape={
        confirmar ? (
          <div className="flex w-full flex-wrap items-center gap-2">
            <p className="mr-auto text-[13px] text-soft">Remover {nivel?.nome}? Parceiros nele voltam ao nível anterior.</p>
            <Botao variante="secundario" onClick={() => setConfirmar(false)}>
              Manter
            </Botao>
            <Botao variante="perigo" onClick={() => nivel && onRemover(nivel.id)}>
              <Trash2 /> Remover nível
            </Botao>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2">
            {nivel && !primeiro && (
              <Botao variante="fantasma" className="mr-auto text-danger hover:text-danger" onClick={() => setConfirmar(true)}>
                <Trash2 /> Remover
              </Botao>
            )}
            <span className={cx('flex w-full gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none', !(nivel && !primeiro) && 'sm:ml-auto')}>
              <Botao variante="secundario" onClick={onFechar}>
                Cancelar
              </Botao>
              <Botao onClick={salvar}>
                <Check /> {nivel ? 'Salvar nível' : 'Criar nível'}
              </Botao>
            </span>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {/* identidade */}
        <div className="flex flex-col gap-4 rounded-[12px] bg-sunken p-4 sm:flex-row sm:items-center">
          <div className="flex items-center justify-center sm:w-[104px]">
            <Insignia key={f.cor + f.ilustracao} cor={f.cor} tipo={f.ilustracao} tamanho={84} className="sobe-nivel" />
          </div>
          <div className="min-w-0 flex-1">
            <Campo rotulo="Nome" obrigatorio>
              <input className="campo" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Diamante" autoFocus />
            </Campo>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Segmentado
                valor={f.ilustracao}
                onChange={(v) => setF({ ...f, ilustracao: v })}
                opcoes={[
                  { id: 'medalha', rotulo: 'Medalha' },
                  { id: 'trofeu', rotulo: 'Troféu' },
                ]}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-soft">Cor do miolo</p>
          <div role="radiogroup" aria-label="Cor do miolo" className="flex flex-wrap gap-2">
            {CORES_NIVEL.map((c) => {
              const sel = c.cor.toLowerCase() === f.cor.toLowerCase()
              return (
                <button
                  key={c.cor}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  title={c.nome}
                  aria-label={c.nome}
                  onClick={() => setF({ ...f, cor: c.cor })}
                  className={cx('clicavel flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-panel', sel ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-line')}
                  style={{ background: c.cor }}
                >
                  {sel && <Check className="h-4 w-4 text-white" strokeWidth={2.6} />}
                </button>
              )
            })}
            <label title="Cor personalizada" className={cx('clicavel relative flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line px-3 text-[12.5px] font-medium text-dim hover:border-ink hover:text-ink', !CORES_NIVEL.some((c) => c.cor.toLowerCase() === f.cor.toLowerCase()) && 'border-solid border-ink text-ink')}>
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: f.cor }} />
              Outra
              <input type="color" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Cor personalizada" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo rotulo="Contratos para chegar" obrigatorio={!primeiro || undefined} dica={primeiro ? 'Nível inicial: todo parceiro começa aqui.' : 'Contratos fechados acumulados.'}>
            <input className="campo font-mono" inputMode="numeric" disabled={primeiro} value={primeiro ? '0' : f.minFechadas} onChange={(e) => setF({ ...f, minFechadas: num(e.target.value) })} placeholder="10" />
          </Campo>
          <Campo rotulo="Valor fixo (R$)" obrigatorio dica="Por contrato fechado.">
            <input className="campo font-mono" inputMode="numeric" value={f.valorFixo} onChange={(e) => setF({ ...f, valorFixo: num(e.target.value) })} placeholder="400" />
          </Campo>
          <Campo rotulo="A cada R$ 100 mil (R$)" obrigatorio dica="Proporcional ao valor da carta.">
            <input className="campo font-mono" inputMode="numeric" value={f.valorPor100k} onChange={(e) => setF({ ...f, valorPor100k: num(e.target.value) })} placeholder="250" />
          </Campo>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-soft">Quando o parceiro recebe</p>
          <div className="flex flex-wrap items-center gap-3">
            <Segmentado
              valor={f.mesmoMes ? 'mes' : 'dias'}
              onChange={(v) => setF({ ...f, mesmoMes: v === 'mes' })}
              opcoes={[
                { id: 'dias', rotulo: 'Dias após fechar' },
                { id: 'mes', rotulo: 'No mesmo mês' },
              ]}
            />
            {!f.mesmoMes && (
              <span className="flex items-center gap-2">
                <input className="campo h-9 w-[84px] font-mono" inputMode="numeric" value={f.prazoDias} onChange={(e) => setF({ ...f, prazoDias: num(e.target.value).slice(0, 3) })} aria-label="Dias após o fechamento" />
                <span className="text-[13px] text-dim">dias após o fechamento</span>
              </span>
            )}
            {f.mesmoMes && <span className="text-[13px] text-dim">Pago até o último dia do mês do fechamento.</span>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-soft">Prêmios do nível</p>
          {f.premios.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {f.premios.map((p) => (
                <li key={p} className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-panel pr-1 pl-3 text-[12.5px] font-medium text-ink">
                  {p}
                  <button type="button" onClick={() => setF({ ...f, premios: f.premios.filter((x) => x !== p) })} aria-label={`Remover ${p}`} className="flex h-6 w-6 items-center justify-center rounded-full text-faint hover:bg-sunken hover:text-ink">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              className="campo"
              placeholder="Ex.: Jantar para dois, viagem, brinde"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPremio()
                }
              }}
            />
            <Botao variante="secundario" onClick={addPremio} disabled={!premio.trim()} className="h-10">
              <Plus /> Adicionar
            </Botao>
          </div>
        </div>

        <p className="rounded-[9px] border border-line-soft px-3.5 py-3 text-[12.5px] text-dim">
          Numa carta de R$ 300 mil, este nível paga <b className="font-mono font-semibold text-ink">{reais(comissao(previa, 300_000))}</b>:{' '}
          {reais(previa.valorFixo)} fixo + 3 × {reais(previa.valorPor100k)}.
        </p>

        {tentou && erros.length > 0 && (
          <ul className="entra-pop rounded-[9px] bg-danger-weak px-3.5 py-2.5 text-[13px] font-medium text-danger">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
