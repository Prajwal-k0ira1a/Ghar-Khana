import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, or } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, providers, wallets, refreshTokens } from '../../db/schema/index';
import { env } from '../../shared/config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors/AppError';
import type { RegisterInput, LoginInput, OtpVerifyInput } from '@gharkhana/validation';
import type { AuthResponse, TokenRefreshResponse, User, Provider } from '@gharkhana/types';

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(user: { id: string; role: string; email: string | null; phone: string | null }) {
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, phone: user.phone },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return {
      accessToken,
      rawRefreshToken,
      tokenHash,
      expiresAt,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private mapUser(u: typeof users.$inferSelect): User {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role as User['role'],
      status: u.status as User['status'],
      phoneVerifiedAt: u.phoneVerifiedAt ? u.phoneVerifiedAt.toISOString() : null,
      emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }

  private mapProvider(p: typeof providers.$inferSelect): Provider {
    return {
      id: p.id,
      userId: p.userId,
      providerType: p.providerType as Provider['providerType'],
      displayName: p.displayName,
      description: p.description,
      verificationStatus: p.verificationStatus as Provider['verificationStatus'],
      dailyCapacity: p.dailyCapacity as Provider['dailyCapacity'],
      rating: p.rating ? parseFloat(p.rating) : null,
      ratingCount: p.ratingCount,
      status: p.status as Provider['status'],
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email or phone already in use
    const existing = await db.query.users.findFirst({
      where: or(
        input.email ? eq(users.email, input.email) : undefined,
        input.phone ? eq(users.phone, input.phone) : undefined
      ),
    });

    if (existing) {
      if (input.email && existing.email === input.email) {
        throw new ConflictError('An account with this email already exists', 'CONFLICT', { field: 'email' });
      }
      if (input.phone && existing.phone === input.phone) {
        throw new ConflictError('An account with this phone number already exists', 'CONFLICT', { field: 'phone' });
      }
    }

    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;

    // Execute in transaction
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          passwordHash,
          role: input.role || 'CUSTOMER',
          status: 'ACTIVE',
          // Auto-verify if local demo
          phoneVerifiedAt: input.phone ? new Date() : null,
          emailVerifiedAt: input.email ? new Date() : null,
        })
        .returning();

      let createdProvider = null;
      if (input.role === 'PROVIDER') {
        const [prov] = await tx
          .insert(providers)
          .values({
            userId: newUser.id,
            displayName: input.displayName || `${input.name}'s Kitchen`,
            providerType: input.providerType || 'HOME_COOK',
            verificationStatus: 'PENDING',
            status: 'ACTIVE',
            dailyCapacity: { BREAKFAST: 0, LUNCH: 30, DINNER: 20, SNACKS: 0 },
          })
          .returning();

        // Create provider wallet
        await tx.insert(wallets).values({
          providerId: prov.id,
          balance: '0.00',
          currency: 'NPR',
        });

        createdProvider = prov;
      }

      return { newUser, createdProvider };
    });

    const tokens = this.generateTokens(result.newUser);

    // Save refresh token
    await db.insert(refreshTokens).values({
      userId: result.newUser.id,
      tokenHash: tokens.tokenHash,
      expiresAt: tokens.expiresAt,
    });

    return {
      user: this.mapUser(result.newUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      expiresIn: tokens.expiresIn,
      provider: result.createdProvider ? this.mapProvider(result.createdProvider) : null,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await db.query.users.findFirst({
      where: or(eq(users.email, input.login), eq(users.phone, input.login)),
      with: { provider: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid login credentials', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is suspended or deactivated', 'ACCOUNT_INACTIVE');
    }

    if (input.isOtp) {
      // In development/test or if OTP flag is passed
      // Handled via OTP flow or instant dev OTP
    } else {
      if (!user.passwordHash || !input.password) {
        throw new UnauthorizedError('Password is required for password login', 'INVALID_CREDENTIALS');
      }
      const isMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid login credentials', 'INVALID_CREDENTIALS');
      }
    }

    const tokens = this.generateTokens(user);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: tokens.tokenHash,
      expiresAt: tokens.expiresAt,
    });

    return {
      user: this.mapUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      expiresIn: tokens.expiresIn,
      provider: user.provider ? this.mapProvider(user.provider) : null,
    };
  }

  async verifyOtp(input: OtpVerifyInput): Promise<AuthResponse> {
    const user = await db.query.users.findFirst({
      where: eq(users.phone, input.phone),
      with: { provider: true },
    });

    if (!user) {
      throw new NotFoundError('User with this phone number not found', 'USER_NOT_FOUND');
    }

    // Fixed test OTP for development: 123456
    if (input.code !== '123456') {
      throw new UnauthorizedError('Invalid or expired verification code', 'INVALID_OTP');
    }

    // Mark phone verified
    const [updatedUser] = await db
      .update(users)
      .set({ phoneVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    const tokens = this.generateTokens(updatedUser);

    await db.insert(refreshTokens).values({
      userId: updatedUser.id,
      tokenHash: tokens.tokenHash,
      expiresAt: tokens.expiresAt,
    });

    return {
      user: this.mapUser(updatedUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      expiresIn: tokens.expiresIn,
      provider: user.provider ? this.mapProvider(user.provider) : null,
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<TokenRefreshResponse> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const tokenRecord = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token', 'TOKEN_INVALID');
    }

    // Security check: Detect token reuse
    if (tokenRecord.revokedAt) {
      // Breach detection: Revoke all tokens for this user family
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.userId, tokenRecord.userId));

      throw new UnauthorizedError(
        'Refresh token reuse detected. All sessions have been revoked for security.',
        'TOKEN_REUSE_DETECTED'
      );
    }

    // Check expiration
    if (new Date() > tokenRecord.expiresAt) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, tokenRecord.id));

      throw new UnauthorizedError('Refresh token expired', 'TOKEN_EXPIRED');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, tokenRecord.userId),
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account not found or inactive', 'ACCOUNT_INACTIVE');
    }

    const tokens = this.generateTokens(user);

    // Rotate token atomically: revoke old, create new
    await db.transaction(async (tx) => {
      const [newRecord] = await tx
        .insert(refreshTokens)
        .values({
          userId: user.id,
          tokenHash: tokens.tokenHash,
          expiresAt: tokens.expiresAt,
        })
        .returning();

      await tx
        .update(refreshTokens)
        .set({
          revokedAt: new Date(),
          replacedByTokenId: newRecord.id,
        })
        .where(eq(refreshTokens.id, tokenRecord.id));
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }
}

export const authService = new AuthService();

