# Estado — Landing page v3 (Raul Consórcio)

Atualizado: 2026-11-27. Commit base: `34f8ab0`.

## Onde está
- Código: `website/app/` (Astro 7 estático + GSAP/ScrollTrigger + Lenis, Montserrat Variable, CSS puro com tokens em `src/styles/global.css`).
- Publicado (protótipo, noindex): https://raul-consorcio-v3.vercel.app (versão A) e `/b/` (versão B).
- Deploy é manual (Vercel CLI, conta `gabrielbarbosa-8923`); push no GitHub NÃO publica. Ver `docs/HANDOFF.md`.
- Marca: monograma RC **provisório** (`public/marca/rc.svg`, `rc-branco.svg`, `favicon.svg`; desenho também inline em `Construcao.astro`). O símbolo de 3 barras saiu: não é a logo do Raul. Logo final ainda vai ser feita (ref.: "RC Premium 01").
- Paleta: vermelho `#A6111F`, vinho `#7A0000`, preto `#0B0B0C`, papel `#F4F4F4`.

## Versões
- **A** (`src/pages/index.astro`): Hero → Consultor → Faixa (marquee) → Construcao (pin 100%; o C do RC se desenha em 3 trechos, R no fim) → Revelacao (pin 110%, abre com a frase "o plano vira patrimônio"; troca de fotos por tempo) → Modalidades (lista) → Depoimentos → Videos → Simulacao → Faq. Página: 13,2 telas desktop 1440×900 / 14,0 mobile 390×844 (Drop Dead da PCYES, que o Raul achou "tamanho top": 14,1). Feedback do Raul: `Downloads/Alterações da Landing Page.zip` (WhatsApp 26/11).
- **B** (`src/pages/b.astro`, componentes em `src/components/b/`): narrativa "sonho + dúvidas", Raul depois. O cliente (Raul) prefere começar por ele, então a A é a base a seguir; B fica como teste.

## Pendências do cliente (dependem do Raul)
Fotos novas dele; depoimentos reais autorizados (hoje são exemplo, fotos Unsplash); CNPJ (placeholder em `src/pages/privacidade.astro`); taxas reais por modalidade (`REF`/`FIN` em `src/components/Simulacao.astro` são hipóteses); IDs GA4/Pixel; endpoint de leads (`PUBLIC_LEAD_ENDPOINT`).

## Prioridade do cliente
Calculadora primeiro. LP só vai ser divulgada no ano que vem; sem pressa.
