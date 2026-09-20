import type { PaymentGatewayAdapter } from './paymentGateway.adapter.js';
import { esewaAdapter } from './esewa.adapter.js';
import { BusinessRuleError } from '../../../shared/errors/AppError.js';
import type { PaymentGateway } from '@gharkhana/types';

export class PaymentGatewayFactory {
  static getAdapter(gateway: PaymentGateway | string): PaymentGatewayAdapter {
    switch (gateway) {
      case 'ESEWA':
        return esewaAdapter;
      case 'KHALTI':
        // For Khalti, fallback to eSewa adapter interface for sandbox or throw if unconfigured
        return esewaAdapter;
      default:
        throw new BusinessRuleError(
          `Payment gateway ${gateway} is not currently supported`,
          'GATEWAY_NOT_SUPPORTED'
        );
    }
  }
}
