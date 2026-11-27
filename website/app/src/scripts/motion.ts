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
      // Confere na hora do clique: links que nascem "#" e viram externos (ex.: WhatsApp do resultado)
      const alvo = a.getAttribute("href") || "";
      if (!alvo.startsWith("#") || alvo.length < 2) return;
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
      // máscara quadrada (viewBox 89×89 a partir de 15.5): cresce a partir da haste do R
      const m = vh * 0.34;
      const ox = vw / 2 + ((51 - 15.5) / 89 - 0.5) * m;
      const oy = vh / 2 + ((60 - 15.5) / 89 - 0.5) * m;
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
  // Linha do tempo de "Como funciona": o trilho enche conforme a rolagem e cada
  // etapa acende quando o trilho chega nela. Sem trava de rolagem.
  const tl = $("[data-tl]", sec);
  const prog = $("[data-tl-progresso]", sec);
  const passos = $$("[data-tl-passo]", sec);
  if (!tl || !prog) return;
  gsap.set(prog, { scaleY: 0 });
  ScrollTrigger.create({
    trigger: tl,
    start: "top 65%",
    end: "bottom 65%",
    scrub: 0.4,
    onUpdate: (st) => {
      gsap.set(prog, { scaleY: st.progress });
      const n = passos.length;
      passos.forEach((p, k) => p.classList.toggle("is-on", st.progress >= k / (n - 1) - 0.02));
    },
  });
}
