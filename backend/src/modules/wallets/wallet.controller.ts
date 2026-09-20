import type { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service.js';
import { providerService } from '../providers/provider.service.js';

export class WalletController {
  async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const details = await walletService.getWalletDetails(provider.id);
      res.status(200).json({ data: details });
    } catch (err) {
      next(err);
    }
  }

  async requestPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = await providerService.getProviderByUserId(req.user!.id);
      const payout = await walletService.requestPayout(provider.id, req.body);
      res.status(201).json({ data: payout });
    } catch (err) {
      next(err);
    }
  }
}

export const walletController = new WalletController();
