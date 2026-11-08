import { PedidoStatus, ProdutoStatus, UsuarioRole } from './models';

export const FLUXO_PEDIDO: PedidoStatus[] = [
  'AGUARDANDO_PAGAMENTO',
  'PAGAMENTO_APROVADO',
  'EM_PREPARACAO',
  'ENVIADO',
  'ENTREGUE',
];

export const PEDIDO_STATUS_LABEL: Record<PedidoStatus, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGAMENTO_APROVADO: 'Pagamento aprovado',
  EM_PREPARACAO: 'Em preparação',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const PEDIDO_STATUS_TOM: Record<PedidoStatus, string> = {
  AGUARDANDO_PAGAMENTO: 'warn',
  PAGAMENTO_APROVADO: 'info',
  EM_PREPARACAO: 'info',
  ENVIADO: 'info',
  ENTREGUE: 'ok',
  CANCELADO: 'danger',
};

export const PRODUTO_STATUS_LABEL: Record<ProdutoStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  VENDIDO: 'Esgotado',
  RESERVADO: 'Reservado',
};

export const PRODUTO_STATUS_TOM: Record<ProdutoStatus, string> = {
  ATIVO: 'ok',
  INATIVO: 'muted',
  VENDIDO: 'danger',
  RESERVADO: 'warn',
};

export const ROLE_LABEL: Record<UsuarioRole, string> = {
  ADMIN: 'Administrador',
  CLIENTE: 'Cliente',
  VENDEDOR: 'Vendedor',
};

/** Mesma regra de PedidoStatus.podeMudarPara do backend */
export function proximosStatus(atual: PedidoStatus): PedidoStatus[] {
  switch (atual) {
    case 'AGUARDANDO_PAGAMENTO':
      return ['PAGAMENTO_APROVADO', 'CANCELADO'];
    case 'PAGAMENTO_APROVADO':
      return ['EM_PREPARACAO', 'CANCELADO'];
    case 'EM_PREPARACAO':
      return ['ENVIADO'];
    case 'ENVIADO':
      return ['ENTREGUE'];
    default:
      return [];
  }
}

export function clientePodeCancelar(status: PedidoStatus): boolean {
  return status === 'AGUARDANDO_PAGAMENTO' || status === 'PAGAMENTO_APROVADO';
}
