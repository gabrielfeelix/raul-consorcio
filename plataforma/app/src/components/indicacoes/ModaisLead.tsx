'use client'

/** Modais da tela do lead: fechamento, ajuste do negócio (valor, data, comissão) e edição dos dados. */
import { useState } from 'react'
import { Botao, Campo, CampoData, cx, Marcador, Modal, Segmentado } from '@/components/ds'
import { useLoja } from '@/lib/loja'
import type { Genero, Indicacao, Nivel, TipoBem } from '@/lib/tipos'
import { comissao, data, dataPagamento, fechadasDoParceiro, formatarTelefone, nivelDaIndicacao, nivelPorFechadas, primeiroNome, reais, soDigitos, TIPOS_BEM } from '@/lib/regras'

function hojeIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const paraIso = (dia: string) => new Date(`${dia}T12:00:00`).toISOString()
const moeda = (t: string) => {
  const n = Number(soDigitos(t))
  return n ? n.toLocaleString('pt-BR') : ''
}
const numero = (t: string) => Number(soDigitos(t)) || 0

export function CampoReais({ valor, onChange, placeholder = '0', autoFocus }: { valor: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13.5px] text-faint">R$</span>
      <input className="campo pl-9 font-mono" inputMode="numeric" autoFocus={autoFocus} value={valor} onChange={(e) => onChange(moeda(e.target.value))} placeholder={placeholder} />
    </div>
  )
}

