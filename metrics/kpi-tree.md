# Payment KPI Tree

## North Star
- **Checkout Conversion Rate**

## Level 1 Drivers
- Authorization Success Rate
- Payment Completion Latency
- Customer Drop-off Rate
- Payment Cost per Successful Order

## Level 2 Metrics
### Authorization Success Rate
- By method: card / PayPal / Apple Pay
- By channel: web / web mobile / mobile
- By provider and region

### Payment Completion Latency
- p50/p95 end-to-end payment latency
- Redirect completion time (PayPal, 3DS flows)
- Provider API latency contribution

### Customer Drop-off Rate
- Drop-off at payment method selection
- Drop-off at step-up or redirect
- Retry abandonment after first failure

### Payment Cost per Successful Order
- Blended processing fee
- Retry overhead cost
- Chargeback-adjusted net margin impact

## Guardrail Metrics
- Duplicate charge incident rate
- Idempotency conflict rate
- Refund SLA adherence
- Provider outage minutes impacting checkout
