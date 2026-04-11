# Card Payment Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BFF as Checkout BFF
  participant PAY as Payments Orchestration
  participant PSP as PSP/Acquirer
  participant ST as State Store

  U->>FE: Submit card details
  FE->>FE: Tokenize card data
  FE->>BFF: POST /execute-payment (token, checkoutId, idempotencyKey)
  BFF->>ST: transition -> PAYMENT_SELECTED
  BFF->>ST: transition -> PROCESSING
  BFF->>PAY: executeCardPayment
  PAY->>PSP: authorize
  PSP-->>PAY: authorized / requires_3ds / declined
  PAY-->>BFF: normalized result

  alt Requires 3DS
    BFF->>ST: transition -> REQUIRES_3DS
    BFF-->>FE: status=REQUIRES_3DS + redirectUrl
    FE->>U: Redirect to challenge
  else Authorized
    BFF->>ST: transition -> SUCCESS
    BFF-->>FE: status=SUCCESS
  else Failed
    BFF->>ST: transition -> FAILED
    BFF-->>FE: status=FAILED + retryable
  end
```

## Key Failure Points
- Tokenization failure at frontend.
- BFF timeout to orchestration.
- PSP soft decline requiring retry.
- Customer abandonment during 3DS.

## Retry Strategy
- Reuse checkout session, new idempotency key only for new business attempt.
- Keep provider-level idempotency for network retries.
- Limit customer-visible retries to avoid duplicate intents.
