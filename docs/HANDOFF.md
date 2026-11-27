# Handoff — rodada "tirar a cara de IA" da LP (versão A)

Leia antes: `docs/STATE.md`. Trabalhar na versão A (`website/app/src/pages/index.astro`).

## Feedback do Raul (WhatsApp, 26/11) + decisões do Gabriel
O Raul gostou da linha geral e dos efeitos de página "abrindo e fechando". Achou "cara de IA" em padrões específicos:

1. **Blocos iguais lado a lado** (3 ou 4 colunas): fatos do Consultor ("8 anos | Multimarcas | Maringá/PR"), garantias da Simulação ("1 min | 0 | 100%"), os 4 cards de `Casos.astro`, passos do resultado da simulação.
2. **Barrinha vertical vermelha** ao lado de texto: citação em `Consultor.astro` (~linha 86), "Caminho possível" em `Simulacao.astro` (~linha 555).
3. **Numeração 01/02/03** e rótulo pequeno em caixa alta acima dos títulos (`.rotulo` com `<b>NN</b>` em ~9 seções; `prom__n` em Promessas; contador em ParaQuem).
4. **Seções de texto em geral**: o Gabriel acha especialmente ruim `Promessas.astro` (frase riscada à esquerda + "A verdade" à direita) — refazer de outro jeito ou remover.

Regra do Gabriel (designer): **não centralizar texto de leitura**. Leitura em F, alinhada à esquerda. Centralizar só título de virada/seção de impacto.

## Pedidos concretos do Raul
- Botão do **WhatsApp no topo** (Nav). Link: `wa()` em `src/data/site.ts`.
- **Capa**: título "Seu próximo grande passo começa com um plano". Sub: "Consultoria personalizada com Raul Carvalho. Presencial e online." (ele atende fora do PR também; não parecer regional).
- **Ordem** (menu e página): Quem é o Raul → Como funciona → Tipos de consórcio → Depoimentos → Simulação (simulação por último).
- **Consultor**: nome "Raul Carvalho" numa linha só (fonte menor); "Consultor de consórcio" → "Especialista em consórcio"; manter "8 anos"; "Multimarcas" → "Mais de 100 clientes atendidos com consórcio"; trocar "Maringá/PR" por algo não regional (ex.: "Presencial e online, em todo o Brasil"). Foto será trocada quando ele mandar as novas.
- Estrutura combinada com ele: 1 capa → 2 quem é ele e o objetivo → (uma "parada" visual de transição, ref.: marquee grande tipo PCYES Drop Dead) → 3 como funciona o consórcio → 4 como funciona com ele (tipos/depoimentos) → 5 simulação.

## LP longa / scroll cansativo
- `Construcao.astro` pina `+=320%` e `Revelacao` pina `+=360%` (em `src/scripts/motion.ts`). O próprio Raul perguntou se alguém chegaria ao fim. Reduzir os pins (~150–180%) e encurtar a página: candidatos a sair ou fundir são `Casos`, `Promessas`, `ParaQuem`, `Videos` (decidir com o Gabriel).

## Sugestão de execução
1. Remover números dos rótulos (ou o rótulo inteiro onde for redundante).
2. Tirar as barrinhas verticais; citação do Consultor com tipografia maior, sem barra.
3. Fatos do Consultor em lista empilhada (número/negrito + texto), sem 3 colunas; garantias da Simulação viram uma frase.
4. Refazer/remover Promessas; tirar Casos; revisar ParaQuem (tirar 01/02).
5. Pedidos concretos acima + reordenar `index.astro` e links do `Nav.astro` (Nav aceita prop `links`).
6. Encurtar pins.
7. QA em print (desktop 1440×900 e mobile 390×844) antes de publicar.

## Como publicar
```
cd website/app && npm run build
D=<pasta de deploy com .vercel ligada ao projeto raul-consorcio-v3>
cp -r dist/. $D/ && cd $D && vercel deploy --prod --yes
```
A pasta de deploy antiga estava no scratchpad da sessão anterior e pode ter sumido. Se sumiu: criar pasta nova, copiar `dist/` e rodar `vercel link` no projeto `raul-consorcio-v3` (conta `gabrielbarbosa-8923`) antes do deploy. `public/vercel.json` já força barra no fim (`/b` → `/b/`).

Commit/push: Gabriel autoriza push direto na `main` (padrão do repo).
