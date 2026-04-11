# Payment Error Handling

## Error Categories
1. **Customer errors**: invalid card data, insufficient funds, authentication cancelled.
2. **Provider errors**: PSP/wallet downtime, malformed provider response.
3. **System errors**: internal timeout, state persistence failure, dependency saturation.

## Retry Policy
- Retry only idempotent network failures and transient upstream 5xx/timeout errors.
- Use exponential backoff with jitter for internal retries.
- Respect max retry budget to preserve latency SLO.

Example policy:
- attempt 1: immediate
- attempt 2: +200ms jitter
- attempt 3: +500ms jitter
- then fail as retryable error

## Recovery Patterns
### 1) Resume checkout
- Frontend calls `/resume` with checkoutId.
- BFF returns canonical state and next action.
- User continues from last safe point.

### 2) Fallback payment method
- If wallet returns non-retryable failure, suggest card.
- If card flow repeatedly times out, suggest wallet.

### 3) Safe failure
- Never return unknown state to frontend.
- Every failure maps to user-facing message + internal error code.

## Enterprise Guardrails
- Correlate all failures with request ID and checkout ID.
- Log technical details internally, expose sanitized messages externally.
- Keep a dead-letter queue for unresolved asynchronous callbacks.
