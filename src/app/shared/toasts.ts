import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pilha" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast ' + t.tipo">
          <app-icon [name]="t.tipo === 'sucesso' ? 'check' : t.tipo === 'erro' ? 'alert' : 'zap'" [size]="18" />
          <span>{{ t.mensagem }}</span>
          <button (click)="toast.fechar(t.id)" aria-label="Fechar"><app-icon name="x" [size]="16" /></button>
        </div>
      }
    </div>
  `,
  styles: `
    .pilha { position: fixed; bottom: 20px; right: 20px; z-index: 100; display: flex; flex-direction: column; gap: 10px; max-width: min(400px, calc(100vw - 40px)); }
    .toast {
      display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px;
      background: var(--brand-900); color: #fff; box-shadow: var(--shadow-lg); font-size: 14px; line-height: 1.4;
      animation: entrar .2s ease-out; border-left: 4px solid var(--info);
    }
    .toast span { flex: 1; }
    .sucesso { border-left-color: var(--ok); }
    .sucesso app-icon { color: var(--ok); }
    .erro { border-left-color: var(--danger); }
    .erro app-icon { color: #ff8a8a; }
    button { background: none; border: 0; color: rgba(255,255,255,.6); cursor: pointer; padding: 0; }
    button:hover { color: #fff; }
    @keyframes entrar { from { opacity: 0; transform: translateY(10px); } }
  `,
})
export class Toasts {
  protected readonly toast = inject(ToastService);
}
