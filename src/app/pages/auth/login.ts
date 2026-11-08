import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensagemErro } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.scss',
  template: `
    <div class="container">
      <div class="auth">
        <div class="lado">
          <h2>Bem-vindo de volta!</h2>
          <p>Entre para acompanhar seus pedidos, finalizar compras ou gerenciar sua loja.</p>
          <ul>
            <li><app-icon name="package" /> Acompanhe cada etapa da entrega</li>
            <li><app-icon name="card" /> Parcele em até 10x sem juros</li>
            <li><app-icon name="store" /> Venda seus produtos para todo o Brasil</li>
          </ul>
        </div>
        <div class="form-lado">
          <h1>Entrar</h1>
          <p>Use o email e a senha cadastrados.</p>

          @if (expirada()) {
            <div class="alerta warn" style="margin-bottom: 14px">Sua sessão expirou. Entre novamente.</div>
          }

          <form [formGroup]="form" (ngSubmit)="entrar()">
            <div class="campo" [class.invalido]="form.controls.email.touched && form.controls.email.invalid">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="voce@email.com" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <span class="erro-campo">Informe um email válido.</span>
              }
            </div>
            <div class="campo" [class.invalido]="form.controls.senha.touched && form.controls.senha.invalid">
              <label for="senha">Senha</label>
              <div class="senha-wrap">
                <input id="senha" [type]="verSenha() ? 'text' : 'password'" formControlName="senha" autocomplete="current-password" />
                <button type="button" (click)="verSenha.update((v) => !v)">{{ verSenha() ? 'OCULTAR' : 'MOSTRAR' }}</button>
              </div>
            </div>

            @if (erro()) {
              <div class="alerta erro"><app-icon name="alert" [size]="18" /> {{ erro() }}</div>
            }

            <button class="btn btn-primary btn-lg btn-block" [disabled]="carregando()">
              @if (carregando()) {
                <span class="spinner"></span> Entrando…
              } @else {
                Entrar
              }
            </button>
          </form>

          <p class="rodape-form">Não tem conta? <a routerLink="/cadastro" [queryParams]="{ returnUrl: returnUrl() }">Cadastre-se grátis</a></p>
        </div>
      </div>
    </div>
  `,
})
export default class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly returnUrl = input<string>();
  readonly expirada = input<string>();

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly verSenha = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  entrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);
    const { email, senha } = this.form.getRawValue();
    this.auth.login(email.trim(), senha).subscribe({
      next: (u) => {
        this.carregando.set(false);
        this.toast.sucesso(`Olá, ${u.nome.split(' ')[0]}!`);
        this.router.navigateByUrl(this.destino(u.role));
      },
      error: (e) => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(e, 'Email ou senha inválidos'));
      },
    });
  }

  private destino(role: string): string {
    const r = this.returnUrl();
    if (r && r.startsWith('/') && !r.startsWith('/login')) return r;
    if (role === 'VENDEDOR') return '/vendedor';
    if (role === 'ADMIN') return '/admin';
    return '/';
  }
}
