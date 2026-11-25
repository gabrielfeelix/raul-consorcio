# Plataforma de indicações e prêmios

Plataforma onde os **clientes/parceiros do Raul** registram e acompanham as pessoas que indicaram, e onde o **Raul** gere essas indicações, os pagamentos e os níveis de cada parceiro. Foco comercial.

> O essencial para o parceiro é **indicar e colocar no sistema**. O resto é acompanhamento.

---

## Quem usa

| Perfil | O que faz |
|---|---|
| **Parceiro** (cliente do Raul) | Só três coisas: **adicionar indicação**, ver **quando e quanto vai receber** e ver as **atualizações de movimentação** que o Raul faz (para saber que a indicação está andando). **Não arrasta cartões nem edita etapas.** |
| **Raul** (admin) | Cria os parceiros, vê todas as indicações, move os cartões entre etapas, edita os dados do lead, registra contato com o interessado, lança data de fechamento e tira relatórios. |

Os dois precisam de **login e senha** → precisa de banco de dados e servidor.

---

## Funcionalidades

### 1. Quadro de indicações (estilo CRM, sem ser um CRM completo)

- Indicações em **cartões arrastáveis** entre etapas (kanban).
- **Só o Raul arrasta** os cartões. O parceiro vê o estado de cada indicado (se alguém já chamou, se respondeu etc.) e recebe as atualizações de movimentação.

### 1b. Tela do lead (Raul)

- Tela própria de cada lead onde o Raul **edita todas as informações** do indicado.
- O histórico de contato e de mudança de etapa fica aí também.

### 2. Ficha do indicado

O parceiro preenche ao cadastrar a indicação.

**Obrigatórios (mínimo que o Raul quer):**

- **Nome**
- **Telefone**
- **Quem é o lead**: campo de texto livre explicando a relação e de onde veio (ex.: "meu pai", "minha mãe", "cunhado, ouviu falar no churrasco", dúvidas que tem, o que planeja).

**Opcionais (menos importantes):**

- E-mail
- Valor de crédito (se já tem carta ou um valor em mente, ex.: R$ 500 mil) → usado no cálculo da comissão
- **Gênero** e **idade** (o Raul disse que esses importam)

### 3. Contato ativo com o indicado

- Lugar para **chamar a pessoa ativamente** e gerir o contato: mandar mensagem, registrar tentativas.
- Registrar **"tentou contato e não respondeu"**.
- **WhatsApp** faz parte do processo.

### 4. Comissão e pagamento

- O Raul paga o parceiro por indicação. Exemplos que ele deu: **R$ 400 por pessoa indicada**, ou um valor **a cada R$ 100 mil de carta**.
- O valor depende do **nível do parceiro** e do **valor da carta**.
- O **Raul lança a data de fechamento** do contrato.
- **Data de pagamento = data de fechamento do contrato + prazo do nível.** Calculada automaticamente.
  - Nível 1: prazo mais longo.
  - Nível 2: prazo mais curto.
  - Nível 3: recebe **no mesmo mês** do fechamento.
  - Prazos **configuráveis** pelo Raul.
- O parceiro vê **quando e quanto** vai receber de cada indicação.

### 5. Níveis e recompensas

- O parceiro começa no **Bronze** e sobe de nível conforme indica (… até **Platinum**).
- Quanto mais alto o nível, **melhores as recompensas**.
- O sistema mostra **quanto falta** para o próximo nível (ex.: "faltam X indicações para Platinum").

### 6. Dashboard e relatórios (Raul)

- **Dashboard na tela inicial** com filtro de período pré-configurado: dia, semana, mês etc.
- Relatório com:
  - **quantas pessoas indicaram** (parceiros ativos);
  - **quantas indicações** cada um fez;
  - **quantas faltam** para cada parceiro subir de nível;
  - **valor de cada indicação** (ex.: o pai do fulano quer uma carta de R$ 500 mil).

### 7. Cadastro de parceiros e onboarding

- **Só o Raul cria a conta** do parceiro. Não tem autocadastro.
- Ao criar, o parceiro **recebe um e-mail** de convite, e o sistema também **gera um link** para o Raul mandar direto no WhatsApp, se preferir.
- **Todo cliente que compra pode virar parceiro.** Isso é apresentado no onboarding.
- **Onboarding é obrigatório e importantíssimo.** O Raul explica tudo pessoalmente, e o sistema tem um **tour com balõezinhos** que acompanha essa explicação:
  - deixa o onboarding mais fácil para o Raul conduzir;
  - serve para o parceiro **relembrar** depois (dá para rever o tour).
- O tour cobre: como indicar, os níveis, quando e quanto recebe.

### 8. Notificações

- **E-mail automático** a cada mudança relevante.
- **WhatsApp** no meio do processo.

---

## Protótipo (`app/`)

Next 16 + Tailwind 4, com a mesma linguagem visual do painel do CT Argel Riboli (fundo cinza claro, sidebar em ilha branca, preto como cor principal, vermelho só em detalhe, tema escuro opcional).

```bash
cd plataforma/app && npm install && npm run dev   # http://localhost:3100
```

