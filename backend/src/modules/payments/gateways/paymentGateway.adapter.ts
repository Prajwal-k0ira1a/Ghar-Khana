export interface GatewaySessionResult {
  sessionId: string;
  gateway: 'ESEWA' | 'KHALTI';
  redirectUrl: string;
  formData?: Record<string, string>;
  paymentId: string;
  amount: string;
  currency: string;
}

export interface NormalizedPaymentEvent {
  event: 'payment.completed' | 'payment.failed';
  gateway: 'ESEWA' | 'KHALTI';
  gatewayTransactionId: string;
  referenceId: string; // internal paymentId
  amount: string;
  status: 'SUCCESS' | 'FAILED';
  rawPayload: any;
}

export interface GatewayRefundResult {
  refundId: string;
  amount: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface PaymentGatewayAdapter {
  readonly gatewayName: 'ESEWA' | 'KHALTI';

  createSession(
    payment: { id: string; amount: string; currency: string; idempotencyKey: string },
    subscription: { id: string; customerId: string }
  ): Promise<GatewaySessionResult>;

  verifyWebhookSignature(rawBody: any, signatureHeader?: string): boolean;

  parseWebhookEvent(rawBody: any): NormalizedPaymentEvent;

  initiateRefund(
    paymentId: string,
    amount: string,
    reason: string
  ): Promise<GatewayRefundResult>;
}
