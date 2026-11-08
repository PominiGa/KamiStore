import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

/** Estado vazio / erro padronizado */
@Component({
  selector: 'app-estado',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="estado" [class.erro]="erro()">
      <div class="ico"><app-icon [name]="erro() ? 'alert' : icone()" [size]="30" /></div>
      <h3>{{ titulo() }}</h3>
      @if (texto()) {
        <p>{{ texto() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .estado { text-align: center; padding: 48px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .ico { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); margin-bottom: 6px; }
    .erro .ico { background: var(--danger-bg); color: var(--danger); }
    h3 { margin: 0; font-size: 18px; }
    p { margin: 0 0 8px; color: var(--muted); max-width: 440px; }
  `,
})
export class Estado {
  readonly titulo = input.required<string>();
  readonly texto = input<string>();
  readonly icone = input('package');
  readonly erro = input(false);
}
