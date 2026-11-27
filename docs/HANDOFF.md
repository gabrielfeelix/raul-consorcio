# Handoff — LP versão A: refazer "Como funciona" e "Com o Raul"

Leia antes: `docs/STATE.md` e `docs/DECISIONS.md`. Base: commit `dd40a3c` (main).
No ar: https://raul-consorcio-v3.vercel.app (versão A; `/b/` é teste, ignorar).

## O problema
Duas seções seguidas repetem o mesmo esqueleto: **título + texto à esquerda (sticky) e uma lista vertical crescendo à direita**.
- `website/app/src/components/Construcao.astro` — "Como funciona o consórcio": linha do tempo vertical com 5 etapas e ícones; animação em `construir()` de `src/scripts/motion.ts`.
- `website/app/src/components/ComORaul.astro` — "Como é fazer consórcio com o Raul": conversa estilo WhatsApp (3 trocas), balões entram em sequência.

O Gabriel (designer) quer que cada uma tenha apresentação própria, do jeito que LPs modernas de produto/design apresentam processos. Pode virar 2 seções novas em vez de uma.

## Tarefa
1. Pesquisar como LPs modernas apresentam processo/etapas: Framer marketplace e templates, Godly, Awwwards, landing pages de fintech e produto (ex.: Nubank, Revolut, Stripe, Linear, Wise, Mercury). Trazer 4–6 referências concretas com URL e o mecanismo de cada uma (interação, layout, motion).
2. Escolher e implementar uma apresentação para "Como funciona" e outra, diferente, para "Com o Raul". Decisões de layout, tipografia e motion na thread principal (Opus).
3. Validar: prints 1440×900 e 390×844; rodar um agente persona de baixo letramento (ex.: motorista de app, 5ª série, desconfiado) e um crítico de design de estúdio. Corrigir o que eles apontarem.
4. Publicar (abaixo), commit e push na main, atualizar `docs/STATE.md`.

## Regras do Gabriel e do Raul (valem para tudo)
- **Não** usar: texto à esquerda + componente vertical à direita; blocos iguais lado a lado (3–4 colunas); barrinha vertical vermelha ao lado de texto; numeração 01/02/03; rótulo pequeno em caixa alta acima de título; visual de "revista editorial" (só tipografia grande, fios e frases soltas). Tudo isso lê como "cara de IA".
- **Sim**: componentes modernos e bonitos, com affordance óbvia, pouca informação por bloco. Texto de leitura alinhado à esquerda; centralizar só título de impacto.
- Manter os termos técnicos (mostram que o Raul é do ramo), sempre com explicação simples junto: carta de crédito = valor do bem; contemplação = quando o dinheiro sai; lance = entrada para sair antes; assembleia = sorteio do mês; taxa de administração = pagamento da empresa, já na parcela. O conteúdo atual das 5 etapas está no array `passos` de `Construcao.astro`.
- O Raul e o Gabriel gostaram da ideia da **conversa** (dúvida do cliente + resposta do Raul). Pode mudar a forma, não precisa sumir. Não usar moldura de app (barra verde/fundo bege): só rosto + balões.
- Página curta e mobile-first: sem pin longo, sem layout shift em animação, sem esperas longas (a conversa roda inteira em ~4 s). WhatsApp sempre verde (`#1a8f4a`). Copy calma, sem pressa.
- A logo RC (provisória) não explica etapas: fica só na marca.

## Rodada 27/11 (tarde) — o que já foi tentado e reprovado
- **Implementado e descartado** (não commitado): stepper com barras tipo stories + "palco" com roda de 10 ícones de pessoa, chips de termo, botões "< Próxima"; conversa com botões de resposta rápida. Gabriel: "cara de IA, ícones muito ruins". Ícone de linha genérico e stepper de SaaS = reprovado.
- **Referências reprovadas**: demos do marketplace Framer (Scroll Stack Cards, Scroll Flip, How It Works Steps, Stack Scroll Reveal, Scroll Services 3D, Split Cards), Apple Card, Raycast, Chat Messages, Bodak chat modal (nem existe mais no site), Awwwards: Mansellmade, Iris Yirei Hu, Paxafe, Omnira, Zelh.
- **Áudio/voz do Raul: não** (cringe). Conversa só em texto.
- **Sobreviveram (ponto de partida)** — Awwwards Inspiration:
  - "da pra pensar": Studio Nordost, processo com ícones em motion — https://www.awwwards.com/inspiration/our-process-studio-nordost (vídeo: https://assets.awwwards.com/awards/element/2025/07/686539d584989772074281.mp4)
  - "+-": Mosey, cena ilustrada que muda por etapa — https://www.awwwards.com/inspiration/hero-section-animations-mosey (vídeo: https://assets.awwwards.com/awards/element/2024/04/66211e5b9f18c987559463.mp4)
  - "viajadão mas legal": Gigantic Media, process steps — https://www.awwwards.com/inspiration/process-steps-gigantic-media
  - "viajado mas legal": 1910 Genetics, storytelling timeline — https://www.awwwards.com/inspiration/storytelling-timeline-1910-genetics
  - Condição do Gabriel: ousado pode, mas **fácil de entender** para cliente leigo.
- **Como trabalhar a próxima rodada**: ver os 4 (frames de vídeo via ffmpeg `fps=6/dur,tile=3x2`, ou filmstrip Playwright), extrair o mecanismo comum, propor 1–2 direções em texto + 1 quadro de referência ANTES de codar, esperar ok. Fonte que funcionou: busca `site:awwwards.com/inspiration <tema>`; vídeos em `assets.awwwards.com/awards/element/...mp4`. Fonte que não funcionou: marketplace Framer (genérico).

## Como publicar
```
cd website/app && npm run build
D=<pasta de deploy ligada ao projeto raul-consorcio-v3>
cp -r dist/. $D/ && cd $D && vercel deploy --prod --yes
```
A pasta de deploy anterior ficava no scratchpad da sessão e some. Se não existir: criar pasta nova, copiar `dist/`, `vercel link --yes --project raul-consorcio-v3` (conta `gabrielbarbosa-8923`) e **apagar o `.env.local` e o `.gitignore` que o link cria** antes do deploy (senão sobem como arquivo público). Playwright para QA: `npm i playwright` numa pasta do scratchpad (chromium já está em `~/.cache/ms-playwright`). Servir `dist/` com `python3 -m http.server`.

## Pegadinhas já resolvidas (não reintroduzir)
- `motion.ts` captura links `href^="#"` para rolagem suave; confere o href no clique porque o botão de WhatsApp do resultado nasce `#` e vira externo.
- No `<script>` da simulação, não usar variáveis antes de declarar (já quebrou o resultado uma vez).
- Astro engole espaço entre texto e elemento inline quando há quebra de linha no markup.

## Ainda depende do Raul
CNPJ real (o zerado no rodapé é o maior gatilho de desconfiança), administradoras parceiras, depoimentos reais com foto, fotos novas dele, taxas reais por modalidade, revisão dos textos na voz dele (FAQ de FGTS inclusa).
