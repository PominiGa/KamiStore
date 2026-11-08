import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensagemErro } from '../../core/api';
import { CarrinhoService } from '../../core/carrinho.service';
import { Endereco, ItemCarrinho, descricaoVariacao } from '../../core/models';
import { ContaService, PedidoService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { EnderecoCampos, criarEnderecoForm, valorEndereco } from '../../shared/endereco-campos';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { ProdutoImg } from '../../shared/produto-img';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule, Icon, ProdutoImg, Estado, EnderecoCampos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './checkout.scss',
  template: `
    <div class="container pagina">
      <nav class="breadcrumb">
        <a routerLink="/carrinho">Carrinho</a> <app-icon name="chevron-right" [size]="14" /> <span>Finalizar compra</span>
      </nav>
      <h1 class="titulo-pagina">Finalizar compra</h1>

      @if (carrinho.carrinho() && carrinho.vazio()) {
        <div class="card">
          <app-estado icone="cart" titulo="Seu carrinho está vazio">
            <a routerLink="/busca" class="btn btn-primary">Explorar produtos</a>
          </app-estado>
        </div>
      } @else {
        <div class="layout">
          <div class="etapas">
            <section class="card">
              <h2 class="card-titulo"><span class="passo">1</span> Endereço de entrega</h2>

              @if (carregandoEnd()) {
                <div class="skeleton" style="height: 80px"></div>
              } @else {
                <div class="enderecos">
                  @for (e of enderecos(); track e.id) {
                    <label class="endereco" [class.sel]="enderecoId() === e.id">
                      <input type="radio" name="end" [checked]="enderecoId() === e.id" (change)="enderecoId.set(e.id)" />
                      <app-icon name="pin" [size]="20" />
                      <span>
                        <b>{{ e.rua }}, {{ e.numero }}{{ e.complemento ? ' - ' + e.complemento : '' }}</b>
                        <small>{{ e.cidade }}/{{ e.estado }} · CEP {{ e.cep }}</small>
                      </span>
                    </label>
                  }
                </div>

                @if (novoAberto() || !enderecos().length) {
                  <form class="novo" (ngSubmit)="salvarEndereco()">
                    <b>Novo endereço</b>
                    <app-endereco-campos [grupo]="novoEndereco" />
                    <div class="acoes">
                      @if (enderecos().length) {
                        <button type="button" class="btn btn-ghost" (click)="novoAberto.set(false)">Cancelar</button>
                      }
                      <button class="btn btn-dark" [disabled]="salvandoEnd()">{{ salvandoEnd() ? 'Salvando…' : 'Salvar endereço' }}</button>
                    </div>
                  </form>
                } @else {
                  <button class="btn btn-outline btn-sm" (click)="novoAberto.set(true)"><app-icon name="plus" [size]="16" /> Adicionar novo endereço</button>
                }
              }
            </section>

            <section class="card">
              <h2 class="card-titulo"><span class="passo">2</span> Revise seus produtos</h2>
              @for (i of carrinho.carrinho()?.itens ?? []; track i.produtoId + '-' + (i.variacaoId ?? 0)) {
                <div class="rev-item">
                  <app-produto-img [nome]="i.nomeProduto" [compacta]="true" />
                  <span class="rev-nome">{{ i.nomeProduto }}<small class="muted">{{ variacao(i) ? variacao(i) + ' · ' : '' }}Qtd: {{ i.quantidade }}</small></span>
                  <b>{{ i.subtotal | currency }}</b>
                </div>
              }
              <a routerLink="/carrinho" class="editar">Alterar itens no carrinho</a>
            </section>

            <section class="card">
              <h2 class="card-titulo"><span class="passo">3</span> Pagamento</h2>
              <div class="alerta info">
                <app-icon name="wallet" [size]="18" />
                <span>O pedido é criado como <b>Aguardando pagamento</b>. A confirmação do pagamento é feita pelo vendedor e você acompanha tudo em <b>Meus pedidos</b>.</span>
              </div>
            </section>
          </div>

          <aside class="card resumo">
            <h2 class="card-titulo">Resumo</h2>
            <div class="linha"><span>Produtos ({{ carrinho.quantidade() }})</span><span>{{ carrinho.carrinho()?.valorTotal ?? 0 | currency }}</span></div>
            <div class="linha total"><span>Total</span><span>{{ carrinho.carrinho()?.valorTotal ?? 0 | currency }}</span></div>
            @if (erro()) {
              <div class="alerta erro">{{ erro() }}</div>
            }
            <button class="btn btn-primary btn-lg btn-block" [disabled]="!enderecoId() || finalizando()" (click)="finalizar()">
              @if (finalizando()) { <span class="spinner"></span> Processando… } @else { Confirmar pedido }
            </button>
            @if (!enderecoId()) {
              <small class="muted centro">Selecione um endereço de entrega</small>
            }
          </aside>
        </div>
      }
    </div>
  `,
})
export default class Checkout {
  protected readonly carrinho = inject(CarrinhoService);
  private conta = inject(ContaService);
  private pedidos = inject(PedidoService);
  private toast = inject(ToastService);
  private router = inject(Router);

  protected readonly enderecos = signal<Endereco[]>([]);
  protected readonly enderecoId = signal<number | null>(null);
  protected readonly carregandoEnd = signal(true);
  protected readonly novoAberto = signal(false);
  protected readonly salvandoEnd = signal(false);
  protected readonly finalizando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly novoEndereco = criarEnderecoForm();

  variacao(i: ItemCarrinho) {
    return descricaoVariacao(i);
  }

  constructor() {
    this.carrinho.carregar().subscribe({ error: () => {} });
    this.conta.enderecos().subscribe({
      next: (l) => {
        this.enderecos.set(l);
        if (l.length) this.enderecoId.set(l[0].id);
        this.carregandoEnd.set(false);
      },
      error: (e) => {
        this.carregandoEnd.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  salvarEndereco() {
    if (this.novoEndereco.invalid) {
      this.novoEndereco.markAllAsTouched();
      return;
    }
    this.salvandoEnd.set(true);
    this.conta.adicionarEndereco(valorEndereco(this.novoEndereco)).subscribe({
      next: (e) => {
        this.salvandoEnd.set(false);
        this.enderecos.update((l) => [...l, e]);
        this.enderecoId.set(e.id);
        this.novoAberto.set(false);
        this.novoEndereco.reset();
        this.toast.sucesso('Endereço adicionado');
      },
      error: (e) => {
        this.salvandoEnd.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  finalizar() {
    const id = this.enderecoId();
    if (!id) return;
    this.finalizando.set(true);
    this.erro.set(null);
    this.pedidos.finalizar(id).subscribe({
      next: (p) => {
        this.carrinho.carregar().subscribe({ error: () => {} });
        this.router.navigate(['/pedido', p.id], { queryParams: { novo: 1 } });
      },
      error: (e) => {
        this.finalizando.set(false);
        this.erro.set(mensagemErro(e));
      },
    });
  }
}
