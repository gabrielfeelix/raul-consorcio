import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";

const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

/* ---------- Interações que funcionam com ou sem animação ---------- */

// Abas de modalidades
(() => {
  const tabs = $$<HTMLButtonElement>("[data-tab]");
  const paineis = $$("[data-painel]");
  if (!tabs.length) return;
  const ativar = (i: number, foco = false) => {
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    paineis.forEach((p, k) => (p.hidden = k !== i));
    if (foco) tabs[i].focus();
    if (!reduz) {
      gsap.fromTo(
        paineis[i].children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.06 },
      );
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => ativar(i));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      ativar((i + d + tabs.length) % tabs.length, true);
    });
  });
})();

// Depoimentos
(() => {
  const itens = $$("[data-dep-item]");
  if (!itens.length) return;
  const n = $("[data-dep-n]")!;
  let i = 0;
  const ir = (k: number) => {
    itens[i].hidden = true;
    i = (k + itens.length) % itens.length;
    itens[i].hidden = false;
    n.textContent = String(i + 1);
    if (!reduz) {
      const q = itens[i].querySelector("blockquote")!;
      gsap.fromTo(q, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" });
    }
  };
  const area = $("[data-dep] .dep__itens");
  let x0 = 0;
  area?.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  area?.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) ir(dx < 0 ? i + 1 : i - 1);
  });
  $("[data-dep-ant]")?.addEventListener("click", () => ir(i - 1));
  $("[data-dep-prox]")?.addEventListener("click", () => ir(i + 1));
})();

/* ---------- Animação ---------- */

