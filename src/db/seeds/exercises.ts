export interface ExerciseSeed {
  name: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  movementPattern: string;
  requiredEquipment: string;
  contraindicatedInjuries: string[];
  instructions?: string;
}

export const curatedExercises: ExerciseSeed[] = [
  // -------------------------------------------------------------------------
  // Quad & Lower Body Compound (Squats & Lunges)
  // -------------------------------------------------------------------------
  {
    name: 'Barbell Back Squat',
    primaryMuscleGroup: 'quads',
    secondaryMuscleGroups: ['glutes', 'lower_back', 'calves'],
    movementPattern: 'squat',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['lower_back', 'knee_pain'],
    instructions: 'Standard back squat with barbell across upper traps or rear delts. Maintain neutral spine and descend to parallel.',
  },
  {
    name: 'Belt Squat',
    primaryMuscleGroup: 'quads',
    secondaryMuscleGroups: ['glutes'],
    movementPattern: 'squat',
    requiredEquipment: 'machine',
    contraindicatedInjuries: ['knee_pain'],
    instructions: 'Belt squat machine providing spinal-deloaded quad loading. Optimal for lifters with lower back sensitivity.',
  },
  {
    name: 'Bulgarian Split Squat',
    primaryMuscleGroup: 'quads',
    secondaryMuscleGroups: ['glutes', 'hamstrings'],
    movementPattern: 'lunge',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['knee_pain'],
    instructions: 'Rear foot elevated on flat bench with dumbbells in hand. Keeps axial loading low while challenging unilateral balance.',
  },
  {
    name: 'Leg Press',
    primaryMuscleGroup: 'quads',
    secondaryMuscleGroups: ['glutes'],
    movementPattern: 'squat',
    requiredEquipment: 'machine',
    contraindicatedInjuries: ['knee_pain', 'lower_back'],
    instructions: '45-degree sled or horizontal leg press. Keep lower back firmly against pad at bottom of movement.',
  },
  {
    name: 'Leg Extension',
    primaryMuscleGroup: 'quads',
    secondaryMuscleGroups: [],
    movementPattern: 'isolation',
    requiredEquipment: 'machine',
    contraindicatedInjuries: ['knee_pain'],
    instructions: 'Seated machine leg extension focusing on controlled eccentric and peak quadriceps contraction.',
  },

  // -------------------------------------------------------------------------
  // Hamstrings & Posterior Chain (Hinges & Curls)
  // -------------------------------------------------------------------------
  {
    name: 'Barbell Conventional Deadlift',
    primaryMuscleGroup: 'hamstrings',
    secondaryMuscleGroups: ['glutes', 'lower_back', 'traps', 'lats', 'forearms'],
    movementPattern: 'hinge',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Full-body compound pull from floor. Pull slack out of bar and drive through heels while locking lats.',
  },
  {
    name: 'Romanian Deadlift (Barbell)',
    primaryMuscleGroup: 'hamstrings',
    secondaryMuscleGroups: ['glutes', 'lower_back', 'forearms'],
    movementPattern: 'hinge',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Hip hinge starting from top position with soft knees. Push hips back until deep hamstring stretch is felt.',
  },
  {
    name: 'Dumbbell Romanian Deadlift',
    primaryMuscleGroup: 'hamstrings',
    secondaryMuscleGroups: ['glutes', 'lower_back'],
    movementPattern: 'hinge',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Dumbbell hip hinge with neutral grip tracking along outer shins.',
  },
  {
    name: 'Seated Leg Curl',
    primaryMuscleGroup: 'hamstrings',
    secondaryMuscleGroups: ['calves'],
    movementPattern: 'isolation',
    requiredEquipment: 'machine',
    contraindicatedInjuries: [],
    instructions: 'Seated machine curl providing deep stretch under hip flexion. Superior hypertrophy stimulus without axial fatigue.',
  },
  {
    name: 'Lying Leg Curl',
    primaryMuscleGroup: 'hamstrings',
    secondaryMuscleGroups: ['calves'],
    movementPattern: 'isolation',
    requiredEquipment: 'machine',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Prone machine leg curl. Keep hips pressed into pad to prevent lumbar hyperextension.',
  },

  // -------------------------------------------------------------------------
  // Horizontal Push (Chest, Front Delts, Triceps)
  // -------------------------------------------------------------------------
  {
    name: 'Barbell Bench Press',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['triceps', 'shoulders'],
    movementPattern: 'horizontal_push',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['shoulder_impingement', 'wrist_pain'],
    instructions: 'Flat barbell bench press. Retract scapulae, touch lower sternum with control, and press in slight J-curve.',
  },
  {
    name: 'Dumbbell Bench Press',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['triceps', 'shoulders'],
    movementPattern: 'horizontal_push',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: 'Flat dumbbell press allowing natural arm path and convergence at top.',
  },
  {
    name: 'Incline Dumbbell Press',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'triceps'],
    movementPattern: 'horizontal_push',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: '30 to 45 degree incline dumbbell press prioritizing clavicular head of pectoralis major.',
  },
  {
    name: 'Incline Barbell Bench Press',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'triceps'],
    movementPattern: 'horizontal_push',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['shoulder_impingement', 'wrist_pain'],
    instructions: 'Incline bench press with barbell touching upper chest with tight upper back.',
  },
  {
    name: 'Push-Up',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['triceps', 'core'],
    movementPattern: 'horizontal_push',
    requiredEquipment: 'bodyweight',
    contraindicatedInjuries: ['wrist_pain'],
    instructions: 'Floor push-up with rigid plank position, full chest contact, and lockout.',
  },
  {
    name: 'Cable Chest Flye',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders'],
    movementPattern: 'isolation',
    requiredEquipment: 'cable',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: 'Standing cable crossover flye keeping constant tension through full horizontal adduction.',
  },
  {
    name: 'Dips',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['triceps', 'shoulders'],
    movementPattern: 'vertical_push',
    requiredEquipment: 'bodyweight',
    contraindicatedInjuries: ['shoulder_impingement', 'elbow_tendonitis'],
    instructions: 'Parallel bar dips with slight forward lean to bias lower chest and triceps.',
  },

  // -------------------------------------------------------------------------
  // Vertical Push (Shoulders & Triceps)
  // -------------------------------------------------------------------------
  {
    name: 'Overhead Barbell Press',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: ['triceps', 'chest', 'core'],
    movementPattern: 'vertical_push',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['shoulder_impingement', 'lower_back'],
    instructions: 'Standing strict overhead military press with tight glutes and abs.',
  },
  {
    name: 'Seated Dumbbell Shoulder Press',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: ['triceps'],
    movementPattern: 'vertical_push',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: 'Seated on vertical or high-incline bench. Press dumbbells overhead in controlled arc.',
  },
  {
    name: 'Dumbbell Lateral Raise',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: ['traps'],
    movementPattern: 'isolation',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: 'Standing or seated lateral raise in scapular plane with slight forward lean.',
  },
  {
    name: 'Cable Lateral Raise',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: ['traps'],
    movementPattern: 'isolation',
    requiredEquipment: 'cable',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: 'Low pulley cable lateral raise with continuous resistance profile at bottom of range.',
  },

  // -------------------------------------------------------------------------
  // Horizontal Pull (Back, Rear Delts, Biceps)
  // -------------------------------------------------------------------------
  {
    name: 'Barbell Bent-Over Row',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps', 'rear_delts', 'lower_back', 'forearms'],
    movementPattern: 'horizontal_pull',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Bent-over row with torso angled 45-70 degrees. Pull bar into lower abdomen.',
  },
  {
    name: 'Chest-Supported Dumbbell Row',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps', 'rear_delts'],
    movementPattern: 'horizontal_pull',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: [],
    instructions: 'Incline bench supported dumbbell row. Eliminates lower back fatigue and allows isolated lat/rhomboid retraction.',
  },
  {
    name: 'Seated Cable Row',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps', 'rear_delts'],
    movementPattern: 'horizontal_pull',
    requiredEquipment: 'cable',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Low cable row with neutral attachment. Full stretch forward and strong retraction back.',
  },
  {
    name: 'One-Arm Dumbbell Row',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps', 'rear_delts'],
    movementPattern: 'horizontal_pull',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Bench-supported unilateral dumbbell row. Pull elbow toward hip pocket.',
  },
  {
    name: 'Face Pull',
    primaryMuscleGroup: 'rear_delts',
    secondaryMuscleGroups: ['traps', 'shoulders'],
    movementPattern: 'horizontal_pull',
    requiredEquipment: 'cable',
    contraindicatedInjuries: [],
    instructions: 'High pulley cable face pull with rope attachment. Emphasize external shoulder rotation.',
  },

  // -------------------------------------------------------------------------
  // Vertical Pull (Lats & Biceps)
  // -------------------------------------------------------------------------
  {
    name: 'Lat Pulldown',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps', 'forearms'],
    movementPattern: 'vertical_pull',
    requiredEquipment: 'cable',
    contraindicatedInjuries: ['shoulder_impingement'],
    instructions: 'Overhand medium grip pulldown to upper sternum. Keep chest raised.',
  },
  {
    name: 'Pull-Up',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps', 'core'],
    movementPattern: 'vertical_pull',
    requiredEquipment: 'pullup_bar',
    contraindicatedInjuries: ['shoulder_impingement', 'elbow_tendonitis'],
    instructions: 'Bodyweight pull-up from dead hang to chin clearing bar.',
  },
  {
    name: 'Chin-Up',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['biceps'],
    movementPattern: 'vertical_pull',
    requiredEquipment: 'pullup_bar',
    contraindicatedInjuries: ['elbow_tendonitis'],
    instructions: 'Supinated underhand grip chin-up recruiting heavy biceps assistance.',
  },

  // -------------------------------------------------------------------------
  // Arms: Biceps & Triceps Isolations
  // -------------------------------------------------------------------------
  {
    name: 'Barbell Biceps Curl',
    primaryMuscleGroup: 'biceps',
    secondaryMuscleGroups: ['forearms'],
    movementPattern: 'isolation',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['wrist_pain', 'elbow_tendonitis'],
    instructions: 'Standing supinated barbell curl with elbows pinned at sides.',
  },
  {
    name: 'Dumbbell Incline Biceps Curl',
    primaryMuscleGroup: 'biceps',
    secondaryMuscleGroups: ['forearms'],
    movementPattern: 'isolation',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['elbow_tendonitis'],
    instructions: 'Incline bench curl placing long head of biceps under passive stretch.',
  },
  {
    name: 'Hammer Curl',
    primaryMuscleGroup: 'biceps',
    secondaryMuscleGroups: ['forearms'],
    movementPattern: 'isolation',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: [],
    instructions: 'Neutral grip curl targeting brachialis and brachioradialis.',
  },
  {
    name: 'Triceps Cable Pushdown',
    primaryMuscleGroup: 'triceps',
    secondaryMuscleGroups: [],
    movementPattern: 'isolation',
    requiredEquipment: 'cable',
    contraindicatedInjuries: ['elbow_tendonitis'],
    instructions: 'Cable pushdown using straight bar or rope with full elbow extension.',
  },
  {
    name: 'Skull Crusher',
    primaryMuscleGroup: 'triceps',
    secondaryMuscleGroups: [],
    movementPattern: 'isolation',
    requiredEquipment: 'barbell',
    contraindicatedInjuries: ['elbow_tendonitis'],
    instructions: 'Lying triceps extension with EZ-bar or barbell descending to forehead or crown.',
  },
  {
    name: 'Overhead Dumbbell Triceps Extension',
    primaryMuscleGroup: 'triceps',
    secondaryMuscleGroups: [],
    movementPattern: 'isolation',
    requiredEquipment: 'dumbbell',
    contraindicatedInjuries: ['elbow_tendonitis', 'shoulder_impingement'],
    instructions: 'Seated two-hand dumbbell extension stretching the long head of the triceps.',
  },

  // -------------------------------------------------------------------------
  // Calves & Core
  // -------------------------------------------------------------------------
  {
    name: 'Standing Calf Raise',
    primaryMuscleGroup: 'calves',
    secondaryMuscleGroups: [],
    movementPattern: 'isolation',
    requiredEquipment: 'machine',
    contraindicatedInjuries: [],
    instructions: 'Standing calf machine raise with full ankle dorsiflexion and pause at stretch.',
  },
  {
    name: 'Seated Calf Raise',
    primaryMuscleGroup: 'calves',
    secondaryMuscleGroups: [],
    movementPattern: 'isolation',
    requiredEquipment: 'machine',
    contraindicatedInjuries: [],
    instructions: 'Seated knee-bent calf raise isolating the soleus muscle.',
  },
  {
    name: 'Hanging Leg Raise',
    primaryMuscleGroup: 'core',
    secondaryMuscleGroups: ['hip_flexors'],
    movementPattern: 'isolation',
    requiredEquipment: 'pullup_bar',
    contraindicatedInjuries: ['lower_back', 'shoulder_impingement'],
    instructions: 'Hanging leg or knee raise curling pelvis upward to activate rectus abdominis.',
  },
  {
    name: 'Cable Woodchopper',
    primaryMuscleGroup: 'core',
    secondaryMuscleGroups: ['shoulders'],
    movementPattern: 'isolation',
    requiredEquipment: 'cable',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Rotational oblique cable pull across torso in diagonal plane.',
  },
  {
    name: 'Plank',
    primaryMuscleGroup: 'core',
    secondaryMuscleGroups: ['shoulders', 'glutes'],
    movementPattern: 'isolation',
    requiredEquipment: 'bodyweight',
    contraindicatedInjuries: ['lower_back'],
    instructions: 'Static prone forearm plank resisting lumbar extension and lateral rotation.',
  },
];
