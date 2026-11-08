import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ROLE_LABEL } from '../../core/pedido-status';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-conta-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container pagina layout">
      <aside class="card menu">
        <div class="perfil">
          <span class="avatar">{{ auth.primeiroNome().charAt(0) }}</span>
          <div>
            <b>{{ auth.usuario()?.nome }}</b>
            <small>{{ roles[auth.role()!] }}</small>
          </div>
        </div>
        <nav>
          <a routerLink="/conta" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }"><app-icon name="user" [size]="18" /> Meus dados</a>
          @if (auth.role() === 'CLIENTE') {
            <a routerLink="/conta/pedidos" routerLinkActive="ativo"><app-icon name="package" [size]="18" /> Meus pedidos</a>
          }
          <a routerLink="/conta/enderecos" routerLinkActive="ativo"><app-icon name="pin" [size]="18" /> Endereços</a>
          <a routerLink="/conta/telefones" routerLinkActive="ativo"><app-icon name="phone" [size]="18" /> Telefones</a>
          @if (auth.role() === 'VENDEDOR') {
            <a routerLink="/vendedor"><app-icon name="store" [size]="18" /> Painel do vendedor</a>
          }
          @if (auth.role() === 'ADMIN') {
            <a routerLink="/admin"><app-icon name="grid" [size]="18" /> Administração</a>
          }
          <button (click)="auth.logout()"><app-icon name="logout" [size]="18" /> Sair</button>
        </nav>
      </aside>
      <section class="conteudo">
        <router-outlet />
      </section>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
    .menu { padding: 12px; position: sticky; top: 160px; }
    .perfil { display: flex; gap: 12px; align-items: center; padding: 8px 8px 16px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
    .perfil div { display: flex; flex-direction: column; min-width: 0; }
    .perfil b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .perfil small { color: var(--muted); }
    .avatar { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; background: var(--accent); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 18px; text-transform: uppercase; }
    nav { display: flex; flex-direction: column; }
    nav a, nav button { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: var(--text); text-decoration: none; font: inherit; font-size: 14px; font-weight: 500; background: none; border: 0; cursor: pointer; text-align: left; }
    nav a:hover, nav button:hover { background: var(--surface-2); }
    nav a.ativo { background: var(--accent-soft); color: var(--accent-strong); font-weight: 700; }
    nav button { color: var(--danger); }
    .conteudo { min-width: 0; }
    @media (max-width: 820px) { .layout { grid-template-columns: 1fr; } .menu { position: static; } }
  `,
})
export default class ContaLayout {
  protected readonly auth = inject(AuthService);
  protected readonly roles = ROLE_LABEL;
}