if (!reduz) {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create("raul", "0.22,1,0.36,1");
  gsap.defaults({ ease: "raul", duration: 0.8 });

  // Rolagem suave
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const alvo = a.getAttribute("href")!;
      if (alvo.length < 2) return;
      e.preventDefault();
      lenis.scrollTo(alvo, { offset: alvo === "#topo" ? 0 : -20, duration: 1.4 });
    }),
  );

  // Navegação: fundo depois do topo, some ao descer, volta ao subir
  const nav = $("[data-nav]");
  if (nav) {
    let ultimo = 0;
    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      nav.classList.toggle("is-solid", scroll > 40);
      nav.classList.toggle("is-hidden", scroll > ultimo && scroll > 400);
      ultimo = scroll;
    });
  }

  // Títulos por máscara de linha
  $$("[data-split]").forEach((el) => {
    gsap.to($$(".linha > span", el), {
      y: 0,
      duration: 1.1,
      stagger: 0.13,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // Entrada simples (fade + subida curta)
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 98%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, stagger: 0.08, overwrite: true }),
  });

  // Abertura: sequência de entrada
  const hero = $(".hero");
  const fotoImg = hero && $(".hero__foto img", hero);
  if (hero && fotoImg) {
    gsap.from(fotoImg, { scale: 1.12, opacity: 0, duration: 1.8 });
    gsap.to(fotoImg, {
      yPercent: -5,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  }

  // Frase do consultor: palavra a palavra, de apagada a cheia conforme rola
  $$("[data-fill]").forEach((el) => {
    const partes: HTMLElement[] = [];
    const quebrar = (n: Node) => {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent!.split(/(\s+)/).forEach((w) => {
            if (!w.trim()) return frag.append(w);
            const s = document.createElement("span");
            s.textContent = w;
            s.style.display = "inline-block";
            partes.push(s);
            frag.append(s);
          });
          c.replaceWith(frag);
        } else quebrar(c);
      });
    };
    quebrar(el);
    gsap.fromTo(
      partes,
      { opacity: 0.12 },
      {
        opacity: 1,
        stagger: 0.3,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
      },
    );
  });

  // Título em escada: cada degrau preenche da esquerda para a direita
  $$("[data-fill-line]").forEach((el) => {
    gsap.fromTo(
      el,
      { "--p": "0%" },
      {
        "--p": "100%",
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 85%", end: "top 50%", scrub: true },
      },
    );
  });

  // Construção do patrimônio (Swarm Build adaptado)
  const build = $("[data-build]");
  if (build) construir(build);

  // Revelação: o símbolo vira janela e cresce até mostrar o patrimônio
  const rev = $("[data-rev]");
  if (rev) {
    const masc = $("[data-rev-mascara]", rev)!;
    const img = $("[data-rev-img]", rev)!;
    const origem = () => {
      const vw = innerWidth, vh = innerHeight;
      const mh = vh * 0.34, mw = (mh * 66) / 72.5;
      // centro do terceiro volume (o do telhado) dentro do símbolo
      const ox = vw / 2 + (57 / 66 - 0.5) * mw;
      const oy = vh / 2 + ((70 - 27.5) / 72.5 - 0.5) * mh;
      return `${ox}px ${oy}px`;
    };
    const st = { s: 1 };
    const aplicar = () => {
      const o = origem();
      gsap.set(masc, { scale: st.s, transformOrigin: o });
      gsap.set(img, { scale: 1 / st.s, transformOrigin: o });
      masc.style.setProperty("--sombra", String(Math.min(1, (st.s - 1) / 20)));
    };
    const tlr = gsap.timeline({
      scrollTrigger: { trigger: rev, start: "top top", end: "+=110%", pin: true, scrub: 0.8, onRefresh: aplicar },
    });
    const dica = $("[data-rev-dica]", rev);
    if (dica) tlr.to(dica, { opacity: 0, y: -30, duration: 0.25, ease: "none" }, 0.05);
    tlr.to(st, { s: 34, ease: "power2.in", duration: 1, onUpdate: aplicar });
    tlr.to($$("[data-rev-txt]", rev), { opacity: 1, stagger: 0.1, duration: 0.3, ease: "none" });
    // Não é só imóvel: as imagens e a palavra trocam enquanto a cena segue travada
    const imgs = $$("img", img);
    // Fotos baixadas e decodificadas antes de a cena travar
    const preparar = () => imgs.forEach((im) => (im as HTMLImageElement).decode?.().catch(() => {}));
    ScrollTrigger.create({ trigger: rev, start: "top bottom+=150%", once: true, onEnter: preparar });
    // A troca de patrimônio corre no relógio, não na rolagem: a cena trava pouco
    // e quem rola rápido não pula as fotos.
    const palavra = $("[data-rev-palavra]", rev);
    const nomes = ["imóvel.", "carro.", "caminhão.", "investimento."];
    let atual = 0;
    let relogio = 0;
    const mostrar = (k: number) => {
      if (k === atual) return;
      gsap.to(imgs[atual], { opacity: 0, duration: 0.7, ease: "none" });
      gsap.to(imgs[k], { opacity: 1, duration: 0.7, ease: "none" });
      if (palavra) palavra.textContent = nomes[k];
      atual = k;
    };
    const parar = () => {
      clearInterval(relogio);
      relogio = 0;
    };
    tlr.to({}, { duration: 0.15 });
    tlr.eventCallback("onUpdate", () => {
      if (tlr.progress() > 0.85) {
        if (!relogio) relogio = window.setInterval(() => mostrar((atual + 1) % imgs.length), 1700);
      } else if (relogio) {
        parar();
        mostrar(0);
      }
    });
    ScrollTrigger.create({ trigger: rev, start: "top bottom", end: "bottom top", onLeave: parar, onLeaveBack: parar });
    aplicar();
  }


  // Faixa vermelha: trilho de palavras e foto crescendo
  const faixa = $("[data-faixa]");
  if (faixa) {
    gsap.fromTo(
      $("[data-trilho]", faixa),
      { xPercent: 0 },
      { xPercent: -33.333, ease: "none", scrollTrigger: { trigger: faixa, start: "top bottom", end: "bottom top", scrub: true } },
    );
    gsap.fromTo(
      $("[data-faixa-foto]", faixa),
      { scale: 0.72, rotate: -3 },
      { scale: 1, rotate: 0, ease: "none", scrollTrigger: { trigger: faixa, start: "top bottom", end: "center center", scrub: true } },
    );
  }

  // Marca do rodapé sobe por máscara
  const marca = $("[data-rod-marca]");
  if (marca) {
    gsap.fromTo(
      marca,
      { clipPath: "inset(100% 0 0 0)", y: 40 },
      { clipPath: "inset(0% 0 0 0)", y: 0, duration: 1.4, scrollTrigger: { trigger: marca, start: "top 95%" } },
    );
  }

  addEventListener("load", () => ScrollTrigger.refresh());
}

