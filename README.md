# Raul Consórcio

Landing page e blog do Raul Carvalho — especialista em consórcios (Ademicon, Maringá/PR).

**No ar:** https://raul-consorcio.vercel.app

---

## Estrutura

| Caminho | O que é |
|---|---|
| `site/` | **O que está publicado.** Build estático da v2, com as correções de mobile, favicon e títulos. É esta pasta que a Vercel serve. |
| `*.dc.html` (raiz) | Arquivos originais do canvas do Claude Design, com o runtime `support.js`. Fonte de onde a v2 nasceu — **não refletem as correções aplicadas em `site/`**. |
| `assets/` | Foto do Raul e logo da Ademicon, originais em PNG. |
| `uploads/` | Material de referência: screenshots do Instagram dele, iterações anteriores de layout, vídeo de teste. |

## Rotas do site publicado

| Rota | Página |
|---|---|
| `/` | Simulação guiada (home) |
| `/blog` | Blog — dúvidas explicadas em vídeo e texto |

## Deploy

Estático, sem build step. A partir de `site/`:

```bash
vercel deploy --prod --yes --scope gabriels-projects-039c9dc7
```

`vercel.json` liga `cleanUrls`, então `/blog` serve `blog.html`.

## Estado atual

**v2 — no ar.** Inclui as correções de layout mobile: as colunas com `position:sticky` deslizavam por cima do conteúdo quando empilhavam no celular (afetava Objeções, Simulação e FAQ); depoimentos passaram de 3 para 2 colunas; o mockup de vídeo passou a ocupar a largura total.

**v3 — em desenho.** Redesenho para tirar a estética de template: vocabulário de containers no lugar do card único, dobras alternadas claro/escuro herdando a linguagem dos carrosséis do Instagram dele, sistema de motion próprio e migração para Next + Tailwind.

## Pendências conhecidas

- **Os depoimentos são fictícios** — nomes e fotos de banco de imagem. Consórcio é produto regulado pelo Banco Central; precisam virar depoimentos reais com autorização antes de qualquer divulgação.
- **O vídeo do hero é de banco de imagens**, usado só como teste. Precisa ser substituído por material do Raul.
- As páginas não têm `noindex` — estão indexáveis por buscadores.
