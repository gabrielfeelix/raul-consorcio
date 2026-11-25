# Calculadora de consórcio (app)

Simulador de consórcio de imóvel que o Raul usa com o cliente: mostra a parcela, o crédito corrigido mês a mês e compara com CDB, Tesouro Selic e financiamento (SAC e Price). Gera um PDF para entregar ao cliente.

Requisitos e perguntas em aberto: [`../README.md`](../README.md).

## Experiência (v2)

Uma dobra só, no formato de configurador: à esquerda o **palco** (escuro, a vitrine), à direita o **painel** (claro, poucos controles). O Raul apresenta um passo de cada vez:

1. **A carta**: valor e prazo. A carta de crédito aparece como objeto.
2. **A parcela**: quanto paga por mês, para onde vai cada parte (passe o mouse na barra) e a antecipação da taxa, com e sem, lado a lado.
3. **O tempo**: arraste a bolinha (ou aperte Reproduzir). A carta valoriza na tela comparada ao que foi pago, com a contemplação marcada.
4. **Compare**: CDB, Tesouro Selic ou financiamento, no mês escolhido.
5. **Resumo**: a folha com os números, o nome do cliente e Gerar PDF.

Navegação: botões Voltar/Avançar, setas do teclado e as teclas 1 a 5. "Ajustar taxas" abre um painel lateral. Todo elemento colorido dos gráficos mostra o valor ao passar o mouse ou tocar.

Estilos: `src/styles.css` (tela) e `src/print.css` (PDF).

## Como rodar

```bash
cd calculadora/app
npm install
npm run dev      # http://localhost:5174
npm test         # testes das fórmulas (vitest)
npm run build    # gera dist/ estático (pode ir para a Vercel)
```

Stack: Vite + React + TypeScript, CSS puro, gráfico em SVG feito à mão. Sem backend: os valores do painel "Ajustar taxas" ficam salvos no navegador (localStorage).

## Onde está cada coisa

| Arquivo | O que faz |
|---|---|
| `src/lib/finance.ts` | Funções puras: taxa mensal equivalente, correção composta, Price, SAC, IR regressivo, aportes em renda fixa |
| `src/lib/antecipacao.ts` | Plano de parcelas com e sem antecipação da taxa de administração. **Regra provisória, isolada aqui** |
| `src/lib/consorcio.ts` | Simulação mês a mês (parcela, crédito, desembolso, CDB, Tesouro) e comparação com financiamento |
| `src/lib/defaults.ts` | Valores padrão (todos editáveis na tela) |
| `src/components/Aviso.tsx` | Texto do aviso obrigatório (tela e PDF) |
| `src/components/PrintReport.tsx` | Layout do PDF (impressão via `window.print()`) |

## Valores padrão

| Parâmetro | Padrão |
|---|---|
| Valor da carta | R$ 150.000 |
| Prazo | 240 meses |
| Taxa de administração | 22% |
| Fundo de reserva | 2% |
| Seguro | desligado (0,035% a.m. sobre o saldo devedor quando ligado) |
| Mês de contemplação | 60 |
| INCC | 6% a.a. (confirmado pelo Raul) |
| Selic | 15% a.a. |
| CDI | 14,9% a.a., CDB a 100% do CDI |
| Tesouro Selic | 15% a.a. |
| Juros do financiamento | 12% a.a., entrada de 20% |
| Antecipação | 1% da carta em cada uma das 2 primeiras parcelas, taxa total cai para 19% |

Selic, CDI e juros são estimativas: conferir no dia e ajustar em "Ajustar taxas".

## Premissas das fórmulas

Todas as taxas anuais são efetivas; a taxa mensal é `(1 + a)^(1/12) − 1`.

**Parcela do consórcio (valores de hoje)**
- Sem antecipação: `carta × (1 + taxa de adm + fundo de reserva) / prazo`, todas iguais.
- Seguro (opcional): `% ao mês × saldo devedor` (soma das parcelas que faltam), somado à parcela.
- Reajuste: parcela e carta reajustam pelo INCC. Padrão **anual** (degrau a cada 12 meses, no aniversário do grupo); dá para trocar para **mensal** (pró-rata).
- Depois da contemplação a parcela continua reajustando pelo INCC.

