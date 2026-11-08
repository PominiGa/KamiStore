import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensagemErro } from '../../core/api';
import { CarrinhoService } from '../../core/carrinho.service';
import { ItemCarrinho, descricaoVariacao } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { ProdutoImg } from '../../shared/produto-img';

@Component({
  selector: 'app-carrinho',
  imports: [RouterLink, CurrencyPipe, Icon, ProdutoImg, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './carrinho.scss',
  template: `
    <div class="container pagina">
      <h1 class="titulo-pagina">Meu carrinho</h1>

      @if (!svc.carrinho()) {
        <div class="skeleton" style="height: 240px"></div>
      } @else if (svc.vazio()) {
        <div class="card">
          <app-estado icone="cart" titulo="Seu carrinho está vazio" texto="Navegue pela loja e adicione produtos para continuar.">
            <a routerLink="/busca" class="btn btn-primary">Explorar produtos</a>
          </app-estado>
        </div>
      } @else {
        <div class="layout">
          <section class="card itens">
            <div class="itens-head">
              <b>{{ svc.quantidade() }} {{ svc.quantidade() === 1 ? 'item' : 'itens' }}</b>
              <button class="btn btn-ghost btn-sm" (click)="esvaziar()"><app-icon name="trash" [size]="16" /> Esvaziar carrinho</button>
            </div>
            @for (i of svc.carrinho()!.itens; track chave(i)) {
              <div class="item" [class.ocupado]="ocupado() === chave(i)">
                <a [routerLink]="['/produto', i.produtoId]" class="thumb"><app-produto-img [nome]="i.nomeProduto" [compacta]="true" /></a>
                <div class="item-info">
                  <a [routerLink]="['/produto', i.produtoId]" class="nome">{{ i.nomeProduto }}</a>
                  @if (variacao(i)) {
                    <span class="variacao">{{ variacao(i) }}</span>
                  }
                  <span class="muted unit">{{ i.precoUnitario | currency }} cada</span>
                  <button class="remover" (click)="remover(i)"><app-icon name="trash" [size]="14" /> Remover</button>
                </div>
                <div class="stepper">
                  <button (click)="alterar(i, i.quantidade - 1)" [disabled]="i.quantidade <= 1" aria-label="Diminuir"><app-icon name="minus" [size]="16" /></button>
                  <span>{{ i.quantidade }}</span>
                  <button (click)="alterar(i, i.quantidade + 1)" aria-label="Aumentar"><app-icon name="plus" [size]="16" /></button>
                </div>
                <div class="subtotal">{{ i.subtotal | currency }}</div>
              </div>
            }
          </section>

          <aside class="card resumo">
            <h2 class="card-titulo">Resumo do pedido</h2>
            <div class="linha"><span>Produtos ({{ svc.quantidade() }})</span><span>{{ svc.carrinho()!.valorTotal | currency }}</span></div>
            <div class="linha total"><span>Total</span><span>{{ svc.carrinho()!.valorTotal | currency }}</span></div>
            <small class="muted">em até 10x de {{ svc.carrinho()!.valorTotal / 10 | currency }} sem juros</small>
            <a routerLink="/checkout" class="btn btn-primary btn-lg btn-block">Continuar para o pagamento</a>
            <a routerLink="/busca" class="btn btn-ghost btn-block">Continuar comprando</a>
            <div class="seguro"><app-icon name="lock" [size]="14" /> Ambiente seguro</div>
          </aside>
        </div>
      }
    </div>
  `,
})
export default class Carrinho {
  protected readonly svc = inject(CarrinhoService);
  private toast = inject(ToastService);
  protected readonly ocupado = signal<string | null>(null);

  chave(i: ItemCarrinho) {
    return `${i.produtoId}-${i.variacaoId ?? 0}`;
  }
  variacao(i: ItemCarrinho) {
    return descricaoVariacao(i);
  }

  constructor() {
    // Garante dados atualizados (preço/estoque podem ter mudado)
    this.svc.carregar().subscribe({ error: (e) => this.toast.erro(mensagemErro(e)) });
  }

  alterar(i: ItemCarrinho, qtd: number) {
    if (qtd < 1) return;
    this.ocupado.set(this.chave(i));
    this.svc.alterarQuantidade(i.produtoId, i.variacaoId, qtd).subscribe({
      next: () => this.ocupado.set(null),
      error: (e) => {
        this.ocupado.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  remover(i: ItemCarrinho) {
    this.ocupado.set(this.chave(i));
    this.svc.remover(i.produtoId, i.variacaoId).subscribe({
      next: () => {
        this.ocupado.set(null);
        this.toast.info(`${i.nomeProduto} removido do carrinho`);
      },
      error: (e) => {
        this.ocupado.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  esvaziar() {
    if (!confirm('Remover todos os itens do carrinho?')) return;
    this.svc.esvaziar().subscribe({ error: (e) => this.toast.erro(mensagemErro(e)) });
  }
}
