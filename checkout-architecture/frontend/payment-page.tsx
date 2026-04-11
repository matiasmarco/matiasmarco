import React, { useEffect, useState } from "react";

type PaymentMethod = "CARD" | "WALLET";
type CheckoutStatus = "IDLE" | "PROCESSING" | "REQUIRES_3DS" | "SUCCESS" | "FAILED";

type ExecutePaymentResponse = {
  status: CheckoutStatus;
  requires3DS?: boolean;
  redirectUrl?: string;
  errorCode?: string;
  errorMessage?: string;
};

export function PaymentPage({ checkoutId }: { checkoutId: string }) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [status, setStatus] = useState<CheckoutStatus>("IDLE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pseudocode: load payment options from BFF
    // GET /payment-options?checkoutId=...
  }, [checkoutId]);

  async function executePayment() {
    setStatus("PROCESSING");
    setError(null);

    // Pseudocode: tokenization would happen before this call.
    const payload = {
      checkoutId,
      method: selectedMethod,
      paymentDataToken: "tok_example",
      idempotencyKey: `${checkoutId}:${Date.now()}`,
    };

    const response = await fetch("/execute-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as ExecutePaymentResponse;

    if (result.requires3DS && result.redirectUrl) {
      setStatus("REQUIRES_3DS");
      window.location.assign(result.redirectUrl);
      return;
    }

    if (result.status === "SUCCESS") {
      setStatus("SUCCESS");
      return;
    }

    if (result.status === "FAILED") {
      setStatus("FAILED");
      setError(result.errorMessage ?? "Payment failed. Please try again.");
    }
  }

  async function resumeCheckout() {
    // Pseudocode: GET /resume?checkoutId=...
    // restore server state if user returns after redirect/interruption.
  }

  return (
    <section>
      <h1>Checkout</h1>

      <div>
        <h2>Select payment method</h2>
        <button onClick={() => setSelectedMethod("CARD")}>Pay with Card</button>
        <button onClick={() => setSelectedMethod("WALLET")}>Pay with Wallet</button>
      </div>

      {selectedMethod === "CARD" && (
        <div>
          <h3>Card Form</h3>
          <p>Card number, expiry, CVV, cardholder name (tokenized before submit).</p>
        </div>
      )}

      {selectedMethod === "WALLET" && (
        <div>
          <h3>Wallet Buttons</h3>
          <button>Wallet A</button>
          <button>Wallet B</button>
        </div>
      )}

      {error && (
        <div role="alert" style={{ color: "crimson" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div>
        <p>Current status: {status}</p>
        <button onClick={executePayment} disabled={!selectedMethod || status === "PROCESSING"}>
          Execute Payment
        </button>
        <button onClick={resumeCheckout}>Resume</button>
      </div>
    </section>
  );
}
