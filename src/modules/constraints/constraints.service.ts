import {
  findConstraintById,
  findConstraintsByUserId,
  insertConstraint,
  softDeleteConstraintById,
  updateConstraintById,
} from './constraints.repository.js';
import type {
  CreateConstraintInput,
  UpdateConstraintInput,
  UserConstraintRow,
} from './constraints.schema.js';

export async function createConstraint(
  userId: string,
  input: CreateConstraintInput,
): Promise<UserConstraintRow> {
  return insertConstraint(userId, input);
}

export async function listConstraints(
  userId: string,
  isActive?: boolean,
): Promise<UserConstraintRow[]> {
  return findConstraintsByUserId(userId, isActive);
}

export async function getConstraintById(
  id: string,
  userId: string,
): Promise<UserConstraintRow | null> {
  return findConstraintById(id, userId);
}

export async function updateConstraint(
  id: string,
  userId: string,
  input: UpdateConstraintInput,
): Promise<UserConstraintRow | null> {
  return updateConstraintById(id, userId, input);
}

export async function deleteConstraint(
  id: string,
  userId: string,
): Promise<boolean> {
  return softDeleteConstraintById(id, userId);
}
