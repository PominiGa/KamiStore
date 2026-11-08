import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API, PageQuery, pageParams } from './api';
import {
  Avaliacao,
  AvaliacaoResumo,
  Cliente,
  Endereco,
  EnderecoRequest,
  Page,
  Pedido,
  PedidoStatus,
  Produto,
  ProdutoRequest,
  ProdutoStatus,
  Telefone,
  TelefoneRequest,
  Usuario,
  Vendedor,
} from './models';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private http = inject(HttpClient);

  listar(q: PageQuery & { nome?: string } = {}): Observable<Page<Produto>> {
    return this.http.get<Page<Produto>>(`${API}/produtos`, { params: pageParams(q) });
  }
  buscar(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${API}/produtos/${id}`);
  }
  daLoja(vendedorId: number, q: PageQuery = {}): Observable<Page<Produto>> {
    return this.http.get<Page<Produto>>(`${API}/produtos/vendedor/${vendedorId}`, { params: pageParams(q) });
  }
  meus(q: PageQuery = {}): Observable<Page<Produto>> {
    return this.http.get<Page<Produto>>(`${API}/vendedores/me/produtos`, { params: pageParams(q) });
  }
  criar(dto: ProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(`${API}/produtos`, dto);
  }
  atualizar(id: number, dto: ProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${API}/produtos/${id}`, dto);
  }
  alterarStatus(id: number, status: ProdutoStatus): Observable<Produto> {
    return this.http.patch<Produto>(`${API}/produtos/${id}/status`, { status });
  }
  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/produtos/${id}`);
  }
  enviarImagens(id: number, arquivos: File[]): Observable<Produto> {
    const fd = new FormData();
    arquivos.forEach((f) => fd.append('imagens', f, f.name));
    return this.http.post<Produto>(`${API}/produtos/${id}/imagens`, fd);
  }
  removerImagem(id: number, imagemId: number): Observable<void> {
    return this.http.delete<void>(`${API}/produtos/${id}/imagens/${imagemId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {
  private http = inject(HttpClient);

  listar(produtoId: number, q: PageQuery = {}): Observable<Page<Avaliacao>> {
    return this.http.get<Page<Avaliacao>>(`${API}/produtos/${produtoId}/avaliacoes`, { params: pageParams(q) });
  }
  resumo(produtoId: number): Observable<AvaliacaoResumo> {
    return this.http.get<AvaliacaoResumo>(`${API}/produtos/${produtoId}/avaliacoes/resumo`);
  }
  criar(produtoId: number, nota: number, comentario: string): Observable<Avaliacao> {
    return this.http.post<Avaliacao>(`${API}/produtos/${produtoId}/avaliacoes`, { nota, comentario });
  }
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/avaliacoes/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);

  finalizar(enderecoId: number): Observable<Pedido> {
    return this.http.post<Pedido>(`${API}/pedidos`, { enderecoId });
  }
  meus(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${API}/pedidos/meus`);
  }
  vendas(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${API}/pedidos/vendas`);
  }
  todos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${API}/pedidos`);
  }
  buscar(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${API}/pedidos/${id}`);
  }
  cancelar(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`${API}/pedidos/${id}/cancelar`, {});
  }
  atualizarStatus(id: number, status: PedidoStatus): Observable<Pedido> {
    return this.http.patch<Pedido>(`${API}/pedidos/${id}/status`, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class ContaService {
  private http = inject(HttpClient);

  atualizar(dto: { nome?: string; senha?: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${API}/usuario/me`, dto);
  }
  meuCliente(): Observable<Cliente> {
    return this.http.get<Cliente>(`${API}/clientes/me`);
  }
  meuVendedor(): Observable<Vendedor> {
    return this.http.get<Vendedor>(`${API}/vendedores/me`);
  }

  enderecos(): Observable<Endereco[]> {
    return this.http.get<Endereco[]>(`${API}/usuario/me/enderecos`);
  }
  adicionarEndereco(dto: EnderecoRequest): Observable<Endereco> {
    return this.http.post<Endereco>(`${API}/usuario/me/enderecos`, dto);
  }
  atualizarEndereco(id: number, dto: EnderecoRequest): Observable<Endereco> {
    return this.http.put<Endereco>(`${API}/usuario/me/enderecos/${id}`, dto);
  }
  removerEndereco(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/usuario/me/enderecos/${id}`);
  }

  telefones(): Observable<Telefone[]> {
    return this.http.get<Telefone[]>(`${API}/usuario/me/telefones`);
  }
  adicionarTelefone(dto: TelefoneRequest): Observable<Telefone> {
    return this.http.post<Telefone>(`${API}/usuario/me/telefones`, dto);
  }
  removerTelefone(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/usuario/me/telefones/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  usuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API}/usuario`);
  }
  excluirUsuario(email: string): Observable<void> {
    return this.http.delete<void>(`${API}/usuario`, { params: { email } });
  }
  clientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${API}/clientes`);
  }
  vendedores(): Observable<Vendedor[]> {
    return this.http.get<Vendedor[]>(`${API}/vendedores`);
  }
}
