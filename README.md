# KamiStore — Frontend (Angular)

Frontend do e-commerce KamiStore (backend Spring Boot).

## Como rodar

Pré-requisitos: Node.js 20+ e o backend rodando em `http://localhost:8080`.

```bash
cd ~/Documents/projetos/ecommerce-frontend
npm install        # só na primeira vez (ou quando mudar o package.json)
npm start          # = ng serve
```

Abra **http://localhost:4200**. O servidor recarrega sozinho ao salvar arquivos. Para parar: `Ctrl + C`.

As chamadas a `/api/...` são repassadas para `localhost:8080` pelo `proxy.conf.json` — por isso o backend não precisa de CORS.

Build de produção: `npm run build` → arquivos em `dist/kamistore/browser`.

## Perfis e telas

| Perfil | O que faz |
|---|---|
| Visitante | Vitrine, busca, página do produto, loja do vendedor, cadastro/login |
| CLIENTE | Carrinho, checkout, meus pedidos (cancelar), avaliar produtos entregues, endereços/telefones |
| VENDEDOR | Painel: produtos (fotos, variações cor/tamanho, ativar/pausar), vendas e avanço de status |
| ADMIN | Pedidos (mudar status), moderação de produtos e avaliações, usuários, clientes, vendedores |

O admin é criado pelo backend (`app.admin.email` / `app.admin.senha` em `application.properties`).

## Estrutura

```
src/app/
  core/     models (DTOs), services HTTP, auth (JWT + interceptor + guards), carrinho, toasts
  shared/   header, footer, card de produto, imagem, estrelas, paginação, ícones…
  pages/    home, busca, produto, loja, auth, carrinho, checkout, pedido, conta, vendedor, admin
```
