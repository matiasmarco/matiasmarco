# Apple Pay Merchant Validation (Conceptual)

Merchant validation is required before presenting the Apple Pay sheet in web contexts.

## Step 1: Validate Domain

1. Merchant hosts Apple Pay domain association file.
2. Apple verifies that the domain is registered and eligible.
3. Wallet service confirms the request origin matches an allowed merchant domain.

## Step 2: Session Creation

1. Client requests merchant validation from `wallet-service`.
2. `wallet-service` calls Apple merchant validation endpoint (mocked here).
3. Apple returns a merchant session object.

## Step 3: Return Merchant Session

1. `wallet-service` returns the merchant session to checkout.
2. Checkout passes session to `ApplePaySession`.
3. User proceeds to authorize payment.

## Notes

- In production, merchant identifiers, certificates, and signatures are mandatory.
- Session lifetimes are short and should not be cached beyond recommended limits.
