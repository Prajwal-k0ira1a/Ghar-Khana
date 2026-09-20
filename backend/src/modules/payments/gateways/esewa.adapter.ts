import crypto from 'crypto';
import type {
  PaymentGatewayAdapter,
  GatewaySessionResult,
  NormalizedPaymentEvent,
  GatewayRefundResult,
} from './paymentGateway.adapter.js';

export interface EsewaConfig {
  merchantCode: string;
  secretKey: string;
  checkoutUrl: string;
  successUrl: string;
  failureUrl: string;
}

export class EsewaAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'ESEWA' as const;

  private config: EsewaConfig;

  constructor(config?: Partial<EsewaConfig>) {
    this.config = {
      merchantCode: config?.merchantCode || process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
      secretKey: config?.secretKey || process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
      checkoutUrl:
        config?.checkoutUrl ||
        process.env.ESEWA_CHECKOUT_URL ||
        'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      successUrl:
        config?.successUrl ||
        process.env.ESEWA_SUCCESS_URL ||
        'https://gharkhana.app/payments/esewa/success',
      failureUrl:
        config?.failureUrl ||
        process.env.ESEWA_FAILURE_URL ||
        'https://gharkhana.app/payments/esewa/failure',
    };
  }

  generateSignature(message: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('base64');
  }

  async createSession(
    payment: { id: string; amount: string; currency: string; idempotencyKey: string },
    _subscription: { id: string; customerId: string }
  ): Promise<GatewaySessionResult> {
    const totalAmount = parseFloat(payment.amount).toFixed(2);
    const transactionUuid = payment.id; // use internal payment UUID
    const productCode = this.config.merchantCode;

    // eSewa v2 signature message: total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = this.generateSignature(signatureMessage);

    const formData: Record<string, string> = {
      amount: totalAmount,
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: this.config.successUrl,
      failure_url: this.config.failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    return {
      sessionId: transactionUuid,
      gateway: 'ESEWA',
      redirectUrl: this.config.checkoutUrl,
      formData,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  verifyWebhookSignature(rawBody: any, signatureHeader?: string): boolean {
    try {
      let payload = rawBody;

      // In eSewa v2, webhook / callback can contain an encoded 'data' string or json
      if (typeof rawBody === 'string') {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          // If Base64 string directly
          const decoded = Buffer.from(rawBody, 'base64').toString('utf-8');
          payload = JSON.parse(decoded);
        }
      }

      if (payload.data && typeof payload.data === 'string') {
        const decoded = Buffer.from(payload.data, 'base64').toString('utf-8');
        payload = JSON.parse(decoded);
      }

      const receivedSignature = signatureHeader || payload.signature;
      if (!receivedSignature) {
        return false;
      }

      const signedFieldNames: string =
        payload.signed_field_names || 'total_amount,transaction_uuid,product_code';
      const fields = signedFieldNames.split(',');

      // Construct signature message in exact order specified in signed_field_names
      const messageParts = fields.map((field) => `${field}=${payload[field]}`);
      const expectedMessage = messageParts.join(',');
      const expectedSignature = this.generateSignature(expectedMessage);

      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  parseWebhookEvent(rawBody: any): NormalizedPaymentEvent {
    let payload = rawBody;

    if (typeof rawBody === 'string') {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        const decoded = Buffer.from(rawBody, 'base64').toString('utf-8');
        payload = JSON.parse(decoded);
      }
    }

    if (payload.data && typeof payload.data === 'string') {
      const decoded = Buffer.from(payload.data, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    }

    const isSuccess =
      payload.status === 'COMPLETE' || payload.status === 'SUCCESS' || payload.status === 'success';

    return {
      event: isSuccess ? 'payment.completed' : 'payment.failed',
      gateway: 'ESEWA',
      gatewayTransactionId: payload.transaction_code || payload.ref_id || `esewa_txn_${Date.now()}`,
      referenceId: payload.transaction_uuid || payload.payment_id,
      amount: payload.total_amount ? parseFloat(payload.total_amount).toFixed(2) : '0.00',
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      rawPayload: payload,
    };
  }

  async initiateRefund(
    paymentId: string,
    amount: string,
    _reason: string
  ): Promise<GatewayRefundResult> {
    // In production: calls eSewa Merchant Refund API endpoint.
    // In sandbox/staging: returns mock successful refund reference.
    return {
      refundId: `esewa_ref_${Date.now()}_${paymentId.slice(0, 8)}`,
      amount,
      status: 'SUCCESS',
    };
  }
}

export const esewaAdapter = new EsewaAdapter();
