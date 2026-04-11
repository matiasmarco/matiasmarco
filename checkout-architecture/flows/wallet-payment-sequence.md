# Wallet Payment Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BFF as Checkout BFF
  participant WAL as Wallet Layer
  participant WP as Wallet Provider
  participant ST as State Store

  U->>FE: Click wallet button
  FE->>BFF: POST /execute-payment (wallet token/session)
  BFF->>ST: transition -> PAYMENT_SELECTED
  BFF->>ST: transition -> PROCESSING
  BFF->>WAL: executeWalletPayment
  WAL->>WP: execute
  WP-->>WAL: approved / rejected / timeout
  WAL-->>BFF: normalized result

  alt Approved
    BFF->>ST: transition -> SUCCESS
    BFF-->>FE: status=SUCCESS
  else Rejected
    BFF->>ST: transition -> FAILED (retryable=false)
    BFF-->>FE: status=FAILED + fallback=card
  else Timeout
    BFF->>ST: transition -> FAILED (retryable=true)
    BFF-->>FE: status=FAILED + retry option
  end
```

## Wallet-Specific Considerations
- Provider sessions can expire quickly; include expiry awareness in UI.
- Wallet callbacks must be signature-verified.
- If wallet fails repeatedly, surface card fallback by default.
