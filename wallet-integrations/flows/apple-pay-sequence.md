# Apple Pay Sequence (Conceptual)

## Flow Summary

User tap → merchant validation → token decrypt → authorization.

## Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant C as Checkout UI
  participant W as Wallet Service
  participant A as Apple Pay
  participant P as PSP/Gateway (Mock)

  U->>C: Tap Apple Pay button
  C->>W: Request merchant validation
  W->>A: Validate domain + request merchant session
  A-->>W: Merchant session
  W-->>C: Return merchant session

  C->>A: Present Apple Pay sheet
  U->>A: Authorize with Face ID / Touch ID
  A-->>C: Encrypted payment token

  C->>W: Send encrypted token
  W->>W: Decrypt token (conceptual mock)
  W->>P: Authorize payment
  P-->>W: Approved/Declined
  W-->>C: Final payment result
  C-->>U: Confirmation or fallback to card
```

## Failure Paths

- Merchant validation fails → do not show Apple Pay sheet.
- Token decryption fails → return `error` and offer card fallback.
- Authorization declined → offer retry or fallback payment method.
