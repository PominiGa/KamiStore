import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API } from '../../core/api';
import { Pedido } from '../../core/models';
import { Estado } from '../../shared/estado';
import { PedidoCard } from '../../shared/pedido-card';

type Filtro = 'todos' | 'andamento' | 'entregues' | 'cancelados';

@Component({
  selector: 'app-meus-pedidos',
  imports: [RouterLink, PedidoCard, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo-pagina">Meus pedidos</h1>

    <div class="abas">
      @for (f of filtros; track f.id) {
        <button [class.ativo]="filtro() === f.id" (click)="filtro.set(f.id)">{{ f.label }} ({{ contar(f.id) }})</button>
      }
    </div>

    @if (pedidos.error()) {
      <div class="card"><app-estado [erro]="true" titulo="Não foi possível carregar seus pedidos" /></div>
    } @else if (pedidos.isLoading()) {
      <div class="skeleton" style="height: 140px"></div>
    } @else {
      <div class="lista">
        @for (p of filtrados(); track p.id) {
          <app-pedido-card [pedido]="p" />
        } @empty {
          <div class="card">
            <app-estado icone="package" titulo="Nenhum pedido aqui" texto="Quando você fizer uma compra, ela aparece nesta lista.">
              <a routerLink="/busca" class="btn btn-primary">Ir às compras</a>
            </app-estado>
          </div>
        }
      </div>
    }
  `,
  styles: `.lista { display: grid; gap: 12px; }`,
})
export default class MeusPedidos {
  protected readonly pedidos = httpResource<Pedido[]>(() => `${API}/pedidos/meus`);
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly filtros: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'andamento', label: 'Em andamento' },
    { id: 'entregues', label: 'Entregues' },
    { id: 'cancelados', label: 'Cancelados' },
  ];

  protected readonly filtrados = computed(() => this.aplicar(this.filtro()));

  contar(f: Filtro) {
    return this.aplicar(f).length;
  }

  private aplicar(f: Filtro): Pedido[] {
    const l = this.pedidos.value() ?? [];
    switch (f) {
      case 'andamento':
        return l.filter((p) => p.status !== 'ENTREGUE' && p.status !== 'CANCELADO');
      case 'entregues':
        return l.filter((p) => p.status === 'ENTREGUE');
      case 'cancelados':
        return l.filter((p) => p.status === 'CANCELADO');
      default:
        return l;
    }
  }
}
