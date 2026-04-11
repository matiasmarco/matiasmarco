/**
 * Pseudo-realistic orchestration flow (illustrative, non-runnable as-is).
 */

type PaymentStatus = "AUTHORIZED" | "DECLINED" | "REQUIRES_ACTION" | "FAILED";
type OrchestrationState = "INITIATED" | "TOKENIZED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "RETRYING";

interface PaymentRequest {
  paymentId: string;
  merchantId: string;
  idempotencyKey: string;
  amount: { value: number; currencyExponent: number };
  currency: string;
  country: string;
  captureMode: "AUTO" | "MANUAL";
  paymentMethod: { type: "CARD" | "WALLET" | "BANK_TRANSFER"; token: string; requires3ds?: boolean };
}

interface PaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  provider: string;
  attempt: number;
  processedAt: string;
  providerReference?: string;
  reasonCode?: string;
  retryable?: boolean;
}

interface RouteDecision {
  primaryProvider: string;
  fallbackProvider?: string;
  maxRetries: number;
}

interface ProviderAdapter {
  name: string;
  authorize(request: PaymentRequest): Promise<PaymentResponse>;
}

interface Services {
  validator: { validate(req: PaymentRequest): void };
  idempotencyStore: {
    find(merchantId: string, idempotencyKey: string): Promise<PaymentResponse | null>;
    save(merchantId: string, idempotencyKey: string, response: PaymentResponse): Promise<void>;
  };
  router: { resolveRoute(req: PaymentRequest): Promise<RouteDecision> };
  providers: Record<string, ProviderAdapter>;
  stateStore: {
    transition(paymentId: string, next: OrchestrationState, metadata?: Record<string, unknown>): Promise<void>;
  };
  metrics: {
    increment(metric: string, tags?: Record<string, string>): void;
    timing(metric: string, ms: number, tags?: Record<string, string>): void;
  };
  retryPolicy: { shouldRetry(response: PaymentResponse, attempt: number, maxRetries: number): boolean };
}

export async function orchestratePayment(request: PaymentRequest, services: Services): Promise<PaymentResponse> {
  const startedAt = Date.now();

  // 1) Validate
  services.validator.validate(request);

  // 2) Idempotency check
  const existing = await services.idempotencyStore.find(request.merchantId, request.idempotencyKey);
  if (existing) {
    services.metrics.increment("payment.idempotency_hit");
    return existing;
  }

  await services.stateStore.transition(request.paymentId, "INITIATED");

  // 3) Route
  const decision = await services.router.resolveRoute(request);
  const providerOrder = [decision.primaryProvider, decision.fallbackProvider].filter(Boolean) as string[];

  let finalResponse: PaymentResponse | null = null;

  // 4) Execute provider(s) with retries/fallback
  for (const providerName of providerOrder) {
    const adapter = services.providers[providerName];
    if (!adapter) continue;

    for (let attempt = 1; attempt <= decision.maxRetries + 1; attempt++) {
      const response = await adapter.authorize(request);

      // 5) Handle response + map state
      if (response.status === "AUTHORIZED") {
        await services.stateStore.transition(request.paymentId, "AUTHORIZED", { provider: providerName, attempt });
        finalResponse = response;
        break;
      }

      if (response.status === "REQUIRES_ACTION") {
        await services.stateStore.transition(request.paymentId, "TOKENIZED", { provider: providerName, action: "3DS_CHALLENGE" });
        finalResponse = response;
        break;
      }

      const retry = services.retryPolicy.shouldRetry(response, attempt, decision.maxRetries);
      if (!retry) {
        await services.stateStore.transition(request.paymentId, "FAILED", {
          provider: providerName,
          reasonCode: response.reasonCode ?? "DECLINED_OR_TERMINAL"
        });
        finalResponse = response;
        break;
      }

      await services.stateStore.transition(request.paymentId, "RETRYING", {
        provider: providerName,
        attempt,
        reasonCode: response.reasonCode ?? "RETRYABLE_FAILURE"
      });
      services.metrics.increment("payment.retry", { provider: providerName });
    }

    // stop fallback chain on terminal known outcomes
    if (finalResponse && ["AUTHORIZED", "REQUIRES_ACTION", "DECLINED"].includes(finalResponse.status)) {
      break;
    }
  }

  if (!finalResponse) {
    finalResponse = {
      paymentId: request.paymentId,
      status: "FAILED",
      provider: decision.fallbackProvider ?? decision.primaryProvider,
      attempt: decision.maxRetries + 1,
      processedAt: new Date().toISOString(),
      reasonCode: "NO_PROVIDER_RESPONSE",
      retryable: false
    };
    await services.stateStore.transition(request.paymentId, "FAILED", { reasonCode: "NO_PROVIDER_RESPONSE" });
  }

  // 6) Persist idempotent response
  await services.idempotencyStore.save(request.merchantId, request.idempotencyKey, finalResponse);
  services.metrics.timing("payment.authorization_latency_ms", Date.now() - startedAt, {
    provider: finalResponse.provider,
    status: finalResponse.status
  });

  return finalResponse;
}
