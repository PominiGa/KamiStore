import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensagemErro } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { ItemPedido, Pedido, PedidoStatus, descricaoVariacao } from '../../core/models';
import {
  FLUXO_PEDIDO,
  PEDIDO_STATUS_LABEL,
  clientePodeCancelar,
  proximosStatus,
} from '../../core/pedido-status';
import { ContaService, PedidoService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { ProdutoImg } from '../../shared/produto-img';
import { StatusBadge } from '../../shared/status-badge';

const ICONES_FLUXO: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'clock',
  PAGAMENTO_APROVADO: 'card',
  EM_PREPARACAO: 'package',
  ENVIADO: 'truck',
  ENTREGUE: 'check',
};

@Component({
  selector: 'app-pedido-detalhe',
  imports: [RouterLink, CurrencyPipe, DatePipe, Icon, ProdutoImg, StatusBadge, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pedido-detalhe.scss',
  template: `
    <div class="container pagina">
      @if (erro()) {
        <div class="card"><app-estado [erro]="true" titulo="Não foi possível abrir o pedido" [texto]="erro()!" /></div>
      } @else if (pedido(); as p) {
        @if (novo() && p.status === 'AGUARDANDO_PAGAMENTO') {
          <div class="sucesso">
            <div class="sucesso-ico"><app-icon name="check" [size]="32" [stroke]="3" /></div>
            <div>
              <h2>Pedido realizado com sucesso!</h2>
              <p>Seu pedido <b>#{{ p.id }}</b> foi registrado e está aguardando a confirmação do pagamento.</p>
            </div>
          </div>
        }

        <nav class="breadcrumb">
          <a [routerLink]="voltarLink()">{{ voltarLabel() }}</a> <app-icon name="chevron-right" [size]="14" /> <span>Pedido #{{ p.id }}</span>
        </nav>

        <div class="cabecalho">
          <div>
            <h1>Pedido #{{ p.id }}</h1>
            <span class="muted">Realizado em {{ p.dataPedido | date: "dd/MM/yyyy 'às' HH:mm" }}</span>
          </div>
          <app-status [pedido]="p.status" />
        </div>

        <section class="card">
          @if (p.status === 'CANCELADO') {
            <div class="alerta erro"><app-icon name="x" [size]="18" /> Este pedido foi cancelado e os itens voltaram ao estoque.</div>
          } @else {
            <ol class="timeline">
              @for (s of fluxo; track s; let i = $index) {
                <li [class.feito]="i <= etapaAtual()" [class.atual]="i === etapaAtual()">
                  <span class="bolinha"><app-icon [name]="icones[s]" [size]="18" /></span>
                  <span class="rotulo">{{ labels[s] }}</span>
                </li>
              }
            </ol>
          }

          @if (acoes().length || podeCancelar()) {
            <div class="acoes">
              @if (acoes().length) {
                <span class="muted">Atualizar status:</span>
                @for (s of acoes(); track s) {
                  <button
                    class="btn btn-sm"
                    [class.btn-primary]="s !== 'CANCELADO'"
                    [class.btn-danger]="s === 'CANCELADO'"
                    [disabled]="processando()"
                    (click)="mudarStatus(s)"
                  >
                    {{ s === 'CANCELADO' ? 'Cancelar pedido' : 'Marcar como ' + labels[s].toLowerCase() }}
                  </button>
                }
              }
              @if (podeCancelar()) {
                <button class="btn btn-danger btn-sm" [disabled]="processando()" (click)="cancelar()">
                  <app-icon name="x" [size]="16" /> Cancelar pedido
                </button>
              }
            </div>
          }
        </section>

        <div class="grid">
          <section class="card">
            <h2 class="card-titulo">Itens do pedido</h2>
            @for (i of p.itens; track $index) {
              <div class="item" [class.de-outro]="ehVendedor() && i.vendedorId !== meuVendedorId()">
                <a [routerLink]="['/produto', i.produtoId]"><app-produto-img [nome]="i.nomeProduto" [compacta]="true" /></a>
                <div class="item-info">
                  <a [routerLink]="['/produto', i.produtoId]" class="nome">{{ i.nomeProduto }}</a>
                  @if (variacao(i)) {
                    <small class="variacao">{{ variacao(i) }}</small>
                  }
                  <small class="muted">{{ i.quantidade }} × {{ i.precoUnitario | currency }}</small>
                  @if (auth.role() === 'CLIENTE' && p.status === 'ENTREGUE') {
                    <a [routerLink]="['/produto', i.produtoId]" fragment="avaliacoes" class="avaliar"><app-icon name="star" [size]="14" /> Avaliar produto</a>
                  }
                </div>
                <b>{{ i.subtotal | currency }}</b>
              </div>
            }
            <div class="total"><span>Total</span><span>{{ p.valorTotal | currency }}</span></div>
          </section>

          <aside class="lateral">
            <section class="card">
              <h2 class="card-titulo"><app-icon name="pin" [size]="18" /> Entrega</h2>
              <p class="end">{{ p.enderecoEntrega }}</p>
            </section>
            <section class="card">
              <h2 class="card-titulo"><app-icon name="user" [size]="18" /> Cliente</h2>
              <p class="end">{{ p.clienteNome }}</p>
            </section>
          </aside>
        </div>
      } @else {
        <div class="skeleton" style="height: 420px"></div>
      }
    </div>
  `,
})
export default class PedidoDetalhe {
  private api = inject(PedidoService);
  private conta = inject(ContaService);
  private toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  readonly novo = input<string>();

  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly processando = signal(false);
  protected readonly meuVendedorId = signal<number | null>(null);

  protected readonly fluxo = FLUXO_PEDIDO;
  protected readonly labels = PEDIDO_STATUS_LABEL;
  protected readonly icones = ICONES_FLUXO;

  protected readonly ehVendedor = computed(() => this.auth.role() === 'VENDEDOR');
  protected readonly etapaAtual = computed(() => FLUXO_PEDIDO.indexOf(this.pedido()?.status as PedidoStatus));
  protected readonly acoes = computed(() => {
    const p = this.pedido();
    return p && this.auth.temRole('VENDEDOR', 'ADMIN') ? proximosStatus(p.status) : [];
  });
  protected readonly podeCancelar = computed(() => {
    const p = this.pedido();
    return !!p && this.auth.role() === 'CLIENTE' && clientePodeCancelar(p.status);
  });
  protected readonly voltarLink = computed(() =>
    this.auth.role() === 'VENDEDOR' ? '/vendedor/vendas' : this.auth.role() === 'ADMIN' ? '/admin' : '/conta/pedidos',
  );
  protected readonly voltarLabel = computed(() =>
    this.auth.role() === 'VENDEDOR' ? 'Minhas vendas' : this.auth.role() === 'ADMIN' ? 'Administração' : 'Meus pedidos',
  );

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.pedido.set(null);
      this.erro.set(null);
      this.api.buscar(id).subscribe({
        next: (p) => this.pedido.set(p),
        error: (e) => this.erro.set(mensagemErro(e)),
      });
    });
    if (this.auth.role() === 'VENDEDOR') {
      // usado para destacar os itens que pertencem a este vendedor
      this.conta.meuVendedor().subscribe({ next: (v) => this.meuVendedorId.set(v.id), error: () => {} });
    }
  }

  variacao(i: ItemPedido) {
    return descricaoVariacao(i);
  }

  mudarStatus(status: PedidoStatus) {
    const p = this.pedido();
    if (!p) return;
    if (status === 'CANCELADO' && !confirm('Cancelar este pedido? Os itens voltarão ao estoque.')) return;
    this.processando.set(true);
    this.api.atualizarStatus(p.id, status).subscribe({
      next: (novo) => {
        this.processando.set(false);
        this.pedido.set(novo);
        this.toast.sucesso(`Pedido #${novo.id}: ${PEDIDO_STATUS_LABEL[novo.status]}`);
      },
      error: (e) => {
        this.processando.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  cancelar() {
    const p = this.pedido();
    if (!p || !confirm('Tem certeza que deseja cancelar este pedido?')) return;
    this.processando.set(true);
    this.api.cancelar(p.id).subscribe({
      next: (novo) => {
        this.processando.set(false);
        this.pedido.set(novo);
        this.toast.sucesso('Pedido cancelado.');
      },
      error: (e) => {
        this.processando.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }
}
