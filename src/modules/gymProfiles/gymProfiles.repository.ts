import { and, desc, eq, isNull } from 'drizzle-orm';
import { db as defaultDb } from '../../db/connection.js';
import { gymProfiles } from '../../db/schema.js';
import type {
  CreateGymProfileInput,
  GymProfileRow,
  UpdateGymProfileInput,
} from './gymProfiles.schema.js';

export type { GymProfileRow };

export async function insertGymProfile(
  userId: string,
  input: CreateGymProfileInput,
  db = defaultDb,
): Promise<GymProfileRow> {
  if (input.isDefault) {
    // Unset current default profile for this user
    await db
      .update(gymProfiles)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(gymProfiles.userId, userId), isNull(gymProfiles.deletedAt)));
  }

  const [created] = await db
    .insert(gymProfiles)
    .values({
      userId,
      ...input,
    })
    .returning();

  return created;
}

export async function findGymProfilesByUserId(
  userId: string,
  db = defaultDb,
): Promise<GymProfileRow[]> {
  return db
    .select()
    .from(gymProfiles)
    .where(and(eq(gymProfiles.userId, userId), isNull(gymProfiles.deletedAt)))
    .orderBy(desc(gymProfiles.isDefault), desc(gymProfiles.createdAt));
}

export async function findGymProfileById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<GymProfileRow | null> {
  const [row] = await db
    .select()
    .from(gymProfiles)
    .where(
      and(
        eq(gymProfiles.id, id),
        eq(gymProfiles.userId, userId),
        isNull(gymProfiles.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findDefaultGymProfile(
  userId: string,
  db = defaultDb,
): Promise<GymProfileRow | null> {
  const [row] = await db
    .select()
    .from(gymProfiles)
    .where(
      and(
        eq(gymProfiles.userId, userId),
        eq(gymProfiles.isDefault, true),
        isNull(gymProfiles.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function updateGymProfileById(
  id: string,
  userId: string,
  input: UpdateGymProfileInput,
  db = defaultDb,
): Promise<GymProfileRow | null> {
  if (input.isDefault) {
    await db
      .update(gymProfiles)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(gymProfiles.userId, userId), isNull(gymProfiles.deletedAt)));
  }

  const [updated] = await db
    .update(gymProfiles)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(gymProfiles.id, id),
        eq(gymProfiles.userId, userId),
        isNull(gymProfiles.deletedAt),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function softDeleteGymProfileById(
  id: string,
  userId: string,
  db = defaultDb,
): Promise<boolean> {
  const [deleted] = await db
    .update(gymProfiles)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(gymProfiles.id, id),
        eq(gymProfiles.userId, userId),
        isNull(gymProfiles.deletedAt),
      ),
    )
    .returning();

  return Boolean(deleted);
}