**Crédito corrigido**
- Até o mês de contemplação: `carta × (1 + INCC)^anos`.
- Depois da contemplação: o crédito do mês da contemplação passa a render pela Selic, composto mês a mês, sem IR (o crédito fica aplicado até ser usado).

**Antecipação da taxa de administração (hipótese, validar com a Ademicon)**
- Nas N primeiras parcelas o cliente paga, a mais, X% da carta (padrão: 1% em 2 parcelas).
- A taxa total do plano cai para o valor configurado (padrão: 22% → 19%).
- O que sobra da taxa (`taxa resultante − X% × N`) é diluído igualmente em todas as parcelas.
- Com os padrões, a parcela cai de R$ 775 para R$ 743,75. O exemplo do Raul (R$ 500 → R$ 350) indica uma queda bem maior; a regra real precisa vir de uma simulação da Ademicon.

**Consórcio × CDB × Tesouro Selic**
- As mesmas parcelas (com reajuste e seguro) são aplicadas todo mês na renda fixa.
- Cada aporte é um lote com sua própria alíquota de IR (22,5% até 180 dias, 20% até 360, 17,5% até 720, 15% acima). Dá para desligar o IR.
- Tesouro Selic sem taxa de custódia da B3.
- Ganho do consórcio = `crédito corrigido − valor original da carta − taxas pagas até o mês` (taxa de adm + fundo de reserva + seguro). É o ganho de correção, líquido das taxas.
- Ganho da renda fixa = `saldo líquido − total aportado`.
- "Sobre o que você pagou" = ganho ÷ total desembolsado até o mês.
- Também mostra o mês em que o CDB passaria o consórcio, caso aconteça.

**Base de cálculo (a tese do Raul)**
- CDB: taxa do CDB × o que o cliente já aportou.
- Consórcio: INCC (ou Selic, depois da contemplação) × crédito corrigido.
- "X vezes" = correção anual da carta ÷ rendimento anual bruto do CDB, a partir do mês escolhido.

**Consórcio × financiamento**
- Mesmo imóvel (valor da carta), mesmo prazo. Financiamento com entrada configurável, sobre o restante.
- Price: `PMT = P × i / (1 − (1 + i)^−n)`. SAC: amortização `P/n` + juros sobre o saldo.
- Valores de hoje: sem INCC no consórcio, sem TR e sem seguros (MIP/DFI) no financiamento.
- Custo do consórcio = taxa de adm + fundo de reserva (+ seguro). O fundo de reserva pode ser devolvido no fim do grupo; aqui ele entra como custo.

**Outros números**
- "Cada R$ 1 que você pagou" = crédito corrigido ÷ total desembolsado.
- "A correção cobre as taxas" = primeiro mês em que `crédito − carta` passa o custo total das taxas do plano (em valores de hoje).

## PDF

O botão "Gerar PDF" abre a impressão do navegador com um layout próprio (fundo branco, uma página A4): nome do cliente, data, parâmetros, números do mês escolhido na linha do tempo, gráfico, comparações, antecipação e aviso. No diálogo, escolher "Salvar como PDF" e desmarcar "Cabeçalhos e rodapés".

## Em aberto (confirmar com o Raul)

- Regra exata da antecipação (simulação real da Ademicon com e sem antecipação).
- Taxas padrão da Ademicon para imóvel: taxa de adm, fundo de reserva, seguro.
- Se o crédito, depois da contemplação, corrige pela Selic cheia e se há IR sobre isso.
- Reajuste anual ou mensal da carta e da parcela (padrão: anual).
- Se as taxas devem vir de uma API (ex.: Banco Central) ou continuar digitadas.
- Texto exato do aviso permitido pela Ademicon.
- Onde a calculadora vai morar (LP, página própria ou sistema de indicações) e se o PDF leva logo.
