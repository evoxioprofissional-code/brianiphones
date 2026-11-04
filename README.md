# Brian iPhones

Loja online (marketplace) da Brian iPhones (Itatiba/SP) com painel administrativo.

## Rodar

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin (login com o usuário criado no Supabase Auth)

## Páginas

| Rota | O que é |
| --- | --- |
| `/` | Início |
| `/loja` | Catálogo com busca e filtros (categoria, estado, armazenamento, preço) |
| `/loja/[slug]` | Produto: comprar, carrinho, cálculo de frete, troca e WhatsApp |
| `/checkout` | Dados, entrega (CEP com endereço automático) e pagamento |
| `/pedido/[id]` | Confirmação do pedido |
| `/troca` | Avaliação do aparelho do cliente como entrada (modelo, cor, GB, bateria, peças trocadas, fotos, aparelho desejado) |
| `/reparo` | Serviços de reparo e pedido de orçamento |
| `/admin` | Painel: faturamento, lucro, contatos, visitas |
| `/admin/pedidos` | Pedidos da loja online e mudança de situação |
| `/admin/produtos` | Cadastro de produtos com fotos |
| `/admin/contatos` | Pedidos que chegaram pelo site (orçamento, troca, reparo) |
| `/admin/financeiro` | Vendas, reparos, despesas e resultado |
| `/admin/configuracoes` | WhatsApp, endereço, horário |

## Dados (Supabase)

O banco é o **Supabase** (projeto `brianip`). O esquema completo está em
[`supabase/schema.sql`](supabase/schema.sql): tabelas, regras de acesso (RLS),
funções do servidor e o bucket de fotos. Rodar de novo é seguro.

- **Visitante** só lê produtos ativos e a configuração do site. Pedido, contato e
  visita entram por funções do banco (`place_order`, `add_lead`, `track_visit`):
  o preço é conferido no servidor e o estoque é reservado na hora.
- **Admin** é qualquer usuário do Supabase Auth. O cadastro público está
  **desligado**: crie o usuário em *Supabase > Authentication > Users > Add user*.
- **Fotos** dos produtos vão para o Storage (bucket `products`).
- Toda leitura/escrita passa por `src/lib/store.ts`. Sem as variáveis do Supabase,
  o site volta ao modo demonstração (dados no navegador).

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha (também na hospedagem):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Ainda falta conectar:

- **Pagamento**: Mercado Pago (Checkout Pro ou Bricks). O ponto de entrada é o `submit` em `src/components/site/Checkout.tsx`; a confirmação do pagamento deve vir por webhook atualizando `orders.status`.
- **Frete**: os valores em `src/lib/shipping.ts` são estimativas. Trocar `quoteShipping` pela API escolhida (Mercado Envios, Correios ou Melhor Envio).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript.
