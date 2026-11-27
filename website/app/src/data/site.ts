export const WHATSAPP = "5544991373569";
export const INSTAGRAM = "https://www.instagram.com/raul_consorcio/";

export const wa = (texto: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

export type Modalidade = {
  id: string;
  nome: string;
  frase: string;
  usos: string[];
  estrategia: string;
};

export const modalidades: Modalidade[] = [
  {
    id: "imovel",
    nome: "Imóvel",
    frase: "A casa, o terreno, a sala comercial. O patrimônio que fica.",
    usos: ["Casa ou apartamento", "Terreno", "Construção e reforma", "Quitar financiamento", "Imóvel comercial"],
    estrategia: "Sair do aluguel sem pagar juros de financiamento, ou montar renda com imóveis ao longo dos anos.",
  },
  {
    id: "veiculo",
    nome: "Veículo",
    frase: "Trocar de carro sem entrar numa dívida com juros.",
    usos: ["Carro novo ou seminovo", "Moto", "Troca do usado", "Frota da empresa"],
    estrategia: "Usar o carro atual no lance e planejar a troca para o momento certo, sem pressa e sem juros.",
  },
  {
    id: "pesados",
    nome: "Pesados",
    frase: "Máquina parada não produz. Planejamento para crescer a operação.",
    usos: ["Caminhão", "Máquina agrícola", "Implementos", "Equipamento de obra"],
    estrategia: "Expandir a frota ou o maquinário com parcela previsível, sem comprometer o capital de giro.",
  },
  {
    id: "servicos",
    nome: "Serviços",
    frase: "O que não é bem, mas também se planeja.",
    usos: ["Reforma", "Estudos", "Procedimentos de saúde", "Viagem", "Festas e eventos"],
    estrategia: "Trocar o parcelado com juros do cartão por uma reserva organizada para o que você já sabe que vai fazer.",
  },
  {
    id: "investimento",
    nome: "Investimento",
    frase: "Carta de crédito como ferramenta de patrimônio.",
    usos: ["Alavancagem patrimonial", "Renda com aluguel", "Venda da carta contemplada", "Diversificação"],
    estrategia: "Usar o crédito para comprar ativos que se pagam. É aqui que a estratégia faz mais diferença.",
  },
];

// Depoimentos: os da v2 eram fictícios. Estes são EXEMPLOS de layout até o Raul
// mandar os reais com autorização por escrito. Não publicar como reais.
export const depoimentos = [
  {
    texto: "Eu achava que consórcio era só sorte. Ele montou a estratégia de lance comigo e fui contemplada no tempo que a gente planejou.",
    nome: "Carla M.",
    contexto: "Imóvel · Maringá",
  },
  {
    texto: "Não tentou me vender nada. Explicou o que fazia sentido para o meu caso e o que não fazia.",
    nome: "Diego S.",
    contexto: "Veículo · Online",
  },
  {
    texto: "Troquei o financiamento por consórcio e hoje sei exatamente onde vou estar daqui a cinco anos.",
    nome: "Marcos R.",
    contexto: "Investimento · Maringá",
  },
];
export const DEPOIMENTOS_SAO_EXEMPLO = true;
