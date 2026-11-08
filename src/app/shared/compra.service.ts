import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { mensagemErro } from '../core/api';
import { AuthService } from '../core/auth.service';
import { CarrinhoService } from '../core/carrinho.service';
import { Produto } from '../core/models';
import { ToastService } from '../core/toast.service';

/** Ação "Comprar / Adicionar ao carrinho" usada nos cards e na página do produto */
@Injectable({ providedIn: 'root' })
export class CompraService {
  private auth = inject(AuthService);
  private carrinho = inject(CarrinhoService);
  private toast = inject(ToastService);
  private router = inject(Router);

  /** id do produto sendo adicionado (para mostrar loading no botão) */
  readonly adicionando = signal<number | null>(null);

  adicionar(produto: Produto, quantidade = 1, irParaCarrinho = false, variacaoId: number | null = null) {
    if (!this.auth.logado()) {
      this.toast.info('Entre na sua conta de cliente para comprar.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/produto/${produto.id}` } });
      return;
    }
    if (this.auth.role() !== 'CLIENTE') {
      this.toast.info('Apenas contas de cliente podem comprar.');
      return;
    }
    if (produto.variacoes?.length && !variacaoId) {
      // Produto com cor/tamanho: a escolha é feita na página do produto
      this.router.navigate(['/produto', produto.id]);
      return;
    }
    this.adicionando.set(produto.id);
    this.carrinho.adicionar(produto.id, quantidade, variacaoId).subscribe({
      next: () => {
        this.adicionando.set(null);
        if (irParaCarrinho) this.router.navigateByUrl('/carrinho');
        else this.toast.sucesso(`${produto.nome} adicionado ao carrinho`);
      },
      error: (e) => {
        this.adicionando.set(null);
        this.toast.erro(mensagemErro(e));
      },
    });
  }
}
