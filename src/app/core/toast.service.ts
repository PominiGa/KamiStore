import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  sucesso(mensagem: string) {
    this.mostrar('sucesso', mensagem);
  }
  erro(mensagem: string) {
    this.mostrar('erro', mensagem, 6000);
  }
  info(mensagem: string) {
    this.mostrar('info', mensagem);
  }

  fechar(id: number) {
    this.toasts.update((l) => l.filter((t) => t.id !== id));
  }

  private mostrar(tipo: ToastTipo, mensagem: string, duracao = 3500) {
    const id = ++this.seq;
    this.toasts.update((l) => [...l.slice(-3), { id, tipo, mensagem }]);
    setTimeout(() => this.fechar(id), duracao);
  }
}
