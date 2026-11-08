import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Estado } from '../shared/estado';

@Component({
  selector: 'app-nao-encontrada',
  imports: [RouterLink, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container pagina">
      <div class="card">
        <app-estado icone="search" titulo="Página não encontrada" texto="O endereço que você acessou não existe ou foi removido.">
          <a routerLink="/" class="btn btn-primary">Voltar para o início</a>
        </app-estado>
      </div>
    </div>
  `,
})
export default class NaoEncontrada {}
