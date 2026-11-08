import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { API } from '../../core/api';
import { Pedido, PedidoStatus, Vendedor } from '../../core/models';
import { PEDIDO_STATUS_LABEL } from '../../core/pedido-status';
import { Estado } from '../../shared/estado';
import { PedidoCard } from '../../shared/pedido-card';

@Component({
  selector: 'app-vendas',
  imports: [PedidoCard, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="abas">
      <button [class.ativo]="filtro() === null" (click)="filtro.set(null)">Todas ({{ vendas.value()?.length ?? 0 }})</button>
      @for (s of status; track s) {
        <button [class.ativo]="filtro() === s" (click)="filtro.set(s)">{{ labels[s] }} ({{ contar(s) }})</button>
      }
    </div>

    @if (vendas.error()) {
      <div class="card"><app-estado [erro]="true" titulo="Não foi possível carregar suas vendas" /></div>
    } @else if (vendas.isLoading()) {
      <div class="skeleton" style="height: 140px"></div>
    } @else {
      <div class="lista">
        @for (p of filtradas(); track p.id) {
          <app-pedido-card [pedido]="p" [mostrarCliente]="true" [valor]="meuValor(p)" rotuloValor="Sua parte" />
        } @empty {
          <div class="card"><app-estado icone="chart" titulo="Nenhuma venda por aqui" texto="Os pedidos com seus produtos aparecem nesta lista." /></div>
        }
      </div>
    }
  `,
  styles: `.lista { display: grid; gap: 12px; }`,
})
export default class Vendas {
  protected readonly vendas = httpResource<Pedido[]>(() => `${API}/pedidos/vendas`);
  protected readonly vendedor = httpResource<Vendedor>(() => `${API}/vendedores/me`);
  protected readonly filtro = signal<PedidoStatus | null>(null);
  protected readonly labels = PEDIDO_STATUS_LABEL;
  protected readonly status: PedidoStatus[] = [
    'AGUARDANDO_PAGAMENTO',
    'PAGAMENTO_APROVADO',
    'EM_PREPARACAO',
    'ENVIADO',
    'ENTREGUE',
    'CANCELADO',
  ];

  protected readonly filtradas = computed(() => {
    const f = this.filtro();
    const l = [...(this.vendas.value() ?? [])].sort((a, b) => b.id - a.id);
    return f ? l.filter((p) => p.status === f) : l;
  });

  contar(s: PedidoStatus) {
    return (this.vendas.value() ?? []).filter((p) => p.status === s).length;
  }

  meuValor(p: Pedido): number | null {
    const id = this.vendedor.value()?.id;
    if (!id) return null;
    return p.itens.filter((i) => i.vendedorId === id).reduce((s, i) => s + i.subtotal, 0);
  }
}
