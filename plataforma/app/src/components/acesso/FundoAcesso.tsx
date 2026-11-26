/** Troque aqui a foto do login/convite (arquivo em public/). */
export const FOTO_ACESSO = { src: '/login-raul.webp', posicao: '22% 30%', escurecer: 0.2 }

/**
 * Fundo das telas de acesso: o Raul em conversa com cliente (frame do Reels, fundo estendido),
 * escurecida em direção ao cartão de login. Só uma aproximação lenta da foto na entrada (sem parallax).
 */
export function FundoAcesso() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0e0f11]">
      {/* celular: faixa no topo; desktop: 70% da esquerda (como o painel do CT) */}
      <div className="absolute inset-x-0 top-[84px] h-[46vh] overflow-hidden lg:inset-y-0 lg:top-0 lg:right-auto lg:h-auto lg:w-[70%]">
        <div className="absolute inset-0">
          <div className="fundo-foto absolute inset-0 bg-cover" style={{ backgroundImage: `url(${FOTO_ACESSO.src})`, backgroundPosition: FOTO_ACESSO.posicao }} />
        </div>
        {/* tom geral mais escuro, para a foto não competir com o cartão */}
        <div className="absolute inset-0" style={{ background: `rgb(10 11 13 / ${FOTO_ACESSO.escurecer})` }} />
        {/* desktop: dissolve para a direita até o fundo liso onde fica o cartão */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,transparent_0%,transparent_45%,rgb(14_15_17/0.75)_75%,#0e0f11_100%)] lg:block" />
        {/* base escura para o título; no celular, funde a faixa com o fundo */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0e0f11_0%,transparent_28%,transparent_55%,#0e0f11_100%)] lg:bg-[linear-gradient(180deg,rgb(14_15_17/0.45)_0%,transparent_20%,transparent_62%,rgb(14_15_17/0.9)_100%)]" />
      </div>
    </div>
  )
}
