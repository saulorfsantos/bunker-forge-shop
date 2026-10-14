# Cupons no carrinho

A loja adiciona/remove cupons pelas rotas nativas Store Cart Promotions do Medusa. Não usa Admin API, não cria promoções e não contém chaves privilegiadas. A administração das promoções fica no Bunker Operacional.

O total dos produtos e desconto vêm de `item_total`, `item_subtotal` e `item_discount_total` do servidor. O pagamento permanece com `cart.total` confirmado no checkout. A correção também evita somar frete duas vezes na apresentação do subtotal: subtotal de produtos, desconto e frete aparecem separadamente.

Aplicar o cupom antes de iniciar Pix/cartão. A UI impede mudanças de cupom se houver sessão de pagamento ativa, evitando alterar o preço de uma cobrança já iniciada. Para teste com cupom após gerar Pix no carrinho anterior, iniciar um carrinho novo e não pagar o código anterior.

Um HTTP 200 sem o código na lista de promoções não é apresentado como cupom aplicado. Sem total retornado para uma promoção, o valor fica indisponível; não se estima 95% no browser.

## Publicação

Na pasta de release existente do Mac: puxar main, recompilar mantendo `VITE_MEDUSA_BACKEND_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY` e a Public Key de produção já salva em `.env.local`; publicar na conta Cloudflare de Adriano com `--keep-vars`. Não publicar o build local de validação, que usa uma Public Key fictícia.

## Smoke

Cupom ativo, 95%, um produto/uma unidade/um uso e validade curta: R$56 passa a R$2,80 em retirada. Conferir o mesmo total no carrinho, checkout e cobrança; remover cupom retorna ao total do servidor; código inválido/expirado mostra erro. Realizar pagamento somente no teste controlado do proprietário.

Rollback: republicar o Worker anterior (`1994f688-04e0-4459-925f-7494855c99e4`) se necessário; desativar promoções de teste pelo PDV/Admin. Não alterar preços de catálogo, estoque ou dados de pedido para simular pagamento.
