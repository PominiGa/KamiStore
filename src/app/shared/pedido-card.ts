import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pedido, descricaoVariacao } from '../core/models';
import { Icon } from './icon';
import { ProdutoImg } from './produto-img';
import { StatusBadge } from './status-badge';

/** Card de pedido usado em "Meus pedidos" e "Minhas vendas" */
@Component({
  selector: 'app-pedido-card',
  imports: [RouterLink, CurrencyPipe, DatePipe, Icon, ProdutoImg, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = pedido();
    <a class="card pedido" [routerLink]="['/pedido', p.id]">
      <header>
        <div>
          <b>Pedido #{{ p.id }}</b>
          <span class="muted">{{ p.dataPedido | date: 'dd/MM/yyyy HH:mm' }}{{ mostrarCliente() ? ' · ' + p.clienteNome : '' }}</span>
        </div>
        <app-status [pedido]="p.status" />
      </header>
      <div class="corpo">
        <div class="thumbs">
          @for (i of p.itens.slice(0, 4); track $index) {
            <app-produto-img [nome]="i.nomeProduto" [compacta]="true" [title]="i.nomeProduto" />
          }
          @if (p.itens.length > 4) {
            <span class="mais">+{{ p.itens.length - 4 }}</span>
          }
        </div>
        <span class="resumo">{{ resumo() }}</span>
        <div class="valor">
          <small class="muted">{{ rotuloValor() }}</small>
          <b>{{ valor() ?? p.valorTotal | currency }}</b>
        </div>
        <app-icon name="chevron-right" class="seta" />
      </div>
    </a>
  `,
  styles: `
    .pedido { display: block; text-decoration: none; color: inherit; padding: 0; transition: box-shadow .15s, border-color .15s; }
    .pedido:hover { box-shadow: var(--shadow-lg); border-color: transparent; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--border); }
    header div { display: flex; flex-direction: column; }
    header span { font-size: 13px; }
    .corpo { display: flex; align-items: center; gap: 16px; padding: 14px 20px; }
    .thumbs { display: flex; gap: 6px; }
    .thumbs app-produto-img { width: 48px; }
    .mais { width: 48px; height: 48px; border-radius: 8px; background: var(--surface-2); display: grid; place-items: center; font-weight: 700; font-size: 13px; color: var(--muted); }
    .resumo { flex: 1; font-size: 14px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
    .valor { display: flex; flex-direction: column; align-items: flex-end; }
    .valor b { font-size: 18px; }
    .seta { color: var(--muted); }
    @media (max-width: 600px) { .resumo { display: none; } }
  `,
})
export class PedidoCard {
  readonly pedido = input.required<Pedido>();
  readonly mostrarCliente = input(false);
  /** Valor alternativo (ex.: total do vendedor dentro do pedido) */
  readonly valor = input<number | null>(null);
  readonly rotuloValor = input('Total');

  protected readonly resumo = computed(() => {
    const itens = this.pedido().itens;
    const nomes = itens
      .map((i) => (descricaoVariacao(i) ? `${i.nomeProduto} (${descricaoVariacao(i)})` : i.nomeProduto))
      .join(', ');
    return `${itens.length} ${itens.length === 1 ? 'item' : 'itens'} · ${nomes}`;
  });
}
