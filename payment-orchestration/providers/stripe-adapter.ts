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
  provider: "STRIPE_MOCK";
  attempt: number;
  processedAt: string;
  providerReference?: string;
  reasonCode?: string;
  retryable?: boolean;
  action?: { type: "REDIRECT" | "CHALLENGE"; url?: string; token?: string };
}

export class StripeAdapterMock {
  readonly name = "STRIPE_MOCK";

  async authorize(request: UnifiedPaymentRequest, attempt = 1): Promise<UnifiedPaymentResponse> {
    // Mock provider behavior for demo scenarios.

    if (request.paymentMethod.requires3ds) {
      return {
        paymentId: request.paymentId,
        status: "REQUIRES_ACTION",
        provider: "STRIPE_MOCK",
        attempt,
        processedAt: new Date().toISOString(),
        providerReference: `st_${request.paymentId}_${attempt}`,
        action: {
          type: "CHALLENGE",
          token: `3ds-session-${request.paymentId}`
        }
      };
    }

    if (request.amount.value > 150000) {
      return {
        paymentId: request.paymentId,
        status: "DECLINED",
        provider: "STRIPE_MOCK",
        attempt,
        processedAt: new Date().toISOString(),
        providerReference: `st_${request.paymentId}_${attempt}`,
        reasonCode: "RISK_DECLINE",
        retryable: false
      };
    }

    return {
      paymentId: request.paymentId,
      status: "AUTHORIZED",
      provider: "STRIPE_MOCK",
      attempt,
      processedAt: new Date().toISOString(),
      providerReference: `st_${request.paymentId}_${attempt}`
    };
  }
}
