import {
  findGymProfileById,
  findGymProfilesByUserId,
  insertGymProfile,
  softDeleteGymProfileById,
  updateGymProfileById,
} from './gymProfiles.repository.js';
import type {
  CreateGymProfileInput,
  GymProfileRow,
  UpdateGymProfileInput,
} from './gymProfiles.schema.js';

export async function createGymProfile(
  userId: string,
  input: CreateGymProfileInput,
): Promise<GymProfileRow> {
  return insertGymProfile(userId, input);
}

export async function listGymProfiles(userId: string): Promise<GymProfileRow[]> {
  return findGymProfilesByUserId(userId);
}

export async function getGymProfileById(
  id: string,
  userId: string,
): Promise<GymProfileRow | null> {
  return findGymProfileById(id, userId);
}

export async function updateGymProfile(
  id: string,
  userId: string,
  input: UpdateGymProfileInput,
): Promise<GymProfileRow | null> {
  return updateGymProfileById(id, userId, input);
}

export async function deleteGymProfile(
  id: string,
  userId: string,
): Promise<boolean> {
  return softDeleteGymProfileById(id, userId);
}
