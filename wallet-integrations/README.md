# Wallet Integrations (Conceptual)

This repository demonstrates conceptual wallet integrations for **Apple Pay**, **Google Pay**, and **PayPal**, decoupled from checkout through a dedicated `wallet-service` layer.

## Elevator Pitch

A conceptual implementation of digital wallet integrations (Apple Pay, Google Pay, PayPal) decoupled from checkout through a wallet-service abstraction.

## Objective

This project models:

- Decrypt flow
- Merchant validation
- Token handling
- Wallet abstraction
- Device capability gating
- Fallback to card payments

## Supported Wallets

- Apple Pay
- Google Pay
- PayPal

## Repository Structure

```text
wallet-integrations/
 ├─ apple-pay/
 ├─ google-pay/
 ├─ paypal/
 ├─ wallet-service/
 ├─ contracts/
 ├─ flows/
 ├─ gating/
 └─ examples/
```

## Included Files

- `wallet-service/wallet-orchestrator.ts` — Wallet router/orchestrator.
- `apple-pay/merchant-validation.md` — Domain validation and merchant session creation flow.
- `apple-pay/decrypt-flow.ts` — Mock Apple Pay token decrypt flow.
- `google-pay/token-handler.ts` — Google Pay `paymentData` handling flow.
- `paypal/create-order.ts` — PayPal order creation flow.
- `contracts/wallet-payment-request.json` — Generic wallet payment request contract.
- `contracts/wallet-payment-response.json` — Generic wallet payment response contract.
- `gating/device-eligibility.ts` — Device eligibility and wallet visibility logic.
- `flows/apple-pay-sequence.md` — Sequence diagram for Apple Pay payment flow.
- `examples/checkout-wallet-button.md` — UI decision logic for rendering wallet buttons.

## Disclaimer

This repository demonstrates wallet integrations conceptually.

Apple Pay and Google Pay flows are simplified.
No real certificates or merchant IDs are used.
Token payloads are mocked.
No production gateway logic is represented.
All flows are educational abstractions.

## Estructura documental agregada

- `markdown/`: documentación técnica y funcional en Markdown.
- `diagramas/`: diagramas de arquitectura y flujos (Mermaid u otros formatos).
- `openapi/`: especificaciones OpenAPI del dominio.
- `ejemplos-json/`: ejemplos de payloads de request/response.
- `adrs/`: registros de decisiones arquitectónicas.
