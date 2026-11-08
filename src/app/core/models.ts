// Espelho dos DTOs do backend (Spring Boot)

export type UsuarioRole = 'ADMIN' | 'CLIENTE' | 'VENDEDOR';
export type ProdutoStatus = 'INATIVO' | 'ATIVO' | 'VENDIDO' | 'RESERVADO';
export type PedidoStatus =
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGAMENTO_APROVADO'
  | 'EM_PREPARACAO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO';

export interface Page<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}

export interface Endereco {
  id: number;
  rua: string;
  numero: number;
  complemento?: string | null;
  cidade: string;
  estado: string;
  cep: string;
}
export type EnderecoRequest = Omit<Endereco, 'id'>;

export interface Telefone {
  id: number;
  ddd: number;
  numero: string;
}
export type TelefoneRequest = Omit<Telefone, 'id'>;

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: UsuarioRole;
  enderecos: Endereco[];
  telefones: Telefone[];
}

export interface Cliente {
  id: number;
  cpf: string;
  usuario: Usuario;
}

export interface Vendedor {
  id: number;
  cnpj: string;
  usuario: Usuario;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  cnpj?: string;
  enderecos?: EnderecoRequest[];
  telefones?: TelefoneRequest[];
}

export interface ImagemProduto {
  id: number;
  /** Caminho relativo, ex.: /api/produtos/1/imagens/3 */
  url: string;
}

export interface Variacao {
  id: number;
  cor?: string | null;
  tamanho?: string | null;
  /** Preço efetivo (o da variação ou, se vazio, o do produto) */
  preco: number;
  quantidade: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string | null;
  ean: string;
  preco: number;
  /** Com variações, é a soma do estoque delas */
  quantidade: number;
  status: ProdutoStatus;
  vendedorId: number;
  vendedorNome: string;
  imagens?: ImagemProduto[];
  variacoes?: Variacao[];
}

export interface VariacaoRequest {
  id?: number | null;
  cor?: string | null;
  tamanho?: string | null;
  preco?: number | null;
  quantidade: number;
}

export interface ProdutoRequest {
  nome: string;
  descricao?: string | null;
  ean: string;
  preco: number;
  quantidade?: number | null;
  /** Omitido = mantém; lista = substitui; [] = remove todas */
  variacoes?: VariacaoRequest[];
}

export interface ItemCarrinho {
  produtoId: number;
  nomeProduto: string;
  variacaoId?: number | null;
  cor?: string | null;
  tamanho?: string | null;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
}

export interface Carrinho {
  id: number;
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  valorTotal: number;
}

export interface ItemPedido {
  produtoId: number;
  nomeProduto: string;
  variacaoId?: number | null;
  cor?: string | null;
  tamanho?: string | null;
  vendedorId: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  clienteNome: string;
  status: PedidoStatus;
  dataPedido: string;
  enderecoEntrega: string;
  valorTotal: number;
  itens: ItemPedido[];
}

export interface Avaliacao {
  id: number;
  produtoId: number;
  clienteNome: string;
  nota: number;
  comentario?: string | null;
  dataAvaliacao: string;
}

export interface AvaliacaoResumo {
  produtoId: number;
  mediaNotas: number | null;
  totalAvaliacoes: number;
}

export interface ErroApi {
  timestamp?: string;
  status: number;
  erro?: string;
  mensagem?: string;
  path?: string;
  campos?: Record<string, string>;
}

/** "Azul / M", "Azul" ou "M" */
export function descricaoVariacao(v: { cor?: string | null; tamanho?: string | null }): string {
  return [v.cor, v.tamanho].filter((x) => !!x).join(' / ');
}
