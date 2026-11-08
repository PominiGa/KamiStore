import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import { API } from './api';
import { CadastroRequest, Cliente, Usuario, UsuarioRole, Vendedor } from './models';

const TOKEN_KEY = 'kami.token';
const USER_KEY = 'kami.usuario';

function lerJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Lê o "exp" do JWT (em ms). O backend gera tokens com validade de 1 hora. */
function expiracaoToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private timer?: ReturnType<typeof setTimeout>;

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly usuario = signal<Usuario | null>(lerJson<Usuario>(USER_KEY));
  readonly logado = computed(() => !!this.token() && !!this.usuario());
  readonly role = computed<UsuarioRole | null>(() => this.usuario()?.role ?? null);
  readonly primeiroNome = computed(() => this.usuario()?.nome.split(' ')[0] ?? '');

  constructor() {
    const token = this.token();
    if (token) {
      const exp = expiracaoToken(token);
      if (exp && exp <= Date.now()) {
        this.limpar();
      } else {
        this.agendarExpiracao(token);
        // Atualiza os dados do usuário em segundo plano
        this.recarregarPerfil().subscribe({ error: () => {} });
      }
    }
  }

  login(email: string, senha: string): Observable<Usuario> {
    return this.http.post<{ token: string }>(`${API}/usuario/login`, { email, senha }).pipe(
      tap((r) => this.salvarToken(r.token)),
      switchMap(() => this.recarregarPerfil()),
      catchError((e) => {
        this.limpar();
        return throwError(() => e);
      }),
    );
  }

  cadastrarCliente(dto: CadastroRequest): Observable<Cliente> {
    return this.http.post<Cliente>(`${API}/clientes`, dto);
  }

  cadastrarVendedor(dto: CadastroRequest): Observable<Vendedor> {
    return this.http.post<Vendedor>(`${API}/vendedores`, dto);
  }

  recarregarPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${API}/usuario/me`).pipe(tap((u) => this.salvarUsuario(u)));
  }

  salvarUsuario(u: Usuario) {
    this.usuario.set(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  logout(redirecionar = true) {
    this.limpar();
    if (redirecionar) this.router.navigateByUrl('/');
  }

  /** Chamado pelo interceptor quando a API responde 401 */
  sessaoExpirada() {
    if (!this.token()) return;
    this.limpar();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url, expirada: 1 },
    });
  }

  temRole(...roles: UsuarioRole[]): boolean {
    const r = this.role();
    return !!r && roles.includes(r);
  }

  private salvarToken(token: string) {
    this.token.set(token);
    localStorage.setItem(TOKEN_KEY, token);
    this.agendarExpiracao(token);
  }

  private agendarExpiracao(token: string) {
    clearTimeout(this.timer);
    const exp = expiracaoToken(token);
    if (exp) this.timer = setTimeout(() => this.sessaoExpirada(), Math.max(exp - Date.now(), 0));
  }

  private limpar() {
    clearTimeout(this.timer);
    this.token.set(null);
    this.usuario.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
