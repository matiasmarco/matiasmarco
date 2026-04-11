/**
 * gating/device-eligibility.ts
 *
 * Device and browser capability gating for wallet button visibility.
 */

type DeviceContext = {
  os: "iOS" | "Android" | "macOS" | "Windows" | "Linux";
  browser: "Safari" | "Chrome" | "Edge" | "Firefox";
  supportsNfc: boolean;
  hasActiveWalletSetup: {
    applePay: boolean;
    googlePay: boolean;
    paypal: boolean;
  };
};

type WalletVisibility = {
  showApplePay: boolean;
  showGooglePay: boolean;
  showPayPal: boolean;
  showCardFallback: boolean;
};

export function getWalletVisibility(ctx: DeviceContext): WalletVisibility {
  const showApplePay =
    (ctx.os === "iOS" || ctx.os === "macOS") &&
    ctx.browser === "Safari" &&
    ctx.hasActiveWalletSetup.applePay;

  const showGooglePay =
    (ctx.os === "Android" || ctx.browser === "Chrome") &&
    ctx.hasActiveWalletSetup.googlePay;

  const showPayPal = ctx.hasActiveWalletSetup.paypal;

  return {
    showApplePay,
    showGooglePay,
    showPayPal,
    showCardFallback: !(showApplePay || showGooglePay || showPayPal),
  };
}

// Example:
// if device != Apple -> hide Apple Pay
