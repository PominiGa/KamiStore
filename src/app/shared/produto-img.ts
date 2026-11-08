import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { categoriaDe } from './categorias';
import { Icon } from './icon';

/** "Foto" gerada do produto: gradiente + ícone da categoria inferida pelo nome */
@Component({
  selector: 'app-produto-img',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src() && !falhou()) {
      <div class="img foto" [class.compacta]="compacta()">
        <img [src]="src()" [alt]="nome()" loading="lazy" (error)="falhou.set(true)" />
      </div>
    } @else {
      <div class="img" [style.background]="fundo()" [class.compacta]="compacta()">
        <app-icon [name]="cat().icone" [size]="compacta() ? 22 : 64" [stroke]="1.4" />
        @if (!compacta()) {
          <span class="cat">{{ cat().nome }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .img {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius);
      display: grid;
      place-items: center;
      color: rgba(255, 255, 255, 0.92);
      overflow: hidden;
    }
    .img::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.22), transparent 55%);
    }
    .cat {
      position: absolute;
      left: 10px;
      bottom: 8px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .compacta { border-radius: 8px; }
    .foto { background: #fff; border: 1px solid var(--border); }
    .foto::after { display: none; }
    .foto img { width: 100%; height: 100%; object-fit: contain; display: block; }
  `,
})
export class ProdutoImg {
  readonly nome = input.required<string>();
  readonly compacta = input(false);
  /** URL da foto real; sem ela (ou se falhar) usa a arte gerada */
  readonly src = input<string | null | undefined>(null);
  protected readonly falhou = signal(false);
  protected readonly cat = computed(() => categoriaDe(this.nome()));
  protected readonly fundo = computed(() => {
    const [a, b] = this.cat().cor;
    return `linear-gradient(135deg, ${a}, ${b})`;
  });

  constructor() {
    effect(() => {
      this.src();
      this.falhou.set(false);
    });
  }
}
