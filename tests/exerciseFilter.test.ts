import { describe, expect, it } from 'vitest';
import {
  filterExercises,
  isExerciseContraindicated,
  isExerciseEquipmentCompatible,
  normalizeInjuryTag,
} from '../src/modules/exercises/exerciseFilter.js';
import { curatedExercises } from '../src/db/seeds/exercises.js';
import type { Exercise } from '../src/db/schema.js';

describe('Exercise Filtering & Biomechanical Heuristics', () => {
  describe('Equipment Compatibility', () => {
    it('always considers bodyweight exercises compatible', () => {
      const pushUp = {
        name: 'Push-Up',
        requiredEquipment: 'bodyweight',
        movementPattern: 'horizontal_push',
      };

      const emptyGym = {
        environmentType: 'home',
        hasBarbell: false,
        hasSquatRack: false,
        hasBench: false,
        hasCableStack: false,
        hasSmithMachine: false,
        hasPullupBar: false,
        hasAdjustableBench: false,
        hasDumbbells: false,
        maxDumbbellWeightKg: null,
      };

      expect(isExerciseEquipmentCompatible(pushUp, emptyGym)).toBe(true);
    });

    it('requires squat rack for barbell squat movements', () => {
      const backSquat = {
        name: 'Barbell Back Squat',
        requiredEquipment: 'barbell',
        movementPattern: 'squat',
      };

      const barbellNoRack = {
        environmentType: 'home',
        hasBarbell: true,
        hasSquatRack: false,
        hasBench: false,
        hasCableStack: false,
        hasSmithMachine: false,
        hasPullupBar: false,
        hasAdjustableBench: false,
        hasDumbbells: false,
        maxDumbbellWeightKg: null,
      };

      expect(isExerciseEquipmentCompatible(backSquat, barbellNoRack)).toBe(false);

      const barbellWithRack = {
        ...barbellNoRack,
        hasSquatRack: true,
      };

      expect(isExerciseEquipmentCompatible(backSquat, barbellWithRack)).toBe(true);
    });

    it('requires bench for bench press movements', () => {
      const benchPress = {
        name: 'Barbell Bench Press',
        requiredEquipment: 'barbell',
        movementPattern: 'horizontal_push',
      };

      const barbellNoBench = {
        environmentType: 'home',
        hasBarbell: true,
        hasSquatRack: true,
        hasBench: false,
        hasCableStack: false,
        hasSmithMachine: false,
        hasPullupBar: false,
        hasAdjustableBench: false,
        hasDumbbells: false,
        maxDumbbellWeightKg: null,
      };

      expect(isExerciseEquipmentCompatible(benchPress, barbellNoBench)).toBe(false);

      const barbellWithBench = {
        ...barbellNoBench,
        hasBench: true,
      };

      expect(isExerciseEquipmentCompatible(benchPress, barbellWithBench)).toBe(true);
    });

    it('identifies cable stack dependencies correctly', () => {
      const cableRow = {
        name: 'Seated Cable Row',
        requiredEquipment: 'cable',
        movementPattern: 'horizontal_pull',
      };

      const homeDumbbellsOnly = {
        environmentType: 'home',
        hasBarbell: false,
        hasSquatRack: false,
        hasBench: true,
        hasCableStack: false,
        hasSmithMachine: false,
        hasPullupBar: false,
        hasAdjustableBench: false,
        hasDumbbells: true,
        maxDumbbellWeightKg: 25,
      };

      expect(isExerciseEquipmentCompatible(cableRow, homeDumbbellsOnly)).toBe(false);

      const commercialGym = {
        ...homeDumbbellsOnly,
        hasCableStack: true,
      };

      expect(isExerciseEquipmentCompatible(cableRow, commercialGym)).toBe(true);
    });
  });

  describe('Conservative Injury Contraindication Filtering', () => {
    it('normalizes various casing and spacing formats', () => {
      expect(normalizeInjuryTag('Lower Back')).toBe('lower_back');
      expect(normalizeInjuryTag('shoulder-impingement')).toBe('shoulder_impingement');
      expect(normalizeInjuryTag('  KNEE PAIN  ')).toBe('knee_pain');
    });

    it('flags exercises matching active user joint sensitivities', () => {
      const contraindicated = ['lower_back', 'knee_pain'];
      const userWithBackPain = [{ jointArea: 'lower_back', isActive: true }];

      expect(isExerciseContraindicated(contraindicated, userWithBackPain)).toBe(true);
    });

    it('matches sub-phrase joint areas conservatively', () => {
      const contraindicated = ['shoulder_impingement'];
      const userWithShoulder = [{ jointArea: 'shoulder', isActive: true }];

      expect(isExerciseContraindicated(contraindicated, userWithShoulder)).toBe(true);
    });

    it('ignores inactive constraints', () => {
      const contraindicated = ['lower_back'];
      const healedBackPain = [{ jointArea: 'lower_back', isActive: false }];

      expect(isExerciseContraindicated(contraindicated, healedBackPain)).toBe(false);
    });

    it('verifies PRD Belt Squat alternative logic for lower back pain', () => {
      const backSquat = curatedExercises.find((e) => e.name === 'Barbell Back Squat')!;
      const beltSquat = curatedExercises.find((e) => e.name === 'Belt Squat')!;
      const activeBackPain = [{ jointArea: 'lower_back', isActive: true }];

      // Barbell Back Squat must be flagged
      expect(isExerciseContraindicated(backSquat.contraindicatedInjuries, activeBackPain)).toBe(true);

      // Belt Squat must be safe (not contraindicated)
      expect(isExerciseContraindicated(beltSquat.contraindicatedInjuries, activeBackPain)).toBe(false);
    });

    it('verifies PRD Chest-Supported DB Row alternative for lower back pain', () => {
      const barbellRow = curatedExercises.find((e) => e.name === 'Barbell Bent-Over Row')!;
      const chestSupportedRow = curatedExercises.find((e) => e.name === 'Chest-Supported Dumbbell Row')!;
      const activeBackPain = [{ jointArea: 'lower_back', isActive: true }];

      // Barbell Bent-Over Row must be flagged
      expect(isExerciseContraindicated(barbellRow.contraindicatedInjuries, activeBackPain)).toBe(true);

      // Chest-Supported Dumbbell Row must be safe
      expect(isExerciseContraindicated(chestSupportedRow.contraindicatedInjuries, activeBackPain)).toBe(false);
    });
  });

  describe('Comprehensive Filter Pipeline', () => {
    const mockExercises: Exercise[] = curatedExercises.map((e, idx) => ({
      id: `00000000-0000-0000-0000-${String(idx).padStart(12, '0')}`,
      name: e.name,
      primaryMuscleGroup: e.primaryMuscleGroup,
      secondaryMuscleGroups: e.secondaryMuscleGroups,
      movementPattern: e.movementPattern,
      requiredEquipment: e.requiredEquipment,
      contraindicatedInjuries: e.contraindicatedInjuries,
      instructions: e.instructions ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }));

    it('filters home dumbbells profile with shoulder impingement', () => {
      const homeProfile = {
        environmentType: 'home',
        hasBarbell: false,
        hasSquatRack: false,
        hasBench: true,
        hasCableStack: false,
        hasSmithMachine: false,
        hasPullupBar: false,
        hasAdjustableBench: true,
        hasDumbbells: true,
        maxDumbbellWeightKg: 20,
      };

      const constraints = [{ jointArea: 'shoulder', isActive: true }];

      const result = filterExercises({
        exercises: mockExercises,
        gymProfile: homeProfile,
        activeConstraints: constraints,
      });

      expect(result.compatible.length).toBeGreaterThan(0);
      expect(result.excludedByEquipmentCount).toBeGreaterThan(0);
      expect(result.disclaimer).toContain('DISCLAIMER');

      // Ensure no barbell exercises survived
      expect(result.compatible.every((e) => e.requiredEquipment !== 'barbell')).toBe(true);

      // Ensure no shoulder impingement exercises survived
      expect(
        result.compatible.every(
          (e) => !e.contraindicatedInjuries.includes('shoulder_impingement'),
        ),
      ).toBe(true);
    });
  });
});
