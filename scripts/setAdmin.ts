import 'dotenv/config';
import { and, eq, isNull } from 'drizzle-orm';
import { hashPassword } from '../src/auth/password.js';
import { db, pool } from '../src/db/connection.js';
import { users } from '../src/db/schema.js';

export async function setAdminUser(email: string, rawPassword: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(rawPassword);

  const [existingUser] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
    .limit(1);

  if (existingUser) {
    await db
      .update(users)
      .set({
        passwordHash,
        role: 'admin',
        name,
        deletedAt: null,
      })
      .where(eq(users.id, existingUser.id));

    console.log(`[setAdmin] Successfully updated existing user (${normalizedEmail}) with admin role.`);
  } else {
    await db.insert(users).values({
      email: normalizedEmail,
      passwordHash,
      name,
      role: 'admin',
    });

    console.log(`[setAdmin] Successfully created new admin account (${normalizedEmail}).`);
  }
}

const targetEmail = process.argv[2] || process.env.ADMIN_EMAIL;
const targetPass = process.argv[3] || process.env.ADMIN_PASSWORD;
const targetName = process.argv[4] || process.env.ADMIN_NAME || 'Admin';

if (!targetEmail || !targetPass) {
  console.error('[setAdmin] Error: Missing email or password.');
  console.error('Usage: npx tsx scripts/setAdmin.ts <email> <password> [name]');
  console.error('Or provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  process.exit(1);
}

setAdminUser(targetEmail, targetPass, targetName)
  .then(() => {
    console.log('[setAdmin] Admin configuration finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[setAdmin] Failed to configure admin account:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
