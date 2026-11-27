# Referências da LP v3

Links que o Raul mandou em 25/11/2026. Capturas (HTML renderizado + assets) em `~/dev/refs/raul/<site>/`, fora do repo.

| Site | O que o Raul disse | O que pegamos |
|---|---|---|
| makeready.framer.media | "Não curti o layout, mas achei muito zica essa parada de ir fazendo enquanto eu desço" | Efeito de construção (abaixo) |
| velorn.framer.website | "Top, inclusive o layout" | Referência principal de layout e ritmo |
| atlasdesign.framer.ai | "Legal", "um dos mais massa" — mas "que vermelho Ademicon, eu não sou Ademicon, faz com outro vermelho" | Faixa de números, cards de processo |
| spector.framer.website (template Spector do marketplace; preview deduzido, confirmar) | "Muito fera, podíamos ter falando das modalidades do consórcio" | Seção de serviços → modalidades |

## Achados técnicos

### Makeready — "Swarm Build"
Code component próprio (`toplevel-deps.*.mjs`, busque `__swarmBuild`). Cursores estilo Figma com etiqueta de nome entram na página e "constroem" cada seção quando ela entra na viewport:
- elementos começam escondidos por `clip-path` (atributo marcador, restaurado no fim);
- cursor desenha a caixa com medida ao vivo (`103 × 39`), depois o conteúdo aparece; texto é digitado letra a letra com cursor de texto;
- 5 cursores, cores CMYK + vermelho + verde, nomes "Agent 01, Ops, Research, Design, QA…", fonte Geist Mono;
- botão "Skip build" / "Replay build"; opção de rodar só na primeira visita; desliga no canvas e em `beforeprint`.
- Entrada inicial: `ease [0.22, 1, 0.36, 1]`, 0.9s.

### Velorn
- Fundo `#0b0b0b`, acento vermelho `#fc201f` (e `#b00806` escuro); seção vermelha em tela cheia com imagem central e texto gigante em marquee passando por trás.
- Tipo: Inter Medium, display 72–132px, `letter-spacing` −0.045 a −0.065em, `line-height` ~1em. Rótulos IBM Plex Mono caixa-alta, padrão `02 / CULTURE & FASHION`.
- Motion: títulos entram por máscara, linha a linha (`translateY(110%)` → 0). Easing único em tudo: `cubic-bezier(.22,1,.36,1)`, 0.5–0.7s, stagger 0.13s. Hover de botão com letras em onda. Grain animado no fundo (`@keyframes velorn-grain`).
- Lista de serviços em tipo grande, um item por linha com divisória fina e índice `(01)`.
- Depoimento com palavra sendo "apagada" por bloco de cor sólida.
- Rodapé com a marca gigante ocupando a largura.
- CSS autoral legível em `~/dev/refs/raul/velorn/_custom.css`.

### Atlas
- Escuro `rgb(12,14,18)`, Golos Text, cards `rgba(255,255,255,.06)` com raio 2–4px.
- Entrada: fade + subida, 0.6s, `ease [0.12,0.23,0.5,1]`, delays 0.3→0.8s.
- Faixa de 3 números grandes + legenda; processo em 3 cards (Discover / Design / Launch).
- Vermelho-laranja `#ff4112` — o que o Raul chamou de "vermelho Ademicon".

### Spector
- Plus Jakarta Sans, `letter-spacing` −0.05/−0.06em, grafite `#262a2d`, vermelho `#f94137`.
- **Seção de serviços** (a que o Raul quer para modalidades): lista à esquerda (Brand Identity, Product Design…), imagem no centro, sub-itens à direita. Título em escada ("WE / BUILD BRANDS. / THEN WE GIVE THEM…") que passa de cinza para escuro conforme rola.
- Entradas com mola (`spring`, bounce 0.2) e tween `[0.36,0.91,0.56,1]` 0.7s.
- Bloco de números com legenda à direita (24 / 78%).

## Estado da v3 (26/11/2026)

- No ar: https://raul-consorcio-v3.vercel.app (conta Vercel `gabrielbarbosa-8923`; deploy a partir de uma cópia do `dist/` numa pasta chamada `raul-consorcio-v3`).
- Imagens por IA: `ia-imagens/` (fora do git) com referência + `PROMPT.txt`. Ao receber: `hero` → `public/img/hero.webp` (trocar foto e enquadramento centralizado na abertura), `retrato` → `public/img/raul-perfil.webp`, modalidades → `public/img/mod/<id>.webp` (aparecem sozinhas no build).
- Reels: códigos em `src/components/Videos.astro`. "A história do Raul" (`DaAkSMXsD3_`) foi removido do Instagram.
- Lead: `gravarLead()` em `Simulacao.astro` envia para `PUBLIC_LEAD_ENDPOINT` quando existir; hoje vai só pelo WhatsApp. `?ref=CODIGO` registra o parceiro.
- Rodada de conversão (26/11): seções Casos ("Qual é o seu momento?"), Promessas ("O que eu nunca vou te prometer" + link BC), ParaQuem; simulação com comparativo consórcio × financiamento (juros de referência em `FIN`, hipótese), passos pós-envio, consentimento LGPD obrigatório e página `/privacidade`; `?tipo=imovel|veiculo|pesados|servicos|investimento` pré-seleciona; eventos `sim_passo`, `sim_envio`, `Lead` vão para `dataLayer`/`fbq` quando instalados.
- Pendente do Raul: depoimentos reais, números (clientes, contemplados, valor em cartas), logos das administradoras, CNPJ, tempo de resposta, taxas reais por modalidade, IDs do GA4/Pixel.
