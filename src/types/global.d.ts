export {};

declare global {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    handler: (response: unknown) => void;
  }

  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open(): void;
    };
  }
}
