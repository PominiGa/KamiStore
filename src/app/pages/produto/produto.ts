import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { API, mensagemErro } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { AvaliacaoResumo, Avaliacao, Page, Produto as ProdutoModel, Variacao } from '../../core/models';
import { AvaliacaoService } from '../../core/services';
import { ToastService } from '../../core/toast.service';
import { categoriaDe } from '../../shared/categorias';
import { CompraService } from '../../shared/compra.service';
import { Estado } from '../../shared/estado';
import { Estrelas } from '../../shared/estrelas';
import { Icon } from '../../shared/icon';
import { Paginacao } from '../../shared/paginacao';
import { ProdutoCard } from '../../shared/produto-card';
import { ProdutoImg } from '../../shared/produto-img';

@Component({
  selector: 'app-produto',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, FormsModule, ProdutoImg, Icon, Estrelas, Estado, Paginacao, ProdutoCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './produto.html',
  styleUrl: './produto.scss',
})
export default class Produto {
  private titulo = inject(Title);
  private avaliacoesApi = inject(AvaliacaoService);
  private toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly compra = inject(CompraService);

  readonly id = input.required<string>();

  protected readonly quantidade = signal(1);
  protected readonly paginaAval = signal(0);

  protected readonly produto = httpResource<ProdutoModel>(() => `${API}/produtos/${this.id()}`);
  protected readonly resumo = httpResource<AvaliacaoResumo>(() => `${API}/produtos/${this.id()}/avaliacoes/resumo`);
  protected readonly avaliacoes = httpResource<Page<Avaliacao>>(() => ({
    url: `${API}/produtos/${this.id()}/avaliacoes`,
    params: { page: this.paginaAval(), size: 5 },
  }));
  protected readonly daLoja = httpResource<Page<ProdutoModel>>(() => {
    const p = this.produto.value();
    return p ? { url: `${API}/produtos/vendedor/${p.vendedorId}`, params: { size: 6 } } : undefined;
  });

  protected readonly categoria = computed(() => categoriaDe(this.produto.value()?.nome ?? ''));
  protected readonly outrosDaLoja = computed(() =>
    (this.daLoja.value()?.conteudo ?? []).filter((p) => p.id !== this.produto.value()?.id).slice(0, 5),
  );
  protected readonly disponivel = computed(() => {
    const p = this.produto.value();
    return !!p && p.status === 'ATIVO' && p.quantidade > 0;
  });

  // ===== Galeria =====
  protected readonly fotoIdx = signal(0);
  protected readonly imagens = computed(() => this.produto.value()?.imagens ?? []);
  protected readonly fotoAtual = computed(() => this.imagens()[this.fotoIdx()]?.url ?? null);

  // ===== Variações (cor / tamanho) =====
  protected readonly variacoes = computed(() => this.produto.value()?.variacoes ?? []);
  protected readonly temVariacoes = computed(() => this.variacoes().length > 0);
  protected readonly cores = computed(() => unicos(this.variacoes().map((v) => v.cor)));
  protected readonly tamanhos = computed(() => unicos(this.variacoes().map((v) => v.tamanho)));
  protected readonly corSel = signal<string | null>(null);
  protected readonly tamSel = signal<string | null>(null);

  /** Variação que bate com a cor e o tamanho escolhidos */
  protected readonly variacaoSel = computed<Variacao | null>(() => {
    if (!this.temVariacoes()) return null;
    const precisaCor = this.cores().length > 0;
    const precisaTam = this.tamanhos().length > 0;
    if ((precisaCor && !this.corSel()) || (precisaTam && !this.tamSel())) return null;
    return (
      this.variacoes().find(
        (v) => (!precisaCor || v.cor === this.corSel()) && (!precisaTam || v.tamanho === this.tamSel()),
      ) ?? null
    );
  });