/** Mostra de onde sai a comissão: fixo + proporcional à carta = total. */
export function ContaComissao({ nivel, carta, manual, className }: { nivel: Nivel; carta: number; manual?: number; className?: string }) {
  const prop = Math.round((carta / 100_000) * nivel.valorPor100k)
  const calc = comissao(nivel, carta)
  return (
    <div className={cx('rounded-2xl bg-sunken p-4 text-[13px]', className)}>
      <p className="mb-2.5 text-[12.5px] text-dim">Como a comissão é calculada (nível {nivel.nome})</p>
      <dl className="grid grid-cols-[1fr_auto] gap-y-1.5">
        <dt className="text-soft">Valor fixo por contrato</dt>
        <dd className="text-right font-mono">{reais(nivel.valorFixo)}</dd>
        <dt className="text-soft">
          {reais(nivel.valorPor100k)} a cada R$ 100 mil × {(carta / 100_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
        </dt>
        <dd className="text-right font-mono">{reais(prop)}</dd>
        <dt className={cx('border-t border-line pt-2 font-semibold', manual !== undefined && 'text-dim line-through decoration-faint')}>Comissão calculada</dt>
        <dd className={cx('border-t border-line pt-2 text-right font-mono font-semibold', manual !== undefined && 'text-dim line-through decoration-faint')}>{reais(calc)}</dd>
        {manual !== undefined && (
          <>
            <dt className="font-semibold">Comissão definida por você</dt>
            <dd className="text-right font-mono font-semibold">{reais(manual)}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

/* ---------------- Fechamento (mover para Contrato fechado) ---------------- */

export function ModalFechamento({ indicacao, onFechar, onConfirmar }: { indicacao: Indicacao | null; onFechar: () => void; onConfirmar: (fechadoEm: string, valor: number) => void }) {
  if (!indicacao) return null
  return <ConteudoFechamento key={indicacao.id} indicacao={indicacao} onFechar={onFechar} onConfirmar={onConfirmar} />
}

function ConteudoFechamento({ indicacao, onFechar, onConfirmar }: { indicacao: Indicacao; onFechar: () => void; onConfirmar: (fechadoEm: string, valor: number) => void }) {
  const { dados } = useLoja()
  const [dia, setDia] = useState(hojeIso())
  const [valor, setValor] = useState(moeda(String(indicacao.valorContrato ?? indicacao.credito ?? '')))
  const parceiro = dados.parceiros.find((p) => p.id === indicacao.parceiroId)
  const nivel = parceiro ? nivelPorFechadas(dados.niveis, fechadasDoParceiro(dados, parceiro.id)) : undefined
  const v = numero(valor)
  const fechadoEm = paraIso(dia)
  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo="Contrato fechado"
      subtitulo={`${indicacao.nome}${parceiro ? ` · indicação de ${parceiro.nome}` : ' · contato direto'}`}
      rodape={
        <>
          <Botao variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao disabled={!v || !dia} onClick={() => onConfirmar(fechadoEm, v)}>
            Confirmar fechamento
          </Botao>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo grupo rotulo="Data do fechamento" obrigatorio>
          <CampoData valor={dia} onChange={setDia} max={hojeIso()} rotuloAria="Data do fechamento" />
        </Campo>
        <Campo rotulo="Valor da carta" obrigatorio dica={indicacao.credito && v !== indicacao.credito ? `Na indicação: ${reais(indicacao.credito)}` : undefined}>
          <CampoReais valor={valor} onChange={setValor} placeholder="300.000" autoFocus />
        </Campo>
      </div>
      {nivel && parceiro ? (
        <>
          <ContaComissao nivel={nivel} carta={v} className="mt-5" />
          <p className="mt-3 text-[13px] text-soft">
            Pagamento a {primeiroNome(parceiro.nome)} previsto para <b className="font-semibold text-ink">{data(dataPagamento(nivel, fechadoEm))}</b>
            <span className="text-dim"> ({nivel.mesmoMes ? 'no mesmo mês do fechamento' : `${nivel.prazoDias} dias após o fechamento`})</span>. O nível fica registrado neste fechamento.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-2xl bg-sunken p-4 text-[13px] text-dim">Contato direto: não gera comissão.</p>
      )}
    </Modal>
  )
}

/* ---------------- Ajuste do negócio já fechado ---------------- */

export function ModalAjusteNegocio({ ind, onFechar, onSalvo }: { ind: Indicacao; onFechar: () => void; onSalvo: () => void }) {
  const { dados, ajustarContrato } = useLoja()
  const nivel = nivelDaIndicacao(dados, ind)
  const [dia, setDia] = useState((ind.fechadoEm ?? new Date().toISOString()).slice(0, 10))
  const [valor, setValor] = useState(moeda(String(ind.valorContrato ?? ind.credito ?? '')))
  const [manual, setManual] = useState(!!ind.comissaoManual)
  const [valorManual, setValorManual] = useState(moeda(String(ind.comissaoManual?.valor ?? '')))
  const [motivo, setMotivo] = useState(ind.comissaoManual?.motivo ?? '')
  const v = numero(valor)
  const vm = numero(valorManual)
  const fechadoEm = paraIso(dia)
  const invalido = !v || !dia || (manual && (!vm || !motivo.trim()))

  return (
    <Modal
      aberto
      onFechar={onFechar}
      largura={560}
      titulo="Ajustar negócio"
      subtitulo={`${ind.nome}. Use quando o valor fechado for diferente do indicado ou a data precisar de correção.`}
      rodape={
        <>
          <Botao variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao
            disabled={invalido}
            onClick={() => {
              ajustarContrato(ind.id, { valorContrato: v, fechadoEm, comissaoManual: manual ? { valor: vm, motivo: motivo.trim() } : undefined })
              onSalvo()
            }}
          >
            Salvar ajuste
          </Botao>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Valor da carta fechada" obrigatorio dica={ind.credito ? `Indicado com ${reais(ind.credito)}` : undefined}>
          <CampoReais valor={valor} onChange={setValor} />
        </Campo>
        <Campo grupo rotulo="Data do fechamento" obrigatorio>
          <CampoData valor={dia} onChange={setDia} max={hojeIso()} rotuloAria="Data do fechamento" />
        </Campo>
      </div>
      {nivel ? (
        <>
          <ContaComissao nivel={nivel} carta={v} manual={manual && vm ? vm : undefined} className="mt-5" />
          <p className="mt-2 text-[12.5px] text-dim">
            Pagamento previsto: <b className="font-semibold text-ink">{data(dataPagamento(nivel, fechadoEm))}</b>. O nível {nivel.nome} é o que o parceiro tinha no fechamento.
          </p>
          <div className="mt-5 rounded-2xl border border-line p-4">
            <Marcador marcado={manual} onChange={setManual}>
              <span className="font-medium text-ink">Definir a comissão manualmente</span>
              <span className="block text-[12px] text-dim">Substitui o cálculo do nível só nesta indicação. Fica registrado no histórico (o parceiro não vê o motivo).</span>
            </Marcador>
            {manual && (
              <div className="entra-pagina mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
                <Campo rotulo="Comissão" obrigatorio>
                  <CampoReais valor={valorManual} onChange={setValorManual} placeholder={String(comissao(nivel, v))} />
                </Campo>
                <Campo rotulo="Motivo" obrigatorio>
                  <input className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: bônus combinado na campanha de novembro" />
                </Campo>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-2xl bg-sunken p-4 text-[13px] text-dim">Contato direto: não gera comissão.</p>
      )}
    </Modal>
  )
}

/* ---------------- Dados do lead ---------------- */

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

export function ModalEditarLead({ ind, onFechar, onSalvo }: { ind: Indicacao; onFechar: () => void; onSalvo: () => void }) {
  const { atualizarIndicacao } = useLoja()
  const [f, setF] = useState({
    nome: ind.nome,
    telefone: formatarTelefone(ind.telefone),
    quemE: ind.quemE,
    email: ind.email ?? '',
    credito: moeda(String(ind.credito ?? '')),
    tipoBem: (ind.tipoBem ?? '') as TipoBem | '',
    genero: (ind.genero ?? '') as Genero,
    idade: ind.idade ? String(ind.idade) : '',
  })
  const invalido = !f.nome.trim() || soDigitos(f.telefone).length < 10 || !f.quemE.trim()
  return (
    <Modal
      aberto
      onFechar={onFechar}
      largura={620}
      titulo="Editar dados do lead"
      subtitulo="O parceiro continua vendo o que ele enviou; as alterações ficam com você."
      rodape={
        <>
          <Botao variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao
            disabled={invalido}
            onClick={() => {
              atualizarIndicacao(ind.id, {
                nome: f.nome.trim(),
                telefone: soDigitos(f.telefone),
                quemE: f.quemE.trim(),
                email: f.email.trim() || undefined,
                credito: numero(f.credito) || undefined,
                tipoBem: f.tipoBem || undefined,
                genero: f.genero,
                idade: Number(f.idade) || undefined,
              })
              onSalvo()
            }}
          >
            Salvar
          </Botao>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome" obrigatorio>
          <input className="campo" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Campo>
        <Campo rotulo="Telefone / WhatsApp" obrigatorio>
          <input className="campo font-mono" inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: formatarTelefone(e.target.value) })} />
        </Campo>
        <Campo rotulo="Quem é" obrigatorio className="sm:col-span-2">
          <textarea className="campo" value={f.quemE} onChange={(e) => setF({ ...f, quemE: e.target.value })} />
        </Campo>
        <Campo rotulo="E-mail">
          <input className="campo" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="email@exemplo.com" />
        </Campo>
        <Campo rotulo="Crédito pretendido">
          <CampoReais valor={f.credito} onChange={(v) => setF({ ...f, credito: v })} />
        </Campo>
        <Campo grupo rotulo="Interesse" className="sm:col-span-2">
          <Chips opcoes={TIPOS_BEM} valor={f.tipoBem} onChange={(v) => setF({ ...f, tipoBem: v })} />
        </Campo>
        <Campo grupo rotulo="Gênero">
          <Segmentado
            opcoes={[
              { id: '', rotulo: 'Não informado' },
              { id: 'feminino', rotulo: 'Feminino' },
              { id: 'masculino', rotulo: 'Masculino' },
            ]}
            valor={f.genero === 'outro' ? '' : f.genero}
            onChange={(v) => setF({ ...f, genero: v as Genero })}
            className="max-w-full overflow-x-auto"
          />
        </Campo>
        <Campo rotulo="Idade">
          <input className="campo font-mono" inputMode="numeric" value={f.idade} onChange={(e) => setF({ ...f, idade: soDigitos(e.target.value).slice(0, 3) })} placeholder="—" />
        </Campo>
      </div>
    </Modal>
  )
}
