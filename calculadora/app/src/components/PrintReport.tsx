import type { ComparacaoFinanciamento, Parametros, Simulacao } from '../lib/consorcio';
import { CONTATO } from '../lib/contato';
import { duracao, porcento, reais, reaisCentavos } from '../lib/format';
import { Chart } from './Chart';
import { AVISO } from './Aviso';

interface Props {
  p: Parametros;
  sim: Simulacao;
  sem: Simulacao;
  com: Simulacao;
  fin: ComparacaoFinanciamento;
  mes: number;
  cliente: string;
}

/**
 * PDF para o cliente levar para casa. Ordem pensada para quem quer comprar um imóvel:
 * o plano → a carta no tempo → contra o financiamento (a alternativa real) → custo de verdade → a parcela no tempo → contato.
 * Sem CDB: comparar rendimento não é a conversa de quem quer o imóvel. Uma página A4.
 */
export function PrintReport({ p, sim, sem, com, fin, mes, cliente }: Props) {
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const pago = sim.desembolsado[mes];
  const n = Math.max(1, Math.round(p.antecipParcelas));
  const parcela = sim.parcela[p.antecipar ? Math.min(sim.prazo, n + 1) : 1];
  const vsSac = fin.sac.totalJuros - sim.custoTaxasHoje;
  const parcelaSac = fin.sac.tabela[0]?.parcela ?? 0;
  const economiaAnt = sem.totalPagoHoje - com.totalPagoHoje;
  const c = sim.contemplacao;
  const contemplada = mes >= c;
  const pctTaxas = Math.round((sim.custoTaxasHoje / p.valorCarta) * 1000) / 10;

  const motivos = [
    {
      t: 'Contra o financiamento',
      v: vsSac >= 0 ? `${reais(vsSac)} a menos` : `${reais(-vsSac)} a mais`,
      d: `Sem juros. A parcela começa em ${reaisCentavos(parcela)}, contra ${reaisCentavos(parcelaSac)} na 1ª do financiamento SAC. Juros do SAC: ${reais(fin.sac.totalJuros)}.`,
    },
    {
      t: 'Custo real, em dinheiro de hoje',
      v: reais(sim.totalPagoHoje),
      d: `${reais(p.valorCarta)} de carta e ${reais(sim.custoTaxasHoje)} de taxas (${porcento(pctTaxas)} em ${duracao(sim.prazo)}). As parcelas sobem com o INCC, junto com a carta.`,
    },
    p.antecipar
      ? {
          t: 'Com a antecipação da taxa',
          v: `${reais(economiaAnt)} a menos`,
          d: `A taxa cai de ${porcento(sem.taxaAdmTotal * 100)} para ${porcento(com.taxaAdmTotal * 100)}; ${n === 1 ? 'a 1ª parcela fica' : `as ${n} primeiras ficam`} em ${reaisCentavos(com.parcela[1])}.`,
        }
      : {
          t: 'Contemplação simulada',
          v: `Mês ${c}`,
          d: `Em ${duracao(c)}, com a carta em ${reais(sim.credito[c])}. Com lance, pode acontecer antes.`,
        },
  ];

  // a parcela ao longo do plano (valores do ano, com o reajuste estimado pelo INCC)
  const marcos = [1, 61, 121, 181, sim.prazo]
    .filter((k, i, a) => k <= sim.prazo && a.indexOf(k) === i)
    .map((k) => ({ k, rotulo: k === 1 ? 'Hoje' : k === sim.prazo ? 'Última' : `Em ${Math.round((k - 1) / 12)} anos`, v: sim.parcela[k] }));

  return (
    <div className="print" aria-hidden="true">
      <header className="pq-head">
        <div className="pq-brand">
          <strong className="pq-nome">
            <b>Raul</b> Consórcio
          </strong>
          <span>Menos impulsividade. Mais estratégia.</span>
        </div>
        <div className="pq-meta">
          {cliente.trim() ? `Simulação para ${cliente.trim()}` : 'Simulação personalizada'} · {hoje}
        </div>
      </header>

      <h1 className="pq-title">
        Consórcio de imóvel de {reais(p.valorCarta)}, em {p.prazo} meses
      </h1>
      <p className="pq-sub">
        Parcela de {reaisCentavos(parcela)} por mês{p.antecipar ? ' (com antecipação da taxa)' : ''}, com reajuste anual pelo INCC. Sem juros e sem entrada.
      </p>

      <section className="pq-hero">
        <div>
          <span>
            No mês {mes} ({duracao(mes)}), {contemplada ? 'o imóvel vale, estimado pelo INCC' : 'a sua carta vale'}
          </span>
          <strong className="pq-red">{reais(sim.credito[mes])}</strong>
        </div>
        <div>
          <span>E você terá pago</span>
          <strong>{reais(pago)}</strong>
        </div>
      </section>

      <section className="pq-chart">
        <Chart sim={sim} mes={mes} width={690} height={230} variant="print" ate={sim.prazo} comCdb={false} />
        <div className="pq-legend">
          <span>
            <i className="pq-k pq-k--carta" />
            Carta, depois o imóvel
          </span>
          <span>
            <i className="pq-k pq-k--pago" />
            Quanto você pagou
          </span>
        </div>
      </section>

      <h2 className="pq-h2">Por que o consórcio</h2>
      <section className="pq-motivos">
        {motivos.map((m) => (
          <div key={m.t} className="pq-motivo">
            <span>{m.t}</span>
            <strong>{m.v}</strong>
            <p>{m.d}</p>
          </div>
        ))}
      </section>

      <h2 className="pq-h2">A parcela ao longo do plano</h2>
      <section className="pq-parcelas">
        {marcos.map((m) => (
          <div key={m.k}>
            <span>{m.rotulo}</span>
            <strong>{reaisCentavos(m.v)}</strong>
          </div>
        ))}
      </section>
      <p className="pq-nota">Reajuste estimado pelo INCC de {porcento(p.incc)} ao ano. Em dinheiro de hoje, a parcela fica a mesma do começo ao fim.</p>

      {CONTATO.whatsapp && (
        <section className="pq-contato">
          <div>
            <strong>{CONTATO.nome}</strong>
            <span>{CONTATO.papel}</span>
          </div>
          <div>
            <span>WhatsApp</span>
            <strong>{CONTATO.whatsapp}</strong>
          </div>
        </section>
      )}

      <footer className="pq-foot">
        <p className="pq-premissas">
          Premissas: taxa de administração {porcento(sim.taxaAdmTotal * 100)}, fundo de reserva {porcento(p.fundoReserva)}, INCC {porcento(p.incc)} a.a. sobre carta e parcelas (depois da
          contemplação, como estimativa do valor do imóvel). Financiamento SAC com {porcento(p.entradaFinanciamento)} de entrada e juros de {porcento(p.jurosFinanciamento)} a.a., valores de
          hoje, sem seguros nem TR.
        </p>
        <p className="pq-aviso">{AVISO}</p>
      </footer>
    </div>
  );
}
