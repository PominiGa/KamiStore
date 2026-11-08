import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { camposErro, mensagemErro } from '../../core/api';
import { ImagemProduto, Produto, ProdutoRequest, Variacao } from '../../core/models';
import { ProdutoService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { ProdutoImg } from '../../shared/produto-img';

const MAX_IMAGENS = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type VariacaoForm = FormGroup<{
  id: FormControl<number | null>;
  cor: FormControl<string>;
  tamanho: FormControl<string>;
  preco: FormControl<number | null>;
  quantidade: FormControl<number | null>;
}>;

function novaVariacao(v?: Partial<Variacao>, precoProduto?: number): VariacaoForm {
  // Se o preço da variação é igual ao do produto, deixa vazio (= herda o do produto)
  const preco = v?.preco != null && v.preco !== precoProduto ? v.preco : null;
  return new FormGroup({
    id: new FormControl<number | null>(v?.id ?? null),
    cor: new FormControl(v?.cor ?? '', { nonNullable: true, validators: Validators.maxLength(50) }),
    tamanho: new FormControl(v?.tamanho ?? '', { nonNullable: true, validators: Validators.maxLength(20) }),
    preco: new FormControl<number | null>(preco, Validators.min(0.01)),
    quantidade: new FormControl<number | null>(v?.quantidade ?? 0, [Validators.required, Validators.min(0)]),
  });
}

interface FotoNova {
  arquivo: File;
  url: string;
}

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, Icon, ProdutoImg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './produto-form.scss',
  templateUrl: './produto-form.html',
})
export default class ProdutoForm implements OnInit {
  private api = inject(ProdutoService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly id = input<string>();

  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly servidor = signal<Record<string, string>>({});

  // Fotos já salvas (edição) e fotos novas aguardando envio
  protected readonly fotosSalvas = signal<ImagemProduto[]>([]);
  protected readonly fotosNovas = signal<FotoNova[]>([]);
  protected readonly totalFotos = computed(() => this.fotosSalvas().length + this.fotosNovas().length);
  protected readonly maxImagens = MAX_IMAGENS;

  protected readonly form = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    descricao: new FormControl('', { nonNullable: true, validators: Validators.maxLength(255) }),
    ean: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{8,17}$/)] }),
    preco: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    quantidade: new FormControl<number | null>(1, [Validators.min(0)]),
    variacoes: new FormArray<VariacaoForm>([]),
  });
  protected readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly temVariacoes = computed(() => (this.valores().variacoes?.length ?? 0) > 0);
  protected readonly estoqueTotal = computed(() =>
    (this.valores().variacoes ?? []).reduce((s, v) => s + (Number(v?.quantidade) || 0), 0),
  );
  protected readonly fotoPreview = computed(() => this.fotosSalvas()[0]?.url ?? this.fotosNovas()[0]?.url ?? null);

  get variacoes() {
    return this.form.controls.variacoes;
  }

  ngOnInit() {
    const id = this.id();
    if (!id) return;
    this.carregando.set(true);
    this.api.buscar(Number(id)).subscribe({
      next: (p) => {
        this.preencher(p);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.erro.set(mensagemErro(e, 'Produto não encontrado'));
      },
    });
  }

  private preencher(p: Produto) {
    this.variacoes.clear();
    (p.variacoes ?? []).forEach((v) => this.variacoes.push(novaVariacao(v, p.preco)));
    this.form.patchValue({ nome: p.nome, descricao: p.descricao ?? '', ean: p.ean, preco: p.preco, quantidade: p.quantidade });
    this.fotosSalvas.set(p.imagens ?? []);
  }

  inv(c: 'nome' | 'descricao' | 'ean' | 'preco' | 'quantidade') {
    const ctrl = this.form.controls[c];
    return ctrl.touched && ctrl.invalid;
  }

  // ===== Variações =====
  adicionarVariacao() {
    this.variacoes.push(novaVariacao());
  }
  removerVariacao(i: number) {
    this.variacoes.removeAt(i);
  }
  /** Gera a grade cor × tamanho a partir de listas separadas por vírgula */
  gerarGrade(cores: string, tamanhos: string) {
    const cs = cores.split(',').map((x) => x.trim()).filter(Boolean);
    const ts = tamanhos.split(',').map((x) => x.trim()).filter(Boolean);
    const combos = cs.length && ts.length ? cs.flatMap((c) => ts.map((t) => [c, t])) : cs.length ? cs.map((c) => [c, '']) : ts.map((t) => ['', t]);
    const existentes = new Set(this.variacoes.getRawValue().map((v) => `${v.cor.toLowerCase()}|${v.tamanho.toLowerCase()}`));
    let novas = 0;
    combos.forEach(([cor, tamanho]) => {
      if (existentes.has(`${cor.toLowerCase()}|${tamanho.toLowerCase()}`)) return;
      this.variacoes.push(novaVariacao({ cor, tamanho, quantidade: 0 }));
      novas++;
    });
    if (!combos.length) this.toast.info('Informe cores e/ou tamanhos separados por vírgula.');
    else if (!novas) this.toast.info('Essas combinações já existem.');
  }

  // ===== Fotos =====
  selecionarFotos(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const arquivos = Array.from(input.files ?? []);
    input.value = '';
    const validas: FotoNova[] = [];
    for (const f of arquivos) {
      if (!TIPOS.includes(f.type)) {
        this.toast.erro(`${f.name}: formato não suportado (use JPEG, PNG, WEBP ou GIF)`);
      } else if (f.size > MAX_BYTES) {
        this.toast.erro(`${f.name}: maior que 5MB`);
      } else if (this.totalFotos() + validas.length >= MAX_IMAGENS) {
        this.toast.erro(`Máximo de ${MAX_IMAGENS} fotos por produto`);
        break;
      } else {
        validas.push({ arquivo: f, url: URL.createObjectURL(f) });
      }
    }
    this.fotosNovas.update((l) => [...l, ...validas]);
  }

  descartarNova(i: number) {
    this.fotosNovas.update((l) => {
      URL.revokeObjectURL(l[i].url);
      return l.filter((_, j) => j !== i);
    });
  }

  removerSalva(img: ImagemProduto) {
    const id = Number(this.id());
    if (!confirm('Remover esta foto do produto?')) return;
    this.api.removerImagem(id, img.id).subscribe({
      next: () => {
        this.fotosSalvas.update((l) => l.filter((x) => x.id !== img.id));
        this.toast.sucesso('Foto removida');
      },
      error: (e) => this.toast.erro(mensagemErro(e)),
    });
  }

  // ===== Salvar =====
  salvar() {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    const semVariacoes = v.variacoes.length === 0;

    if (semVariacoes && (v.quantidade === null || (v.quantidade as unknown) === '')) {
      this.form.controls.quantidade.setErrors({ required: true });
    }
    const variacaoVazia = v.variacoes.findIndex((x) => !x.cor.trim() && !x.tamanho.trim());
    if (variacaoVazia >= 0) {
      this.erro.set(`A variação ${variacaoVazia + 1} precisa ter cor e/ou tamanho.`);
      return;
    }
    if (this.form.invalid) {
      this.erro.set('Revise os campos destacados.');
      return;
    }

    const dto: ProdutoRequest = {
      nome: v.nome.trim(),
      descricao: v.descricao.trim() || null,
      ean: v.ean,
      preco: Math.round(Number(v.preco) * 100) / 100,
      quantidade: semVariacoes ? Number(v.quantidade) : null,
      // Lista completa: o backend cria/atualiza/remove conforme os ids
      variacoes: v.variacoes.map((x) => ({
        id: x.id,
        cor: x.cor.trim() || null,
        tamanho: x.tamanho.trim() || null,
        preco: x.preco ? Math.round(Number(x.preco) * 100) / 100 : null,
        quantidade: Number(x.quantidade),
      })),
    };

    const idEdicao = this.id();
    this.salvando.set(true);
    this.erro.set(null);
    this.servidor.set({});

    const salvarProduto$ = idEdicao ? this.api.atualizar(Number(idEdicao), dto) : this.api.criar(dto);
    // Fluxo em duas etapas: salva o produto (JSON) e depois envia as fotos (multipart)
    salvarProduto$
      .pipe(
        switchMap((p): Observable<Produto> => {
          const novas = this.fotosNovas().map((f) => f.arquivo);
          return novas.length ? this.api.enviarImagens(p.id, novas) : of(p);
        }),
      )
      .subscribe({
        next: (p) => {
          this.salvando.set(false);
          this.fotosNovas().forEach((f) => URL.revokeObjectURL(f.url));
          this.fotosNovas.set([]);
          this.toast.sucesso(idEdicao ? 'Produto atualizado' : `${p.nome} cadastrado!`);
          this.router.navigateByUrl('/vendedor');
        },
        error: (e) => {
          this.salvando.set(false);
          this.servidor.set(camposErro(e));
          this.erro.set(mensagemErro(e));
          // Se o produto foi criado mas as fotos falharam, segue para a edição para não duplicar
          if (!idEdicao && e?.url?.includes('/imagens')) {
            const m = /produtos\/(\d+)\/imagens/.exec(e.url);
            if (m) this.router.navigate(['/vendedor/produtos', m[1], 'editar']);
          }
        },
      });
  }
}
