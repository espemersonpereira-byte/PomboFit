export type FitnessGoal = 'lose_weight' | 'gain_muscle' | 'get_strong';
export type MascotForm = 'pombo_seco' | 'pombo_grande' | 'pombo_bruto';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type UnitSystem = 'metric' | 'imperial';

export type WorkoutSplitCategory =
  | 'ai_auto'
  | 'muscle_groups'
  | 'letters'
  | 'modality';

export type WorkoutSplitType =
  | 'ai_auto'
  | 'AB'
  | 'ABC'
  | 'ABCD'
  | 'ABCDE'
  | 'ABCDEF'
  | 'full_body'
  | 'upper_lower'
  | 'push_pull_legs'
  | 'muscle_groups';

export type AccessoryCategory =
  | 'hat'
  | 'glasses'
  | 'mask'
  | 'headband'
  | 'outfit'
  | 'special';

export type AccessoryRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type MuscleCategory =
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Antebraços'
  | 'Abdômen'
  | 'Quadríceps'
  | 'Posteriores de coxa'
  | 'Glúteos'
  | 'Panturrilhas'
  | 'Cardio';

export type EquipmentCategory =
  | 'Máquinas'
  | 'Halteres'
  | 'Barras'
  | 'Cabos'
  | 'Peso corporal'
  | 'Elásticos'
  | 'Equipamentos funcionais'
  | 'Outros equipamentos';

export type MovementPattern =
  | 'Empurrar'
  | 'Puxar'
  | 'Agachar'
  | 'Dobradiça de quadril'
  | 'Isolado'
  | 'Core / Estabilização'
  | 'Cardio / Metabólico';

export type AnatomicalZoneId =
  | 'chest'
  | 'upper_chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lats'
  | 'traps'
  | 'lower_back'
  | 'cardio_system';

export type BiomechanicalPosture =
  | 'bench_flat'
  | 'bench_incline'
  | 'standing_press'
  | 'standing_curl'
  | 'standing_row'
  | 'lat_pulldown'
  | 'cable_pushdown'
  | 'cable_fly'
  | 'squat'
  | 'lunge'
  | 'hip_hinge'
  | 'hip_thrust'
  | 'leg_machine'
  | 'calf_raise'
  | 'floor_core'
  | 'hanging_core'
  | 'pushup_plank'
  | 'cardio_run'
  | 'cardio_bike';

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: MuscleCategory;
  equipment: EquipmentCategory;
  movementType: MovementPattern;
  posture: BiomechanicalPosture;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  primaryZoneIds: AnatomicalZoneId[];
  secondaryZoneIds: AnatomicalZoneId[];
  startingPosition: string;
  executionSteps: string[];
  endingPosition: string;
  breathingTip: string;
  importantNotes: string;
  commonMistakes: string[];
  safetyPrecautions: string;
  jointStressTags: Array<'ombro' | 'joelho' | 'lombar' | 'punho' | 'cotovelo' | 'impacto'>;
  demonstrationImageUrl: string;
  startImageUrl?: string;
  endImageUrl?: string;
  imageUrl?: string;
  isCustom?: boolean;
  createdByUserId?: string;
  customNotes?: string;
}

export interface CustomPushReminder {
  id: string;
  title: string;
  body?: string;
  time: string; // HH:mm
  enabled: boolean;
  days?: string[]; // ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
}

