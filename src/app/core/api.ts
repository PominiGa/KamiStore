import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ErroApi } from './models';

/** Base da API. Em desenvolvimento o proxy (proxy.conf.json) redireciona para http://localhost:8080 */
export const API = '/api';

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

export function pageParams(q: object = {}): HttpParams {
  let params = new HttpParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
  }
  return params;
}

/** Extrai uma mensagem legível do ErroResponseDTO do backend */
export function mensagemErro(err: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
    const body = err.error as ErroApi | null;
    if (body?.campos && Object.keys(body.campos).length) {
      return Object.entries(body.campos)
        .map(([campo, msg]) => `${campo}: ${msg}`)
        .join(' · ');
    }
    if (body?.mensagem) return body.mensagem;
    if (err.status === 401) return 'Sessão expirada. Faça login novamente.';
    if (err.status === 403) return 'Você não tem permissão para esta ação.';
  }
  return padrao;
}

export function camposErro(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse) return (err.error as ErroApi | null)?.campos ?? {};
  return {};
}
