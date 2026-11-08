import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-paginacao',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() > 1) {
      <nav class="pag" aria-label="Paginação">
        <button class="btn btn-ghost btn-sm" [disabled]="pagina() === 0" (click)="mudar.emit(pagina() - 1)">
          <app-icon name="chevron-left" [size]="16" /> Anterior
        </button>
        @for (p of paginas(); track $index) {
          @if (p === -1) {
            <span class="reticencias">…</span>
          } @else {
            <button class="num" [class.ativa]="p === pagina()" (click)="mudar.emit(p)">{{ p + 1 }}</button>
          }
        }
        <button class="btn btn-ghost btn-sm" [disabled]="pagina() >= total() - 1" (click)="mudar.emit(pagina() + 1)">
          Próxima <app-icon name="chevron-right" [size]="16" />
        </button>
      </nav>
    }
  `,
  styles: `
    .pag { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 28px 0 8px; flex-wrap: wrap; }
    .num {
      min-width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--surface); font-weight: 600; cursor: pointer; color: var(--text);
    }
    .num:hover { border-color: var(--accent); color: var(--accent); }
    .num.ativa { background: var(--accent); border-color: var(--accent); color: #fff; }
    .reticencias { color: var(--muted); padding: 0 4px; }
  `,
})
export class Paginacao {
  readonly pagina = input.required<number>();
  readonly total = input.required<number>();
  readonly mudar = output<number>();

  protected readonly paginas = computed(() => {
    const total = this.total();
    const atual = this.pagina();
    const set = new Set([0, total - 1, atual - 1, atual, atual + 1].filter((p) => p >= 0 && p < total));
    const ordenadas = [...set].sort((a, b) => a - b);
    const out: number[] = [];
    ordenadas.forEach((p, i) => {
      if (i > 0 && p - ordenadas[i - 1] > 1) out.push(-1);
      out.push(p);
    });
    return out;
  });
}
