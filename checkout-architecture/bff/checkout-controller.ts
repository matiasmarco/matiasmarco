/**
 * Checkout BFF controller pseudocode.
 * Endpoints:
 *   - GET /payment-options
 *   - POST /execute-payment
 *   - GET /resume
 */

type PaymentMethod = "CARD" | "WALLET";

type ExecutePaymentRequest = {
  checkoutId: string;
  method: PaymentMethod;
  paymentDataToken: string;
  idempotencyKey: string;
};

export class CheckoutController {
  constructor(
    private readonly paymentsClient: { executeCardPayment: Function },
    private readonly walletClient: { executeWalletPayment: Function },
    private readonly stateService: { get: Function; transition: Function },
    private readonly orderService: { validate: Function; finalize: Function },
  ) {}

  async getPaymentOptions(checkoutId: string) {
    const checkout = await this.orderService.validate(checkoutId);

    return {
      checkoutId,
      amount: checkout.amount,
      currency: checkout.currency,
      options: ["CARD", "WALLET"],
    };
  }

  async executePayment(input: ExecutePaymentRequest) {
    const currentState = await this.stateService.get(input.checkoutId);
    this.assertExecutable(currentState.status);

    await this.stateService.transition(input.checkoutId, "PAYMENT_SELECTED", {
      method: input.method,
      idempotencyKey: input.idempotencyKey,
    });

    await this.stateService.transition(input.checkoutId, "PROCESSING");

    const result =
      input.method === "CARD"
        ? await this.paymentsClient.executeCardPayment(input)
        : await this.walletClient.executeWalletPayment(input);

    if (result.status === "REQUIRES_3DS") {
      await this.stateService.transition(input.checkoutId, "REQUIRES_3DS", {
        redirectUrl: result.redirectUrl,
      });
      return result;
    }

    if (result.status === "SUCCESS") {
      await this.orderService.finalize(input.checkoutId, result);
      await this.stateService.transition(input.checkoutId, "SUCCESS");
      return { status: "SUCCESS" };
    }

    await this.stateService.transition(input.checkoutId, "FAILED", {
      code: result.errorCode,
      retryable: result.retryable,
    });

    return {
      status: "FAILED",
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      retryable: result.retryable,
    };
  }

  async resume(checkoutId: string) {
    const state = await this.stateService.get(checkoutId);

    return {
      checkoutId,
      status: state.status,
      nextAction: this.resolveNextAction(state.status),
      context: state.context,
    };
  }

  private assertExecutable(status: string) {
    const allowed = ["INIT", "FAILED", "PAYMENT_SELECTED"];
    if (!allowed.includes(status)) {
      throw new Error(`Cannot execute payment from status: ${status}`);
    }
  }

  private resolveNextAction(status: string) {
    switch (status) {
      case "REQUIRES_3DS":
        return "CONTINUE_3DS";
      case "FAILED":
        return "RETRY_OR_CHANGE_METHOD";
      case "SUCCESS":
        return "SHOW_CONFIRMATION";
      default:
        return "SHOW_PAYMENT_OPTIONS";
    }
  }
}
