# Observability

## Core Funnel Metrics
1. **Drop rate**
   - Definition: percentage of checkouts that do not reach SUCCESS.
   - Formula: `(initiated - successful) / initiated`.

2. **Success rate**
   - Definition: percentage of checkouts ending in SUCCESS.
   - Formula: `successful / initiated`.

3. **3DS rate**
   - Definition: percentage of payment attempts that require 3DS.
   - Formula: `requires_3ds / payment_attempts`.

## Additional Metrics
- Authorization latency p50/p95/p99.
- Wallet timeout rate by provider.
- Retry rate and retry success rate.
- State recovery rate (`/resume` leading to success).

## Tracing and Logging
- Propagate `traceId`, `checkoutId`, and `idempotencyKey` across all services.
- Emit structured logs at each state transition.
- Create distributed traces for `execute-payment` and callback flows.

## Alerting
- Alert on sudden drop in success rate.
- Alert on increased 3DS or provider timeout rate.
- Alert on stuck `PROCESSING` states beyond threshold.

## Dashboard Segmentation
- By payment method (card vs wallet).
- By provider.
- By geography and currency.
- By app/web platform.
