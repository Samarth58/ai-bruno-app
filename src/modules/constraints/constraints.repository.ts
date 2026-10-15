import { and, desc, eq, isNull } from 'drizzle-orm';
import { db as defaultDb } from '../../db/connection.js';
import { userConstraints } from '../../db/schema.js';
import type {
  CreateConstraintInput,
  UpdateConstraintInput,
  UserConstraintRow,
} from './constraints.schema.js';

export type { UserConstraintRow };

export async function insertConstraint(
  userId: string,
  input: CreateConstraintInput,
  db = defaultDb,
): Promise<UserConstraintRow> {
  const [created] = await db
    .insert(userConstraints)
    .values({
      userId,
      ...input,
    })
    .returning();

  return created;
}

export async function findConstraintsByUserId(
  userId: string,
  isActive?: boolean,
  db = defaultDb,
): Promise<UserConstraintRow[]> {
  const conditions = [
    eq(userConstraints.userId, userId),
    isNull(userConstraints.deletedAt),
  ];

  if (typeof isActive === 'boolean') {
    conditions.push(eq(userConstraints.isActive, isActive));
  }

  return db
    .select()
    .from(userConstraints)
    .where(and(...conditions))
    .orderBy(desc(userConstraints.createdAt));
}

export async function findConstraintById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<UserConstraintRow | null> {
  const [row] = await db
    .select()
    .from(userConstraints)
    .where(
      and(
        eq(userConstraints.id, id),
        eq(userConstraints.userId, userId),
        isNull(userConstraints.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function updateConstraintById(
  id: string,
  userId: string,
  input: UpdateConstraintInput,
  db = defaultDb,
): Promise<UserConstraintRow | null> {
  const [updated] = await db
    .update(userConstraints)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userConstraints.id, id),
        eq(userConstraints.userId, userId),
        isNull(userConstraints.deletedAt),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function softDeleteConstraintById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<boolean> {
  const [deleted] = await db
    .update(userConstraints)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userConstraints.id, id),
        eq(userConstraints.userId, userId),
        isNull(userConstraints.deletedAt),
      ),
    )
    .returning();

  return Boolean(deleted);
}
