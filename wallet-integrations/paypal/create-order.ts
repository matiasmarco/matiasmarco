/**
 * paypal/create-order.ts
 *
 * Conceptual PayPal create-order flow.
 */

type PayPalCreateOrderRequest = {
  intent: "CAPTURE" | "AUTHORIZE";
  amount: {
    currency_code: string;
    value: string;
  };
  reference_id: string;
};

type PayPalCreateOrderResponse = {
  id: string;
  status: "CREATED" | "APPROVED" | "COMPLETED";
  links: Array<{ rel: string; href: string; method: string }>;
};

export async function createPayPalOrder(
  request: PayPalCreateOrderRequest
): Promise<PayPalCreateOrderResponse> {
  if (!request?.amount?.value) {
    throw new Error("Amount is required");
  }

  // Pseudocode:
  // 1) POST /v2/checkout/orders to PayPal API.
  // 2) Return approval URL to client.
  // 3) After approval, capture order (outside this function).

  return {
    id: `ORDER-${request.reference_id}`,
    status: "CREATED",
    links: [
      {
        rel: "approve",
        href: "https://www.paypal.com/checkoutnow?token=ORDER-ANON",
        method: "GET",
      },
      {
        rel: "self",
        href: "https://api-m.paypal.com/v2/checkout/orders/ORDER-ANON",
        method: "GET",
      },
    ],
  };
}
