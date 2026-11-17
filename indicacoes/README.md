# Sistema de indicações e prêmios

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
