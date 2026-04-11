# Checkout State Machine

## States
- `INIT`
- `PAYMENT_SELECTED`
- `PROCESSING`
- `REQUIRES_3DS`
- `SUCCESS`
- `FAILED`

## Transition Table

| Current State     | Event                        | Next State        | Notes |
|------------------|------------------------------|-------------------|-------|
| INIT             | SELECT_PAYMENT_METHOD        | PAYMENT_SELECTED  | User chooses card or wallet |
| PAYMENT_SELECTED | EXECUTE_PAYMENT              | PROCESSING        | BFF starts orchestration |
| PROCESSING       | AUTH_REQUIRES_3DS            | REQUIRES_3DS      | Redirect/challenge required |
| PROCESSING       | AUTH_APPROVED                | SUCCESS           | Payment authorized and order finalized |
| PROCESSING       | AUTH_FAILED                  | FAILED            | Includes declines, timeouts, provider errors |
| REQUIRES_3DS     | 3DS_COMPLETED_SUCCESS        | SUCCESS           | 3DS callback validated |
| REQUIRES_3DS     | 3DS_COMPLETED_FAILURE        | FAILED            | 3DS failed/cancelled |
| FAILED           | RETRY_SAME_OR_NEW_METHOD     | PAYMENT_SELECTED  | Retry with same/new method |
| FAILED           | ABANDON_CHECKOUT             | FAILED            | Terminal until resumed |

## Recovery Rules
1. Persist each transition with timestamp and correlation ID.
2. Resume endpoint computes next action from last persisted state.
3. `PROCESSING` state with stale heartbeat can be reconciled by polling orchestration status.
4. `REQUIRES_3DS` state includes callback nonce and expiry.
5. `FAILED` state stores retryability and recommended fallback method.

## Invariants
- `SUCCESS` is terminal and idempotent.
- No transition to `INIT` after payment selection.
- Same idempotency key cannot produce multiple successful charges.
