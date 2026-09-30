# Mercado Pago local harness

Harness **exclusivamente local/dev** para validar o Card Payment Brick, tokenização no browser e a
continuação 3DS. Ele vive fora de `src/`, não é importado pelo router e não participa do build do
storefront.

## Barreiras de segurança

- O servidor escuta somente em `127.0.0.1` e rejeita `Host` que não seja loopback.
- `MP_HARNESS_BACKEND_URL` é obrigatório e precisa ser uma origem HTTP(S) loopback explícita.
  Target ausente, inválido, LAN ou remoto interrompe o startup.
- Redirects do backend não são seguidos.
- O Brick tokeniza no browser. O proxy usa uma allowlist e rejeita chaves de PAN/CVV.
- Token e `creq` existem somente em memória, nunca são exibidos, persistidos ou registrados.
- A continuação 3DS aceita somente `external_resource_url` HTTPS e envia `creq` por formulário POST
  diretamente ao challenge iframe.
- A public key é obrigatória em runtime; não há valor versionado nem suporte a arquivo `.env`.

## Execução com o mock local

Use apenas uma public key de **teste/sandbox**, disponibilizada ao processo por um gerenciador local
de ambiente. Nunca cole credenciais no repositório, histórico de shell, argumentos ou chat.

Em um terminal:

```bash
npm --prefix tools/mp-local-harness run mock
```

Em outro terminal, com `MERCADO_PAGO_PUBLIC_KEY` já presente no ambiente:

```bash
MP_HARNESS_BACKEND_URL=http://127.0.0.1:4311 npm --prefix tools/mp-local-harness run dev
```

Abra `http://127.0.0.1:4310`. Use somente cartões de teste documentados pelo Mercado Pago. O mock
confirma o recebimento do payload tokenizado, não cria pagamento e não simula uma autenticação 3DS.

## Backend local do Card 140

Aponte `MP_HARNESS_BACKEND_URL` para a origem loopback do backend local e, se necessário, configure
`MP_HARNESS_PAYMENT_PATH` (padrão: `/payments`). O endpoint deve aceitar o payload tokenizado do
Card Brick e responder com:

```json
{
  "status": "pending",
  "status_detail": "pending_challenge",
  "three_ds_info": {
    "external_resource_url": "https://provedor-3ds.exemplo/challenge",
    "creq": "<fornecido-em-runtime>"
  }
}
```

Esse exemplo é apenas o contrato: não contém token ou challenge real. O E2E sandbox/externo depende
do Card 140 e de revisão independente antes de qualquer execução. O backend local também deve estar
em modo sandbox e não pode encaminhar a operação para produção.

## Checks

```bash
npm --prefix tools/mp-local-harness test
npm run build
```

Após o build, `dist/` não deve conter arquivos ou referências ao harness.