function construir(sec: HTMLElement) {
  const vols = $$<SVGGElement>(".vol", sec);
  const etapas = $$(".build__etapa", sec);
  const raul = $<SVGGElement>('[data-cursor="raul"]', sec)!;
  const voce = $<SVGGElement>('[data-cursor="voce"]', sec)!;

  const dados = vols.map((g) => {
    const box = g.querySelector<SVGRectElement>(".sel__box")!;
    const tag = g.querySelector<SVGTextElement>(".vol__tag")!;
    return {
      g,
      fill: g.querySelector(".vol__fill")!,
      linha: g.querySelector(".vol__linha")!,
      sel: g.querySelector(".vol__sel")!,
      handles: g.querySelectorAll(".sel__handle"),
      pill: g.querySelector(".sel__pill")!.parentElement!,
      box,
      x: +box.getAttribute("x")!,
      y: +box.getAttribute("y")!,
      w: +box.getAttribute("width")!,
      h: +box.getAttribute("height")!,
      tag,
      txt: tag.dataset.tag || "",
    };
  });

  // Estado inicial
  dados.forEach((d) => {
    gsap.set(d.fill, { scaleY: 0, transformOrigin: "50% 100%" });
    gsap.set(d.linha, { strokeDashoffset: 1 });
    gsap.set(d.sel, { opacity: 0 });
    d.tag.textContent = "";
  });
  gsap.set(raul, { x: 92, y: 120, opacity: 1 });
  gsap.set(voce, { x: -30, y: 118, opacity: 1 });

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut", duration: 1 },
    scrollTrigger: {
      trigger: sec,
      start: "top top",
      end: "+=100%",
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
    },
  });

  const marcos: number[] = [];
  dados.forEach((d, i) => {
    marcos.push(tl.duration());
    // Raul vai até o canto da caixa
    tl.to(raul, { x: d.x, y: d.y });
    // Arrasta desenhando a seleção com medida
    tl.set(d.sel, { opacity: 1 });
    tl.fromTo(d.box, { attr: { width: 0, height: 0 } }, { attr: { width: d.w, height: d.h }, duration: 1.1 }, "<");
    tl.fromTo(d.handles, { opacity: 0 }, { opacity: 1, duration: 0.2 }, ">-0.2");
    tl.fromTo(d.pill, { opacity: 0, y: 2 }, { opacity: 1, y: 0, duration: 0.3 }, "<");
    tl.to(raul, { x: d.x + d.w, y: d.y + d.h, duration: 1.1 }, "<-1.1");
    // Contorno e preenchimento
    tl.to(d.linha, { strokeDashoffset: 0, duration: 0.9, ease: "none" });
    tl.to(d.fill, { scaleY: 1, duration: 0.9, ease: "power3.out" }, "<0.4");
    tl.to(d.sel, { opacity: 0, duration: 0.3 });
    // Você digita o nome da etapa
    const alvo = { n: 0 };
    tl.to(voce, { x: d.x + d.w / 2 - 3, y: 108.5, duration: 0.8 }, "<-0.6");
    tl.to(alvo, {
      n: d.txt.length,
      duration: 0.7,
      ease: "none",
      onUpdate: () => (d.tag.textContent = d.txt.slice(0, Math.round(alvo.n))),
    });
    // Raul se afasta para a próxima
    tl.to(raul, { x: d.x + d.w + 4, y: d.y - 10, duration: 0.5 });
    if (i === dados.length - 1) {
      tl.to([raul, voce], { opacity: 0, duration: 0.6 }, "+=0.4");
      const fim = $("[data-build-fim]", sec);
      if (fim) tl.to(fim, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "<");
      tl.to({}, { duration: 0.6 });
    }
  });

  const total = tl.duration();
  const ativar = () => {
    const t = tl.time();
    let k = 0;
    marcos.forEach((m, i) => t >= m - 0.01 && (k = i));
    etapas.forEach((e, i) => e.classList.toggle("is-ativa", i === k));
  };
  tl.eventCallback("onUpdate", ativar);
  ativar();
  void total;
}
