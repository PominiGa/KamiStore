import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { Page, Produto } from '../../core/models';
import { CATEGORIAS } from '../../shared/categorias';
import { Estado } from '../../shared/estado';
import { Icon } from '../../shared/icon';
import { ProdutoCard } from '../../shared/produto-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, ProdutoCard, Estado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  protected readonly auth = inject(AuthService);
  protected readonly categorias = CATEGORIAS;
  protected readonly esqueletos = Array.from({ length: 5 });

  protected readonly novidades = httpResource<Page<Produto>>(() => ({
    url: `${API}/produtos`,
    params: { size: 10, sort: 'id,desc' },
  }));

  protected readonly baratos = httpResource<Page<Produto>>(() => ({
    url: `${API}/produtos`,
    params: { size: 5, sort: 'preco,asc' },
  }));
}
