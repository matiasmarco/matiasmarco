export interface UnifiedPaymentRequest {
  paymentId: string;
  amount: { value: number; currencyExponent: number };
  currency: string;
  country: string;
  paymentMethod: { token: string; requires3ds?: boolean };
}

export interface UnifiedPaymentResponse {
  paymentId: string;
  status: "AUTHORIZED" | "DECLINED" | "REQUIRES_ACTION" | "FAILED";
  provider: "ADYEN_MOCK";
  attempt: number;
  processedAt: string;
  providerReference?: string;
  reasonCode?: string;
  retryable?: boolean;
  action?: { type: "REDIRECT" | "CHALLENGE"; url?: string; token?: string };
}

export class AdyenAdapterMock {
  readonly name = "ADYEN_MOCK";

  async authorize(request: UnifiedPaymentRequest, attempt = 1): Promise<UnifiedPaymentResponse> {
    // Mock transient error path for retry/fallback demonstration.
    const shouldSimulateTransientFailure = request.country === "UK" && request.amount.value > 50000 && attempt === 1;

    if (shouldSimulateTransientFailure) {
      return {
        paymentId: request.paymentId,
        status: "FAILED",
        provider: "ADYEN_MOCK",
        attempt,
        processedAt: new Date().toISOString(),
        providerReference: `ad_${request.paymentId}_${attempt}`,
        reasonCode: "TIMEOUT",
        retryable: true
      };
    }

    if (request.paymentMethod.requires3ds) {
      return {
        paymentId: request.paymentId,
        status: "REQUIRES_ACTION",
        provider: "ADYEN_MOCK",
        attempt,
        processedAt: new Date().toISOString(),
        providerReference: `ad_${request.paymentId}_${attempt}`,
        action: {
          type: "REDIRECT",
          url: "https://3ds-mock.example/challenge"
        }
      };
    }

    return {
      paymentId: request.paymentId,
      status: "AUTHORIZED",
      provider: "ADYEN_MOCK",
      attempt,
      processedAt: new Date().toISOString(),
      providerReference: `ad_${request.paymentId}_${attempt}`
    };
  }
}
