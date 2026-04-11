# Payment Observability & Metrics

## Core KPIs

### 1) Success Rate

**Definition:**

`authorized_or_captured / total_payment_attempts`

**Dimensions:**

- merchant
- country
- provider
- payment method type

### 2) Authorization Latency

**Definition:**

`time from orchestrator receive -> normalized provider response`

**Recommended percentiles:** p50, p90, p95, p99.

**Dimensions:**

- provider
- route (primary vs fallback)
- status outcome

### 3) Retries

**Definition:**

- Retry attempts per payment
- Retry success-after-failure rate

**Dimensions:**

- provider
- reasonCode (`TIMEOUT`, `RATE_LIMIT`, `NETWORK_ERROR`)
- attempt index

### 4) Provider Distribution

**Definition:**

Percentage of payment attempts routed to each provider.

**Dimensions:**

- merchant
- country
- rule name

## Suggested Metric Names

- `payment.request.total`
- `payment.response.total`
- `payment.authorized.total`
- `payment.failed.total`
- `payment.requires_action.total`
- `payment.retry.total`
- `payment.authorization.latency_ms`
- `payment.routing.provider.count`

## Structured Log Fields

- `paymentId`
- `idempotencyKey`
- `merchantId`
- `provider`
- `attempt`
- `stateFrom`
- `stateTo`
- `status`
- `reasonCode`
- `correlationId`

## Tracing Spans

- `orchestrator.validate`
- `orchestrator.route`
- `provider.authorize.<provider_name>`
- `orchestrator.retry_decision`
- `orchestrator.persist_state`

## Alert Examples

- Authorization success rate drops below threshold for 5 minutes.
- p95 authorization latency above SLO for a given provider.
- Retry volume spikes above baseline.
- One provider receives 0% traffic unexpectedly (potential routing or health issue).
