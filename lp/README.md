# LP — Raul Consórcio

Landing page e blog do Raul Carvalho — Raul Consórcios Multimarcas, especialista em consórcios multiempresas.

**No ar:** https://raul-consorcio.vercel.app

---

## Escopo (reunião com o Raul, 2026-11-16)

> **A LP é a prioridade** entre os três projetos.

LP para o Raul se vender, usando a **marca dele**: logo, branding e a mesma apresentação que ele usa no Instagram.

### Posicionamento e marca

- Nome: **Raul Consórcios Multimarcas** (CNPJ próprio do Raul).
- Título: **Especialista em Consórcios Multiempresas**.
- Ele trabalha com **várias administradoras**, não só com a Ademicon.
- O CNPJ dele fica abaixo do da **Faça Consórcios**, mas ele **não quer a Faça Consórcios na LP**. Usar só o CNPJ dele.
- [ ] Receber a **identidade visual** feita pelo Rodrigo (logo, cores, fontes) e aplicar na v3.
- [ ] Pegar o **número do CNPJ** do Raul para o rodapé.

### Objetivo

- A LP **não ensina consórcio**. Ela **apresenta o trabalho do Raul**, **gera confiança** e leva a pessoa a **fazer a simulação**.
- O visitante **não fecha nada pela LP**. Ele precisa conversar com o Raul.
- **Linguagem acessível:** quem não entende de consórcio tem que entender o que está lendo.
- **Tráfego:** Instagram e tráfego pago. A LP é o destino dos anúncios e do link do perfil.

### Ordem da página

1. **Primeiro, o Raul:** quem ele é, como trabalha, por que confiar.
2. **Depoimentos** (o Raul adorou essa seção).
3. **Simulação no fim**, depois que a pessoa já conhece o Raul.

### Simulação (20% / 80%)

- **Consultiva, não um formulário:** as perguntas têm que dar a sensação de uma conversa com um especialista. **O Raul vai melhorar as perguntas.**
- Mostra um **resultado prévio curto**, mais ou menos **20%** da análise.
- Os outros **80%** ficam para a conversa: o Raul entra em contato para falar do caso específico.
- As **respostas ficam salvas no CRM de indicações** (mesmo banco do sistema em `indicacoes/`). Quem preenche a simulação vira lead no quadro do Raul.

### Público

- O Raul trabalha com **qualquer tipo de consórcio**: imóvel, carro, moto, outros bens. A LP atende todos.
- (Quem foca só em imóvel é a calculadora de investimento, não a LP.)

### Depoimentos

- O Raul tem **clientes reais** e vamos poder usar os depoimentos deles.
- [ ] Coletar com o Raul: nome, foto, texto (ou vídeo) e **autorização por escrito** de cada cliente.

### Referências de Instagram

- **@dan_silva** — perfil "Prefiro Consórcios". É de São Paulo, não de Maringá.
- **Consórcio Sincero** — outro perfil, separado do Dan.

### Perguntas em aberto

- **O que entra nos 20%:** só uma faixa de parcela e prazo? Uma estratégia recomendada? Precisa gerar interesse sem resolver o caso.
- **Dados de contato:** a pessoa deixa nome e telefone antes ou depois de ver o resultado prévio?
- **Indicação pela LP:** se a pessoa chegou pelo link de um parceiro, a LP registra quem indicou (ex.: link com código do parceiro)?
- **Maringá:** a LP continua dizendo "Maringá/PR · presencial e online" ou fica sem cidade?

### O que a v2 no ar precisa mudar por causa disso

- Hoje diz **"Especialista Ademicon"** em 7 lugares, com o logo da Ademicon e "Administradora parceira". Vira **multimarcas**.
- Os **depoimentos são fictícios** (fotos de banco de imagem). Trocar pelos reais.
- A simulação só abre o WhatsApp no final, **não salva as respostas**.
- A home abre com a simulação. Na v3 ela vai para o fim.

## Estrutura

| Caminho | O que é |
|---|---|
| `site/` | **O que está publicado.** Build estático da v2, com as correções de mobile, favicon e títulos. É esta pasta que a Vercel serve. |
| `*.dc.html` (raiz de `lp/`) | Arquivos originais do canvas do Claude Design, com o runtime `support.js`. Fonte de onde a v2 nasceu — **não refletem as correções aplicadas em `site/`**. |
| `assets/` | Foto do Raul e logo da Ademicon, originais em PNG. |
| `uploads/` | Material de referência: screenshots do Instagram dele, iterações anteriores de layout, vídeo de teste. |

## Rotas do site publicado

| Rota | Página |
|---|---|
| `/` | Simulação guiada (home) |
| `/blog` | Blog — dúvidas explicadas em vídeo e texto |

## Deploy

Estático, sem build step. A partir de `lp/site/`:

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
