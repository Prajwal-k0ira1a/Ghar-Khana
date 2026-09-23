import { api } from './client';
import type { Payment, PaymentGateway } from '@gharkhana/types';

export interface InitiatePaymentPayload {
  subscriptionId: string;
  gateway: PaymentGateway;
  idempotencyKey: string;
}

export interface InitiatePaymentResponse {
  payment: Payment;
  checkoutUrl?: string;
  sessionPayload?: Record<string, unknown>;
  alreadyPaid?: boolean;
  idempotentReplay?: boolean;
}

export const paymentsApi = {
  initiate: (payload: InitiatePaymentPayload) =>
    api.post<InitiatePaymentResponse>('/payments', payload),

  getById: (id: string) => api.get<Payment>(`/payments/${id}`),

  getBySubscription: (subscriptionId: string) =>
    api.get<Payment[]>(`/payments/subscription/${subscriptionId}`),
};
