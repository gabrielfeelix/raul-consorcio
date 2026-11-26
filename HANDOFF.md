# Handoff — Raul Consórcio

Estado em 25/11/2026. Leia isto antes de mexer em qualquer coisa.

## O que é

Três projetos para o Raul Vitor (marca **Raul Consórcio**), consultor de consórcio focado em planejamento patrimonial.

| Pasta | O que é | Como rodar | Estado |
|---|---|---|---|
| `plataforma/app` | Plataforma de indicações: Raul gere indicações e parceiros; parceiro indica e acompanha comissão e nível | `npm install && npm run dev` → http://localhost:3100 | Protótipo completo, **sem banco** (dados de exemplo no localStorage via `src/lib/loja.tsx`) |
| `calculadora/app` | Calculadora consultiva de consórcio de imóvel, em 5 passos numa dobra só | `npm install && npm run dev` → http://localhost:5174 · `npm test` (22 testes) | Pronta para apresentar; regra de antecipação é hipótese |
| `website/` | Landing page v2 estática no ar (raul-consorcio.vercel.app) | estático, `website/site/` | **v3 ainda não começou** (próxima grande tarefa) |

Requisitos detalhados de cada um: `README.md` de cada pasta (vieram das reuniões com o Raul).

## Identidade (manual oficial: `MANUAL RAUL.pdf` na raiz)

- **Paleta (só estas):** vinho `#7A0000` (principal), vermelho Ademicon `#CE2616`, preto `#111111`, cinza escuro `#2D2D2D`, cinza claro `#E5E5E5`, branco.
- **Regra do usuário:** vinho **só no botão principal/CTA**. Resto em neutros sóbrios (cinza frio, nunca bege). Vermelho `#CE2616` para custo/alerta. Verde só com função de sinal positivo ("isso é bom pra você": ganho, valorização, economia).
- **Fonte:** Montserrat em tudo (inclusive números, com `tabular-nums`).
- **Tom:** consultor, nunca vendedor. Simples, direto, elegante. Sem exclamação, pressão, sensacionalismo, linguagem infantil. Frase central: "Menos impulsividade. Mais estratégia." Promessa: "Você não compra um consórcio. Você constrói patrimônio."
- **Estilo:** muito espaço negativo, poucos elementos e ícones, **sem cara de IA** (o usuário cobra isso muito). Cards pouco arredondados (~10–12px). Ações têm que parecer botões, não cards.
- **Nome:** manual diz "Raul Consórcio"; o CNPJ é "Raul Consórcios Multimarcas". Falta o Raul confirmar. Hoje as telas usam "Raul Consórcio".

## Logo (em andamento)

- Gerada via ChatGPT (imagens), escolha: **direção C** — três volumes ascendentes, o último termina em telhado (patrimônio construído passo a passo → imóvel; os 3 volumes = os 3 pilares do manual). Texto: "**Raul** Consórcio" (Raul SemiBold, Consórcio Regular).
- **Próximo passo:** redesenhar a C em SVG com as cores exatas (volumes mais finos, espaçamento igual), fazer favicon simplificado para 16/32px, ícone de app, versões vinho/branco/preto. Depois trocar o selo provisório "R" em `plataforma/app/src/components/layout/Marca.tsx`, no header da calculadora (`calculadora/app/src/App.tsx`, classe `.marca__nome::before`), na carta (`Carta.tsx`) e no PDF (`PrintReport.tsx`). Depois, animar a logo em SVG para a landing e Reels.

## Decisões importantes da plataforma

- Dois papéis: **Raul** (move cards no quadro, edita lead, fecha contrato, paga) e **parceiro** (só indica e acompanha; não move nada).
- Login aceita qualquer e-mail/senha (e-mail de parceiro cadastrado abre a visão dele). Trocar de perfil: menu do usuário → modal.
- Comissão = valor fixo + (carta ÷ 100 mil) × valor por 100 mil do nível; nível congelado no fechamento; data de pagamento = fechamento + prazo do nível (ou fim do mês). Comissão manual com motivo sobrescreve. Regras em `src/lib/regras.ts`.
- Níveis provisórios Bronze/Prata/Ouro/Platinum (o Raul vai passar os definitivos; editáveis na tela).
- Criação sempre em modal (`src/components/acoes/Acoes.tsx`), nada de `<select>`/date nativo (`src/components/ds/controles.tsx`), modais via portal.
- Formulário de indicação: "Relação com você" (chips + "Outro" com texto) + "Conte um pouco sobre ela"; grava em `quemE` como "Relação. Contexto".
- Gráfico do dashboard agrupa: dia (7d), semana (30d), quinzena (90d), mês (ano).
- Fundo do login: foto Unsplash `public/login-fundo.webp` escurecida para o lado do cartão.

## Decisões da calculadora

- Layout configurador (inspirado no configurador Tesla): palco escuro à esquerda, painel claro à direita, passos no topo. O usuário **adorou** esse layout — não mexer na estrutura.
- Passos: A carta → A parcela (rosca da composição + antecipar ou não) → O tempo (gráfico arrastável carta × pago) → Compare (barras deitadas: CDB, Tesouro, financiamento) → Resumo (folha + PDF A4 de uma página).
- Fórmulas em `src/lib/` com testes. Antecipação (`antecipacao.ts`) é **hipótese**: precisa de uma simulação real da Ademicon com e sem antecipação.
- Estilos: `src/styles.css` (tela) e `src/print.css` (PDF; variáveis escopadas em `.print`, não em `:root`).

## Pendências com o Raul

Identidade final/logo aprovada · nome oficial · níveis e comissões definitivos · prazos de pagamento por nível · regra real da antecipação e taxas padrão da Ademicon · texto do aviso legal permitido · depoimentos reais com autorização · CNPJ · perguntas da simulação da LP.

## Próximas tarefas prováveis

1. Logo em SVG (direção C) e aplicação em tudo.
2. Landing page v3 (`website/`), seguindo `website/README.md` + manual: apresentar o Raul, gerar confiança, simulação consultiva no fim (20% resultado, 80% conversa), respostas salvas no CRM da plataforma.
3. Backend da plataforma (Supabase próprio do Raul; e-mail real; WhatsApp).

## Como o usuário gosta de trabalhar

- Português, direto. Mostra prints e manda áudio transcrito; lê tudo com olhar de UX/UI exigente.
- **Não delegar para subagentes** — fazer o trabalho direto.
- Conferir visualmente com Playwright antes de dizer que está pronto (o Chromium instalado precisa de `executablePath` apontando para `~/.cache/ms-playwright/chromium_headless_shell-1243/*/chrome-headless-shell`).
- Commit e push só quando ele pedir. Se o servidor da plataforma mostrar CSS velho, apagar `plataforma/app/.next` e reiniciar.

## Git

Último commit: `9817891`. **Há trabalho sem commit** (identidade do manual na plataforma e na calculadora, novo início do parceiro, formulário de indicação, cores contextuais, gráfico agrupado) e o `MANUAL RAUL.pdf` não versionado. Pergunte antes de commitar.
