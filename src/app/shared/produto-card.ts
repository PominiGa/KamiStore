import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Produto } from '../core/models';
import { CompraService } from './compra.service';
import { Icon } from './icon';
import { ProdutoImg } from './produto-img';

@Component({
  selector: 'app-produto-card',
  imports: [RouterLink, CurrencyPipe, ProdutoImg, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = produto();
    <article class="card-produto">
      <a [routerLink]="['/produto', p.id]" class="link">
        <div class="foto">
          <app-produto-img [nome]="p.nome" [src]="p.imagens?.[0]?.url" />
          @if (p.quantidade > 0 && p.quantidade <= 5) {
            <span class="selo selo-warn">Últimas {{ p.quantidade }} un.</span>
          }
        </div>
        <span class="loja">{{ p.vendedorNome }}</span>
        <h3 class="nome">{{ p.nome }}</h3>
        @if (temOpcoes()) {
          <span class="opcoes">{{ resumoOpcoes() }}</span>
        }
        <div class="preco">
          @if (variaPreco()) { <small>a partir de</small> }
          {{ precoMin() | currency }}
        </div>
        <div class="parcela">em até 10x de {{ precoMin() / 10 | currency }} sem juros</div>
      </a>
      <button
        class="btn btn-primary btn-block"
        [disabled]="p.quantidade === 0 || compra.adicionando() === p.id"
        (click)="compra.adicionar(p)"
      >
        @if (p.quantidade === 0) {
          Esgotado
        } @else {
          <app-icon name="cart" [size]="18" />
          {{ compra.adicionando() === p.id ? 'Adicionando…' : temOpcoes() ? 'Escolher opções' : 'Comprar' }}
        }
      </button>
    </article>
  `,
  styles: `
    .card-produto {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
      transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
    }
    .card-produto:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: transparent; }
    .link { color: inherit; text-decoration: none; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .foto { position: relative; margin-bottom: 4px; }
    .selo { position: absolute; top: 8px; right: 8px; }
    .loja { font-size: 12px; color: var(--muted); }
    .nome {
      font-size: 14px; font-weight: 600; line-height: 1.35; margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      min-height: 2.7em;
    }
    .preco { font-size: 22px; font-weight: 800; color: var(--accent-strong); margin-top: auto; letter-spacing: -0.02em; }
    .parcela { font-size: 12px; color: var(--muted); }
    .preco small { display: block; font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0; }
    .opcoes { font-size: 12px; color: var(--info); font-weight: 600; }
  `,
})
export class ProdutoCard {
  readonly produto = input.required<Produto>();
  protected readonly compra = inject(CompraService);

  protected readonly temOpcoes = computed(() => !!this.produto().variacoes?.length);
  protected readonly precoMin = computed(() => {
    const vs = this.produto().variacoes ?? [];
    return vs.length ? Math.min(...vs.map((v) => v.preco)) : this.produto().preco;
  });
  protected readonly variaPreco = computed(() => new Set((this.produto().variacoes ?? []).map((v) => v.preco)).size > 1);
  protected readonly resumoOpcoes = computed(() => {
    const vs = this.produto().variacoes ?? [];
    const cores = new Set(vs.map((v) => v.cor).filter(Boolean)).size;
    const tams = new Set(vs.map((v) => v.tamanho).filter(Boolean)).size;
    return [cores ? `${cores} ${cores === 1 ? 'cor' : 'cores'}` : '', tams ? `${tams} ${tams === 1 ? 'tamanho' : 'tamanhos'}` : '']
      .filter(Boolean)
      .join(' · ');
  });
}
