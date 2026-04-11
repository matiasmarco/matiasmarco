/**
 * Payment orchestration client pseudocode.
 */

type CardPaymentInput = {
  checkoutId: string;
  paymentDataToken: string;
  idempotencyKey: string;
};

export class PaymentClient {
  constructor(private readonly orchestrationBaseUrl: string) {}

  async executeCardPayment(input: CardPaymentInput) {
    const response = await fetch(`${this.orchestrationBaseUrl}/payments/card/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
        "X-Checkout-Id": input.checkoutId,
      },
      body: JSON.stringify({ token: input.paymentDataToken }),
    });

    if (response.status >= 500) {
      return {
        status: "FAILED",
        errorCode: "ORCHESTRATION_UNAVAILABLE",
        errorMessage: "Temporary upstream issue",
        retryable: true,
      };
    }

    const data = await response.json();

    // Normalize provider status into checkout domain status.
    if (data.status === "requires_action" && data.action === "3ds") {
      return {
        status: "REQUIRES_3DS",
        redirectUrl: data.redirectUrl,
      };
    }

    if (data.status === "authorized") {
      return { status: "SUCCESS", transactionId: data.transactionId };
    }

    return {
      status: "FAILED",
      errorCode: data.errorCode ?? "PAYMENT_DECLINED",
      errorMessage: data.message ?? "Payment declined",
      retryable: Boolean(data.retryable),
    };
  }
}
