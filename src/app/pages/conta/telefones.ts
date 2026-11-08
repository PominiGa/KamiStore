import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensagemErro } from '../../core/api';
import { Telefone } from '../../core/models';
import { ContaService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { formatarTelefone, soDigitos } from '../../shared/mascaras';

@Component({
  selector: 'app-telefones',
  imports: [ReactiveFormsModule, Icon, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo-pagina">Meus telefones</h1>

    <form class="card form" [formGroup]="form" (ngSubmit)="adicionar()">
      <div class="campo ddd" [class.invalido]="form.controls.ddd.touched && form.controls.ddd.invalid">
        <label>DDD</label>
        <input type="number" formControlName="ddd" placeholder="11" />
      </div>
      <div class="campo num" [class.invalido]="form.controls.numero.touched && form.controls.numero.invalid">
        <label>Número</label>
        <input formControlName="numero" inputmode="numeric" maxlength="9" placeholder="987654321" />
        @if (form.controls.numero.touched && form.controls.numero.invalid) {
          <span class="erro-campo">8 ou 9 dígitos, sem traço</span>
        }
      </div>
      <button class="btn btn-primary" [disabled]="salvando()"><app-icon name="plus" [size]="18" /> Adicionar</button>
    </form>

    <div class="lista">
      @for (t of telefones(); track t.id) {
        <article class="card tel">
          <app-icon name="phone" [size]="20" />
          <b>{{ fmt(t) }}</b>
          <button class="btn btn-danger btn-sm" (click)="remover(t)"><app-icon name="trash" [size]="16" /> Remover</button>
        </article>
      } @empty {
        @if (!carregando()) {
          <div class="card"><app-estado icone="phone" titulo="Nenhum telefone cadastrado" /></div>
        }
      }
    </div>
  `,
  styles: `
    .form { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 16px; }
    .ddd { width: 90px; }
    .num { flex: 1; min-width: 180px; }
    .form .btn { margin-top: 25px; }
    .lista { display: grid; gap: 10px; }
    .tel { display: flex; align-items: center; gap: 14px; padding: 14px 20px; }
    .tel app-icon { color: var(--accent); }
    .tel b { flex: 1; }
  `,
})
export default class Telefones {
  private fb = inject(FormBuilder);
  private conta = inject(ContaService);
  private toast = inject(ToastService);

  protected readonly telefones = signal<Telefone[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);

  protected readonly form = this.fb.group({
    ddd: [null as number | null, [Validators.required, Validators.min(11), Validators.max(99)]],
    numero: ['', [Validators.required, Validators.pattern(/^\d{8,9}$/)]],
  });

  constructor() {
    this.conta.telefones().subscribe({
      next: (l) => {
        this.telefones.set(l);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  fmt(t: Telefone) {
    return formatarTelefone(t.ddd, t.numero);
  }

  adicionar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.conta.adicionarTelefone({ ddd: Number(v.ddd), numero: soDigitos(v.numero ?? '') }).subscribe({
      next: (t) => {
        this.salvando.set(false);
        this.telefones.update((l) => [...l, t]);
        this.form.reset();
        this.toast.sucesso('Telefone adicionado');
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }

  remover(t: Telefone) {
    if (!confirm(`Remover o telefone ${this.fmt(t)}?`)) return;
    this.conta.removerTelefone(t.id).subscribe({
      next: () => {
        this.telefones.update((l) => l.filter((x) => x.id !== t.id));
        this.toast.sucesso('Telefone removido');
      },
      error: (e) => this.toast.erro(mensagemErro(e)),
    });
  }
}
