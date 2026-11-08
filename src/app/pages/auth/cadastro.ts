import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { camposErro, mensagemErro } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { CadastroRequest } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EnderecoCampos, criarEnderecoForm, valorEndereco } from '../../shared/endereco-campos';
import { Icon } from '../../shared/icon';
import { mascaraCnpj, mascaraCpf, soDigitos } from '../../shared/mascaras';

type Tipo = 'cliente' | 'vendedor';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, Icon, EnderecoCampos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.scss',
  template: `
    <div class="container">
      <div class="auth">
        <div class="lado">
          @if (tipoAtual() === 'cliente') {
            <h2>Crie sua conta e aproveite.</h2>
            <p>Leva menos de um minuto. Depois é só escolher, comprar e acompanhar a entrega.</p>
            <ul>
              <li><app-icon name="cart" /> Carrinho salvo na sua conta</li>
              <li><app-icon name="truck" /> Histórico e status dos pedidos</li>
              <li><app-icon name="star" /> Avalie o que você comprou</li>
            </ul>
          } @else {
            <h2>Venda para todo o Brasil.</h2>
            <p>Cadastre sua loja com CNPJ e comece a anunciar hoje mesmo.</p>
            <ul>
              <li><app-icon name="store" /> Página da sua loja</li>
              <li><app-icon name="package" /> Gestão de produtos e estoque</li>
              <li><app-icon name="chart" /> Painel de vendas e faturamento</li>
            </ul>
          }
        </div>

        <div class="form-lado">
          <h1>Criar conta</h1>
          <p>Escolha o tipo de conta.</p>

          <div class="tipo" role="tablist">
            <button type="button" [class.ativo]="tipoAtual() === 'cliente'" (click)="tipoSel.set('cliente')">
              <app-icon name="user" /><span><b>Quero comprar</b><small>Conta de cliente (CPF)</small></span>
            </button>
            <button type="button" [class.ativo]="tipoAtual() === 'vendedor'" (click)="tipoSel.set('vendedor')">
              <app-icon name="store" /><span><b>Quero vender</b><small>Conta de vendedor (CNPJ)</small></span>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="cadastrar()">
            <div class="campo" [class.invalido]="inv('nome')">
              <label>{{ tipoAtual() === 'cliente' ? 'Nome completo' : 'Nome da loja / razão social' }}</label>
              <input formControlName="nome" autocomplete="name" />
              @if (erroServidor()['nome']) { <span class="erro-campo">{{ erroServidor()['nome'] }}</span> }
            </div>

            <div class="campo" [class.invalido]="inv('documento')">
              <label>{{ tipoAtual() === 'cliente' ? 'CPF' : 'CNPJ' }}</label>
              <input
                formControlName="documento"
                inputmode="numeric"
                [placeholder]="tipoAtual() === 'cliente' ? '000.000.000-00' : '00.000.000/0000-00'"
                (input)="mascarar($event)"
              />
              @if (erroServidor()['cpf'] || erroServidor()['cnpj']) {
                <span class="erro-campo">{{ erroServidor()['cpf'] || erroServidor()['cnpj'] }}</span>
              }
            </div>

            <div class="campo" [class.invalido]="inv('email')">
              <label>Email</label>
              <input type="email" formControlName="email" autocomplete="email" />
              @if (inv('email')) { <span class="erro-campo">Email inválido</span> }
            </div>

            <div class="campo" [class.invalido]="inv('senha')">
              <label>Senha</label>
              <input type="password" formControlName="senha" autocomplete="new-password" />
              <span class="dica">Mínimo de 6 caracteres</span>
            </div>

            <details>
              <summary>Adicionar endereço e telefone agora (opcional)</summary>
              <app-endereco-campos [grupo]="endereco" />
              <div class="form-grid" [formGroup]="telefone" style="margin-top: 14px">
                <div class="campo span-1">
                  <label>DDD</label>
                  <input formControlName="ddd" type="number" placeholder="11" />
                </div>
                <div class="campo span-3">
                  <label>Telefone</label>
                  <input formControlName="numero" inputmode="numeric" placeholder="987654321" maxlength="9" />
                </div>
              </div>
            </details>

            @if (erro()) {
              <div class="alerta erro"><app-icon name="alert" [size]="18" /> {{ erro() }}</div>
            }

            <button class="btn btn-primary btn-lg btn-block" [disabled]="carregando()">
              @if (carregando()) {
                <span class="spinner"></span> Criando conta…
              } @else {
                Criar conta de {{ tipoAtual() }}
              }
            </button>
          </form>

          <p class="rodape-form">Já tem conta? <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl() }">Entrar</a></p>
        </div>
      </div>
    </div>
  `,
})
export default class Cadastro {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly tipo = input<Tipo>();
  readonly returnUrl = input<string>();

