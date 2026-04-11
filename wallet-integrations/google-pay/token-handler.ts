/**
 * google-pay/token-handler.ts
 *
 * Handles Google Pay paymentData payload conceptually.
 */

type GooglePayPaymentData = {
  apiVersion: number;
  apiVersionMinor: number;
  paymentMethodData: {
    type: "CARD";
    description: string;
    info: {
      cardNetwork: string;
      cardDetails: string;
    };
    tokenizationData: {
      type: "PAYMENT_GATEWAY" | "DIRECT";
      token: string;
    };
  };
};

type ParsedGooglePayToken = {
  gateway: string;
  gatewayMerchantId: string;
  cryptogram?: string;
  eciIndicator?: string;
  messageExpiration?: string;
};

export function handleGooglePayPaymentData(
  paymentData: GooglePayPaymentData
): ParsedGooglePayToken {
  const tokenized = paymentData?.paymentMethodData?.tokenizationData?.token;

  if (!tokenized) {
    throw new Error("Missing Google Pay token");
  }

  // In real integrations this token is JSON-encoded and signed/encrypted.
  // Here we mock-parsed output with anonymized fields.
  return {
    gateway: "example-gateway",
    gatewayMerchantId: "merchant_anon_001",
    cryptogram: "AgAAAAAABk4DWZ4C28yUQAAAAAA=",
    eciIndicator: "05",
    messageExpiration: "2026-12-31T23:59:59Z",
  };
}
