# Brian iPhones

Site da loja Brian iPhones (Itatiba/SP) com painel administrativo.

## Rodar

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin (acesso de demonstração em `ACESSO-DEMO.md`)

## Páginas

| Rota | O que é |
| --- | --- |
| `/` | Início |
| `/loja` | Catálogo com filtros (categoria, estado, preço) |
| `/loja/[slug]` | Produto, com orçamento direto no WhatsApp |
| `/troca` | Avaliação do aparelho do cliente como entrada (modelo, cor, GB, bateria, peças trocadas, fotos, aparelho desejado) |
| `/reparo` | Serviços de reparo e pedido de orçamento |
| `/admin` | Painel: faturamento, lucro, contatos, visitas |
| `/admin/produtos` | Cadastro de produtos com fotos |
| `/admin/contatos` | Pedidos que chegaram pelo site (orçamento, troca, reparo) |
| `/admin/financeiro` | Vendas, reparos, despesas e resultado |
| `/admin/configuracoes` | WhatsApp, endereço, horário |

## Dados

Ainda **sem banco de dados**: tudo fica no `localStorage` do navegador, com dados
de demonstração. Toda leitura e escrita passa por `src/lib/store.ts`. Para conectar
um banco (ex.: Supabase), basta trocar esse arquivo e o login em `src/lib/auth.ts`.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript.
