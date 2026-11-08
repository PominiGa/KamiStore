import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CarrinhoService } from '../core/carrinho.service';
import { ROLE_LABEL } from '../core/pedido-status';
import { CATEGORIAS } from './categorias';
import { Icon } from './icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'menuAberto.set(false)' },
  template: `
    <div class="topbar">
      <div class="container topbar-inner">
        <span><app-icon name="shield" [size]="14" /> Compra 100% segura</span>
        <span class="hide-sm"><app-icon name="card" [size]="14" /> Parcele em até 10x sem juros</span>
        <span class="hide-sm"><app-icon name="truck" [size]="14" /> Acompanhe seu pedido em tempo real</span>
      </div>
    </div>

    <header class="main">
      <div class="container main-inner">
        <a routerLink="/" class="logo" aria-label="Página inicial">
          <span class="logo-mark"><app-icon name="zap" [size]="20" [stroke]="2.5" /></span>
          <span>Kami<b>Store</b></span>
        </a>

        <form class="busca" (ngSubmit)="buscar()" role="search">
          <input
            type="search"
            name="q"
            [(ngModel)]="termo"
            placeholder="Busque por placa de vídeo, notebook, monitor…"
            aria-label="Buscar produtos"
          />
          <button type="submit" aria-label="Buscar"><app-icon name="search" /></button>
        </form>

        <div class="acoes">
          @if (auth.logado()) {
            <div class="conta" (click)="$event.stopPropagation()">
              <button class="conta-btn" (click)="menuAberto.update((v) => !v)" [attr.aria-expanded]="menuAberto()">
                <span class="avatar">{{ auth.primeiroNome().charAt(0) }}</span>
                <span class="conta-txt hide-sm">
                  <small>Olá, {{ auth.primeiroNome() }}</small>
                  <b>Minha conta <app-icon name="chevron-down" [size]="14" /></b>
                </span>
              </button>
              @if (menuAberto()) {
                <div class="menu" (click)="menuAberto.set(false)">
                  <div class="menu-head">
                    <b>{{ auth.usuario()?.nome }}</b>
                    <small>{{ auth.usuario()?.email }} · {{ roleLabel[auth.role()!] }}</small>
                  </div>
                  <a routerLink="/conta"><app-icon name="user" [size]="18" /> Meus dados</a>
                  @switch (auth.role()) {
                    @case ('CLIENTE') {
                      <a routerLink="/conta/pedidos"><app-icon name="package" [size]="18" /> Meus pedidos</a>
                      <a routerLink="/carrinho"><app-icon name="cart" [size]="18" /> Carrinho</a>
                    }
                    @case ('VENDEDOR') {
                      <a routerLink="/vendedor"><app-icon name="store" [size]="18" /> Painel do vendedor</a>
                      <a routerLink="/vendedor/vendas"><app-icon name="chart" [size]="18" /> Minhas vendas</a>
                    }
                    @case ('ADMIN') {
                      <a routerLink="/admin"><app-icon name="grid" [size]="18" /> Painel administrativo</a>
                    }
                  }
                  <button (click)="auth.logout()"><app-icon name="logout" [size]="18" /> Sair</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="conta-btn">
              <span class="avatar vazio"><app-icon name="user" [size]="18" /></span>
              <span class="conta-txt hide-sm">
                <small>Olá, visitante</small>
                <b>Entre ou cadastre-se</b>
              </span>
            </a>
          }

          @if (!auth.logado() || auth.role() === 'CLIENTE') {
            <a routerLink="/carrinho" class="carrinho" aria-label="Carrinho">
              <app-icon name="cart" [size]="26" />
              @if (carrinho.quantidade() > 0) {
                <span class="contador">{{ carrinho.quantidade() }}</span>
              }
            </a>
          }
        </div>
      </div>
    </header>

    <nav class="categorias">
      <div class="container cat-inner">
        <a routerLink="/busca" [queryParams]="{}" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }">
          <app-icon name="menu" [size]="16" /> Todos os produtos
        </a>
        @for (c of categorias; track c.nome) {
          <a routerLink="/busca" [queryParams]="{ q: c.busca }">{{ c.nome }}</a>
        }
      </div>
    </nav>
  `,
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly carrinho = inject(CarrinhoService);
  private router = inject(Router);

  protected readonly categorias = CATEGORIAS;
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly menuAberto = signal(false);
  protected termo = '';

  constructor() {
    // Mantém o campo de busca sincronizado com a URL
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const tree = this.router.parseUrl(this.router.url);
      this.termo = tree.root.children['primary']?.segments[0]?.path === 'busca' ? (tree.queryParams['q'] ?? '') : '';
      this.menuAberto.set(false);
    });
  }

  buscar() {
    const q = this.termo.trim();
    this.router.navigate(['/busca'], { queryParams: q ? { q } : {} });
  }
}
