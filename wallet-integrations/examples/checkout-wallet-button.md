# Checkout Wallet Button Decision Logic

This document describes how checkout decides which wallet buttons to render.

## Inputs

- Device OS and browser
- Wallet capability checks (`ApplePaySession.canMakePayments`, Google Pay readiness, etc.)
- Merchant configuration by region/currency
- Runtime availability from `wallet-service`

## Decision Tree (Conceptual)

1. Evaluate device eligibility.
2. Evaluate merchant + currency compatibility.
3. Render supported wallet buttons in priority order.
4. Always provide card payment fallback.

## Pseudocode

```ts
const eligibility = getWalletVisibility(deviceContext);

if (eligibility.showApplePay && currency === "USD") {
  render("ApplePayButton");
}

if (eligibility.showGooglePay && ["USD", "EUR"].includes(currency)) {
  render("GooglePayButton");
}

if (eligibility.showPayPal) {
  render("PayPalButton");
}

render("CardButton");
```

## UX Notes

- Wallet buttons should use native branding and sizing guidelines.
- If wallet checks are pending, show a loading skeleton to prevent layout shift.
- If no wallet is available, hide wallet section and emphasize card checkout.
