import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-estrelas',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="estrelas" [class.editavel]="editavel()" role="img" [attr.aria-label]="'Nota ' + nota() + ' de 5'">
      @for (i of cinco; track i) {
        @if (editavel()) {
          <button type="button" (click)="nota.set(i)" [attr.aria-label]="i + ' estrelas'">
            <app-icon name="star" [size]="tamanho()" [class.cheia]="i <= nota()" />
          </button>
        } @else {
          <app-icon name="star" [size]="tamanho()" [class.cheia]="i <= arredondada()" />
        }
      }
    </span>
  `,
  styles: `
    .estrelas { display: inline-flex; gap: 2px; color: #d4d8de; vertical-align: middle; }
    .cheia { color: #f5a524; }
    .cheia ::ng-deep svg { fill: currentColor; }
    button { background: none; border: 0; padding: 2px; cursor: pointer; color: inherit; }
    button:hover { transform: scale(1.15); }
  `,
})
export class Estrelas {
  readonly nota = model(0);
  readonly tamanho = input(16);
  readonly editavel = input(false);
  protected readonly cinco = [1, 2, 3, 4, 5];
  protected readonly arredondada = computed(() => Math.round(this.nota() ?? 0));
}
