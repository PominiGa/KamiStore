import { Routes } from '@angular/router';
import { authGuard, roleGuard, visitanteGuard } from './core/guards';

export const routes: Routes = [
  { path: '', title: 'KamiStore · Tecnologia com bom preço', loadComponent: () => import('./pages/home/home') },
  { path: 'busca', title: 'Buscar produtos · KamiStore', loadComponent: () => import('./pages/busca/busca') },
  { path: 'produto/:id', loadComponent: () => import('./pages/produto/produto') },
  { path: 'loja/:id', loadComponent: () => import('./pages/loja/loja') },

  { path: 'login', title: 'Entrar · KamiStore', canActivate: [visitanteGuard], loadComponent: () => import('./pages/auth/login') },
  { path: 'cadastro', title: 'Criar conta · KamiStore', canActivate: [visitanteGuard], loadComponent: () => import('./pages/auth/cadastro') },

  { path: 'carrinho', title: 'Carrinho · KamiStore', canActivate: [roleGuard('CLIENTE')], loadComponent: () => import('./pages/carrinho/carrinho') },
  { path: 'checkout', title: 'Finalizar compra · KamiStore', canActivate: [roleGuard('CLIENTE')], loadComponent: () => import('./pages/checkout/checkout') },
  { path: 'pedido/:id', title: 'Pedido · KamiStore', canActivate: [authGuard], loadComponent: () => import('./pages/pedido/pedido-detalhe') },

  {
    path: 'conta',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/conta/conta-layout'),
    children: [
      { path: '', title: 'Meus dados · KamiStore', loadComponent: () => import('./pages/conta/meus-dados') },
      { path: 'enderecos', title: 'Endereços · KamiStore', loadComponent: () => import('./pages/conta/enderecos') },
      { path: 'telefones', title: 'Telefones · KamiStore', loadComponent: () => import('./pages/conta/telefones') },
      { path: 'pedidos', title: 'Meus pedidos · KamiStore', canActivate: [roleGuard('CLIENTE')], loadComponent: () => import('./pages/conta/meus-pedidos') },
    ],
  },

  {
    path: 'vendedor',
    canActivate: [roleGuard('VENDEDOR')],
    loadComponent: () => import('./pages/vendedor/vendedor-layout'),
    children: [
      { path: '', title: 'Meus produtos · KamiStore', loadComponent: () => import('./pages/vendedor/meus-produtos') },
      { path: 'produtos/novo', title: 'Novo produto · KamiStore', loadComponent: () => import('./pages/vendedor/produto-form') },
      { path: 'produtos/:id/editar', title: 'Editar produto · KamiStore', loadComponent: () => import('./pages/vendedor/produto-form') },
      { path: 'vendas', title: 'Minhas vendas · KamiStore', loadComponent: () => import('./pages/vendedor/vendas') },
    ],
  },

  { path: 'admin', title: 'Administração · KamiStore', canActivate: [roleGuard('ADMIN')], loadComponent: () => import('./pages/admin/admin') },

  { path: '**', title: 'Página não encontrada · KamiStore', loadComponent: () => import('./pages/nao-encontrada') },
];
