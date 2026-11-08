import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { API } from '../../core/api';
import { Page, Produto } from '../../core/models';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { Paginacao } from '../../shared/paginacao';
import { ProdutoCard } from '../../shared/produto-card';

const ORDENS = [
  { valor: 'id,asc', label: 'Relevância' },
  { valor: 'id,desc', label: 'Mais recentes' },
  { valor: 'preco,asc', label: 'Menor preço' },
  { valor: 'preco,desc', label: 'Maior preço' },
  { valor: 'nome,asc', label: 'Nome (A-Z)' },
];

@Component({
  selector: 'app-busca',
  imports: [RouterLink, ProdutoCard, Paginacao, Estado, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container pagina">
      <nav class="breadcrumb">
        <a routerLink="/">Início</a> <app-icon name="chevron-right" [size]="14" />
        <span>{{ q() ? 'Busca' : 'Todos os produtos' }}</span>
      </nav>

      <div class="topo">
        <div>
          <h1 class="titulo-pagina">
            @if (q()) {
              Resultados para “{{ q() }}”
            } @else {
              Todos os produtos
            }
          </h1>
          @if (resultado.value(); as r) {
            <span class="muted">{{ r.totalElementos }} {{ r.totalElementos === 1 ? 'produto encontrado' : 'produtos encontrados' }}</span>
          }
        </div>
        <label class="ordem">
          Ordenar por
          <select [value]="ordemAtual()" (change)="navegar({ ordem: $any($event.target).value, pagina: null })">
            @for (o of ordens; track o.valor) {
              <option [value]="o.valor">{{ o.label }}</option>
            }
          </select>
        </label>
      </div>

      @if (resultado.error()) {
        <div class="card">
          <app-estado [erro]="true" titulo="Erro ao buscar produtos" texto="Verifique se o backend está rodando.">
            <button class="btn btn-outline" (click)="resultado.reload()">Tentar novamente</button>
          </app-estado>
        </div>
      } @else if (resultado.isLoading() && !resultado.value()) {
        <div class="grade-produtos">
          @for (s of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track s) {
            <div class="skeleton" style="height: 380px"></div>
          }
        </div>
      } @else if (resultado.value()?.conteudo?.length) {
        <div class="grade-produtos" [style.opacity]="resultado.isLoading() ? 0.5 : 1">
          @for (p of resultado.value()!.conteudo; track p.id) {
            <app-produto-card [produto]="p" />
          }
        </div>
        <app-paginacao
          [pagina]="resultado.value()!.pagina"
          [total]="resultado.value()!.totalPaginas"
          (mudar)="navegar({ pagina: $event || null })"
        />
      } @else {
        <div class="card">
          <app-estado
            icone="search"
            titulo="Nenhum produto encontrado"
            [texto]="q() ? 'Tente outro termo ou verifique a ortografia.' : 'Ainda não há produtos à venda.'"
          >
            @if (q()) {
              <a routerLink="/busca" class="btn btn-outline">Ver todos os produtos</a>
            }
          </app-estado>
        </div>
      }
    </div>
  `,
  styles: `
    .topo { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .topo .titulo-pagina { margin-bottom: 4px; }
    .ordem { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
    .ordem select { font: inherit; font-size: 14px; padding: 9px 12px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
  `,
})
export default class Busca {
  private router = inject(Router);

  // Query params vinculados via withComponentInputBinding
  readonly q = input<string>('');
  readonly ordem = input<string>();
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });

  protected readonly ordens = ORDENS;
  protected readonly ordemAtual = computed(() => this.ordem() || 'id,asc');

  protected readonly resultado = httpResource<Page<Produto>>(() => {
    const params: Record<string, string | number> = { page: this.pagina(), size: 20, sort: this.ordemAtual() };
    if (this.q()) params['nome'] = this.q();
    return { url: `${API}/produtos`, params };
  });

  navegar(params: Record<string, unknown>) {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
