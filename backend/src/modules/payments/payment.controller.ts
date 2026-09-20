import type { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service.js';

export class PaymentController {
  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.initiatePayment(req.user!.id, req.body);
      const statusCode = result.idempotentReplay || result.alreadyPaid ? 200 : 201;
      res.status(statusCode).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.getPaymentById(req.params.id, req.user!.id);
      res.status(200).json({ data: payment });
    } catch (err) {
      next(err);
    }
  }

  async getSubscriptionPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await paymentService.getSubscriptionPayments(
        req.params.subscriptionId,
        req.user!.id
      );
      res.status(200).json({ data: payments });
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gateway = req.params.gateway.toUpperCase();
      const signatureHeader =
        (req.headers['x-signature'] as string) || (req.headers['x-esewa-signature'] as string);

      const result = await paymentService.handleWebhook(gateway, req.body, signatureHeader);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refunded = await paymentService.processRefund(
        req.params.id,
        req.body,
        req.user!.id
      );
      res.status(200).json({ data: refunded });
    } catch (err) {
      next(err);
    }
  }

  async reconcilePayments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.reconcilePendingPayments();
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
