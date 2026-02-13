export const schemas = {
  Order: {
    type: "object",
    properties: {
      id: { type: "string" },
      customer_name: { type: "string" },
      customer_phone: { type: "string" },
      delivery_point: { type: "string" },
      total_amount: { type: "number" },
      status: { type: "string" },
      payment_status: { type: "string" },
      razorpay_order_id: { type: ["string", "null"] },
    },
  },

  CreateOrderRequest: {
    type: "object",
    required: [
      "customer_name",
      "customer_phone",
      "delivery_point",
      "idempotency_key",
      "items",
    ],
    properties: {
      customer_name: { type: "string" },
      customer_phone: { type: "string" },
      delivery_point: { type: "string" },
      idempotency_key: { type: "string", format: "uuid" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            qty: { type: "integer" },
          },
        },
      },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      error: { type: "string" },
    },
  },
};
