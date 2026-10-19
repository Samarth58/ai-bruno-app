import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { hashPassword } from './password.js';

/**
 * Ensures the primary administrative account exists with the 'admin' role.
 * Runs idempotently during server startup.
 */
export async function bootstrapAdmin(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL || 'samarthahg2004@gmail.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Samarth@582004';
  const adminName = process.env.ADMIN_NAME || 'Samarth';

  try {
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.email, adminEmail), isNull(users.deletedAt)))
      .limit(1);

    if (existing) {
      if (existing.role !== 'admin') {
        await db
          .update(users)
          .set({ role: 'admin' })
          .where(eq(users.id, existing.id));
        console.log(`[bootstrapAdmin] Elevated existing user ${adminEmail} to admin role.`);
      }
    } else {
      const passwordHash = await hashPassword(adminPassword);
      await db.insert(users).values({
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: 'admin',
      });
      console.log(`[bootstrapAdmin] Created default admin account for ${adminEmail}.`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[bootstrapAdmin] Notice: could not check or initialize admin user:', message);
  }
}
