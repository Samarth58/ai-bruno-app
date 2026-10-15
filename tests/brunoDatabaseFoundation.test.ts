import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import {
  categories,
  examples,
  exercises,
  gymProfiles,
  routineExercises,
  userConstraints,
  userSessions,
  users,
  workoutPrograms,
  workoutRoutines,
  workoutSessions,
  workoutSetLogs,
} from '../src/db/schema.js';
import { curatedExercises } from '../src/db/seeds/exercises.js';

describe('Bruno AI Gym Buddy — Phase 1: Database Foundation', () => {
  describe('Exercise Seed Dataset Integrity', () => {
    it('contains a curated dataset of at least 35 strength exercises', () => {
      expect(curatedExercises.length).toBeGreaterThanOrEqual(35);
      expect(curatedExercises.length).toBe(40);
    });

    it('guarantees unique exercise names to prevent duplicate conflicts', () => {
      const names = curatedExercises.map((e) => e.name.toLowerCase().trim());
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(curatedExercises.length);
    });

    it('enforces mandatory biomechanical classification for every exercise', () => {
      const validMovements = [
        'squat',
        'hinge',
        'lunge',
        'horizontal_push',
        'vertical_push',
        'horizontal_pull',
        'vertical_pull',
        'isolation',
      ];

      for (const ex of curatedExercises) {
        expect(ex.name).toBeTruthy();
        expect(ex.primaryMuscleGroup).toBeTruthy();
        expect(validMovements).toContain(ex.movementPattern);
        expect(ex.requiredEquipment).toBeTruthy();
        expect(Array.isArray(ex.secondaryMuscleGroups)).toBe(true);
        expect(Array.isArray(ex.contraindicatedInjuries)).toBe(true);
      }
    });

    it('includes specific PRD-referenced exercises and safe alternatives', () => {
      const names = curatedExercises.map((e) => e.name);
      expect(names).toContain('Barbell Back Squat');
      expect(names).toContain('Belt Squat');
      expect(names).toContain('Bulgarian Split Squat');
      expect(names).toContain('Chest-Supported Dumbbell Row');
      expect(names).toContain('Seated Cable Row');
      expect(names).toContain('Incline Dumbbell Press');

      // Verify Belt Squat has no lower_back contraindication (PRD page 3 alternative)
      const beltSquat = curatedExercises.find((e) => e.name === 'Belt Squat')!;
      expect(beltSquat.contraindicatedInjuries).not.toContain('lower_back');

      // Verify Barbell Back Squat flags lower_back contraindication
      const backSquat = curatedExercises.find((e) => e.name === 'Barbell Back Squat')!;
      expect(backSquat.contraindicatedInjuries).toContain('lower_back');
    });
  });

  describe('Drizzle Schema Definition & Entities', () => {
    it('exports all starter-kit and Bruno tables correctly', () => {
      expect(users).toBeDefined();
      expect(userSessions).toBeDefined();
      expect(examples).toBeDefined();
      expect(categories).toBeDefined();

      expect(exercises).toBeDefined();
      expect(gymProfiles).toBeDefined();
      expect(userConstraints).toBeDefined();
      expect(workoutPrograms).toBeDefined();
      expect(workoutRoutines).toBeDefined();
      expect(routineExercises).toBeDefined();
      expect(workoutSessions).toBeDefined();
      expect(workoutSetLogs).toBeDefined();
    });

    it('verifies gym_profiles has all equipment checklist fields from PRD', () => {
      const columns = getTableColumns(gymProfiles);
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('userId');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('environmentType');
      expect(columns).toHaveProperty('maxDumbbellWeightKg');
      expect(columns).toHaveProperty('hasBarbell');
      expect(columns).toHaveProperty('hasSquatRack');
      expect(columns).toHaveProperty('hasBench');
      expect(columns).toHaveProperty('hasCableStack');
      expect(columns).toHaveProperty('hasSmithMachine');
      expect(columns).toHaveProperty('hasPullupBar');
      expect(columns).toHaveProperty('hasAdjustableBench');
      expect(columns).toHaveProperty('hasDumbbells');
    });

    it('verifies workout_programs contains split and duration constraints', () => {
      const columns = getTableColumns(workoutPrograms);
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('userId');
      expect(columns).toHaveProperty('gymProfileId');
      expect(columns).toHaveProperty('splitType');
      expect(columns).toHaveProperty('durationWeeks');
      expect(columns).toHaveProperty('currentWeek');
      expect(columns).toHaveProperty('trainingDaysPerWeek');
      expect(columns).toHaveProperty('targetSessionDurationMinutes');
      expect(columns).toHaveProperty('isActive');
    });

    it('verifies workout_sessions contains post-workout logging & feedback fields', () => {
      const columns = getTableColumns(workoutSessions);
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('userId');
      expect(columns).toHaveProperty('routineId');
      expect(columns).toHaveProperty('startedAt');
      expect(columns).toHaveProperty('completedAt');
      expect(columns).toHaveProperty('perceivedRpe');
      expect(columns).toHaveProperty('jointSoreness');
      expect(columns).toHaveProperty('hitPrescribedTargets');
      expect(columns).toHaveProperty('status');
    });

    it('verifies workout_set_logs records targets versus actual performance', () => {
      const columns = getTableColumns(workoutSetLogs);
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('sessionId');
      expect(columns).toHaveProperty('exerciseId');
      expect(columns).toHaveProperty('routineExerciseId');
      expect(columns).toHaveProperty('setNumber');
      expect(columns).toHaveProperty('targetWeightKg');
      expect(columns).toHaveProperty('targetReps');
      expect(columns).toHaveProperty('actualWeightKg');
      expect(columns).toHaveProperty('actualReps');
      expect(columns).toHaveProperty('targetHit');
    });
  });

  describe('Migration File & Journal Integrity', () => {
    it('verifies migration 0005 exists and is properly registered in journal', () => {
      const journalPath = path.resolve('drizzle/meta/_journal.json');
      expect(fs.existsSync(journalPath)).toBe(true);

      const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
      const entries = journal.entries as Array<{ idx: number; tag: string }>;

      const entry5 = entries.find((e) => e.idx === 5);
      expect(entry5).toBeDefined();
      expect(entry5?.tag).toMatch(/^0005_/);

      const migrationPath = path.resolve(`drizzle/${entry5?.tag}.sql`);
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      expect(sqlContent).toContain('CREATE TABLE "exercises"');
      expect(sqlContent).toContain('CREATE TABLE "gym_profiles"');
      expect(sqlContent).toContain('CREATE TABLE "user_constraints"');
      expect(sqlContent).toContain('CREATE TABLE "workout_programs"');
      expect(sqlContent).toContain('CREATE TABLE "workout_routines"');
      expect(sqlContent).toContain('CREATE TABLE "routine_exercises"');
      expect(sqlContent).toContain('CREATE TABLE "workout_sessions"');
      expect(sqlContent).toContain('CREATE TABLE "workout_set_logs"');
    });
  });
});
