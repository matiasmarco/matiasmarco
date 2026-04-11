# Checkout Components

## 1) UI Layer (Frontend)
**Responsibility**
- Render payment methods and forms.
- Capture user intent and payment data.
- Display transient and terminal error states.

**Key concerns**
- Accessibility and latency.
- Tokenization before backend submission.
- UX continuity when checkout resumes.

## 2) BFF Layer
**Responsibility**
- Expose checkout-specific API contracts for the frontend.
- Aggregate payment options from cards, wallets, and risk capabilities.
- Orchestrate requests to payments, wallets, state, and order services.

**Key concerns**
- Schema normalization.
- Idempotent execution endpoint.
- State transition integrity.

## 3) Payments Layer
**Responsibility**
- Route card payments through orchestration/PSP integrations.
- Handle auth/capture lifecycle.
- Abstract provider-specific error and status contracts.

**Key concerns**
- Timeouts and retries with circuit protection.
- 3DS decisioning and callback support.
- Mapping external statuses to internal domain state.

## 4) Wallet Layer
**Responsibility**
- Integrate wallet providers behind a common interface.
- Normalize wallet session, approve, and execute operations.
- Return domain-level statuses to BFF.

**Key concerns**
- Session expiration handling.
- Wallet-specific callback verification.
- Fallback to alternative method on provider degradation.

## 5) Order Service
**Responsibility**
- Validate order amount and currency.
- Lock and finalize order after successful payment.
- Ensure consistency between payment state and order status.

**Key concerns**
- Exactly-once order confirmation.
- Compensation strategy for partial failures.
- Correlation IDs for audit and support.
