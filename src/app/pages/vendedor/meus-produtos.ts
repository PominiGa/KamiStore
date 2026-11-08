import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API, mensagemErro } from '../../core/api';
import { Page, Produto } from '../../core/models';
import { ProdutoService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { Paginacao } from '../../shared/paginacao';
import { ProdutoImg } from '../../shared/produto-img';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-meus-produtos',
  imports: [RouterLink, CurrencyPipe, Icon, ProdutoImg, StatusBadge, Estado, Paginacao],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (produtos.error()) {
      <div class="card"><app-estado [erro]="true" titulo="Não foi possível carregar seus produtos" /></div>
    } @else if (produtos.value()?.conteudo?.length === 0) {
      <div class="card">
        <app-estado icone="package" titulo="Você ainda não tem produtos" texto="Cadastre seu primeiro produto para começar a vender.">
          <a routerLink="/vendedor/produtos/novo" class="btn btn-primary"><app-icon name="plus" [size]="18" /> Cadastrar produto</a>
        </app-estado>
      </div>
    } @else {
      <div class="tabela-wrap">
        <table class="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>EAN</th>
              <th class="num">Preço</th>
              <th class="num">Estoque</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of produtos.value()?.conteudo ?? []; track p.id) {
              <tr [class.ocupado]="ocupado() === p.id">
                <td>
                  <div class="prod">
                    <app-produto-img [nome]="p.nome" [compacta]="true" [src]="p.imagens?.[0]?.url" />
                    <span class="nome-col">
                      <a [routerLink]="['/produto', p.id]">{{ p.nome }}</a>
                      @if (p.variacoes?.length) {
                        <small class="muted">{{ p.variacoes!.length }} variações</small>
                      }
                    </span>
                  </div>
                </td>
                <td class="mono">{{ p.ean }}</td>
                <td class="num"><b>{{ p.preco | currency }}</b></td>
                <td class="num" [class.zerado]="p.quantidade === 0">{{ p.quantidade }}</td>
                <td><app-status [produto]="p.status" /></td>
                <td>
                  <div class="acoes">
                    <a [routerLink]="['/vendedor/produtos', p.id, 'editar']" class="btn btn-ghost btn-sm"><app-icon name="edit" [size]="16" /> Editar</a>
                    @if (p.status === 'ATIVO') {
                      <button class="btn btn-ghost btn-sm" (click)="alternar(p)" title="Tirar da vitrine"><app-icon name="power" [size]="16" /> Pausar</button>
                    } @else if (p.status === 'INATIVO' || p.status === 'VENDIDO') {
                      <button class="btn btn-ghost btn-sm ativar" (click)="alternar(p)" [disabled]="p.quantidade === 0" [title]="p.quantidade === 0 ? 'Adicione estoque para ativar' : 'Publicar na vitrine'">
                        <app-icon name="power" [size]="16" /> Ativar
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (produtos.value(); as r) {
        <app-paginacao [pagina]="r.pagina" [total]="r.totalPaginas" (mudar)="pagina.set($event)" />
      }
    }
  `,
  styles: `
    .prod { display: flex; align-items: center; gap: 12px; min-width: 240px; }
    .prod app-produto-img { width: 44px; flex-shrink: 0; }
    .nome-col { display: flex; flex-direction: column; }
    .prod a { color: var(--text); font-weight: 600; text-decoration: none; }
    .prod a:hover { color: var(--accent); }
    .acoes { display: flex; gap: 4px; justify-content: flex-end; }
    .ativar { color: var(--ok); }
    .zerado { color: var(--danger); font-weight: 700; }
    tr.ocupado { opacity: .5; pointer-events: none; }
  `,
})
export default class MeusProdutos {
  private api = inject(ProdutoService);
  private toast = inject(ToastService);

  protected readonly pagina = signal(0);
  protected readonly ocupado = signal<number | null>(null);
  protected readonly produtos = httpResource<Page<Produto>>(() => ({
    url: `${API}/vendedores/me/produtos`,
    params: { page: this.pagina(), size: 20, sort: 'id,desc' },
  }));

  alternar(p: Produto) {
    const novo = p.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    this.ocupado.set(p.id);
    this.api.alterarStatus(p.id, novo).subscribe({
      next: () => {
        this.ocupado.set(null);
        this.toast.sucesso(novo === 'ATIVO' ? `${p.nome} está na vitrine` : `${p.nome} foi pausado`);
        this.produtos.reload();
      },
      error: (e) => {
        this.ocupado.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }
}
