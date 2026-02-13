import { schemas } from "./schemas";

export const paths = {
  "/api/order/create": {
    post: {
      summary: "Create a new order",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: schemas.CreateOrderRequest,
          },
        },
      },
      responses: {
        "200": {
          description: "Order created",
        },
        "400": {
          description: "Invalid request",
          content: {
            "application/json": {
              schema: schemas.ErrorResponse,
            },
          },
        },
      },
    },
  },

  "/api/payment/create": {
    post: {
      summary: "Create Razorpay payment order",
      responses: {
        "200": {
          description: "Razorpay order created",
        },
      },
    },
  },

  "/api/admin/orders": {
    get: {
      summary: "Get all orders (Admin only)",
      responses: {
        "200": {
          description: "List of orders",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orders: {
                    type: "array",
                    items: schemas.Order,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
