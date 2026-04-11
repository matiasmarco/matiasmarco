# ADR-001: Provider Fallback for Authorization Resilience

- **Status:** Accepted
- **Date:** 2026-04-11
- **Decision Owner:** Product + Payments Platform (anonymized)

## Context
A single-provider strategy increased checkout failure risk during provider incidents and regional degradation. The business required higher authorization resilience for card, PayPal, and Apple Pay across web and mobile surfaces.

## Decision
Adopt a controlled fallback model:
- Primary provider per segment (method x region x channel)
- Secondary provider for technical errors and approved soft-decline categories
- No fallback on hard declines
- Maximum one fallback hop per payment attempt

## Consequences
### Positive
- Higher checkout continuity during localized outages.
- Better control of conversion during peak periods.
- Explicit reason codes improve incident response and analytics.

### Negative
- More complex reconciliation and dispute workflows.
- Additional vendor management and certification overhead.
- Requires strict idempotency and deduplication controls.

## Rollout Plan
1. Launch fallback for card web traffic in one region.
2. Expand to web mobile and mobile once latency and duplication KPIs are stable.
3. Add wallet methods (PayPal, Apple Pay) with method-specific guardrails.

## Success Metrics
- Authorization rate uplift versus baseline.
- Reduced technical-failure-induced abandonment.
- No material increase in duplicate charge incidents.
