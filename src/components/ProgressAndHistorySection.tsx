import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  WorkoutSession,
  ExerciseHistoryLog,
  BodyMeasurement,
  ProgressPhoto,
  DailyHabitLog,
  CalendarEntry,
  WorkoutPlan,
  MuscleCategory,
  MealEntry,
  AnatomicalZoneId,
} from '../types';
import { EXERCISES_CATALOG, MUSCLE_CATEGORIES, getExerciseById } from '../data/exercisesCatalog';
import { AnatomicalMuscleMap } from './AnatomicalVisuals';
import { HumanAnatomicalPostWorkoutMap } from './HumanAnatomicalPostWorkoutMap';
import {
  Activity,
  Barcode,
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Moon,
  Plus,
  Ruler,
  Scale,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  TrendingUp,
  Trophy,
  Utensils,
} from 'lucide-react';

// Helper to compress uploaded progress photo safely on canvas
async function compressImageFile(file: File, maxWidth = 680, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context indisponível'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

// Built-in Brazilian Fitness Food Catalog (TACO reference)
interface FoodCatalogItem {
  id: string;
  name: string;
  defaultPortion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  defaultCategory: 'cafe' | 'almoco' | 'jantar' | 'lanche';
}

const BRAZILIAN_FOOD_CATALOG: FoodCatalogItem[] = [
  { id: 'frango_grelhado', name: 'Peito de Frango Grelhado', defaultPortion: '150g', calories: 238, proteinG: 48, carbsG: 0, fatG: 3.8, defaultCategory: 'almoco' },
  { id: 'arroz_branco', name: 'Arroz Branco Cozido', defaultPortion: '120g (4 col. sopa)', calories: 154, proteinG: 3, carbsG: 34, fatG: 0.3, defaultCategory: 'almoco' },
  { id: 'arroz_integral', name: 'Arroz Integral Cozido', defaultPortion: '120g', calories: 148, proteinG: 3.2, carbsG: 31, fatG: 1.2, defaultCategory: 'almoco' },
  { id: 'feijao_carioca', name: 'Feijão Carioca Cozido', defaultPortion: '100g (1 concha)', calories: 76, proteinG: 4.8, carbsG: 13.6, fatG: 0.5, defaultCategory: 'almoco' },
  { id: 'patinho_moido', name: 'Carne Bovina Magra (Patinho)', defaultPortion: '150g', calories: 328, proteinG: 53.8, carbsG: 0, fatG: 10.9, defaultCategory: 'jantar' },
  { id: 'ovos_mexidos', name: 'Ovos Inteiros Cozidos / Mexidos', defaultPortion: '2 unidades (100g)', calories: 146, proteinG: 13, carbsG: 1.2, fatG: 9.8, defaultCategory: 'cafe' },
  { id: 'whey_protein', name: 'Whey Protein Concentrado', defaultPortion: '1 scoop (30g)', calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5, defaultCategory: 'lanche' },
  { id: 'aveia_flocos', name: 'Aveia em Flocos', defaultPortion: '40g (3 col. sopa)', calories: 157, proteinG: 5.6, carbsG: 26.6, fatG: 3.4, defaultCategory: 'cafe' },
  { id: 'banana_prata', name: 'Banana Prata', defaultPortion: '1 unidade média (90g)', calories: 88, proteinG: 1.2, carbsG: 23.4, fatG: 0.1, defaultCategory: 'lanche' },
  { id: 'batata_doce', name: 'Batata-Doce Cozida', defaultPortion: '150g', calories: 115, proteinG: 0.9, carbsG: 27.6, fatG: 0.2, defaultCategory: 'almoco' },
  { id: 'tapioca_frango', name: 'Tapioca com Frango Desfiado', defaultPortion: '1 unidade (130g)', calories: 265, proteinG: 22, carbsG: 36, fatG: 3.2, defaultCategory: 'jantar' },
  { id: 'pao_integral', name: 'Pão Integral de Forma', defaultPortion: '2 fatias (50g)', calories: 126, proteinG: 6.2, carbsG: 21, fatG: 1.8, defaultCategory: 'cafe' },
  { id: 'iogurte_natural', name: 'Iogurte Natural Desnatado', defaultPortion: '1 pote (170g)', calories: 74, proteinG: 6.8, carbsG: 9.8, fatG: 0.3, defaultCategory: 'lanche' },
  { id: 'pasta_amendoim', name: 'Pasta de Amendoim Integral', defaultPortion: '1 col. sopa (20g)', calories: 118, proteinG: 5.6, carbsG: 3.2, fatG: 9.8, defaultCategory: 'lanche' },
  { id: 'tilapia_grelhada', name: 'Filé de Tilápia Grelhado', defaultPortion: '150g', calories: 192, proteinG: 39, carbsG: 0, fatG: 4.1, defaultCategory: 'jantar' },
];

const MUSCLE_TO_ZONES: Record<string, AnatomicalZoneId[]> = {
  Peito: ['chest', 'upper_chest'],
  Peitoral: ['chest', 'upper_chest'],
  Costas: ['lats', 'traps', 'lower_back'],
  Ombros: ['front_delts', 'side_delts', 'rear_delts'],
  Bíceps: ['biceps'],
  Tríceps: ['triceps'],
  Braços: ['biceps', 'triceps', 'forearms'],
  Antebraços: ['forearms'],
  Pernas: ['quads', 'hamstrings', 'glutes', 'calves'],
  Quadríceps: ['quads'],
  'Posteriores de coxa': ['hamstrings'],
  Posterior: ['hamstrings'],
  Glúteos: ['glutes'],
  Panturrilhas: ['calves'],
  Abdômen: ['abs', 'obliques'],
  Cardio: ['cardio_system'],
};

interface ProgressAndHistorySectionProps {
  profile: UserProfile;
  workouts: WorkoutPlan[];
  sessions: WorkoutSession[];
  exerciseLogs: ExerciseHistoryLog[];
  measurements: BodyMeasurement[];
  photos: ProgressPhoto[];
  habits: DailyHabitLog[];
  calendarEntries: CalendarEntry[];
  onSaveMeasurement: (
    data: Omit<BodyMeasurement, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDeleteMeasurement: (id: string) => Promise<void>;
  onAddPhoto: (data: Omit<ProgressPhoto, 'id' | 'createdAt'>) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
  onSaveDailyHabit: (data: Omit<DailyHabitLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onSaveCalendarEntry: (
    data: Omit<CalendarEntry, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDeleteCalendarEntry: (id: string) => Promise<void>;
  onUpdateProfile?: (partial: Partial<UserProfile>) => Promise<void>;
  initialSubTab?: 'geral' | 'treinos' | 'calorias' | 'corporal' | 'fotos' | 'nutricao' | 'calendario';
}

export const ProgressAndHistorySection: React.FC<ProgressAndHistorySectionProps> = ({
  profile,
  workouts,
  sessions,
  exerciseLogs,
  measurements,
  photos,
  habits,
  calendarEntries,
  onSaveMeasurement,
  onDeleteMeasurement,
  onAddPhoto,
  onDeletePhoto,
  onSaveDailyHabit,
  onSaveCalendarEntry,
  onDeleteCalendarEntry,
  onUpdateProfile,
  initialSubTab = 'geral',
}) => {
  const [subTab, setSubTab] = useState<
    'geral' | 'treinos' | 'calorias' | 'corporal' | 'fotos' | 'nutricao' | 'calendario'
  >(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // History Filters
  const [periodFilter, setPeriodFilter] = useState<'all' | '7d' | '30d' | 'today'>('all');
  const [muscleFilter, setMuscleFilter] = useState<MuscleCategory | 'Todos'>('Todos');
  const [exerciseFilterId, setExerciseFilterId] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'weight' | 'reps' | 'volume'>('weight');
  const [expandedMuscleMapSessionId, setExpandedMuscleMapSessionId] = useState<string | null>(null);

  // Body Measurement Form State (with Abdomen, Forearms, Body Fat %)
  const todayISO = new Date().toISOString().slice(0, 10);
  const [editingMeasId, setEditingMeasId] = useState<string | null>(null);
  const [measDate, setMeasDate] = useState(todayISO);
  const [measWeight, setMeasWeight] = useState(String(profile.weightKg || 75));
  const [measHeight, setMeasHeight] = useState(String(profile.heightCm || 175));
  const [measWaist, setMeasWaist] = useState('');
  const [measAbdomen, setMeasAbdomen] = useState('');
  const [measHip, setMeasHip] = useState('');
  const [measChest, setMeasChest] = useState('');
  const [measArm, setMeasArm] = useState('');
  const [measForearm, setMeasForearm] = useState('');
  const [measThigh, setMeasThigh] = useState('');
  const [measCalf, setMeasCalf] = useState('');
  const [measBodyFat, setMeasBodyFat] = useState('');
  const [measNotes, setMeasNotes] = useState('');
  const [savingMeas, setSavingMeas] = useState(false);

  // Photos Comparison State
  const [photoDate, setPhotoDate] = useState(todayISO);
  const [photoPose, setPhotoPose] = useState('Frente Relaxado');
  const [photoWeight, setPhotoWeight] = useState(String(profile.weightKg || ''));
  const [photoNotes, setPhotoNotes] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [compareLeftId, setCompareLeftId] = useState<string>('');
  const [compareRightId, setCompareRightId] = useState<string>('');

  // Nutrition & Food Center State
  const [habitDateKey, setHabitDateKey] = useState(todayISO);
  const currentHabit = useMemo(
    () =>
      habits.find((h) => h.dateKey === habitDateKey) || {
        id: habitDateKey,
        userId: profile.userId,
        dateKey: habitDateKey,
        waterMl: 0,
        waterGoalMl: profile.waterGoalMl || 2500,
        sleepHours: 7.5,
        recoveryScore: 8,
        meals: [],
        notes: '',
      },
    [habits, habitDateKey, profile.userId, profile.waterGoalMl]
  );

  // Macro Goals
  const caloriesGoal = profile.caloriesGoal || (profile.goal === 'lose_weight' ? 1950 : profile.goal === 'gain_muscle' ? 2650 : 2400);
  const proteinGoalG = profile.proteinGoalG || Math.round((profile.weightKg || 75) * 2);
  const carbsGoalG = profile.carbsGoalG || (profile.goal === 'lose_weight' ? 180 : 280);
  const fatGoalG = profile.fatGoalG || 65;

  const [showMacroGoalEditor, setShowMacroGoalEditor] = useState(false);
  const [editCaloriesGoal, setEditCaloriesGoal] = useState(String(caloriesGoal));
  const [editProteinGoal, setEditProteinGoal] = useState(String(proteinGoalG));
  const [editCarbsGoal, setEditCarbsGoal] = useState(String(carbsGoalG));
  const [editFatGoal, setEditFatGoal] = useState(String(fatGoalG));

  // Food entry state
  const [selectedMealCategory, setSelectedMealCategory] = useState<'cafe' | 'almoco' | 'jantar' | 'lanche'>('almoco');
  const [mealTime, setMealTime] = useState('12:30');
  const [mealTitle, setMealTitle] = useState('');
  const [mealPortion, setMealPortion] = useState('1 porção (100g)');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);

  // Calendar State
  const [selectedCalDate, setSelectedCalDate] = useState(todayISO);
  const [calWorkoutId, setCalWorkoutId] = useState(workouts[0]?.id || 'rest_day');
  const [calEntryType, setCalEntryType] = useState<'planned' | 'rest' | 'rescheduled'>('planned');
  const [calNotes, setCalNotes] = useState('');

  // Muscle Group Training Frequency & Anatomical Map
  const muscleFrequencyData = useMemo(() => {
    const counts: Record<string, number> = {
      Peitoral: 0,
      Costas: 0,
      Ombros: 0,
      Bíceps: 0,
      Tríceps: 0,
      Antebraços: 0,
      Quadríceps: 0,
      'Posteriores de coxa': 0,
      Glúteos: 0,
      Panturrilhas: 0,
      Abdômen: 0,
      Cardio: 0,
    };

    // Count from real exercise logs
    exerciseLogs.forEach((log) => {
      const ex = getExerciseById(log.exerciseId);
      const rawGroup: string = ex?.muscleGroup || log.muscleGroup;
      if (rawGroup === 'Peito' || rawGroup === 'Peitoral') counts.Peitoral += log.setsCount || 3;
      else if (rawGroup === 'Costas') counts.Costas += log.setsCount || 3;
      else if (rawGroup === 'Ombros') counts.Ombros += log.setsCount || 3;
      else if (rawGroup === 'Bíceps') counts.Bíceps += log.setsCount || 3;
      else if (rawGroup === 'Tríceps') counts.Tríceps += log.setsCount || 3;
      else if (rawGroup === 'Braços') {
        counts.Bíceps += 2;
        counts.Tríceps += 2;
      } else if (rawGroup === 'Antebraços') counts.Antebraços += log.setsCount || 2;
      else if (rawGroup === 'Quadríceps' || rawGroup === 'Pernas') counts.Quadríceps += log.setsCount || 3;
      else if (rawGroup === 'Posteriores de coxa' || rawGroup === 'Posterior') counts['Posteriores de coxa'] += log.setsCount || 3;
      else if (rawGroup === 'Glúteos') counts.Glúteos += log.setsCount || 3;
      else if (rawGroup === 'Panturrilhas') counts.Panturrilhas += log.setsCount || 3;
      else if (rawGroup === 'Abdômen') counts.Abdômen += log.setsCount || 3;
      else if (rawGroup === 'Cardio') counts.Cardio += log.setsCount || 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const mostTrained = sorted.filter((x) => x[1] > 0).slice(0, 4);
    const leastTrained = [...sorted].reverse().slice(0, 4);

    const primaryZones = new Set<AnatomicalZoneId>();
    const secondaryZones = new Set<AnatomicalZoneId>();

    mostTrained.slice(0, 2).forEach(([group]) => {
      (MUSCLE_TO_ZONES[group] || []).forEach((z) => primaryZones.add(z));
    });
    mostTrained.slice(2, 5).forEach(([group]) => {
      (MUSCLE_TO_ZONES[group] || []).forEach((z) => {
        if (!primaryZones.has(z)) secondaryZones.add(z);
      });
    });

    return {
      sorted,
      mostTrained,
      leastTrained,
      primaryZones: Array.from(primaryZones),
      secondaryZones: Array.from(secondaryZones),
    };
  }, [exerciseLogs]);

  // Filtered Workout Sessions
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => {
      const sTime = new Date(s.dateISO).getTime();
      if (periodFilter === 'today' && s.dateISO.slice(0, 10) !== todayISO) return false;
      if (periodFilter === '7d' && now - sTime > 7 * 86400000) return false;
      if (periodFilter === '30d' && now - sTime > 30 * 86400000) return false;
      if (muscleFilter !== 'Todos' && !s.muscleGroups.includes(muscleFilter)) return false;
      if (
        exerciseFilterId !== 'all' &&
        !s.loggedSets.some((ls) => ls.exerciseId === exerciseFilterId)
      ) {
        return false;
      }
      return true;
    });
  }, [sessions, periodFilter, muscleFilter, exerciseFilterId, todayISO]);

  // Filtered Exercise Logs for Progression Chart
  const filteredExerciseLogs = useMemo(() => {
    return exerciseLogs
      .filter((l) => {
        if (muscleFilter !== 'Todos' && l.muscleGroup !== muscleFilter) return false;
        if (exerciseFilterId !== 'all' && l.exerciseId !== exerciseFilterId) return false;
        return true;
      })
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }, [exerciseLogs, muscleFilter, exerciseFilterId]);

  const totalVolumeSum = useMemo(
    () => filteredSessions.reduce((acc, s) => acc + s.totalVolumeKg, 0),
    [filteredSessions]
  );
  const totalPRsCount = useMemo(
    () => filteredSessions.reduce((acc, s) => acc + s.prCount, 0),
    [filteredSessions]
  );

  // Daily Nutrition Totals
  const dailyNutritionTotals = useMemo(() => {
    return currentHabit.meals.reduce(
      (acc, m) => {
        acc.calories += m.calories || 0;
        acc.proteinG += m.proteinG || 0;
        acc.carbsG += m.carbsG || 0;
        acc.fatG += m.fatG || 0;
        return acc;
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
  }, [currentHabit.meals]);

  const filteredFoodCatalog = useMemo(() => {
    const q = foodSearchQuery.trim().toLowerCase();
    if (!q) return BRAZILIAN_FOOD_CATALOG.slice(0, 6);
    return BRAZILIAN_FOOD_CATALOG.filter((f) => f.name.toLowerCase().includes(q));
  }, [foodSearchQuery]);

  const handleSaveMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measWeight || Number(measWeight) < 20) return;
    setSavingMeas(true);
    try {
      await onSaveMeasurement(
        {
          userId: profile.userId,
          dateISO: measDate,
          weightKg: Number(measWeight),
          ...(measHeight ? { heightCm: Number(measHeight) } : {}),
          ...(measWaist ? { waistCm: Number(measWaist) } : {}),
          ...(measAbdomen ? { abdomenCm: Number(measAbdomen) } : {}),
          ...(measHip ? { hipCm: Number(measHip) } : {}),
          ...(measChest ? { chestCm: Number(measChest) } : {}),
          ...(measArm ? { armCm: Number(measArm) } : {}),
          ...(measForearm ? { forearmCm: Number(measForearm) } : {}),
          ...(measThigh ? { thighCm: Number(measThigh) } : {}),
          ...(measCalf ? { calfCm: Number(measCalf) } : {}),
          ...(measBodyFat ? { bodyFatPercent: Number(measBodyFat) } : {}),
          ...(measNotes.trim() ? { notes: measNotes.trim().slice(0, 300) } : {}),
        },
        editingMeasId || undefined
      );
      setEditingMeasId(null);
      setMeasNotes('');
    } finally {
      setSavingMeas(false);
    }
  };

  const handlePhotoUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file);
      await onAddPhoto({
        userId: profile.userId,
        dateISO: photoDate,
        poseLabel: photoPose,
        ...(photoWeight && Number(photoWeight) >= 20 ? { weightKg: Number(photoWeight) } : {}),
        imageDataUrl: compressedDataUrl,
        ...(photoNotes.trim() ? { notes: photoNotes.trim().slice(0, 300) } : {}),
      });
      setPhotoNotes('');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddWater = async (deltaMl: number) => {
    const nextWater = Math.max(0, Math.min(15000, currentHabit.waterMl + deltaMl));
    await onSaveDailyHabit({
      userId: profile.userId,
      dateKey: habitDateKey,
      waterMl: nextWater,
      waterGoalMl: currentHabit.waterGoalMl,
      sleepHours: currentHabit.sleepHours,
      recoveryScore: currentHabit.recoveryScore,
      meals: currentHabit.meals,
      notes: currentHabit.notes || '',
    });
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealTitle.trim()) return;
    const newMeal: MealEntry = {
      id: `meal_${Date.now()}`,
      time: mealTime,
      title: mealTitle.trim().slice(0, 80),
      mealCategory: selectedMealCategory,
      portionText: mealPortion.trim() || '1 porção',
      calories: Math.max(0, Math.round(Number(mealCalories) || 0)),
      proteinG: Math.max(0, Math.round((Number(mealProtein) || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round((Number(mealCarbs) || 0) * 10) / 10),
      fatG: Math.max(0, Math.round((Number(mealFat) || 0) * 10) / 10),
      notes: mealNotes.trim().slice(0, 140),
    };
    await onSaveDailyHabit({
      userId: profile.userId,
      dateKey: habitDateKey,
      waterMl: currentHabit.waterMl,
      waterGoalMl: currentHabit.waterGoalMl,
      sleepHours: currentHabit.sleepHours,
      recoveryScore: currentHabit.recoveryScore,
      meals: [...currentHabit.meals, newMeal].slice(0, 35),
      notes: currentHabit.notes || '',
    });
    setMealTitle('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setMealNotes('');
  };

  const handleQuickAddFoodFromCatalog = async (food: FoodCatalogItem) => {
    const newMeal: MealEntry = {
      id: `meal_${Date.now()}_${food.id}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: food.name,
      mealCategory: selectedMealCategory,
      portionText: food.defaultPortion,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      notes: '',
    };
    await onSaveDailyHabit({
      userId: profile.userId,
      dateKey: habitDateKey,
      waterMl: currentHabit.waterMl,
      waterGoalMl: currentHabit.waterGoalMl,
      sleepHours: currentHabit.sleepHours,
      recoveryScore: currentHabit.recoveryScore,
      meals: [...currentHabit.meals, newMeal].slice(0, 35),
      notes: currentHabit.notes || '',
    });
  };

  const handleBarcodeLookup = async () => {
    const cleanCode = barcodeInput.replace(/\D/g, '');
    if (cleanCode.length < 8) {
      setBarcodeStatus('Digite um código de barras válido (EAN-8 ou EAN-13).');
      return;
    }
    setBarcodeLoading(true);
    setBarcodeStatus(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`);
      const data = await res.json();
      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const nut = p.nutriments || {};
        const prodName = p.product_name_pt || p.product_name || `Produto ${cleanCode}`;
        setMealTitle(prodName.slice(0, 75));
        setMealPortion(p.serving_size || '100g');
        setMealCalories(String(Math.round(nut['energy-kcal_serving'] || nut['energy-kcal_100g'] || 0)));
        setMealProtein(String(Math.round((nut.proteins_serving || nut.proteins_100g || 0) * 10) / 10));
        setMealCarbs(String(Math.round((nut.carbohydrates_serving || nut.carbohydrates_100g || 0) * 10) / 10));
        setMealFat(String(Math.round((nut.fat_serving || nut.fat_100g || 0) * 10) / 10));
        setBarcodeStatus(`Produto localizado: ${prodName}. Confira a porção e clique em Adicionar!`);
      } else {
        setBarcodeStatus('Produto não encontrado na base OpenFoodFacts. Preencha manualmente abaixo.');
      }
    } catch {
      setBarcodeStatus('Não foi possível consultar o código de barras agora. Preencha manualmente.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleSaveMacroGoals = async () => {
    if (!onUpdateProfile) return;
    await onUpdateProfile({
      caloriesGoal: Math.max(800, Number(editCaloriesGoal) || 2200),
      proteinGoalG: Math.max(30, Number(editProteinGoal) || 150),
      carbsGoalG: Math.max(30, Number(editCarbsGoal) || 220),
      fatGoalG: Math.max(20, Number(editFatGoal) || 65),
    });
    setShowMacroGoalEditor(false);
  };

  // Generate 14-day calendar strip around today
  const calendarDaysList = useMemo(() => {
    const list: Array<{ dateKey: string; labelDay: string; dayNum: string }> = [];
    const base = new Date();
    for (let offset = -4; offset <= 9; offset++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      const key = d.toISOString().slice(0, 10);
      list.push({
        dateKey: key,
        labelDay: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        dayNum: String(d.getDate()).padStart(2, '0'),
      });
    }
    return list;
  }, []);

  return (
    <div className="space-y-6">
      {/* Primary Sub-navigation Tabs */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-[#F4F0FF] rounded-2xl border border-[#EDE7FD]">
          {(
            [
              { id: 'geral', label: 'Evolução Geral' },
              { id: 'treinos', label: 'Estatísticas & PRs' },
              { id: 'nutricao', label: 'Alimentação & Água' },
            ] as const
          ).map((t) => {
            const active = subTab === t.id || (t.id === 'nutricao' && subTab === 'calorias');
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`px-1.5 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold leading-tight truncate transition-all text-center cursor-pointer ${
                  active
                    ? 'bg-[#5E2EE8] text-white shadow-sm'
                    : 'text-[#5E2EE8] hover:bg-[#EDE7FD]/60'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Secondary feature pills: Measurements, Photos, Calendar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5">
          {(
            [
              { id: 'corporal', label: 'Medidas Corporais', icon: Ruler },
              { id: 'fotos', label: `Fotos (${photos.length})`, icon: Camera },
              { id: 'calendario', label: 'Calendário & Histórico', icon: CalendarIcon },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1E1638] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-[#5E2EE8]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ABA 1 — EVOLUÇÃO GERAL & MAPA DE FREQUÊNCIA MUSCULAR (100% DADOS REAIS) */}
      {subTab === 'geral' && (
        <div className="space-y-5">
          {(() => {
            const nowMs = Date.now();
            const weeklySessionsCount = sessions.filter(
              (s) => nowMs - new Date(s.dateISO).getTime() <= 7 * 86400000
            ).length;
            const weeklyGoal = Math.max(1, profile.weeklyDays || 4);
            const realConsistencyPct =
              weeklySessionsCount === 0
                ? 0
                : Math.min(100, Math.round((weeklySessionsCount / weeklyGoal) * 100));

            const completedSessionsCount = sessions.filter(
              (s) => s.setsCompleted > 0 || s.dataSource === 'health_integration'
            ).length;

            const sessionCaloriesSum = sessions.reduce((acc, s) => {
              if (typeof s.activeCaloriesKcal === 'number' && s.activeCaloriesKcal > 0) {
                return acc + Math.round(s.activeCaloriesKcal);
              }
              return acc + Math.round(Math.max(0, (s.durationSeconds || 0) / 60) * 6.2);
            }, 0);

            const habitActiveCaloriesSum = habits.reduce(
              (acc, h) => acc + (h.activeCaloriesKcal || 0),
              0
            );
            const totalRealActiveCalories = Math.max(sessionCaloriesSum, habitActiveCaloriesSum);

            const monthNames = [
              'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
              'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
            ];
            const nowDate = new Date();
            const monthlyStats = Array.from({ length: 6 }, (_, idx) => {
              const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - (5 - idx), 1);
              const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const monthSessions = sessions.filter((s) => s.dateISO.slice(0, 7) === ym);
              return {
                key: ym,
                month: monthNames[d.getMonth()],
                count: monthSessions.length,
                volumeKg: monthSessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0),
              };
            });
            const maxMonthCount = Math.max(1, ...monthlyStats.map((m) => m.count));

            return (
              <>
                {/* Hero Trophy Card: "Sua Evolução Real" */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4A1CD8] via-[#5E2EE8] to-[#8042F7] p-5 sm:p-6 text-white shadow-md">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                        <Trophy className="w-9 h-9 text-[#FFD700] drop-shadow-md" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold tracking-wider uppercase text-white/80">
                          Sua Consistência Semanal Real
                        </span>
                        <div className="text-3xl font-black tracking-tight text-white leading-none my-1 font-mono-tabular">
                          {realConsistencyPct}%
                        </div>
                        <span className="text-xs text-white/85 font-medium">
                          {sessions.length === 0
                            ? 'Registre sua primeira atividade para acompanhar sua evolução.'
                            : `${weeklySessionsCount} de ${weeklyGoal} treinos concluídos nos últimos 7 dias`}
                        </span>
                      </div>
                    </div>
                    <img
                      src="/assets/mascots/pombo_hero_bust.png"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/mascots/pombo_head.jpg';
                      }}
                      alt="Mascote PomboFit"
                      className="w-16 h-16 object-contain hidden sm:block drop-shadow-lg"
                    />
                  </div>
                </div>

                {/* 3 Real KPI Cards: Fichas, Treinos Concluídos, Calorias Ativas */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EDE7FD] shadow-xs flex flex-col items-center justify-center text-center min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F0EBFE] flex items-center justify-center mb-1.5 text-[#5E2EE8] shrink-0">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-[#1E1638] font-mono-tabular leading-tight truncate w-full">
                      {sessions.length}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5 leading-tight truncate w-full">
                      Sessões Registradas
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EDE7FD] shadow-xs flex flex-col items-center justify-center text-center min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E8F8F0] flex items-center justify-center mb-1.5 text-[#10B981] shrink-0">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-[#1E1638] font-mono-tabular leading-tight truncate w-full">
                      {completedSessionsCount}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5 leading-tight truncate w-full">
                      Concluídos
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EDE7FD] shadow-xs flex flex-col items-center justify-center text-center min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFF0E8] flex items-center justify-center mb-1.5 text-[#FF5722] shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-[#1E1638] font-mono-tabular leading-tight truncate w-full">
                      {totalRealActiveCalories.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5 leading-tight truncate w-full">
                      Kcal Ativas Reais
                    </span>
                  </div>
                </div>

                {/* MAPA MUSCULAR CORPORAL DE FREQUÊNCIA (FRENTE E COSTAS) + MAIS/MENOS TREINADOS */}
                <div className="bg-white rounded-3xl p-5 border border-[#EDE7FD] shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8]">
                        Análise Biomecânica Real
                      </span>
                      <h3 className="text-base font-extrabold text-[#1E1638]">
                        Mapa de Frequência Muscular (Frente e Costas)
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">
                      {exerciseLogs.length > 0
                        ? `Calculado sobre ${exerciseLogs.length} registros de exercícios`
                        : 'Aguardando primeiro treino concluído'}
                    </span>
                  </div>

                  <AnatomicalMuscleMap
                    primaryZones={muscleFrequencyData.primaryZones}
                    secondaryZones={muscleFrequencyData.secondaryZones}
                    mascotForm={profile.mascotForm}
                    exerciseLogs={exerciseLogs}
                  />

                  {muscleFrequencyData.mostTrained.length === 0 ? (
                    <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-4 text-center text-xs text-slate-600">
                      Registre sua primeira atividade para acompanhar sua evolução muscular por grupamento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-[#F6F3FF] border border-[#E5DCFD] rounded-2xl p-3.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block mb-2">
                          Grupos Mais Treinados (Reais)
                        </span>
                        <div className="space-y-1.5">
                          {muscleFrequencyData.mostTrained.map(([group, sets]) => (
                            <div key={group} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#1E1638]">{group}</span>
                              <span className="font-mono-tabular font-black text-[#5E2EE8]">
                                {sets} séries
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-2">
                          Grupos Menos Trabalhados (Atenção)
                        </span>
                        <div className="space-y-1.5">
                          {muscleFrequencyData.leastTrained.slice(0, 3).map(([group, sets]) => (
                            <div key={group} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-950">{group}</span>
                              <span className="font-mono-tabular font-semibold text-amber-800">
                                {sets} séries
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* "Seu Histórico" Real Monthly Comparison Bar Chart */}
                <div className="bg-white rounded-3xl p-5 border border-[#EDE7FD] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#1E1638]">
                        Comparação Mensal de Treinos Concluídos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Histórico real dos últimos 6 meses
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubTab('treinos')}
                      className="text-xs font-bold text-[#5E2EE8] hover:underline cursor-pointer"
                    >
                      Ver Detalhes
                    </button>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="py-10 px-4 text-center bg-[#FAF8FF] rounded-2xl border border-purple-100/80 space-y-1">
                      <p className="text-xs font-bold text-[#1E1638]">
                        Nenhum treino registrado ainda
                      </p>
                      <p className="text-xs text-slate-500">
                        Registre sua primeira atividade para acompanhar sua evolução mensal.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-4 pb-2">
                      <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-slate-100 pb-2">
                        {monthlyStats.map((col) => {
                          const heightPct =
                            col.count === 0
                              ? 6
                              : Math.max(16, Math.round((col.count / maxMonthCount) * 100));
                          return (
                            <div
                              key={col.key}
                              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                            >
                              <span className="text-[10px] font-bold text-[#5E2EE8] font-mono-tabular">
                                {col.count}
                              </span>
                              <div className="w-full max-w-[36px] flex flex-col items-center justify-end h-full">
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full rounded-t-xl transition-all duration-500 shadow-xs ${
                                    col.count > 0
                                      ? 'bg-gradient-to-t from-[#5E2EE8] to-[#9872FF]'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#5E2EE8]">
                                {col.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ABA 2 — ESTATÍSTICAS DETALHADAS DE TREINO, CARGAS, REPETIÇÕES E PRs */}
      {subTab === 'treinos' && (
        <div className="space-y-6">
          {/* Filters by Period, Muscle Group, and Exercise */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 bg-[#FAF9FC] p-1 rounded-xl border border-slate-200 w-full lg:w-auto">
              {(
                [
                  { id: 'all', label: 'Todo o Período' },
                  { id: 'today', label: 'Hoje' },
                  { id: '7d', label: 'Últimos 7 Dias' },
                  { id: '30d', label: 'Último Mês' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id)}
                  className={`flex-1 sm:flex-initial px-2.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors text-center cursor-pointer ${
                    periodFilter === p.id
                      ? 'bg-[#7650C9] text-white'
                      : 'text-slate-600 hover:text-[#24212B]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
              <select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value as MuscleCategory | 'Todos')}
                className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold w-full"
              >
                <option value="Todos">Todos os Grupos Musculares</option>
                {MUSCLE_CATEGORIES.map((m) => (
                  <option key={m} value={m}>
                    Grupo: {m}
                  </option>
                ))}
              </select>

              <select
                value={exerciseFilterId}
                onChange={(e) => setExerciseFilterId(e.target.value)}
                className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold w-full"
              >
                <option value="all">Todos os Exercícios</option>
                {EXERCISES_CATALOG.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Sessões Realizadas</span>
              <strong className="text-2xl font-extrabold text-[#24212B] font-mono-tabular mt-1 block">
                {filteredSessions.length}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Volume Acumulado</span>
              <strong className="text-2xl font-extrabold text-[#7650C9] font-mono-tabular mt-1 block">
                {totalVolumeSum.toLocaleString('pt-BR')} kg
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Recordes Pessoais (PRs)</span>
              <strong className="text-2xl font-extrabold text-[#24212B] font-mono-tabular mt-1 block">
                {totalPRsCount}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Meta de Frequência</span>
              <strong className="text-2xl font-extrabold text-[#7650C9] font-mono-tabular mt-1 block">
                {profile.weeklyDays}x / sem
              </strong>
            </div>
          </div>

          {/* Progression Chart (Load, Reps, Volume) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[#24212B]">
                Gráfico de Desempenho (Cargas, Repetições e Volume)
              </h3>
              <div className="flex items-center gap-1 bg-[#FAF9FC] p-1 rounded-xl border border-slate-200">
                {(
                  [
                    { id: 'weight', label: 'Carga Máx (kg)' },
                    { id: 'reps', label: 'Repetições' },
                    { id: 'volume', label: 'Volume (kg)' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChartMetric(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      chartMetric === m.id
                        ? 'bg-[#5E2EE8] text-white'
                        : 'text-slate-600 hover:text-[#1E1638]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredExerciseLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 bg-[#FAF9FC] rounded-2xl">
                Nenhum registro encontrado para o filtro selecionado. Conclua um treino para alimentar o gráfico de evolução!
              </div>
            ) : (
              <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-3 bg-[#FAF9FC] rounded-2xl border border-slate-100 overflow-x-auto">
                {filteredExerciseLogs.slice(-12).map((log) => {
                  const getValue = (item: ExerciseHistoryLog) =>
                    chartMetric === 'weight'
                      ? item.maxWeightKg
                      : chartMetric === 'reps'
                      ? item.maxReps
                      : item.totalVolumeKg;
                  const val = getValue(log);
                  const maxVal = Math.max(
                    1,
                    ...filteredExerciseLogs.slice(-12).map((i) => getValue(i))
                  );
                  const barH = Math.max(20, Math.round((val / maxVal) * 115));
                  return (
                    <div
                      key={log.id}
                      className="flex-1 min-w-[58px] flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] font-bold text-[#7650C9] font-mono-tabular">
                        {val}
                        {chartMetric === 'reps' ? ' reps' : 'kg'}
                      </span>
                      <div
                        style={{ height: `${barH}px` }}
                        className={`w-full max-w-[30px] rounded-t-xl ${
                          log.isPR ? 'bg-amber-500' : 'bg-[#7650C9]'
                        }`}
                      />
                      <span className="text-[10px] text-slate-600 truncate max-w-[64px]">
                        {log.exerciseName.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono-tabular">
                        {new Date(log.dateISO).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Sessions History List */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-[#24212B]">
              Histórico de Sessões Concluídas ({filteredSessions.length})
            </h3>
            {filteredSessions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500">
                Nenhuma sessão concluída neste período. Inicie um treino na aba Início ou Treinos!
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isImported = sess.dataSource === 'health_integration';
                return (
                <div
                  key={sess.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#7650C9]">
                          {new Date(sess.dateISO).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg ${
                            isImported
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-[#5E2EE8] border border-purple-200'
                          }`}
                        >
                          {isImported
                            ? `Importado: ${
                                sess.healthProvider === 'apple_health'
                                  ? 'Apple Health'
                                  : sess.healthProvider === 'health_connect'
                                  ? 'Health Connect'
                                  : 'Saúde do Celular'
                              }`
                            : 'Registrado manualmente no PomboFit'}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-[#24212B] mt-1">
                        {sess.workoutName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono-tabular">
                      <span>
                        <strong>{Math.max(1, Math.round(sess.durationSeconds / 60))}</strong> min
                      </span>
                      {sess.activeCaloriesKcal !== undefined && sess.activeCaloriesKcal > 0 && (
                        <span className="text-orange-600 font-bold">
                          {Math.round(sess.activeCaloriesKcal)} kcal
                        </span>
                      )}
                      <span>
                        <strong>{sess.setsCompleted}</strong> séries
                      </span>
                      <span className="text-[#7650C9] font-bold">
                        {sess.totalVolumeKg} kg
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {sess.loggedSets.slice(0, 8).map((ls, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-600 flex items-center justify-between bg-[#FAF9FC] px-3 py-1.5 rounded-xl"
                      >
                        <span className="truncate pr-2">
                          Série #{ls.setNumber} · {ls.exerciseName}
                        </span>
                        <strong className="font-mono-tabular text-[#24212B] shrink-0">
                          {ls.weightKg}kg × {ls.repsDone}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* Ações da Sessão: Mapa Muscular Anatômico da Sessão */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMuscleMapSessionId(
                          expandedMuscleMapSessionId === sess.id ? null : sess.id
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        expandedMuscleMapSessionId === sess.id
                          ? 'bg-[#84CC16] text-[#0A1A05] shadow-xs'
                          : 'bg-[#FAF8FF] border border-purple-200 text-[#5E2EE8] hover:bg-[#F2EDFF]'
                      }`}
                    >
                      <span>🧬</span>
                      <span>
                        {expandedMuscleMapSessionId === sess.id
                          ? 'Ocultar Mapa Muscular'
                          : 'Ver Mapa Muscular'}
                      </span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      {sess.loggedSets.length} séries gravadas
                    </span>
                  </div>

                  {/* Expansor do Mapa Anatômico Humano Dual */}
                  {expandedMuscleMapSessionId === sess.id && (
                    <div className="pt-2 animate-in fade-in duration-300">
                      <HumanAnatomicalPostWorkoutMap
                        loggedSets={sess.loggedSets}
                        sessionName={sess.workoutName}
                        theme="dark"
                      />
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ABA 3 — MEDIDAS CORPORAIS COMPLETAS (INCLUINDO ABDÔMEN, ANTEBRAÇOS E % GORDURA) */}
      {subTab === 'corporal' && (
        <div className="space-y-6">
          {/* Date Comparison Card when user has >= 2 measurements */}
          {measurements.length >= 2 && (
            <div className="bg-white border border-[#EDE7FD] rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8]">
                    Comparativo entre Datas
                  </span>
                  <h3 className="text-base font-extrabold text-[#1E1638]">
                    Evolução Corporal ({new Date(measurements[measurements.length - 1].dateISO).toLocaleDateString('pt-BR')} → {new Date(measurements[0].dateISO).toLocaleDateString('pt-BR')})
                  </h3>
                </div>
                <Scale className="w-5 h-5 text-[#5E2EE8]" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const first = measurements[measurements.length - 1];
                  const latest = measurements[0];
                  const weightDiff = Math.round((latest.weightKg - first.weightKg) * 10) / 10;
                  const waistDiff =
                    latest.waistCm && first.waistCm
                      ? Math.round((latest.waistCm - first.waistCm) * 10) / 10
                      : null;
                  const armDiff =
                    latest.armCm && first.armCm
                      ? Math.round((latest.armCm - first.armCm) * 10) / 10
                      : null;
                  const bfDiff =
                    latest.bodyFatPercent && first.bodyFatPercent
                      ? Math.round((latest.bodyFatPercent - first.bodyFatPercent) * 10) / 10
                      : null;

                  return (
                    <>
                      <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block">Variação de Peso</span>
                        <strong className="text-base font-black text-[#1E1638] font-mono-tabular">
                          {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
                        </strong>
                      </div>
                      <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block">Cintura</span>
                        <strong className="text-base font-black text-[#1E1638] font-mono-tabular">
                          {waistDiff !== null ? `${waistDiff > 0 ? `+${waistDiff}` : waistDiff} cm` : `${latest.waistCm || '--'} cm`}
                        </strong>
                      </div>
                      <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block">Braços</span>
                        <strong className="text-base font-black text-[#1E1638] font-mono-tabular">
                          {armDiff !== null ? `${armDiff > 0 ? `+${armDiff}` : armDiff} cm` : `${latest.armCm || '--'} cm`}
                        </strong>
                      </div>
                      <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block">% de Gordura</span>
                        <strong className="text-base font-black text-[#5E2EE8] font-mono-tabular">
                          {bfDiff !== null ? `${bfDiff > 0 ? `+${bfDiff}` : bfDiff}%` : `${latest.bodyFatPercent || '--'}%`}
                        </strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveMeasurementSubmit}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 h-fit"
            >
              <h3 className="text-base font-extrabold text-[#24212B]">
                {editingMeasId ? 'Editar Medição Corporal' : 'Registrar Nova Medição'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={measDate}
                    onChange={(e) => setMeasDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Peso Corporal (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={measWeight}
                    onChange={(e) => setMeasWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measHeight}
                    onChange={(e) => setMeasHeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    % de Gordura Corporal
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={measBodyFat}
                    onChange={(e) => setMeasBodyFat(e.target.value)}
                    placeholder="Ex: 14.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Cintura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measWaist}
                    onChange={(e) => setMeasWaist(e.target.value)}
                    placeholder="Ex: 78"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Abdômen (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measAbdomen}
                    onChange={(e) => setMeasAbdomen(e.target.value)}
                    placeholder="Ex: 82"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Peitoral (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measChest}
                    onChange={(e) => setMeasChest(e.target.value)}
                    placeholder="Ex: 104"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Quadril (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measHip}
                    onChange={(e) => setMeasHip(e.target.value)}
                    placeholder="Ex: 98"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Braços (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measArm}
                    onChange={(e) => setMeasArm(e.target.value)}
                    placeholder="Ex: 38"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Antebraços (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measForearm}
                    onChange={(e) => setMeasForearm(e.target.value)}
                    placeholder="Ex: 30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Coxas (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measThigh}
                    onChange={(e) => setMeasThigh(e.target.value)}
                    placeholder="Ex: 58"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Panturrilhas (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={measCalf}
                    onChange={(e) => setMeasCalf(e.target.value)}
                    placeholder="Ex: 39"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={measNotes}
                    onChange={(e) => setMeasNotes(e.target.value)}
                    placeholder="Ex: Medição em jejum pela manhã"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingMeas}
                className="w-full py-3 rounded-2xl bg-[#7650C9] text-white text-xs font-bold hover:bg-[#6440B5] cursor-pointer"
              >
                {savingMeas
                  ? 'Salvando...'
                  : editingMeasId
                  ? 'Atualizar Medição'
                  : 'Salvar Medição no Histórico'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-base font-extrabold text-[#24212B]">
                Histórico de Medições Corporais ({measurements.length})
              </h3>
              {measurements.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500">
                  Nenhuma medição registrada ainda. Adicione seu peso e circunferências no formulário ao lado.
                </div>
              ) : (
                measurements.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7650C9]">
                        {new Date(m.dateISO).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMeasId(m.id);
                            setMeasDate(m.dateISO.slice(0, 10));
                            setMeasWeight(String(m.weightKg));
                            setMeasHeight(String(m.heightCm || ''));
                            setMeasWaist(String(m.waistCm || ''));
                            setMeasAbdomen(String(m.abdomenCm || ''));
                            setMeasHip(String(m.hipCm || ''));
                            setMeasChest(String(m.chestCm || ''));
                            setMeasArm(String(m.armCm || ''));
                            setMeasForearm(String(m.forearmCm || ''));
                            setMeasThigh(String(m.thighCm || ''));
                            setMeasCalf(String(m.calfCm || ''));
                            setMeasBodyFat(String(m.bodyFatPercent || ''));
                            setMeasNotes(m.notes || '');
                          }}
                          className="text-xs font-semibold text-slate-500 hover:text-[#7650C9] cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMeasurement(m.id)}
                          className="text-xs font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tabular">
                      <div className="bg-[#FAF9FC] p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Peso</span>
                        <strong>{m.weightKg} kg</strong>
                      </div>
                      {m.bodyFatPercent !== undefined && (
                        <div className="bg-[#F6F3FF] p-2 rounded-xl">
                          <span className="text-[10px] text-[#5E2EE8] block">% Gordura</span>
                          <strong className="text-[#5E2EE8]">{m.bodyFatPercent}%</strong>
                        </div>
                      )}
                      {m.waistCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Cintura</span>
                          <strong>{m.waistCm} cm</strong>
                        </div>
                      )}
                      {m.abdomenCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Abdômen</span>
                          <strong>{m.abdomenCm} cm</strong>
                        </div>
                      )}
                      {m.chestCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Peitoral</span>
                          <strong>{m.chestCm} cm</strong>
                        </div>
                      )}
                      {m.armCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Braços</span>
                          <strong>{m.armCm} cm</strong>
                        </div>
                      )}
                      {m.forearmCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Antebraços</span>
                          <strong>{m.forearmCm} cm</strong>
                        </div>
                      )}
                      {m.thighCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Coxas</span>
                          <strong>{m.thighCm} cm</strong>
                        </div>
                      )}
                      {m.calfCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Panturrilhas</span>
                          <strong>{m.calfCm} cm</strong>
                        </div>
                      )}
                      {m.hipCm && (
                        <div className="bg-[#FAF9FC] p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Quadril</span>
                          <strong>{m.hipCm} cm</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4 — FOTOS DE EVOLUÇÃO PRIVADAS & COMPARAÇÃO */}
      {subTab === 'fotos' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-7 space-y-3">
              <span className="text-xs font-bold text-[#7650C9] uppercase">
                Galeria Privada do Usuário
              </span>
              <h3 className="text-lg font-extrabold text-[#24212B]">
                Registrar e Comparar Fotos de Evolução
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Data</label>
                  <input
                    type="date"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pose</label>
                  <select
                    value={photoPose}
                    onChange={(e) => setPhotoPose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option>Frente Relaxado</option>
                    <option>Costas / Dorsal</option>
                    <option>Perfil Lateral</option>
                    <option>Duplo Bíceps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Peso na Data (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={photoWeight}
                    onChange={(e) => setPhotoWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <label className="border-2 border-dashed border-[#7650C9]/40 bg-[#F2EDFF]/50 hover:bg-[#F2EDFF] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                <Camera className="w-8 h-8 text-[#7650C9] mb-2" />
                <span className="text-xs font-bold text-[#24212B]">
                  {uploadingPhoto ? 'Processando e salvando...' : 'Adicionar Foto de Evolução'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Arquivo 100% privado na sua conta
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {photos.length >= 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
              <h4 className="text-sm font-extrabold text-[#24212B]">
                Comparador de Evolução (Antes × Depois)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    selectedId: compareLeftId || photos[photos.length - 1]?.id,
                    setSelected: setCompareLeftId,
                    title: 'Foto Inicial / Antes',
                  },
                  {
                    selectedId: compareRightId || photos[0]?.id,
                    setSelected: setCompareRightId,
                    title: 'Foto Atual / Depois',
                  },
                ].map((side, idx) => {
                  const chosen = photos.find((p) => p.id === side.selectedId) || photos[0];
                  return (
                    <div key={idx} className="space-y-2">
                      <select
                        value={chosen?.id || ''}
                        onChange={(e) => side.setSelected(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        {photos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {new Date(p.dateISO).toLocaleDateString('pt-BR')} · {p.poseLabel}{' '}
                            {p.weightKg ? `(${p.weightKg}kg)` : ''}
                          </option>
                        ))}
                      </select>
                      {chosen && (
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                          <img
                            src={chosen.imageDataUrl}
                            alt={chosen.poseLabel}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 right-2 bg-black/65 text-white px-3 py-1.5 rounded-xl text-[11px] flex justify-between">
                            <span>{new Date(chosen.dateISO).toLocaleDateString('pt-BR')}</span>
                            {chosen.weightKg && <strong>{chosen.weightKg} kg</strong>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[3/4] bg-slate-100 relative">
                  <img
                    src={p.imageDataUrl}
                    alt={p.poseLabel}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-[#24212B] block">{p.poseLabel}</strong>
                    <span className="text-[11px] text-slate-500">
                      {new Date(p.dateISO).toLocaleDateString('pt-BR')}{' '}
                      {p.weightKg ? `· ${p.weightKg}kg` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5 — CENTRAL DE ALIMENTAÇÃO, MACRONUTRIENTES E HIDRATAÇÃO */}
      {(subTab === 'nutricao' || subTab === 'calorias') && (
        <div className="space-y-6">
          {/* Date Selector & Goal Settings Header */}
          <div className="bg-white border border-[#EDE7FD] rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1E1638]">
                  Central de Alimentação & Nutrição
                </h3>
                <p className="text-xs text-slate-500">
                  Diário alimentar por refeição, controle de macros e código de barras
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={habitDateKey}
                onChange={(e) => setHabitDateKey(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
              />
              {onUpdateProfile && (
                <button
                  type="button"
                  onClick={() => setShowMacroGoalEditor(!showMacroGoalEditor)}
                  className="px-3 py-2 rounded-xl bg-[#F6F3FF] hover:bg-[#EBE3FF] text-[#5E2EE8] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Metas Diárias</span>
                </button>
              )}
            </div>
          </div>

          {/* Configurable Daily Macro Goals Drawer */}
          {showMacroGoalEditor && (
            <div className="bg-[#F6F3FF] border border-[#E2D6FC] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#5E2EE8]">
                  Configurar Metas Nutricionais Diárias
                </h4>
                <button
                  type="button"
                  onClick={() => setShowMacroGoalEditor(false)}
                  className="text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1638] mb-1">
                    Calorias (kcal)
                  </label>
                  <input
                    type="number"
                    value={editCaloriesGoal}
                    onChange={(e) => setEditCaloriesGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1638] mb-1">
                    Proteínas (g)
                  </label>
                  <input
                    type="number"
                    value={editProteinGoal}
                    onChange={(e) => setEditProteinGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1638] mb-1">
                    Carboidratos (g)
                  </label>
                  <input
                    type="number"
                    value={editCarbsGoal}
                    onChange={(e) => setEditCarbsGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E1638] mb-1">
                    Gorduras (g)
                  </label>
                  <input
                    type="number"
                    value={editFatGoal}
                    onChange={(e) => setEditFatGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono-tabular font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveMacroGoals}
                  className="px-4 py-2 rounded-xl bg-[#5E2EE8] text-white text-xs font-extrabold cursor-pointer"
                >
                  Salvar Metas Nutricionais
                </button>
              </div>
            </div>
          )}

          {/* 4 Macronutrient Summary Cards (Calorias, Proteínas, Carboidratos, Gorduras) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Calorias',
                current: Math.round(dailyNutritionTotals.calories),
                goal: caloriesGoal,
                unit: 'kcal',
                color: 'bg-[#5E2EE8]',
                textColor: 'text-[#5E2EE8]',
              },
              {
                label: 'Proteínas',
                current: Math.round(dailyNutritionTotals.proteinG),
                goal: proteinGoalG,
                unit: 'g',
                color: 'bg-emerald-500',
                textColor: 'text-emerald-600',
              },
              {
                label: 'Carboidratos',
                current: Math.round(dailyNutritionTotals.carbsG),
                goal: carbsGoalG,
                unit: 'g',
                color: 'bg-amber-500',
                textColor: 'text-amber-600',
              },
              {
                label: 'Gorduras',
                current: Math.round(dailyNutritionTotals.fatG),
                goal: fatGoalG,
                unit: 'g',
                color: 'bg-rose-500',
                textColor: 'text-rose-600',
              },
            ].map((mac) => {
              const pct = Math.min(100, Math.round((mac.current / Math.max(1, mac.goal)) * 100));
              return (
                <div
                  key={mac.label}
                  className="bg-white border border-[#EDE7FD] rounded-2xl p-4 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">{mac.label}</span>
                    <span className={`font-black font-mono-tabular ${mac.textColor}`}>{pct}%</span>
                  </div>
                  <div className="text-lg font-black text-[#1E1638] font-mono-tabular">
                    {mac.current}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      / {mac.goal} {mac.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={`h-full ${mac.color} transition-all`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Food Search, Barcode Lookup & Add Food Form */}
            <div className="lg:col-span-5 space-y-5">
              {/* Meal Category Selector */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#5E2EE8] block">
                  1. Selecione a Refeição
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'cafe', label: 'Café da manhã', icon: Coffee },
                      { id: 'almoco', label: 'Almoço', icon: Sun },
                      { id: 'jantar', label: 'Jantar', icon: Moon },
                      { id: 'lanche', label: 'Lanches', icon: Sunset },
                    ] as const
                  ).map((cat) => {
                    const Icon = cat.icon;
                    const active = selectedMealCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedMealCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                          active
                            ? 'bg-[#5E2EE8] text-white border-[#5E2EE8]'
                            : 'bg-[#FAF9FC] text-[#1E1638] border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Search in TACO Catalog */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-[#1E1638]">
                    Busca Rápida de Alimentos (Tabela TACO)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={foodSearchQuery}
                      onChange={(e) => setFoodSearchQuery(e.target.value)}
                      placeholder="Buscar frango, arroz, ovo, whey, aveia..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {filteredFoodCatalog.map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8FF] border border-purple-100 text-xs"
                      >
                        <div className="min-w-0">
                          <strong className="text-[#1E1638] block truncate">{food.name}</strong>
                          <span className="text-[10px] text-slate-500">
                            {food.defaultPortion} · {food.calories} kcal · P:{food.proteinG}g C:{food.carbsG}g G:{food.fatG}g
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickAddFoodFromCatalog(food)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#5E2EE8] text-white text-[11px] font-bold shrink-0 hover:bg-[#4A1CD8] cursor-pointer"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barcode Lookup */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-[#1E1638] flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-[#5E2EE8]" />
                    <span>Consultar Produto por Código de Barras (EAN)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Ex: 7891000100103"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                    />
                    <button
                      type="button"
                      disabled={barcodeLoading}
                      onClick={handleBarcodeLookup}
                      className="px-3 py-2 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] text-xs font-bold hover:bg-[#E4DAFD] cursor-pointer shrink-0"
                    >
                      {barcodeLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  {barcodeStatus && (
                    <p className="text-[11px] text-[#5E2EE8] font-medium bg-[#F6F3FF] px-3 py-1.5 rounded-xl">
                      {barcodeStatus}
                    </p>
                  )}
                </div>

                {/* Custom Food Entry Form */}
                <form onSubmit={handleAddMeal} className="space-y-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-[#1E1638] block">
                    Ou Cadastrar Alimento Personalizado
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="time"
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                    />
                    <input
                      type="text"
                      value={mealTitle}
                      onChange={(e) => setMealTitle(e.target.value)}
                      placeholder="Nome do alimento *"
                      className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={mealPortion}
                      onChange={(e) => setMealPortion(e.target.value)}
                      placeholder="Porção (ex: 150g)"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      placeholder="Calorias (kcal)"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={mealProtein}
                      onChange={(e) => setMealProtein(e.target.value)}
                      placeholder="Prot (g)"
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={mealCarbs}
                      onChange={(e) => setMealCarbs(e.target.value)}
                      placeholder="Carb (g)"
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={mealFat}
                      onChange={(e) => setMealFat(e.target.value)}
                      placeholder="Gord (g)"
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#5E2EE8] text-white text-xs font-extrabold hover:bg-[#4A1CD8] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar no Diário Alimentar</span>
                  </button>
                </form>
              </div>

              {/* Water & Hydration Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-[#7650C9]" />
                    <h3 className="text-sm font-extrabold text-[#24212B]">Hidratação Diária</h3>
                  </div>
                  <span className="text-xs font-bold font-mono-tabular text-[#7650C9]">
                    {currentHabit.waterMl} / {currentHabit.waterGoalMl} ml
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((currentHabit.waterMl / Math.max(1, currentHabit.waterGoalMl)) * 100)
                      )}%`,
                    }}
                    className="h-full bg-[#7650C9] transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, -250].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => handleAddWater(delta)}
                      className="py-2 rounded-xl bg-[#F2EDFF] text-[#7650C9] text-xs font-bold hover:bg-[#E4D9FF] cursor-pointer font-mono-tabular"
                    >
                      {delta > 0 ? `+${delta} ml` : `${delta} ml`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Categorized Food Diary (Café da manhã, Almoço, Jantar, Lanches) */}
            <div className="lg:col-span-7 space-y-4">
              {(
                [
                  { id: 'cafe', label: 'Café da manhã', icon: Coffee },
                  { id: 'almoco', label: 'Almoço', icon: Sun },
                  { id: 'jantar', label: 'Jantar', icon: Moon },
                  { id: 'lanche', label: 'Lanches', icon: Sunset },
                ] as const
              ).map((section) => {
                const Icon = section.icon;
                const items = currentHabit.meals.filter(
                  (m) => (m.mealCategory || 'almoco') === section.id
                );
                const sectionKcal = items.reduce((s, i) => s + (i.calories || 0), 0);
                const sectionProt = items.reduce((s, i) => s + (i.proteinG || 0), 0);

                return (
                  <div
                    key={section.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#1E1638]">
                            {section.label}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {items.length} {items.length === 1 ? 'item registrado' : 'itens registrados'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono-tabular">
                        <strong className="text-xs font-black text-[#5E2EE8] block">
                          {Math.round(sectionKcal)} kcal
                        </strong>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {Math.round(sectionProt)}g prot
                        </span>
                      </div>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">
                        Nenhum alimento registrado em {section.label.toLowerCase()}.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between bg-[#FAF9FC] border border-slate-200/80 rounded-2xl px-3.5 py-2.5 text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono-tabular font-bold text-[#7650C9]">
                                  {m.time}
                                </span>
                                <strong className="text-[#24212B] truncate">{m.title}</strong>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                                {m.portionText && <span>{m.portionText}</span>}
                                {m.calories !== undefined && (
                                  <span className="font-bold text-[#5E2EE8]">{m.calories} kcal</span>
                                )}
                                {(m.proteinG !== undefined || m.carbsG !== undefined || m.fatG !== undefined) && (
                                  <span className="font-mono-tabular">
                                    P:{m.proteinG || 0}g · C:{m.carbsG || 0}g · G:{m.fatG || 0}g
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onSaveDailyHabit({
                                  userId: profile.userId,
                                  dateKey: habitDateKey,
                                  waterMl: currentHabit.waterMl,
                                  waterGoalMl: currentHabit.waterGoalMl,
                                  sleepHours: currentHabit.sleepHours,
                                  recoveryScore: currentHabit.recoveryScore,
                                  meals: currentHabit.meals.filter((x) => x.id !== m.id),
                                  notes: currentHabit.notes || '',
                                })
                              }
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 6 — CALENDÁRIO INTERATIVO E AGENDA SEMANAL */}
      {subTab === 'calendario' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
            <h3 className="text-base font-extrabold text-[#24212B]">
              Calendário de Treinos Realizados, Descansos e Reagendamentos
            </h3>
            <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
              {calendarDaysList.map((d) => {
                const completedSession = sessions.some((s) => s.dateISO.slice(0, 10) === d.dateKey);
                const customEntry = calendarEntries.find((c) => c.dateKey === d.dateKey);
                const isSelected = selectedCalDate === d.dateKey;

                return (
                  <button
                    key={d.dateKey}
                    type="button"
                    onClick={() => setSelectedCalDate(d.dateKey)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                      isSelected
                        ? 'bg-[#7650C9] text-white border-[#7650C9]'
                        : completedSession
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : customEntry?.entryType === 'rest'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-[#FAF9FC] border-slate-200 text-[#24212B]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-75">{d.labelDay}</span>
                    <strong className="text-base font-extrabold font-mono-tabular my-0.5">
                      {d.dayNum}
                    </strong>
                    <span className="text-[9px] font-bold truncate max-w-full">
                      {completedSession
                        ? 'Concluído'
                        : customEntry?.entryType === 'rest'
                        ? 'Descanso'
                        : customEntry?.workoutName
                        ? customEntry.workoutName.slice(0, 10)
                        : 'Livre'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Data Selecionada
                </label>
                <input
                  type="date"
                  value={selectedCalDate}
                  onChange={(e) => setSelectedCalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tipo de Agendamento
                </label>
                <select
                  value={calEntryType}
                  onChange={(e) =>
                    setCalEntryType(e.target.value as 'planned' | 'rest' | 'rescheduled')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="planned">Treino Planejado</option>
                  <option value="rescheduled">Treino Reagendado</option>
                  <option value="rest">Dia de Descanso / Recuperação</option>
                </select>
              </div>
              {calEntryType !== 'rest' && (
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ficha de Treino
                  </label>
                  <select
                    value={calWorkoutId}
                    onChange={(e) => setCalWorkoutId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    {workouts.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={async () => {
                    const chosenWorkout = workouts.find((w) => w.id === calWorkoutId);
                    await onSaveCalendarEntry(
                      {
                        userId: profile.userId,
                        dateKey: selectedCalDate,
                        entryType: calEntryType,
                        workoutId: calEntryType === 'rest' ? 'rest' : chosenWorkout?.id || '',
                        workoutName:
                          calEntryType === 'rest'
                            ? 'Dia de Descanso'
                            : chosenWorkout?.name || 'Treino Personalizado',
                        notes: calNotes.trim(),
                      },
                      `cal_${selectedCalDate}`
                    );
                    setCalNotes('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7650C9] text-white text-xs font-bold hover:bg-[#6440B5] cursor-pointer"
                >
                  Salvar na Agenda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
