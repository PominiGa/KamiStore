import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { API } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { Page, Pedido, Produto, Vendedor } from '../../core/models';
import { Icon } from '../../shared/icon';
import { mascaraCnpj } from '../../shared/mascaras';

@Component({
  selector: 'app-vendedor-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CurrencyPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="topo">
      <div class="container topo-inner">
        <div class="loja">
          <span class="logo">{{ auth.primeiroNome().charAt(0) }}</span>
          <div>
            <small>Painel do vendedor</small>
            <h1>{{ auth.usuario()?.nome }}</h1>
            @if (vendedor.value(); as v) {
              <span class="cnpj">CNPJ {{ cnpj(v.cnpj) }}</span>
            }
          </div>
        </div>
        @if (vendedor.value(); as v) {
          <a [routerLink]="['/loja', v.id]" class="btn btn-outline-claro"><app-icon name="store" [size]="16" /> Ver minha loja</a>
        }
      </div>
    </section>

    <div class="container pagina">
      <div class="stats">
        <div class="stat">
          <app-icon name="package" />
          <span><small>Produtos cadastrados</small><b>{{ produtos.value()?.totalElementos ?? '–' }}</b></span>
        </div>
        <div class="stat">
          <app-icon name="list" />
          <span><small>Pedidos recebidos</small><b>{{ vendas.value()?.length ?? '–' }}</b></span>
        </div>
        <div class="stat">
          <app-icon name="clock" />
          <span><small>Aguardando ação</small><b>{{ pendentes() }}</b></span>
        </div>
        <div class="stat destaque">
          <app-icon name="wallet" />
          <span><small>Faturamento (não cancelados)</small><b>{{ faturamento() | currency }}</b></span>
        </div>
      </div>

      <nav class="abas">
        <a routerLink="/vendedor" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }"><app-icon name="package" [size]="18" /> Meus produtos</a>
        <a routerLink="/vendedor/produtos/novo" routerLinkActive="ativo"><app-icon name="plus" [size]="18" /> Novo produto</a>
        <a routerLink="/vendedor/vendas" routerLinkActive="ativo"><app-icon name="chart" [size]="18" /> Vendas</a>
      </nav>

      <router-outlet (activate)="recarregar()" />
    </div>
  `,
  styles: `
    .topo { background: linear-gradient(120deg, var(--brand-700), var(--brand)); color: #fff; }
    .topo-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-top: 28px; padding-bottom: 28px; flex-wrap: wrap; }
    .loja { display: flex; align-items: center; gap: 16px; }
    .logo { width: 64px; height: 64px; border-radius: 16px; background: var(--accent); display: grid; place-items: center; font-size: 28px; font-weight: 800; text-transform: uppercase; }
    h1 { margin: 2px 0; font-size: 26px; }
    small, .cnpj { color: rgba(255,255,255,.7); font-size: 13px; }
    .btn-outline-claro { background: rgba(255,255,255,.1); color: #fff; border-color: rgba(255,255,255,.25); }
    .btn-outline-claro:hover { background: rgba(255,255,255,.18); }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px 18px; display: flex; gap: 14px; align-items: center; }
    .stat app-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--surface-2); color: var(--brand); display: grid; place-items: center; }
    .stat span { display: flex; flex-direction: column; }
    .stat small { color: var(--muted); font-size: 12px; }
    .stat b { font-size: 22px; letter-spacing: -.02em; }
    .stat.destaque app-icon { background: var(--accent-soft); color: var(--accent); }
    .stat.destaque b { color: var(--accent-strong); }
    @media (max-width: 900px) { .stats { grid-template-columns: repeat(2, 1fr); } }
  `,
})
export default class VendedorLayout {
  protected readonly auth = inject(AuthService);

  protected readonly vendedor = httpResource<Vendedor>(() => `${API}/vendedores/me`);
  protected readonly produtos = httpResource<Page<Produto>>(() => ({ url: `${API}/vendedores/me/produtos`, params: { size: 1 } }));
  protected readonly vendas = httpResource<Pedido[]>(() => `${API}/pedidos/vendas`);

  protected readonly pendentes = computed(
    () => (this.vendas.value() ?? []).filter((p) => !['ENTREGUE', 'CANCELADO'].includes(p.status)).length,
  );
  protected readonly faturamento = computed(() => {
    const id = this.vendedor.value()?.id;
    if (!id) return 0;
    return (this.vendas.value() ?? [])
      .filter((p) => p.status !== 'CANCELADO')
      .flatMap((p) => p.itens)
      .filter((i) => i.vendedorId === id)
      .reduce((s, i) => s + i.subtotal, 0);
  });

  cnpj(v: string) {
    return mascaraCnpj(v);
  }

  /** Atualiza os números ao navegar entre as abas */
  recarregar() {
    if (this.produtos.value()) this.produtos.reload();
    if (this.vendas.value()) this.vendas.reload();
  }
}
