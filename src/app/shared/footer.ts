import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer>
      <div class="container grid">
        <div>
          <div class="logo"><app-icon name="zap" [size]="18" /> Kami<b>Store</b></div>
          <p>Marketplace de tecnologia: hardware, periféricos e muito mais, de vendedores de todo o Brasil.</p>
        </div>
        <div>
          <h4>Comprar</h4>
          <a routerLink="/busca">Todos os produtos</a>
          <a routerLink="/carrinho">Carrinho</a>
          <a routerLink="/conta/pedidos">Meus pedidos</a>
        </div>
        <div>
          <h4>Vender</h4>
          <a routerLink="/cadastro" [queryParams]="{ tipo: 'vendedor' }">Seja um vendedor</a>
          <a routerLink="/vendedor">Painel do vendedor</a>
        </div>
        <div>
          <h4>Sua conta</h4>
          <a routerLink="/login">Entrar</a>
          <a routerLink="/cadastro">Criar conta</a>
          <a routerLink="/conta">Meus dados</a>
        </div>
      </div>
      <div class="container rodape">
        <span>© {{ ano }} KamiStore. Todos os direitos reservados.</span>
        <span class="selos">
          <span><app-icon name="lock" [size]="14" /> Site seguro</span>
          <span><app-icon name="card" [size]="14" /> Cartão · Pix · Boleto</span>
        </span>
      </div>
    </footer>
  `,
  styles: `
    footer { background: var(--brand-900); color: rgba(255,255,255,.7); margin-top: 64px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; padding-top: 44px; padding-bottom: 32px; }
    .logo { color: #fff; font-size: 20px; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
    .logo b { color: var(--accent); }
    p { max-width: 320px; line-height: 1.6; margin: 0; }
    h4 { color: #fff; margin: 0 0 12px; font-size: 14px; }
    a { display: block; color: inherit; text-decoration: none; padding: 4px 0; }
    a:hover { color: #fff; }
    .rodape { border-top: 1px solid rgba(255,255,255,.1); padding-top: 18px; padding-bottom: 22px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; }
    .selos { display: flex; gap: 18px; }
    .selos span { display: inline-flex; align-items: center; gap: 6px; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }
  `,
})
export class Footer {
  protected readonly ano = new Date().getFullYear();
}
