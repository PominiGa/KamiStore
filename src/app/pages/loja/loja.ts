import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { API } from '../../core/api';
import { Page, Produto } from '../../core/models';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { Paginacao } from '../../shared/paginacao';
import { ProdutoCard } from '../../shared/produto-card';

@Component({
  selector: 'app-loja',
  imports: [RouterLink, ProdutoCard, Paginacao, Estado, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="capa">
      <div class="container capa-inner">
        <div class="logo-loja">{{ inicial() }}</div>
        <div>
          <small>Loja oficial na KamiStore</small>
          <h1>{{ nome() || 'Loja' }}</h1>
          @if (produtos.value(); as r) {
            <span>{{ r.totalElementos }} produtos à venda</span>
          }
        </div>
      </div>
    </section>

    <div class="container pagina">
      <nav class="breadcrumb">
        <a routerLink="/">Início</a> <app-icon name="chevron-right" [size]="14" /> <span>{{ nome() || 'Loja' }}</span>
      </nav>
      @if (produtos.error()) {
        <div class="card"><app-estado [erro]="true" titulo="Não foi possível carregar a loja" /></div>
      } @else if (produtos.value()?.conteudo?.length) {
        <div class="grade-produtos">
          @for (p of produtos.value()!.conteudo; track p.id) {
            <app-produto-card [produto]="p" />
          }
        </div>
        <app-paginacao [pagina]="pagina()" [total]="produtos.value()!.totalPaginas" (mudar)="pagina.set($event)" />
      } @else if (!produtos.isLoading()) {
        <div class="card"><app-estado icone="store" titulo="Esta loja não tem produtos à venda no momento" /></div>
      }
    </div>
  `,
  styles: `
    .capa { background: linear-gradient(120deg, var(--brand-700), var(--brand)); color: #fff; }
    .capa-inner { display: flex; align-items: center; gap: 20px; padding-top: 32px; padding-bottom: 32px; }
    .logo-loja { width: 80px; height: 80px; border-radius: 20px; background: var(--accent); display: grid; place-items: center; font-size: 36px; font-weight: 800; text-transform: uppercase; }
    h1 { margin: 2px 0; font-size: 30px; }
    small, span { color: rgba(255,255,255,.7); font-size: 14px; }
  `,
})
export default class Loja {
  private titulo = inject(Title);
  readonly id = input.required<string>();
  protected readonly pagina = signal(0);

  protected readonly produtos = httpResource<Page<Produto>>(() => ({
    url: `${API}/produtos/vendedor/${this.id()}`,
    params: { page: this.pagina(), size: 20 },
  }));

  // O endpoint público não retorna os dados da loja; usamos o nome vindo dos produtos
  protected readonly nome = computed(() => this.produtos.value()?.conteudo[0]?.vendedorNome ?? '');
  protected readonly inicial = computed(() => this.nome().charAt(0) || '?');

  constructor() {
    effect(() => {
      if (this.nome()) this.titulo.setTitle(`${this.nome()} · KamiStore`);
    });
  }
}
