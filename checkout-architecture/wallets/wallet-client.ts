/**
 * Wallet abstraction client pseudocode.
 */

type WalletPaymentInput = {
  checkoutId: string;
  paymentDataToken: string;
  idempotencyKey: string;
};

export class WalletClient {
  constructor(private readonly walletGatewayBaseUrl: string) {}

  async executeWalletPayment(input: WalletPaymentInput) {
    const response = await fetch(`${this.walletGatewayBaseUrl}/wallets/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        checkoutId: input.checkoutId,
        walletToken: input.paymentDataToken,
      }),
    });

    if (response.status === 408 || response.status >= 500) {
      return {
        status: "FAILED",
        errorCode: "WALLET_TIMEOUT",
        errorMessage: "Wallet provider timeout",
        retryable: true,
      };
    }

    const data = await response.json();

    if (data.status === "approved") {
      return {
        status: "SUCCESS",
        walletReference: data.walletReference,
      };
    }

    return {
      status: "FAILED",
      errorCode: data.errorCode ?? "WALLET_REJECTED",
      errorMessage: data.message ?? "Wallet payment rejected",
      retryable: Boolean(data.retryable),
    };
  }
}