- **Ainda sem banco.** Os dados são de exemplo e ficam no navegador (localStorage). A camada `src/lib/loja.tsx` concentra todas as ações, para trocar por Supabase sem mexer nas telas.
- **Login de demonstração:** abaixo do cartão de login há atalhos para entrar como Raul ou como parceiro. O parceiro Thiago (convite pendente) abre o onboarding guiado.
- **Raul:** Início (dashboard com período), Indicações (quadro arrastável + lista), tela do lead, Parceiros (convite por e-mail e link para WhatsApp), Pagamentos, Relatórios (exporta CSV), Níveis e prêmios (configurável).
- **Parceiro:** Início (nível, quanto falta, quando e quanto recebe), Indicar alguém (modal), Minhas indicações (só leitura, com passo a passo), Níveis e prêmios, onboarding guiado.
- **E-mails automáticos** são simulados: cada mudança relevante fica registrada (tela do parceiro e do lead) e aparece um aviso.
- **Níveis e comissão são provisórios:** Bronze/Prata/Ouro/Platinum com valor fixo + valor a cada R$ 100 mil e prazo por nível. O Raul passa os definitivos e edita na própria tela.
- **Etapas usadas:** Novas → Em contato → Sem resposta → Em negociação → Contrato fechado → Comissão paga, e Não avançou.

## Decisões de design

- **Base Apple-like, sem ruído.** Canvas cinza frio e neutro (`#f1f2f4`), cartões brancos com sombra leve, preto como cor de ação e vermelho só em detalhe (marca, campo obrigatório, atraso, item novo). Nenhum cartão preto em métricas, nenhum brilho colorido ou degradê decorativo. O único bloco escuro é o cartão de nível do parceiro, que é o centro emocional da tela dele.
- **Botões primários pretos.** Um por contexto. WhatsApp usa verde suave (fundo claro, texto verde), não um bloco saturado.
- **Gráficos legíveis.** Escala de cinzas que termina no preto (`--serie-1..4`); toda parte colorida mostra o número ao passar o mouse ou focar (`Dica`/`DicaGrafico`). Gráfico de barras do início com 300 px de altura e totais na legenda. Porcentagem de variação só aparece quando existe base de comparação.
- **Gamificação contida.** Insígnias desenhadas em SVG (medalha, troféu no topo; o Raul escolhe só a cor do miolo), barras que enchem uma vez ao abrir, números que contam até o valor, e um único momento de conquista quando um contrato recente faz o parceiro subir de nível (aparece uma vez, sem confete).
- **Criar é sempre modal.** Nova indicação, novo parceiro, novo nível, fechamento, ajuste do negócio e edição de dados abrem em modal (renderizado no `<body>`, cobrindo a tela toda). Detalhes abrem em página. Ações reversíveis mostram aviso com **Desfazer**.
- **Controles próprios.** Sem `select` ou `input date` nativos: `Selecao` (com busca e teclado), `CampoData` (calendário), `Marcador` (checkbox), chips para opções curtas. Tabelas com a linha inteira clicável e paginação a partir de 20 itens.
- **Ajuste do negócio.** O Raul corrige valor da carta e data do fechamento e vê a comissão recalculada pelo nível congelado no fechamento, com a conta exposta (fixo + proporcional). Pode definir a comissão manualmente com motivo; fica no histórico como nota interna.
- **Busca como paleta de comandos** (Ctrl/⌘ K): ações rápidas, indicações, parceiros e recentes, tudo pelo teclado.
- **Linguagem profissional.** Português correto, sem gírias; “onboarding guiado” em vez de “tour com balõezinhos”. Etapas para o parceiro: Recebida, Raul fez contato, Em negociação, Contrato fechado, Comissão recebida.
- **Movimento com propósito.** Entrada curta da página, modais e menus; animações respeitam “reduzir movimento”.

## Código para reaproveitar

| Projeto | Caminho | O que dá para pegar |
|---|---|---|
| **CRM 4YU (Garimpo)** | `~/dev/4yu-apps/crm` | Base de CRM: leads, quadro, front Next + shadcn + Supabase. No ar em crm.4yumkt.com.br. |
| **Traxium** | `~/dev/traxium-saas` | Dashboards e componentes de painel (Next + Radix + Recharts). |
| **AutoFluxos** | `~/dev/4yu-apps/autofluxos-v2` | Login (better-auth), Supabase com realtime e integração com WhatsApp. |

## Pendências — o Raul vai passar

- [ ] **Identidade visual** (feita pelo Rodrigo).
- [ ] **Níveis**: nomes, quantos são e o critério para subir (número de indicações? indicações fechadas? valor total das cartas?).
- [ ] **Comissão por nível**: valor fixo por indicação, valor por R$ 100 mil de carta, ou os dois.
- [ ] **Prazo de pagamento por nível**: quantos dias/meses após o fechamento nos níveis 1 e 2.

## Perguntas em aberto

- **Etapas do quadro**: quais colunas? Ex.: Indicado → Contatado → Sem resposta → Em negociação → Contrato fechado → Pago / Perdido.
- **A comissão conta a partir de quando**: no cadastro da indicação ou só quando o contrato fecha?
- **WhatsApp**: só um botão que abre a conversa (link `wa.me`) ou envio automático pela API oficial (tem custo e exige aprovação da Meta)?
- **Quais e-mails disparam**: indicação recebida, mudança de etapa, contrato fechado, pagamento agendado, subiu de nível?
- **Nível usado no pagamento**: se o parceiro sobe de nível entre o fechamento e o pagamento, vale o prazo do nível antigo ou do novo?
- **"Mesmo mês" no nível 3**: se o contrato fecha no dia 30, paga no mesmo mês ou no próximo?
- **LGPD**: o parceiro vai cadastrar dados de terceiros (nome, telefone). Precisa de consentimento do indicado e de um aviso de privacidade.
