import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API, mensagemErro } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { Cliente, Page, Pedido, PedidoStatus, Produto, Usuario, Vendedor } from '../../core/models';
import { PEDIDO_STATUS_LABEL, ROLE_LABEL, proximosStatus } from '../../core/pedido-status';
import { AdminService, PedidoService, ProdutoService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { mascaraCnpj, mascaraCpf } from '../../shared/mascaras';
import { Paginacao } from '../../shared/paginacao';
import { StatusBadge } from '../../shared/status-badge';

type Aba = 'pedidos' | 'produtos' | 'usuarios' | 'clientes' | 'vendedores';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, CurrencyPipe, DatePipe, Icon, StatusBadge, Estado, Paginacao],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export default class Admin {
  private adminApi = inject(AdminService);
  private pedidoApi = inject(PedidoService);
  private produtoApi = inject(ProdutoService);
  private toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly aba = signal<Aba>('pedidos');
  protected readonly labels = PEDIDO_STATUS_LABEL;
  protected readonly roles = ROLE_LABEL;
  protected readonly ocupado = signal<string | null>(null);
  protected readonly paginaProdutos = signal(0);
  protected readonly filtroStatus = signal<PedidoStatus | ''>('');

  protected readonly pedidos = httpResource<Pedido[]>(() => `${API}/pedidos`);
  protected readonly usuarios = httpResource<Usuario[]>(() => `${API}/usuario`);
  protected readonly clientes = httpResource<Cliente[]>(() => (this.aba() === 'clientes' ? `${API}/clientes` : undefined));
  protected readonly vendedores = httpResource<Vendedor[]>(() => (this.aba() === 'vendedores' ? `${API}/vendedores` : undefined));
  protected readonly produtos = httpResource<Page<Produto>>(() => ({
    url: `${API}/produtos`,
    params: { page: this.paginaProdutos(), size: 20, sort: 'id,desc' },
  }));

  protected readonly pedidosOrdenados = computed(() => {
    const f = this.filtroStatus();
    const l = [...(this.pedidos.value() ?? [])].sort((a, b) => b.id - a.id);
    return f ? l.filter((p) => p.status === f) : l;
  });
  protected readonly faturamento = computed(() =>
    (this.pedidos.value() ?? []).filter((p) => p.status !== 'CANCELADO').reduce((s, p) => s + p.valorTotal, 0),
  );
  protected readonly contagemRoles = computed(() => {
    const l = this.usuarios.value() ?? [];
    return {
      CLIENTE: l.filter((u) => u.role === 'CLIENTE').length,
      VENDEDOR: l.filter((u) => u.role === 'VENDEDOR').length,
    };
  });
  protected readonly todosStatus = Object.keys(PEDIDO_STATUS_LABEL) as PedidoStatus[];

  proximos(s: PedidoStatus) {
    return proximosStatus(s);
  }
  cpf(v: string) {
    return mascaraCpf(v);
  }
  cnpj(v: string) {
    return mascaraCnpj(v);
  }

  mudarStatus(p: Pedido, status: string) {
    if (!status) return;
    const novo = status as PedidoStatus;
    if (novo === 'CANCELADO' && !confirm(`Cancelar o pedido #${p.id}? Os itens voltam ao estoque.`)) return;
    this.ocupado.set(`pedido-${p.id}`);
    this.pedidoApi.atualizarStatus(p.id, novo).subscribe({
      next: (atualizado) => {
        this.ocupado.set(null);
        this.pedidos.update((l) => l?.map((x) => (x.id === p.id ? atualizado : x)));
        this.toast.sucesso(`Pedido #${p.id}: ${PEDIDO_STATUS_LABEL[novo]}`);
      },
      error: (e) => {
        this.ocupado.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  inativarProduto(p: Produto) {
    if (!confirm(`Remover "${p.nome}" da vitrine?`)) return;
    this.ocupado.set(`produto-${p.id}`);
    this.produtoApi.alterarStatus(p.id, 'INATIVO').subscribe({
      next: () => {
        this.ocupado.set(null);
        this.toast.sucesso('Produto removido da vitrine');
        this.produtos.reload();
      },
      error: (e) => {
        this.ocupado.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  excluirUsuario(u: Usuario) {
    if (!confirm(`Excluir definitivamente o usuário ${u.nome} (${u.email})?`)) return;
    this.ocupado.set(`usuario-${u.id}`);
    this.adminApi.excluirUsuario(u.email).subscribe({
      next: () => {
        this.ocupado.set(null);
        this.usuarios.update((l) => l?.filter((x) => x.id !== u.id));
        this.toast.sucesso('Usuário excluído');
      },
      error: (e) => {
        this.ocupado.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }
}
