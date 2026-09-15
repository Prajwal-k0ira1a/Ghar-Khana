import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema/index';
import { NotFoundError } from '../../shared/errors/AppError';

export class UserService {
  async getMe(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        provider: true,
        customerLocations: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Exclude password hash from response
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateMe(userId: string, input: { name?: string }) {
    const [updated] = await db
      .update(users)
      .set({
        ...(input.name ? { name: input.name } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }
}

export const userService = new UserService();

