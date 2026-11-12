import React, { useMemo } from 'react';
import {
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  ActiveSessionState,
  DailyHabitLog,
  MainTab,
} from '../types';
import {
  calculateLevelFromXp,
  MASCOT_DATA,
  goalToMascotForm,
} from '../data/gamificationAndMascot';
import { getExerciseById } from '../data/exercisesCatalog';
import { AvatarHeadDisplay } from './AvatarCustomizerModal';
import { MascotAnatomicalOverlays, getMascotFormScaleClass } from './MascotAccessoryArt';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  History,
  Layers,
  MapPin,
  Play,
  Ruler,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Utensils,
} from 'lucide-react';

interface HomeDashboardProps {
  profile: UserProfile;
  workouts: WorkoutPlan[];
  sessions: WorkoutSession[];
  habits?: DailyHabitLog[];
  activeSession: ActiveSessionState | null;
  onStartWorkout: (workout: WorkoutPlan) => void;
  onResumeActiveSession: () => void;
  onNavigateTab: (tab: MainTab, subtab?: string) => void;
  onOpenFlexibleRoutine: () => void;
  onInspectWorkoutPlan?: (workout: WorkoutPlan) => void;
  onOpenScanner?: () => void;
  onOpenPomboAI?: () => void;
  onOpenAvatarModal?: () => void;
}

