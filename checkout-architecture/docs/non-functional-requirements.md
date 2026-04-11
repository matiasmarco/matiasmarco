# Non-Functional Requirements

## Idempotency
- `POST /execute-payment` must require an idempotency key.
- Idempotency scope: checkout + payment attempt.
- Duplicate requests with same key must return the same canonical result.

## Timeout Budgets
- Frontend to BFF: 3s target timeout.
- BFF to orchestration/wallet clients: 2s timeout with bounded retries.
- Callback processing: asynchronous with strict verification and replay protection.

## Retry Requirements
- Internal retries only for transient errors (network/5xx/timeout).
- Maximum retry attempts must be explicitly configured per dependency.
- Backoff must include jitter to avoid synchronized retry storms.

## Resilience Requirements
- Circuit breakers for external providers.
- Bulkhead isolation between card and wallet integrations.
- Graceful degradation: return available payment options when a provider is down.
- Stale state reconciliation job for in-flight checkouts.

## Availability and Consistency
- Checkout APIs designed for high availability.
- State transitions must be atomic and append-only for auditability.
- Success state must prevent double charge and double order confirmation.
