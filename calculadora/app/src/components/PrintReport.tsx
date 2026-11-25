import type { ComparacaoFinanciamento, Parametros, Simulacao } from '../lib/consorcio';
import { duracao, porcento, reais, reaisCentavos } from '../lib/format';
import { Chart } from './Chart';
import { ganhoConsorcio } from '../lib/derivados';
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
 * PDF para o cliente levar. Hierarquia: o que é → os dois números → o gráfico → três motivos → premissas.
 * Fundo branco, uma página A4.
 */
export function PrintReport({ p, sim, sem, com, fin, mes, cliente }: Props) {
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const pago = sim.desembolsado[mes];
  const n = Math.max(1, Math.round(p.antecipParcelas));
  const parcela = sim.parcela[p.antecipar ? Math.min(sim.prazo, n + 1) : 1];
  const vsCdb = ganhoConsorcio(sim, p.valorCarta, mes) - (sim.cdb[mes] - pago);
  const vsSac = fin.sac.totalJuros - sim.custoTaxasHoje;
  const economiaAnt = sem.totalPagoHoje - com.totalPagoHoje;
  const sinal = (v: number) => (v >= 0 ? reais(v) : `−${reais(-v)}`);
  const ate = Math.min(sim.prazo, Math.max(mes, Math.ceil((sim.contemplacao + 24) / 12) * 12));

  const motivos = [
    {
      t: 'Contra o CDB',
      v: sinal(vsCdb),
      d: `${vsCdb >= 0 ? 'a mais' : 'a menos'} que as mesmas parcelas aplicadas no CDB, até o mês ${mes}. A carta corrige sobre o valor inteiro; o CDB, só sobre o que foi depositado.`,
    },
    {
      t: 'Contra o financiamento',
      v: sinal(vsSac),
      d: `de economia no plano inteiro. As taxas do consórcio somam ${reais(sim.custoTaxasHoje)}; os juros do financiamento SAC, ${reais(fin.sac.totalJuros)}.`,
    },
    p.antecipar
      ? {
          t: 'Com a antecipação da taxa',
          v: reais(economiaAnt),
          d: `a menos no plano. A taxa cai de ${porcento(sem.taxaAdmTotal * 100)} para ${porcento(com.taxaAdmTotal * 100)}; ${n === 1 ? 'a 1ª parcela fica' : `as ${n} primeiras ficam`} em ${reaisCentavos(com.parcela[1])}.`,
        }
      : {
          t: 'Cada R$ 1 pago',
          v: reaisCentavos(pago > 0 ? sim.credito[mes] / pago : 0),
          d: `de crédito na carta, no mês ${mes}. Você paga aos poucos e a carta já vale o imóvel inteiro, corrigido.`,
        },
  ];

  return (
    <div className="print" aria-hidden="true">
      <header className="pq-head">
        <div className="pq-brand">
          Raul Carvalho <span>Consórcios Multimarcas</span>
        </div>
        <div className="pq-meta">
          {cliente.trim() ? `Simulação para ${cliente.trim()}` : 'Simulação personalizada'} · {hoje}
        </div>
      </header>

      <h1 className="pq-title">
        Consórcio de imóvel de {reais(p.valorCarta)}, em {p.prazo} meses
      </h1>
      <p className="pq-sub">
        Parcela de {reaisCentavos(parcela)} por mês{p.antecipar ? ' (com antecipação da taxa)' : ''}, com reajuste anual pelo INCC. Contemplação simulada no mês {sim.contemplacao}.
      </p>

      <section className="pq-hero">
        <div>
          <span>No mês {mes} ({duracao(mes)}), a sua carta vale</span>
          <strong className="pq-red">{reais(sim.credito[mes])}</strong>
        </div>
        <div>
          <span>E você terá pago</span>
          <strong>{reais(pago)}</strong>
        </div>
      </section>

      <section className="pq-chart">
        <Chart sim={sim} mes={mes} width={690} height={250} variant="print" ate={ate} />
        <div className="pq-legend">
          <span>
            <i className="pq-k pq-k--carta" />
            Valor da carta
          </span>
          <span>
            <i className="pq-k pq-k--cdb" />
            As mesmas parcelas no CDB
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

      <footer className="pq-foot">
        <p className="pq-premissas">
          Premissas: taxa de administração {porcento(sim.taxaAdmTotal * 100)}, fundo de reserva {porcento(p.fundoReserva)}, INCC {porcento(p.incc)} a.a. até a contemplação e Selic {porcento(p.selic)} a.a.
          depois. CDB a {porcento(p.cdbPctCdi)} do CDI ({porcento(p.cdi)} a.a.){p.descontarIR ? ', líquido de IR' : ''}. Financiamento com {porcento(p.entradaFinanciamento)} de entrada e
          juros de {porcento(p.jurosFinanciamento)} a.a., valores de hoje.
        </p>
        <p className="pq-aviso">{AVISO}</p>
      </footer>
    </div>
  );
}
