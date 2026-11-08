import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensagemErro } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { ROLE_LABEL } from '../../core/pedido-status';
import { ContaService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { mascaraCnpj, mascaraCpf } from '../../shared/mascaras';

@Component({
  selector: 'app-meus-dados',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo-pagina">Meus dados</h1>

    <section class="card">
      <h2 class="card-titulo"><app-icon name="user" [size]="18" /> Informações da conta</h2>
      <dl class="info">
        <div><dt>Email</dt><dd>{{ auth.usuario()?.email }}</dd></div>
        <div><dt>Tipo de conta</dt><dd>{{ roles[auth.role()!] }}</dd></div>
        @if (documento()) {
          <div><dt>{{ auth.role() === 'CLIENTE' ? 'CPF' : 'CNPJ' }}</dt><dd class="mono">{{ documento() }}</dd></div>
        }
      </dl>
    </section>

    <section class="card bloco">
      <h2 class="card-titulo"><app-icon name="edit" [size]="18" /> Alterar nome</h2>
      <form [formGroup]="formNome" (ngSubmit)="salvarNome()" class="linha-form">
        <div class="campo">
          <label for="nome">Nome</label>
          <input id="nome" formControlName="nome" maxlength="100" />
        </div>
        <button class="btn btn-dark" [disabled]="formNome.invalid || formNome.pristine || salvando()">Salvar</button>
      </form>
    </section>

    <section class="card bloco">
      <h2 class="card-titulo"><app-icon name="lock" [size]="18" /> Alterar senha</h2>
      <form [formGroup]="formSenha" (ngSubmit)="salvarSenha()" class="linha-form">
        <div class="campo">
          <label for="senha">Nova senha</label>
          <input id="senha" type="password" formControlName="senha" autocomplete="new-password" />
          <span class="dica">Mínimo de 6 caracteres</span>
        </div>
        <div class="campo">
          <label for="conf">Confirmar nova senha</label>
          <input id="conf" type="password" formControlName="confirmacao" autocomplete="new-password" />
          @if (formSenha.touched && senhasDiferentes()) {
            <span class="erro-campo">As senhas não conferem</span>
          }
        </div>
        <button class="btn btn-dark" [disabled]="formSenha.invalid || senhasDiferentes() || salvando()">Alterar senha</button>
      </form>
    </section>
  `,
  styles: `
    .bloco { margin-top: 16px; }
    .info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 0; }
    dt { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; font-weight: 700; }
    dd { margin: 4px 0 0; font-weight: 600; }
    .linha-form { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .linha-form .campo { flex: 1; min-width: 220px; }
    .linha-form .btn { margin-top: 25px; }
  `,
})
export default class MeusDados {
  private fb = inject(FormBuilder);
  private conta = inject(ContaService);
  private toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly roles = ROLE_LABEL;

  protected readonly salvando = signal(false);
  protected readonly documento = signal<string | null>(null);

  protected readonly formNome = this.fb.nonNullable.group({
    nome: [this.auth.usuario()?.nome ?? '', [Validators.required, Validators.maxLength(100)]],
  });
  protected readonly formSenha = this.fb.nonNullable.group({
    senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    confirmacao: ['', Validators.required],
  });

  constructor() {
    const role = this.auth.role();
    if (role === 'CLIENTE') this.conta.meuCliente().subscribe({ next: (c) => this.documento.set(mascaraCpf(c.cpf)), error: () => {} });
    if (role === 'VENDEDOR') this.conta.meuVendedor().subscribe({ next: (v) => this.documento.set(mascaraCnpj(v.cnpj)), error: () => {} });
  }

  senhasDiferentes() {
    const v = this.formSenha.getRawValue();
    return !!v.confirmacao && v.senha !== v.confirmacao;
  }

  salvarNome() {
    this.salvar({ nome: this.formNome.getRawValue().nome.trim() }, 'Nome atualizado', () => this.formNome.markAsPristine());
  }

  salvarSenha() {
    this.salvar({ senha: this.formSenha.getRawValue().senha }, 'Senha alterada', () => this.formSenha.reset());
  }

  private salvar(dto: { nome?: string; senha?: string }, msg: string, depois: () => void) {
    this.salvando.set(true);
    this.conta.atualizar(dto).subscribe({
      next: (u) => {
        this.salvando.set(false);
        this.auth.salvarUsuario(u);
        this.toast.sucesso(msg);
        depois();
      },
      error: (e) => {
        this.salvando.set(false);
        this.toast.erro(mensagemErro(e));
      },
    });
  }
}
