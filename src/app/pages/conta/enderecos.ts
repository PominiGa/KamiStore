import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { mensagemErro } from '../../core/api';
import { Endereco } from '../../core/models';
import { ContaService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { EnderecoCampos, EnderecoForm, criarEnderecoForm, valorEndereco } from '../../shared/endereco-campos';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-enderecos',
  imports: [ReactiveFormsModule, Icon, Estado, EnderecoCampos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="topo">
      <h1 class="titulo-pagina">Meus endereços</h1>
      @if (editando() === null) {
        <button class="btn btn-primary" (click)="abrir()"><app-icon name="plus" [size]="18" /> Novo endereço</button>
      }
    </div>

    @if (editando() !== null) {
      <form class="card form" (ngSubmit)="salvar()">
        <h2 class="card-titulo">{{ editando() === 0 ? 'Novo endereço' : 'Editar endereço' }}</h2>
        <app-endereco-campos [grupo]="form" />
        <div class="acoes">
          <button type="button" class="btn btn-ghost" (click)="editando.set(null)">Cancelar</button>
          <button class="btn btn-dark" [disabled]="salvando()">{{ salvando() ? 'Salvando…' : 'Salvar' }}</button>
        </div>
      </form>
    }

    @if (carregando()) {
      <div class="skeleton" style="height: 120px"></div>
    } @else {
      <div class="lista">
        @for (e of enderecos(); track e.id) {
          <article class="card end">
            <app-icon name="pin" [size]="22" />
            <div class="txt">
              <b>{{ e.rua }}, {{ e.numero }}{{ e.complemento ? ' - ' + e.complemento : '' }}</b>
              <span class="muted">{{ e.cidade }}/{{ e.estado }} · CEP {{ e.cep }}</span>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="abrir(e)"><app-icon name="edit" [size]="16" /> Editar</button>
            <button class="btn btn-danger btn-sm" (click)="remover(e)"><app-icon name="trash" [size]="16" /></button>
          </article>
        } @empty {
          @if (editando() === null) {
            <div class="card"><app-estado icone="pin" titulo="Nenhum endereço cadastrado" texto="Cadastre um endereço para receber suas compras." /></div>
          }
        }
      </div>
    }
  `,
  styles: `
    .topo { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .form { margin-bottom: 16px; }
    .acoes { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .lista { display: grid; gap: 12px; }
    .end { display: flex; align-items: center; gap: 14px; padding: 16px 20px; }
    .end > app-icon { color: var(--accent); }
    .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  `,
})
export default class Enderecos {
  private conta = inject(ContaService);
  private toast = inject(ToastService);

  protected readonly enderecos = signal<Endereco[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  /** null = fechado, 0 = novo, >0 = id em edição */
  protected readonly editando = signal<number | null>(null);
  protected form: EnderecoForm = criarEnderecoForm();

  constructor() {
    this.conta.enderecos().subscribe({
      next: (l) => {
        this.enderecos.set(l);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  abrir(e?: Endereco) {
    this.form = criarEnderecoForm(e);
    this.editando.set(e?.id ?? 0);
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.editando();
    const dto = valorEndereco(this.form);
    this.salvando.set(true);
    const req = id ? this.conta.atualizarEndereco(id, dto) : this.conta.adicionarEndereco(dto);
    req.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.enderecos.update((l) => (id ? l.map((x) => (x.id === id ? salvo : x)) : [...l, salvo]));
        this.editando.set(null);
        this.toast.sucesso(id ? 'Endereço atualizado' : 'Endereço adicionado');
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  remover(e: Endereco) {
    if (!confirm(`Remover o endereço ${e.rua}, ${e.numero}?`)) return;
    this.conta.removerEndereco(e.id).subscribe({
      next: () => {
        this.enderecos.update((l) => l.filter((x) => x.id !== e.id));
        this.toast.sucesso('Endereço removido');
      },
      error: (err) => this.toast.erro(mensagemErro(err)),
    });
  }
}