const JS_DAY_TO_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  workouts,
  sessions,
  habits = [],
  activeSession,
  onStartWorkout,
  onResumeActiveSession,
  onNavigateTab,
  onOpenFlexibleRoutine,
  onInspectWorkoutPlan,
  onOpenScanner,
  onOpenPomboAI,
  onOpenAvatarModal,
}) => {
  const activeMascotForm = profile.mascotForm || goalToMascotForm(profile.goal || 'gain_muscle');
  const activeMascot = MASCOT_DATA[activeMascotForm] || MASCOT_DATA.pombo_grande;
  const levelInfo = calculateLevelFromXp(profile.xp || 100);

  const now = new Date();
  const todayIndex = now.getDay();
  const todayPt = JS_DAY_TO_PT[todayIndex];
  const todayISO = now.toISOString().slice(0, 10);

  // Today's scheduled workout
  const todaysWorkout = useMemo(() => {
    return workouts.find((w) => w.scheduledDays.includes(todayPt)) || workouts[0] || null;
  }, [workouts, todayPt]);

  // Today's habit & health log
  const todayHabit = useMemo(
    () => habits.find((h) => h.dateKey === todayISO),
    [habits, todayISO]
  );

  // 1. Real Workouts Count (fichas planejadas)
  const totalWorkoutsCount = workouts.length;

  // 2. Real Completed Sessions (Today & Last 7 Days)
  const nowMs = Date.now();
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.dateISO.slice(0, 10) === todayISO),
    [sessions, todayISO]
  );

  const weeklyDoneSessions = useMemo(
    () =>
      sessions.filter(
        (s) => nowMs - new Date(s.dateISO).getTime() <= 7 * 86400000
      ),
    [sessions, nowMs]
  );
  const weeklyDoneCount = weeklyDoneSessions.length;

  // 3. Real Active Calories (NO FAKE FALLBACKS — 0 if no activity recorded)
  const todayWorkoutCalories = useMemo(() => {
    return todaySessions.reduce((acc, s) => {
      if (typeof s.activeCaloriesKcal === 'number' && s.activeCaloriesKcal > 0) {
        return acc + Math.round(s.activeCaloriesKcal);
      }
      const minutes = Math.max(0, (s.durationSeconds || 0) / 60);
      return acc + Math.round(minutes * 6.2);
    }, 0);
  }, [todaySessions]);

  const weeklyWorkoutCalories = useMemo(() => {
    return weeklyDoneSessions.reduce((acc, s) => {
      if (typeof s.activeCaloriesKcal === 'number' && s.activeCaloriesKcal > 0) {
        return acc + Math.round(s.activeCaloriesKcal);
      }
      const minutes = Math.max(0, (s.durationSeconds || 0) / 60);
      return acc + Math.round(minutes * 6.2);
    }, 0);
  }, [weeklyDoneSessions]);

  // Combine health integration active calories with manual workout calories without double counting
  const todayActiveCalories = useMemo(() => {
    const healthKcal = todayHabit?.activeCaloriesKcal || 0;
    return Math.max(healthKcal, todayWorkoutCalories);
  }, [todayHabit, todayWorkoutCalories]);

  const weeklyTotalActiveCalories = useMemo(() => {
    const healthWeekKcal = habits
      .filter((h) => nowMs - new Date(h.dateKey).getTime() <= 7 * 86400000)
      .reduce((acc, h) => acc + (h.activeCaloriesKcal || 0), 0);
    return Math.max(healthWeekKcal, weeklyWorkoutCalories);
  }, [habits, nowMs, weeklyWorkoutCalories]);

  // 4. Real Activity Minutes (Today & Week)
  const todayWorkoutMinutes = useMemo(() => {
    return todaySessions.reduce(
      (acc, s) => acc + Math.max(1, Math.round((s.durationSeconds || 0) / 60)),
      0
    );
  }, [todaySessions]);

  const todayActiveMinutes = useMemo(() => {
    const healthMin = todayHabit?.activeMinutes || 0;
    return Math.max(healthMin, todayWorkoutMinutes);
  }, [todayHabit, todayWorkoutMinutes]);

  // 5. Real Streak & Consistency (Counts consecutive active training days up to today or yesterday)
  const realStreakDays = useMemo(() => {
    if (sessions.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(
        sessions.map((s) => {
          const d = new Date(s.dateISO);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        })
      )
    ).sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) return 0;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now.getTime() - 86400000);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const latestKey = uniqueDates[0];
    if (latestKey !== todayStr && latestKey !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let cursor = new Date(latestKey === todayStr ? now.getTime() : yesterdayDate.getTime());

    for (let i = 0; i < 365; i++) {
      const checkStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      if (uniqueDates.includes(checkStr)) {
        streak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  }, [sessions]);

  const weeklyGoalDays = Math.max(1, profile.weeklyDays || 4);
  const consistencyRate = useMemo(() => {
    if (weeklyDoneCount === 0) return 0;
    return Math.min(100, Math.round((weeklyDoneCount / weeklyGoalDays) * 100));
  }, [weeklyDoneCount, weeklyGoalDays]);

  // 6. Health Provider & Data Origin Resolution
  const healthConnected = Boolean(profile.healthConnected && profile.healthProvider && profile.healthProvider !== 'none');
  const healthProviderLabel =
    profile.healthProvider === 'apple_health'
      ? 'Apple Health (iOS)'
      : profile.healthProvider === 'health_connect'
      ? 'Health Connect (Android)'
      : 'Saúde do Celular';

  const hasStepsData = typeof todayHabit?.steps === 'number';
  const hasDistanceData = typeof todayHabit?.distanceKm === 'number';
  const hasHeartRateData = typeof todayHabit?.heartRateBpm === 'number' && todayHabit.heartRateBpm > 0;

  // 7. Real Muscle Evolution from completed sessions
  const realMuscleEvolution = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((sess) => {
      (sess.loggedSets || []).forEach((ls) => {
        if (!ls.completed) return;
        const ex = getExerciseById(ls.exerciseId);
        const group = ex?.muscleGroup || sess.muscleGroups[0] || 'Geral';
        counts[group] = (counts[group] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [sessions]);

  // 8. Today's nutritional summary (real logged meals)
  const todayNutrition = useMemo(() => {
    const meals = todayHabit?.meals || [];
    const totals = meals.reduce(
      (acc, m) => {
        acc.calories += m.calories || 0;
        acc.proteinG += m.proteinG || 0;
        acc.carbsG += m.carbsG || 0;
        acc.fatG += m.fatG || 0;
        return acc;
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
    return {
      ...totals,
      waterMl: todayHabit?.waterMl || 0,
      waterGoalMl: todayHabit?.waterGoalMl || profile.waterGoalMl || 2500,
      caloriesGoal:
        profile.caloriesGoal ||
        (profile.goal === 'lose_weight' ? 1950 : profile.goal === 'gain_muscle' ? 2650 : 2400),
      proteinGoalG: profile.proteinGoalG || Math.round((profile.weightKg || 75) * 2),
    };
  }, [todayHabit, profile]);

  // Next upcoming workouts formatted with future dates
  const upcomingWorkouts = useMemo(() => {
    if (workouts.length === 0) return [];

    const list: Array<{
      dayShort: string;
      dateNum: string;
      monthShort: string;
      workout: WorkoutPlan;
    }> = [];

    for (let i = 1; i <= 6; i++) {
      const targetDate = new Date(now.getTime() + i * 86400000);
      const targetDayPt = JS_DAY_TO_PT[targetDate.getDay()];
      const match = workouts.find((w) => w.scheduledDays.includes(targetDayPt));
      if (match) {
        list.push({
          dayShort: targetDayPt,
          dateNum: String(targetDate.getDate()).padStart(2, '0'),
          monthShort: MONTH_NAMES_SHORT[targetDate.getMonth()],
          workout: match,
        });
      }
    }

    if (list.length === 0) {
      workouts.slice(0, 3).forEach((w, idx) => {
        const targetDate = new Date(now.getTime() + (idx + 1) * 86400000);
        list.push({
          dayShort: JS_DAY_TO_PT[targetDate.getDay()],
          dateNum: String(targetDate.getDate()).padStart(2, '0'),
          monthShort: MONTH_NAMES_SHORT[targetDate.getMonth()],
          workout: w,
        });
      });
    }

    return list;
  }, [workouts, now]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* 1. CARTÃO DE APRESENTAÇÃO COM O POMBO SECO, SAUDAÇÃO, FOTO DO USUÁRIO E SEQUÊNCIA REAL */}
      <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-r from-[#5520D8] via-[#6B32E2] to-[#8E52F4] p-4 sm:p-6 text-white shadow-md">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 sm:gap-6 relative z-10">
          {/* Lado Esquerdo: Mascote Interativo 3D com Skins, Acessórios e Forma Física */}
          <button
            type="button"
            onClick={() => (onOpenAvatarModal ? onOpenAvatarModal() : onNavigateTab('mascot'))}
            title={`Personalizar ${activeMascot.name} (${activeMascot.goalLabel})`}
            className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative flex items-center justify-center cursor-pointer transition-transform hover:scale-103 group"
          >
            <div
              className={`w-full h-full relative flex items-center justify-center transition-transform duration-300 ${getMascotFormScaleClass(
                activeMascotForm
              )}`}
            >
              <img
                src="/assets/mascots/pombo_hero_bust.png"
                alt={activeMascot.name}
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(25,8,66,0.38)] select-none"
              />
              <MascotAnatomicalOverlays
                equippedHat={profile.equippedHat}
                equippedGlasses={profile.equippedGlasses}
                equippedMask={profile.equippedMask}
                equippedHeadband={profile.equippedHeadband || 'headband_classic'}
                equippedOutfit={profile.equippedOutfit || 'outfit_classic'}
                equippedSpecial={profile.equippedSpecial}
                mascotForm={activeMascotForm}
              />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/95 text-[#5E2EE8] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap z-20 flex items-center gap-1 group-hover:bg-[#7650C9] group-hover:text-white transition-colors">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{activeMascot.name}</span>
            </span>
          </button>

          {/* Lado Direito: Saudação, Foto do Usuário e Sequência */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight truncate">
                Olá, {profile.displayName || 'Atleta'}!
              </h1>
              {onOpenAvatarModal && (
                <button
                  type="button"
                  onClick={onOpenAvatarModal}
                  title="Alterar foto do perfil ou mascote"
                  className="shrink-0 rounded-full ring-2 ring-white/40 p-0.5 cursor-pointer hover:scale-105 transition-transform hidden sm:block"
                >
                  <AvatarHeadDisplay profile={profile} sizeClassName="w-9 h-9" />
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-purple-100 font-normal mt-1 leading-relaxed">
              Sua jornada fitness mais forte a cada dia!
            </p>

            {/* Sequência Real de Dias e Nível */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('progress', 'calendario')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#341170]/80 backdrop-blur-xs text-white text-[11px] sm:text-xs font-semibold shadow-inner border border-white/10 cursor-pointer hover:bg-[#341170] transition-colors"
              >
                <span className="text-xs sm:text-sm">🔥</span>
                <span>
                  {realStreakDays} {realStreakDays === 1 ? 'dia de sequência' : 'dias de sequência'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('mascot')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-semibold cursor-pointer hover:bg-white/25 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Nível {levelInfo.level} · {activeMascot.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SESSÃO ATIVA EM ANDAMENTO (SE HOUVER) */}
      {activeSession && (
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#5520D8] to-[#4514BC] text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-200 block">
                Sessão em Andamento
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {activeSession.workoutName}
              </h3>
              <p className="text-xs text-purple-100/90 font-normal mt-0.5">
                {activeSession.exercises.length} exercícios · Cronômetro ativo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResumeActiveSession}
            className="px-4 py-2.5 rounded-xl bg-white text-[#5520D8] text-xs font-bold uppercase tracking-wider hover:bg-purple-50 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-[#5520D8]" />
            <span>Retomar Treino</span>
          </button>
        </div>
      )}

      {/* 2. CARTÃO TREINO DE HOJE (VER DETALHES + INICIAR TREINO) */}
      <div className="bg-white rounded-[26px] p-5 sm:p-6 shadow-xs border border-purple-100/80 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5E2EE8]" />
            <h2 className="text-base sm:text-lg font-bold text-[#1E1638]">
              Treino de Hoje
            </h2>
          </div>

          {todaysWorkout && (
            <button
              type="button"
              onClick={() => {
                if (onInspectWorkoutPlan) {
                  onInspectWorkoutPlan(todaysWorkout);
                } else {
                  onNavigateTab('workouts');
                }
              }}
              className="bg-[#F0EBFE] hover:bg-[#E5DCFD] text-[#5E2EE8] text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver Detalhes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {todaysWorkout ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div
              onClick={() => onNavigateTab('workouts')}
              className="flex items-center gap-3.5 min-w-0 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F0EBFE] flex items-center justify-center text-[#5E2EE8] shrink-0">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#1E1638] text-base sm:text-lg leading-snug">
                  {todaysWorkout.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                  {todaysWorkout.estimatedDurationMin} min · {todaysWorkout.exercises.length} exercícios planejados
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStartWorkout(todaysWorkout)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Treino</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 py-2">
            <div>
              <h3 className="font-bold text-[#1E1638] text-sm sm:text-base">
                Dia de Descanso ou Treino Livre
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Nenhum treino programado para hoje. Crie ou escolha uma ficha para iniciar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('workouts')}
              className="px-4 py-2.5 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold hover:bg-[#4E21D0] cursor-pointer"
            >
              Ver Fichas
            </button>
          </div>
        )}
      </div>

      {/* 3. QUATRO INDICADORES CLICÁVEIS COM DADOS 100% REAIS (SEM VALORES FICTÍCIOS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('workouts')}
          className="bg-white rounded-[22px] p-4 shadow-xs border border-purple-100/80 hover:border-[#5E2EE8] transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <Dumbbell className="w-5 h-5 text-[#5E2EE8] mb-1" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E1638] font-mono-tabular leading-none my-1">
            {totalWorkoutsCount}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Fichas Ativas
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('progress', 'treinos')}
          className="bg-white rounded-[22px] p-4 shadow-xs border border-purple-100/80 hover:border-[#10B981] transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5 text-[#10B981] mb-1" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E1638] font-mono-tabular leading-none my-1">
            {weeklyDoneCount}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Concluídos (7d)
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('health')}
          className="bg-white rounded-[22px] p-4 shadow-xs border border-purple-100/80 hover:border-[#F97316] transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <Flame className="w-5 h-5 text-[#F97316] mb-1" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E1638] font-mono-tabular leading-none my-1">
            {weeklyTotalActiveCalories}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Kcal Ativas (7d)
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('progress', 'geral')}
          className="bg-white rounded-[22px] p-4 shadow-xs border border-purple-100/80 hover:border-[#8B5CF6] transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <TrendingUp className="w-5 h-5 text-[#8B5CF6] mb-1" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E1638] font-mono-tabular leading-none my-1">
            {consistencyRate}%
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Consistência
          </span>
        </button>
      </div>

      {/* 4. PAINEL DE SAÚDE DO CELULAR E ATIVIDADE FÍSICA DE HOJE (DADOS REAIS E ORIGEM CLARA) */}
      <div className="bg-white rounded-[26px] p-5 sm:p-6 shadow-xs border border-purple-100/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1E1638]">
                  Atividade Diária & Saúde do Celular
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                    healthConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {healthConnected ? `Conectado: ${healthProviderLabel}` : 'Não conectado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                {healthConnected
                  ? 'Exibindo métricas reais sincronizadas ou registradas manualmente hoje.'
                  : 'Conecte ao Apple Health ou Health Connect para importar passos, calorias e distância reais.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('health')}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-[#F0EBFE] hover:bg-[#E4DAFD] text-[#5E2EE8] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>{healthConnected ? 'Gerenciar Saúde' : 'Conectar Saúde do Celular'}</span>
          </button>
        </div>

        {/* 4 Real Daily Activity Metrics with explicit Data Origin Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Passos de Hoje */}
          <div className="rounded-2xl p-4 bg-[#FAF8FF] border border-purple-100/90 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1E1638] flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#5E2EE8]" />
                <span>Passos de Hoje</span>
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  hasStepsData
                    ? todayHabit?.healthSource === 'health_integration'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-purple-100 text-[#5E2EE8]'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {hasStepsData
                  ? todayHabit?.healthSource === 'health_integration'
                    ? healthProviderLabel.split(' ')[0]
                    : 'Manual'
                  : 'Não disponível'}
              </span>
            </div>
            <div>
              {hasStepsData ? (
                <strong className="text-xl font-bold tracking-tight text-[#1E1638] font-mono-tabular block">
                  {(todayHabit?.steps || 0).toLocaleString('pt-BR')} passos
                </strong>
              ) : (
                <span className="text-sm font-semibold text-slate-400 block">
                  Não disponível
                </span>
              )}
              <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                {hasStepsData
                  ? 'Contagem verificada de hoje'
                  : 'Conecte a Saúde do celular para ler passos'}
              </span>
            </div>
          </div>

          {/* Calorias Ativas de Hoje */}
          <div className="rounded-2xl p-4 bg-[#FAF8FF] border border-purple-100/90 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1E1638] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Calorias Ativas (Hoje)</span>
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  todayHabit?.activeCaloriesKcal
                    ? 'bg-emerald-50 text-emerald-700'
                    : todayWorkoutCalories > 0
                    ? 'bg-purple-100 text-[#5E2EE8]'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {todayHabit?.activeCaloriesKcal
                  ? healthProviderLabel.split(' ')[0]
                  : todayWorkoutCalories > 0
                  ? 'Treino PomboFit'
                  : 'Sem atividade hoje'}
              </span>
            </div>
            <div>
              <strong className="text-xl font-bold tracking-tight text-[#1E1638] font-mono-tabular block">
                {todayActiveCalories} kcal
              </strong>
              <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                {todayActiveCalories > 0
                  ? 'Energia gasta em atividades registradas'
                  : '0 kcal — Registre um treino ou sincronize'}
              </span>
            </div>
          </div>

          {/* Distância Percorrida */}
          <div className="rounded-2xl p-4 bg-[#FAF8FF] border border-purple-100/90 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1E1638] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Distância Hoje</span>
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  hasDistanceData
                    ? todayHabit?.healthSource === 'health_integration'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-purple-100 text-[#5E2EE8]'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {hasDistanceData
                  ? todayHabit?.healthSource === 'health_integration'
                    ? healthProviderLabel.split(' ')[0]
                    : 'Manual'
                  : 'Não disponível'}
              </span>
            </div>
            <div>
              {hasDistanceData ? (
                <strong className="text-xl font-bold tracking-tight text-[#1E1638] font-mono-tabular block">
                  {todayHabit?.distanceKm} km
                </strong>
              ) : (
                <span className="text-sm font-semibold text-slate-400 block">
                  Não disponível
                </span>
              )}
              <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                {hasDistanceData
                  ? 'Caminhada / corrida registrada hoje'
                  : 'Requer leitura de distância autorizada'}
              </span>
            </div>
          </div>

          {/* Tempo de Atividade & Frequência Cardíaca */}
          <div className="rounded-2xl p-4 bg-[#FAF8FF] border border-purple-100/90 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1E1638] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#5E2EE8]" />
                <span>Tempo em Atividade</span>
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                  todayActiveMinutes > 0
                    ? 'bg-purple-100 text-[#5E2EE8]'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {todayActiveMinutes > 0 ? 'Registrado' : '0 min hoje'}
              </span>
            </div>
            <div>
              <strong className="text-xl font-bold tracking-tight text-[#1E1638] font-mono-tabular block">
                {todayActiveMinutes} min
              </strong>
              <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                {hasHeartRateData
                  ? `FC média: ${todayHabit?.heartRateBpm} bpm`
                  : todayActiveMinutes > 0
                  ? `${todaySessions.length} sessão(ões) hoje`
                  : 'Nenhum minuto de exercício hoje'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. EVOLUÇÃO MUSCULAR REAL, META SEMANAL E RESUMO NUTRICIONAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Frequência Semanal & Meta */}
        <button
          type="button"
          onClick={() => onNavigateTab('progress', 'geral')}
          className="bg-white rounded-[24px] p-5 shadow-xs border border-purple-100/80 hover:border-[#5E2EE8] transition-all text-left cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1E1638]">
                  Frequência Semanal
                </h4>
                <span className="text-[11px] text-slate-500 font-normal">
                  Meta: {weeklyGoalDays} dias/semana
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5E2EE8]" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                {weeklyDoneCount} de {weeklyGoalDays} treinos concluídos
              </span>
              <strong className="font-mono-tabular font-bold text-[#5E2EE8]">{consistencyRate}%</strong>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${consistencyRate}%` }}
                className="h-full bg-gradient-to-r from-[#5E2EE8] to-[#8E52F4] transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-snug">
              {weeklyDoneCount === 0
                ? 'Registre sua primeira atividade da semana para iniciar o progresso.'
                : weeklyDoneCount >= weeklyGoalDays
                ? 'Meta semanal atingida! Excelente consistência.'
                : `Faltam ${Math.max(0, weeklyGoalDays - weeklyDoneCount)} treino(s) para bater sua meta.`}
            </p>
          </div>
        </button>

        {/* Evolução Muscular Real */}
        <button
          type="button"
          onClick={() => onNavigateTab('progress', 'geral')}
          className="bg-white rounded-[24px] p-5 shadow-xs border border-purple-100/80 hover:border-[#5E2EE8] transition-all text-left cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1E1638]">
                  Evolução Muscular
                </h4>
                <span className="text-[11px] text-slate-500 font-normal">
                  Séries reais concluídas
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5E2EE8]" />
          </div>

          {realMuscleEvolution.length > 0 ? (
            <div className="space-y-1.5">
              {realMuscleEvolution.map(([group, setsCount]) => (
                <div key={group} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1E1638] truncate">{group}</span>
                  <span className="font-mono-tabular font-bold text-[#5E2EE8]">
                    {setsCount} {setsCount === 1 ? 'série' : 'séries'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF8FF] border border-purple-100 rounded-xl p-3 text-xs text-slate-500 font-normal">
              Nenhum treino concluído ainda. Conclua séries durante o treino para visualizar os músculos trabalhados.
            </div>
          )}
        </button>

        {/* Resumo Nutricional & Hidratação */}
        <button
          type="button"
          onClick={() => onNavigateTab('progress', 'nutricao')}
          className="bg-white rounded-[24px] p-5 shadow-xs border border-purple-100/80 hover:border-[#5E2EE8] transition-all text-left cursor-pointer flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1E1638]">
                  Metas de Nutrição & Água
                </h4>
                <span className="text-[11px] text-slate-500 font-normal">
                  Registros manuais de hoje
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5E2EE8]" />
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div className="bg-[#FAF8FF] rounded-xl p-2.5 border border-purple-50 min-w-0">
              <span className="text-[10px] text-slate-500 font-medium block truncate">Calorias</span>
              <strong className="text-xs font-bold text-[#1E1638] font-mono-tabular block truncate mt-0.5">
                {Math.round(todayNutrition.calories)}/{todayNutrition.caloriesGoal}
              </strong>
            </div>
            <div className="bg-[#FAF8FF] rounded-xl p-2.5 border border-purple-50 min-w-0">
              <span className="text-[10px] text-slate-500 font-medium block truncate">Proteínas</span>
              <strong className="text-xs font-bold text-emerald-600 font-mono-tabular block truncate mt-0.5">
                {Math.round(todayNutrition.proteinG)}g/{todayNutrition.proteinGoalG}g
              </strong>
            </div>
            <div className="bg-[#FAF8FF] rounded-xl p-2.5 border border-purple-50 min-w-0">
              <span className="text-[10px] text-slate-500 font-medium block truncate">Água</span>
              <strong className="text-xs font-bold text-[#5E2EE8] font-mono-tabular block truncate mt-0.5">
                {todayNutrition.waterMl}ml
              </strong>
            </div>
          </div>
        </button>
      </div>

      {/* 6. ATALHOS DE IA & RECONHECIMENTO VISUAL (SCANNER DE APARELHOS + POMBO IA) */}
      {(onOpenScanner || onOpenPomboAI) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="bg-white border border-[#E5DCFD] hover:border-[#5E2EE8] rounded-[22px] p-4 flex items-center justify-between gap-3 text-left transition-all shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E2EE8] block">
                    Visão Computacional
                  </span>
                  <h4 className="text-sm font-bold text-[#1E1638] truncate">
                    Scanner de Aparelhos
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    Fotografe máquinas da academia para ver uso e músculos
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5E2EE8] shrink-0" />
            </button>
          )}

          {onOpenPomboAI && (
            <button
              type="button"
              onClick={onOpenPomboAI}
              className="bg-gradient-to-r from-[#F6F3FF] to-[#EDE5FF] border border-[#DDD0FC] hover:border-[#5E2EE8] rounded-[22px] p-4 flex items-center justify-between gap-3 text-left transition-all shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white border border-purple-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                  <img
                    src="/assets/mascots/pombo_head.jpg"
                    alt="Pombo IA"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E2EE8] block">
                    Treinador Inteligente
                  </span>
                  <h4 className="text-sm font-bold text-[#1E1638] truncate">
                    Pombo IA — Assistente
                  </h4>
                  <p className="text-xs text-slate-600 truncate">
                    Analise seu equilíbrio muscular, fichas e evolução
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5E2EE8] shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* 7. CARTÃO ROTINA FLEXÍVEL */}
      <div
        onClick={onOpenFlexibleRoutine}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onOpenFlexibleRoutine();
          }
        }}
        className="bg-[#F1EBFE] border border-[#E4DAFD] rounded-[22px] p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#EBE2FD] transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#DFD2FC] flex items-center justify-center text-[#5E2EE8] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="font-bold text-sm sm:text-base text-[#44189E] leading-snug">
              Rotina Flexível
            </h4>
            <p className="text-xs text-[#5E5177] mt-0.5 leading-snug">
              Treinou mais tarde? Sem problemas! Ajuste sua rotina quando precisar.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#5E2EE8] shrink-0" />
      </div>

      {/* 8. SEÇÃO SEUS PRÓXIMOS TREINOS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#5E2EE8]" />
            <h3 className="font-bold text-base sm:text-lg text-[#1E1638]">
              Seus Próximos Treinos
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('workouts')}
            className="text-xs sm:text-sm font-bold text-[#5E2EE8] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Ver Todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingWorkouts.length === 0 ? (
          <div className="bg-white rounded-[22px] p-6 text-center text-xs text-slate-500 border border-purple-50">
            Nenhum próximo treino agendado. Crie ou personalize suas fichas na aba Treinos!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingWorkouts.slice(0, 3).map((item, idx) => (
              <div
                key={`${item.workout.id}-${idx}`}
                onClick={() => onNavigateTab('workouts')}
                className="bg-white rounded-[22px] p-4 shadow-xs border border-purple-100/80 flex items-center gap-3.5 justify-between hover:border-purple-300 transition-colors cursor-pointer"
              >
                <div className="w-14 h-16 rounded-2xl bg-[#5E2EE8] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <span className="text-[11px] font-medium text-purple-200 uppercase leading-none">
                    {item.dayShort}
                  </span>
                  <span className="text-xl font-bold font-mono-tabular leading-none my-1">
                    {item.dateNum}
                  </span>
                  <span className="text-[11px] font-medium text-purple-200 leading-none">
                    {item.monthShort}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm sm:text-[15px] text-[#1E1638] truncate">
                    {item.workout.name}
                  </h4>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {item.workout.estimatedDurationMin} min · {item.workout.exercises.length} exerc.
                    </span>
                  </div>
                </div>

                <div className="bg-[#F0EBFE] text-[#5E2EE8] text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3" />
                  <span>Programado</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. ÚLTIMOS TREINOS REALIZADOS (HISTÓRICO REAL COM ORIGEM DO DADO) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#5E2EE8]" />
            <h3 className="font-bold text-base sm:text-lg text-[#1E1638]">
              Últimos Treinos Realizados
            </h3>
          </div>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('progress', 'treinos')}
              className="text-xs font-bold text-[#5E2EE8] hover:underline cursor-pointer"
            >
              Histórico Completo ({sessions.length})
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-[22px] p-5 border border-purple-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#1E1638]">
                Nenhuma atividade registrada ainda
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Registre sua primeira atividade ou conecte o aplicativo à Saúde do celular para acompanhar sua evolução real.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {todaysWorkout && (
                <button
                  type="button"
                  onClick={() => onStartWorkout(todaysWorkout)}
                  className="px-4 py-2 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold hover:bg-[#4E21D0] cursor-pointer"
                >
                  Iniciar 1º Treino
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateTab('health')}
                className="px-3.5 py-2 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] text-xs font-bold hover:bg-[#E4DAFD] cursor-pointer"
              >
                Saúde do Celular
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sessions.slice(0, 4).map((sess) => {
              const isImported = sess.dataSource === 'health_integration';
              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => onNavigateTab('progress', 'treinos')}
                  className="bg-white rounded-[20px] p-4 border border-purple-100/80 hover:border-[#5E2EE8] transition-colors text-left flex items-center justify-between gap-3 shadow-2xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#5E2EE8]">
                        {new Date(sess.dateISO).toLocaleDateString('pt-BR')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isImported
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-purple-50 text-[#5E2EE8]'
                        }`}
                      >
                        {isImported
                          ? sess.healthProvider === 'apple_health'
                            ? 'Apple Health'
                            : sess.healthProvider === 'health_connect'
                            ? 'Health Connect'
                            : 'Saúde do Celular'
                          : 'Registrado no PomboFit'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1E1638] truncate mt-1">
                      {sess.workoutName}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono-tabular block mt-0.5">
                      {Math.max(1, Math.round((sess.durationSeconds || 0) / 60))} min ·{' '}
                      {sess.setsCompleted} séries · {sess.totalVolumeKg} kg
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#5E2EE8] shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 10. ATALHOS RÁPIDOS */}
      <div className="space-y-2.5 pt-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Acesso Rápido às Funções
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { id: 'workouts', label: 'Minhas Fichas', sub: `${workouts.length} fichas`, icon: Layers, tab: 'workouts' },
            { id: 'exercises', label: 'Biblioteca 3D', sub: '127 exercícios', icon: BookOpen, tab: 'exercises' },
            { id: 'health', label: 'Saúde Celular', sub: healthConnected ? 'Conectado' : 'Conectar', icon: HeartPulse, tab: 'health' },
            { id: 'history', label: 'Histórico', sub: `${sessions.length} sessões`, icon: History, tab: 'progress', subtab: 'treinos' },
            { id: 'measurements', label: 'Medidas', sub: 'Evolução', icon: Ruler, tab: 'progress', subtab: 'corporal' },
            { id: 'habits', label: 'Alimentação', sub: 'Diário & Água', icon: Utensils, tab: 'progress', subtab: 'nutricao' },
          ].map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onNavigateTab(sc.tab as MainTab, sc.subtab)}
                className="bg-white border border-purple-100/80 rounded-2xl p-3.5 text-left hover:border-[#5E2EE8] transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors truncate">
                  {sc.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {sc.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
