import { db } from '../../db/index.js';
import { auditLogs } from '../../db/schema/index.js';

/**
 * Append-only audit trail writer (SECURITY.md §10, DATABASE.md §19).
 * Never throws — audit failure must not fail the business transaction.
 */
export const recordAudit = async (params: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}): Promise<void> => {
  try {
    await db.insert(auditLogs).values({
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeState: (params.beforeState ?? null) as never,
      afterState: (params.afterState ?? null) as never,
    });
  } catch {
    // Intentionally silent: audit writes are best-effort at the API layer.
  }
};