export interface UserProfile {
  userId: string;
  email?: string;
  displayName: string;
  photoURL?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  goal: FitnessGoal;
  mascotForm: MascotForm;
  experienceLevel: ExperienceLevel;
  trainingLocation?: string;
  availableEquipment?: EquipmentCategory[];
  weeklyDays: number;
  sessionDurationMin: number;
  workoutSplitCategory?: WorkoutSplitCategory;
  workoutSplitType?: WorkoutSplitType;
  customMuscleCombos?: string[];
  priorityMuscles?: MuscleCategory[];
  limitations?: string;
  xp: number;
  level: number;
  streakDays?: number;
  unlockedAchievementIds?: string[];
  unlockedAccessories?: string[];
  avatarType?: 'personal' | 'pombo_head' | 'pombo_custom';
  personalPhotoUrl?: string;
  equippedHat?: string;
  equippedGlasses?: string;
  equippedMask?: string;
  equippedHeadband?: string;
  equippedOutfit?: string;
  equippedShoes?: string;
  equippedPose?: string;
  equippedSpecial?: string;
  favoriteExerciseIds?: string[];
  recentExerciseIds?: string[];
  waterGoalMl?: number;
  caloriesGoal?: number;
  proteinGoalG?: number;
  carbsGoalG?: number;
  fatGoalG?: number;
  unitSystem?: UnitSystem;
  autoStartRestTimer?: boolean;
  soundAlerts?: boolean;
  vibrationAlerts?: boolean;
  pushNotificationsEnabled?: boolean;
  notifRestFinished?: boolean;
  notifWorkoutCompletion?: boolean;
  notifWorkoutReminder?: boolean;
  workoutReminderTime?: string;
  notifWeeklyGoal?: boolean;
  notifAchievements?: boolean;
  notifWaterReminder?: boolean;
  waterReminderIntervalMin?: number;
  customReminders?: CustomPushReminder[];
  themePreference?: 'light' | 'dark' | 'system';
  healthProvider?: HealthProviderId;
  healthConnected?: boolean;
  healthPermissions?: HealthPermissionCategory[];
  healthLastSyncISO?: string;
  onboardingCompleted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type HealthProviderId = 'none' | 'apple_health' | 'health_connect';

export type DataOriginState = 'manual' | 'health_integration' | 'unavailable';

export type HealthPermissionCategory =
  | 'steps'
  | 'distance'
  | 'active_calories'
  | 'workouts'
  | 'active_minutes'
  | 'heart_rate';

export interface WorkoutExerciseSlot {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  targetWeightKg?: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  muscleGroups: MuscleCategory[];
  scheduledDays: string[]; // ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  estimatedDurationMin: number;
  exercises: WorkoutExerciseSlot[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LoggedSetEntry {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  plannedReps: string;
  weightKg: number;
  repsDone: number;
  completed: boolean;
  completedAtISO: string;
}

export interface ActiveSessionState {
  sessionId: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  muscleGroups: MuscleCategory[];
  startedAtMs: number;
  elapsedSecondsBeforePause: number;
  isPaused: boolean;
  exercises: Array<{
    slotId: string;
    exerciseId: string;
    notes: string;
    restSeconds: number;
    sets: Array<{
      setNumber: number;
      plannedReps: string;
      weightKg: number;
      repsDone: number;
      completed: boolean;
      completedAtISO?: string;
      isPro?: boolean;
      proAwarded?: boolean;
    }>;
  }>;
  restTimer: {
    active: boolean;
    remainingSeconds: number;
    totalSeconds: number;
    startedAtMs?: number;
  };
  isFreeWorkout?: boolean;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  muscleGroups: MuscleCategory[];
  dateISO: string;
  durationSeconds: number;
  totalVolumeKg: number;
  setsCompleted: number;
  exercisesCount: number;
  prCount: number;
  loggedSets: LoggedSetEntry[];
  notes?: string;
  dataSource?: 'manual' | 'health_integration';
  healthProvider?: HealthProviderId;
  activeCaloriesKcal?: number;
  distanceKm?: number;
  averageHeartRateBpm?: number;
  isFreeWorkout?: boolean;
  muscleMapSnapshot?: {
    primaryZones: AnatomicalZoneId[];
    secondaryZones: AnatomicalZoneId[];
    groups: Array<{
      name: string;
      intensity: 'high' | 'medium' | 'low';
      setsCount: number;
      volumeKg: number;
      exercises: string[];
    }>;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExerciseHistoryLog {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleCategory;
  sessionId: string;
  dateISO: string;
  maxWeightKg: number;
  maxReps: number;
  totalVolumeKg: number;
  setsCount: number;
  setsSummary: string;
  isPR: boolean;
  createdAt?: unknown;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  dateISO: string;
  weightKg: number;
  heightCm?: number;
  waistCm?: number;
  abdomenCm?: number;
  hipCm?: number;
  chestCm?: number;
  armCm?: number;
  forearmCm?: number;
  thighCm?: number;
  calfCm?: number;
  bodyFatPercent?: number;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  dateISO: string;
  poseLabel: string;
  weightKg?: number;
  imageDataUrl: string;
  notes?: string;
  createdAt?: unknown;
}

export type MealCategoryType = 'cafe' | 'almoco' | 'jantar' | 'lanche';

export interface MealEntry {
  id: string;
  time: string;
  title: string;
  notes: string;
  mealCategory?: MealCategoryType;
  portionText?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  barcode?: string;
}

export interface DailyHabitLog {
  id: string; // dateKey YYYY-MM-DD
  userId: string;
  dateKey: string;
  waterMl: number;
  waterGoalMl: number;
  sleepHours: number;
  recoveryScore: number;
  meals: MealEntry[];
  notes?: string;
  steps?: number;
  activeCaloriesKcal?: number;
  distanceKm?: number;
  activeMinutes?: number;
  heartRateBpm?: number;
  healthSource?: DataOriginState;
  healthProvider?: HealthProviderId;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CalendarEntry {
  id: string;
  userId: string;
  dateKey: string; // YYYY-MM-DD
  workoutId: string;
  workoutName: string;
  entryType: 'planned' | 'rest' | 'completed' | 'rescheduled';
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type MainTab = 'home' | 'workouts' | 'exercises' | 'progress' | 'profile' | 'mascot' | 'health';

