import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { AuthService } from './auth.service';
import { Carrinho } from './models';

/** Estado global do carrinho do cliente logado */
@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly carrinho = signal<Carrinho | null>(null);
  readonly quantidade = computed(() => this.carrinho()?.quantidadeTotal ?? 0);
  readonly vazio = computed(() => !this.carrinho()?.itens.length);

  constructor() {
    effect(() => {
      if (this.auth.logado() && this.auth.role() === 'CLIENTE') {
        this.carregar().subscribe({ error: () => {} });
      } else {
        this.carrinho.set(null);
      }
    });
  }

  carregar(): Observable<Carrinho> {
    return this.http.get<Carrinho>(`${API}/carrinho`).pipe(tap((c) => this.carrinho.set(c)));
  }

  adicionar(produtoId: number, quantidade = 1, variacaoId: number | null = null): Observable<Carrinho> {
    return this.http
      .post<Carrinho>(`${API}/carrinho/itens`, { produtoId, variacaoId, quantidade })
      .pipe(tap((c) => this.carrinho.set(c)));
  }

  alterarQuantidade(produtoId: number, variacaoId: number | null | undefined, quantidade: number): Observable<Carrinho> {
    return this.http
      .put<Carrinho>(`${API}/carrinho/itens/${produtoId}`, { quantidade }, { params: variacaoParam(variacaoId) })
      .pipe(tap((c) => this.carrinho.set(c)));
  }

  remover(produtoId: number, variacaoId?: number | null): Observable<Carrinho> {
    return this.http
      .delete<Carrinho>(`${API}/carrinho/itens/${produtoId}`, { params: variacaoParam(variacaoId) })
      .pipe(tap((c) => this.carrinho.set(c)));
  }

  esvaziar(): Observable<void> {
    return this.http.delete<void>(`${API}/carrinho`).pipe(
      tap(() => this.carrinho.update((c) => (c ? { ...c, itens: [], quantidadeTotal: 0, valorTotal: 0 } : c))),
    );
  }
}

function variacaoParam(variacaoId: number | null | undefined): Record<string, number> {
  return variacaoId ? { variacaoId } : {};
}
