import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PedidoStatus, ProdutoStatus } from '../core/models';
import {
  PEDIDO_STATUS_LABEL,
  PEDIDO_STATUS_TOM,
  PRODUTO_STATUS_LABEL,
  PRODUTO_STATUS_TOM,
} from '../core/pedido-status';

@Component({
  selector: 'app-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge badge-{{ tom() }}">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly pedido = input<PedidoStatus>();
  readonly produto = input<ProdutoStatus>();

  protected readonly label = computed(() => {
    const pe = this.pedido();
    const pr = this.produto();
    return pe ? PEDIDO_STATUS_LABEL[pe] : pr ? PRODUTO_STATUS_LABEL[pr] : '';
  });
  protected readonly tom = computed(() => {
    const pe = this.pedido();
    const pr = this.produto();
    return pe ? PEDIDO_STATUS_TOM[pe] : pr ? PRODUTO_STATUS_TOM[pr] : 'muted';
  });
}