  protected readonly precoExibido = computed(() => {
    const v = this.variacaoSel();
    if (v) return v.preco;
    const vs = this.variacoes();
    return vs.length ? Math.min(...vs.map((x) => x.preco)) : (this.produto.value()?.preco ?? 0);
  });
  protected readonly aPartirDe = computed(
    () => !this.variacaoSel() && new Set(this.variacoes().map((v) => v.preco)).size > 1,
  );
  /** Estoque considerando a variação escolhida */
  protected readonly estoque = computed(() => {
    const v = this.variacaoSel();
    return v ? v.quantidade : (this.produto.value()?.quantidade ?? 0);
  });
  protected readonly faltaEscolher = computed(() => this.temVariacoes() && !this.variacaoSel());

  /** Há estoque para esta cor (com algum tamanho) / este tamanho (com a cor escolhida)? */
  corDisponivel(cor: string) {
    return this.variacoes().some((v) => v.cor === cor && v.quantidade > 0);
  }
  tamDisponivel(tam: string) {
    const cor = this.corSel();
    return this.variacoes().some(
      (v) => v.tamanho === tam && v.quantidade > 0 && (!this.cores().length || !cor || v.cor === cor),
    );
  }

  escolherCor(cor: string) {
    this.corSel.set(cor);
    this.quantidade.set(1);
    // se o tamanho escolhido não existe nessa cor, limpa
    const t = this.tamSel();
    if (t && !this.tamDisponivel(t)) this.tamSel.set(null);
  }
  escolherTam(tam: string) {
    this.tamSel.set(tam);
    this.quantidade.set(1);
  }

  // Formulário de avaliação
  protected nota = signal(0);
  protected comentario = '';
  protected readonly enviando = signal(false);
  protected readonly erroAval = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.produto.value();
      if (p) this.titulo.setTitle(`${p.nome} · KamiStore`);
    });
    // Reseta estado ao trocar de produto
    effect(() => {
      this.id();
      this.quantidade.set(1);
      this.paginaAval.set(0);
      this.fotoIdx.set(0);
      this.corSel.set(null);
      this.tamSel.set(null);
    });
    // Pré-seleciona quando só há uma opção
    effect(() => {
      if (this.cores().length === 1) this.corSel.set(this.cores()[0]);
      if (this.tamanhos().length === 1) this.tamSel.set(this.tamanhos()[0]);
    });
  }

  alterarQtd(delta: number) {
    const max = Math.max(this.estoque(), 1);
    this.quantidade.update((q) => Math.min(Math.max(q + delta, 1), max));
  }

  comprar(irParaCarrinho: boolean) {
    const p = this.produto.value();
    if (!p || this.faltaEscolher()) return;
    this.compra.adicionar(p, this.quantidade(), irParaCarrinho, this.variacaoSel()?.id ?? null);
  }

  avaliar() {
    if (!this.nota()) {
      this.erroAval.set('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    this.enviando.set(true);
    this.erroAval.set(null);
    this.avaliacoesApi.criar(Number(this.id()), this.nota(), this.comentario.trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.nota.set(0);
        this.comentario = '';
        this.toast.sucesso('Obrigado pela sua avaliação!');
        this.paginaAval.set(0);
        this.avaliacoes.reload();
        this.resumo.reload();
      },
      error: (e) => {
        this.enviando.set(false);
        this.erroAval.set(mensagemErro(e));
      },
    });
  }

  excluirAvaliacao(a: Avaliacao) {
    if (!confirm(`Excluir a avaliação de ${a.clienteNome}?`)) return;
    this.avaliacoesApi.excluir(a.id).subscribe({
      next: () => {
        this.toast.sucesso('Avaliação removida.');
        this.avaliacoes.reload();
        this.resumo.reload();
      },
      error: (e) => this.toast.erro(mensagemErro(e)),
    });
  }
}

function unicos(l: (string | null | undefined)[]): string[] {
  return [...new Set(l.filter((x): x is string => !!x))];
}