  protected readonly tipoSel = signal<Tipo | null>(null);
  protected readonly tipoAtual = computed<Tipo>(() => this.tipoSel() ?? (this.tipo() === 'vendedor' ? 'vendedor' : 'cliente'));

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroServidor = signal<Record<string, string>>({});

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    documento: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });
  protected readonly endereco = criarEnderecoForm();
  protected readonly telefone = this.fb.group({
    ddd: [null as number | null, [Validators.min(11), Validators.max(99)]],
    numero: ['', Validators.pattern(/^\d{8,9}$/)],
  });

  constructor() {
    // Limpa o documento ao trocar CPF <-> CNPJ
    effect(() => {
      this.tipoAtual();
      this.form.controls.documento.reset('');
    });
  }

  inv(c: keyof typeof this.form.controls) {
    const ctrl = this.form.controls[c];
    return ctrl.touched && ctrl.invalid;
  }

  mascarar(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.form.controls.documento.setValue(this.tipoAtual() === 'cliente' ? mascaraCpf(v) : mascaraCnpj(v));
  }

  cadastrar() {
    this.erro.set(null);
    this.erroServidor.set({});

    const enderecoPreenchido = Object.values(this.endereco.getRawValue()).some((v) => v !== '' && v !== null);
    const tel = this.telefone.getRawValue();
    const telefonePreenchido = !!tel.ddd || !!tel.numero;

    if (enderecoPreenchido) this.endereco.markAllAsTouched();
    if (this.form.invalid || (enderecoPreenchido && this.endereco.invalid) || this.telefone.invalid ||
        (telefonePreenchido && (!tel.ddd || !tel.numero))) {
      this.form.markAllAsTouched();
      this.erro.set('Revise os campos destacados.');
      return;
    }

    const v = this.form.getRawValue();
    const dto: CadastroRequest = {
      nome: v.nome.trim(),
      email: v.email.trim(),
      senha: v.senha,
      enderecos: enderecoPreenchido ? [valorEndereco(this.endereco)] : [],
      telefones: telefonePreenchido ? [{ ddd: Number(tel.ddd), numero: soDigitos(tel.numero ?? '') }] : [],
    };
    const tipo = this.tipoAtual();
    let req: Observable<unknown>;
    if (tipo === 'cliente') req = this.auth.cadastrarCliente({ ...dto, cpf: v.documento });
    else req = this.auth.cadastrarVendedor({ ...dto, cnpj: v.documento });

    this.carregando.set(true);
    req.pipe(switchMap(() => this.auth.login(dto.email, dto.senha))).subscribe({
      next: () => {
        this.carregando.set(false);
        this.toast.sucesso('Conta criada com sucesso!');
        const r = this.returnUrl();
        this.router.navigateByUrl(r && r.startsWith('/') ? r : tipo === 'vendedor' ? '/vendedor' : '/');
      },
      error: (e) => {
        this.carregando.set(false);
        this.erroServidor.set(camposErro(e));
        this.erro.set(mensagemErro(e));
      },
    });
  }
}
