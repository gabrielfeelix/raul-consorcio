# Calculadora de consórcio

Ferramenta que o Raul usa com o cliente para **comparar** o consórcio com as alternativas e mostrar por que o consórcio vale mais a pena.

> **Escopo:** consórcio como investimento só faz sentido para **imóvel (moradia)**, então a calculadora foca em imóvel. Isso vale **só para a calculadora**: o Raul vende consórcio de todo tipo (carro, moto, outros bens), e a LP atende todos.

## Referência

Prints do simulador da ConsórcioGO (Embracon) em [`referencias/`](referencias/). São referência de **funcionamento**, não de visual. A identidade é a do Raul.

| Print | O que mostra |
|---|---|
| [`consorciogo-vs-renda-fixa.png`](referencias/consorciogo-vs-renda-fixa.png) | Consórcio × renda fixa: retorno total, lucro e rentabilidade ao mês |
| [`consorciogo-contemplada-aplicada.png`](referencias/consorciogo-contemplada-aplicada.png) | Carta contemplada e aplicada (alavancagem): crédito, valor final, lucro |
| [`consorciogo-vs-financiamento.png`](referencias/consorciogo-vs-financiamento.png) | Consórcio × financiamento SAC × Price: prazo, crédito/valor financiado, total pago, juros/taxa, gráficos de pizza |

## Código para reaproveitar

Nenhum código pronto. A base são os prints de referência acima.

## Comparações

- **Consórcio × financiamento** (SAC e Price).
- **Consórcio × CDB**.
- **Consórcio × Tesouro Selic** (ou outra renda fixa). Bom ter, além do CDB.
- Não precisa comparar com bitcoin nem com renda variável.

## A tese que a calculadora tem que mostrar

- No **CDB**, o rendimento incide só sobre o que a pessoa já aportou. Ex.: aporta R$ 500 → rende ~15% a.a. sobre os R$ 500.
- No **consórcio**, a correção incide sobre o **valor total da carta**. Ex.: carta de R$ 150 mil → corrige ~6% a.a. sobre os R$ 150 mil, mesmo a pessoa tendo pago pouco até ali.
- Por isso, olhando o quanto a pessoa desembolsou, o consórcio acaba rendendo mais.

## Regras de cálculo

- **O consórcio tem duas fases**, com índices de correção diferentes:
  - **Antes da contemplação:** corrige pelo índice do tipo de bem. Para **imóvel é o INCC**. (Cada tipo de operação tem o seu índice.)
  - **Depois da contemplação:** corrige pela **Selic**.
- **Correção antes da contemplação: 6% a.a. (INCC)**, confirmado pelo Raul. Valor padrão, ajustável.
- A calculadora tem que mostrar a **parcela**. Os prints de referência não mostram, mas é obrigatório.
- Tem que mostrar o **crédito** (valor da carta e crédito corrigido).
- **Antecipação da taxa de administração** (opção na simulação):
  - Sem antecipar, a taxa de administração é diluída em todas as parcelas. Ex.: taxa total de **22%**, parcela de **R$ 500**.
  - Antecipando, o cliente paga **1% da taxa de administração na 1ª e na 2ª parcela**. Essas duas ficam mais caras.
  - Em troca, as parcelas seguintes ficam mais baratas (ex.: **R$ 500 → R$ 350**) e a taxa total cai (ex.: **22% → 19%**).
  - A calculadora mostra as duas versões lado a lado: com e sem antecipação.
  - **O cálculo exato ainda precisa ser fechado** (ver perguntas abaixo).
- **Taxas ajustáveis:** um lugar para o Raul mexer na taxa de juros (do financiamento, CDB, Selic, INCC etc.) em vez de deixar fixo.

## Interação

- **Linha do tempo com bolinha arrastável** (1º mês → 240 meses), como nos prints.
- Ao arrastar, o **resultado atualiza na hora** para aquele mês.
- O balão sobre a bolinha mostra o mês, o total investido até ali e o crédito corrigido.

## Saída

- **Gerar PDF** com o resultado da análise para entregar ao cliente.
- **Aviso de simulação** obrigatório na tela e no PDF (ex.: "simulação, não é promessa de rendimento"). Confirmado pelo Raul.

## Perguntas em aberto

- **Quais taxas entram na parcela do consórcio:** taxa de administração, fundo de reserva, seguro. Valores padrão da Ademicon?
- **Mês de contemplação:** o usuário escolhe o mês em que é contemplado (a bolinha?) ou é uma entrada separada?
- **Regra da antecipação:** o "1%" é 1% do valor da carta em cada uma das duas parcelas (ex.: R$ 1.500 cada numa carta de R$ 150 mil)? A redução da taxa total (22% → 19%) é uma tabela fixa da Ademicon ou sai da conta? Precisa de uma simulação real da Ademicon, com e sem antecipação, para validar a fórmula.
- **De onde vêm as taxas**: o Raul digita à mão ou o sistema puxa INCC, Selic e CDI atualizados (ex.: API do Banco Central)?
- **Onde vive a calculadora:** dentro da LP, como página própria, ou dentro do sistema de indicações (só para o Raul logado)?
- **PDF com a marca do Raul** e os dados do cliente (nome)?
- **Texto do aviso:** confirmar com o Raul o texto exato que a Ademicon permite.
