/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut, deleteUser, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  ExerciseHistoryLog,
  BodyMeasurement,
  ProgressPhoto,
  DailyHabitLog,
  CalendarEntry,
  ActiveSessionState,
  LoggedSetEntry,
  MainTab,
} from './types';
import { EXERCISES_CATALOG, getExerciseById } from './data/exercisesCatalog';
import {
  generatePersonalizedWorkouts,
  calculateLevelFromXp,
  goalToMascotForm,
  MASCOT_ACCESSORIES,
  MascotAccessoryItem,
} from './data/gamificationAndMascot';
import { LevelUpCelebrationModal } from './components/LevelUpCelebrationModal';
import { AuthScreen, OnboardingWizard } from './components/AuthAndOnboarding';
import { HomeDashboard } from './components/HomeDashboard';
import {
  WorkoutsSection,
  ActiveWorkoutExecutionOverlay,
} from './components/WorkoutsAndExecution';
import {
  ExerciseLibraryBrowser,
  ExerciseDetailModal,
} from './components/ExerciseLibraryAndDetailModal';
import { ProgressAndHistorySection } from './components/ProgressAndHistorySection';
import {
  MascotSection,
  ProfileSettingsSection,
} from './components/MascotAndProfileSections';
import {
  AvatarHeadDisplay,
  AvatarCustomizerModal,
} from './components/AvatarCustomizerModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { FlexibleRoutineModal } from './components/FlexibleRoutineModal';
import { EquipmentScannerModal } from './components/EquipmentScannerModal';
import { PomboAIAssistantModal } from './components/PomboAIAssistantModal';
import {
  OfflineConnectivityBanner,
  PWAInstallButton,
} from './components/PWAInstallBar';
import { HealthIntegrationSection } from './components/HealthIntegrationSection';
import {
  Camera,
  Dumbbell,
  HeartPulse,
  Home,
  Menu,
  Play,
  Plus,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import { ExerciseItem } from './types';
import { AppLoadingScreen } from './components/AppLoadingScreen';
import { QuickActionSheet } from './components/QuickActionSheet';
import { FreeWorkoutPrepModal } from './components/FreeWorkoutPrepModal';
import { CustomExerciseModal } from './components/CustomExerciseModal';
import {
  syncExistingWebPushSubscription,
  syncServerWorkoutSessionPush,
} from './utils/restAlerts';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Dynamic Loading & Initialization Stages (0 to 5)
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState<boolean>(false);

  // Real-time Firestore state for authenticated user
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseHistoryLog[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [habits, setHabits] = useState<DailyHabitLog[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);

  // Navigation & Active Workout Execution State
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null);
  const [isExecutionOverlayOpen, setIsExecutionOverlayOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFlexibleRoutineOpen, setIsFlexibleRoutineOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPomboAIOpen, setIsPomboAIOpen] = useState(false);
  const [scannedExerciseDetail, setScannedExerciseDetail] = useState<ExerciseItem | null>(null);
  const [progressSubTab, setProgressSubTab] = useState<
    'geral' | 'treinos' | 'calorias' | 'corporal' | 'fotos' | 'nutricao' | 'calendario'
  >('geral');
  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean;
    newLevel: number;
    unlockedItems: MascotAccessoryItem[];
  }>({
    isOpen: false,
    newLevel: 1,
    unlockedItems: [],
  });

  // Central Action Center (+) & Custom Workouts / Exercises State
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isFreeWorkoutPrepOpen, setIsFreeWorkoutPrepOpen] = useState(false);
  const [isCustomExerciseModalOpen, setIsCustomExerciseModalOpen] = useState(false);
  const [customExercises, setCustomExercises] = useState<ExerciseItem[]>(() => {
    try {
      const saved = localStorage.getItem('pombofit_custom_exercises');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Safety timer to prevent screen from hanging indefinitely if network/auth is slow
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoadingStep(5);
      setTimeout(() => {
        setIsLoadingComplete(true);
      }, 400);
    }, 2800);
    return () => clearTimeout(safetyTimer);
  }, []);

  // 1. Track Firebase Auth state & drive real initialization steps
  useEffect(() => {
    setLoadingStep(0); // "Preparando seu PomboFit..."

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setProfile(null);
        setWorkouts([]);
        setSessions([]);
        setExerciseLogs([]);
        setMeasurements([]);
        setPhotos([]);
        setHabits([]);
        setCalendarEntries([]);
        setActiveSession(null);
        setIsExecutionOverlayOpen(false);
        // Unauthenticated -> Advance smoothly to ready
        setLoadingStep(4);
        setTimeout(() => {
          setLoadingStep(5);
          setTimeout(() => setIsLoadingComplete(true), 350);
        }, 200);
        return;
      }

      setLoadingStep(1); // "Organizando seus treinos..."

      // Recover any interrupted workout session from localStorage for this user
      const savedSessionRaw = localStorage.getItem(`pombofit_active_session_${user.uid}`);
      if (savedSessionRaw) {
        try {
          const parsed = JSON.parse(savedSessionRaw) as ActiveSessionState;
          if (parsed && parsed.userId === user.uid) {
            setActiveSession(parsed);
          }
        } catch {
          // ignore malformed local recovery
        }
      }

      setProfileLoading(true);
      setLoadingStep(2); // "Sincronizando sua evolução..."

      const userDocPath = `users/${user.uid}`;
      const getLocalProfileOverrides = (uid: string): Partial<UserProfile> => {
        try {
          const raw = localStorage.getItem(`pombofit_profile_custom_${uid}`);
          return raw ? (JSON.parse(raw) as Partial<UserProfile>) : {};
        } catch {
          return {};
        }
      };

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const remoteData = snap.data() as UserProfile;
          const localOverrides = getLocalProfileOverrides(user.uid);
          setProfile({ ...remoteData, ...localOverrides });
        } else {
          setProfile(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, userDocPath);
      } finally {
        setProfileLoading(false);
        setLoadingStep(3); // "Carregando suas conquistas..."
        setTimeout(() => {
          setLoadingStep(4); // "Quase tudo pronto..."
          setTimeout(() => {
            setLoadingStep(5); // "Tudo pronto! Vamos treinar?"
            setTimeout(() => {
              setIsLoadingComplete(true);
            }, 450);
          }, 250);
        }, 250);
      }
    });
    return () => unsub();
  }, []);

  // 2. Attach real-time Firestore listeners once profile exists
  useEffect(() => {
    if (!firebaseUser || !profile?.onboardingCompleted) return;
    const uid = firebaseUser.uid;

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as UserProfile;
          let localOverrides: Partial<UserProfile> = {};
          try {
            const raw = localStorage.getItem(`pombofit_profile_custom_${uid}`);
            if (raw) localOverrides = JSON.parse(raw) as Partial<UserProfile>;
          } catch {
            // ignore
          }
          setProfile({ ...remoteData, ...localOverrides });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubWorkouts = onSnapshot(
      query(collection(db, 'users', uid, 'workouts'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorkoutPlan, 'id'>) }));
        setWorkouts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/workouts`)
    );

    const unsubSessions = onSnapshot(
      query(collection(db, 'users', uid, 'sessions'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<WorkoutSession, 'id'>) }))
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
        setSessions(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/sessions`)
    );

    const unsubExLogs = onSnapshot(
      query(collection(db, 'users', uid, 'exerciseLogs'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ExerciseHistoryLog, 'id'>) }))
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
        setExerciseLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/exerciseLogs`)
    );

    const unsubMeasurements = onSnapshot(
      query(collection(db, 'users', uid, 'measurements'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<BodyMeasurement, 'id'>) }))
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
        setMeasurements(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/measurements`)
    );

    const unsubPhotos = onSnapshot(
      query(collection(db, 'users', uid, 'photos'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ProgressPhoto, 'id'>) }))
          .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
        setPhotos(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/photos`)
    );

    const unsubHabits = onSnapshot(
      query(collection(db, 'users', uid, 'habits'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DailyHabitLog, 'id'>) }));
        setHabits(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/habits`)
    );

    const unsubCalendar = onSnapshot(
      query(collection(db, 'users', uid, 'calendar'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEntry, 'id'>) }))
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        setCalendarEntries(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/calendar`)
    );

    const unsubCustomExercises = onSnapshot(
      collection(db, 'users', uid, 'customExercises'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ExerciseItem, 'id'>),
          isCustom: true,
        }));
        setCustomExercises(list);
        try {
          localStorage.setItem('pombofit_custom_exercises', JSON.stringify(list));
        } catch {
          // ignore quota error
        }
      },
      (err) => console.warn('Custom exercises snapshot listener deferred:', err)
    );

    return () => {
      unsubProfile();
      unsubWorkouts();
      unsubSessions();
      unsubExLogs();
      unsubMeasurements();
      unsubPhotos();
      unsubHabits();
      unsubCalendar();
      unsubCustomExercises();
    };
  }, [firebaseUser, profile?.onboardingCompleted]);

  // Synchronize Dark Mode (.dark-theme) to html and body globally to prevent any white flashes or unstyled portals
  useEffect(() => {
    const savedPref = profile?.themePreference || (localStorage.getItem('pombofit_theme_pref') as 'light' | 'dark' | 'system' | null) || 'light';
    if (profile?.themePreference) {
      try {
        localStorage.setItem('pombofit_theme_pref', profile.themePreference);
      } catch {
        // ignore storage error
      }
    }

    const applyTheme = () => {
      const dark =
        savedPref === 'dark' ||
        (savedPref === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (dark) {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
      }
    };

    applyTheme();

    if (savedPref === 'system' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, [profile?.themePreference]);

  // Persist active workout session automatically to localStorage for crash/reload recovery
  const handleUpdateActiveSession = useCallback(
    (updated: ActiveSessionState | null) => {
      setActiveSession(updated);
      if (firebaseUser) {
        const key = `pombofit_active_session_${firebaseUser.uid}`;
        if (updated) {
          localStorage.setItem(key, JSON.stringify(updated));
        } else {
          localStorage.removeItem(key);
        }
      }
    },
    [firebaseUser]
  );

  // Sync existing granted Web Push subscription with authenticated userId & handle notification click routing
  useEffect(() => {
    if (!firebaseUser || !profile?.onboardingCompleted) return;
    if (profile.pushNotificationsEnabled !== false) {
      syncExistingWebPushSubscription(firebaseUser.uid, {
        pushNotificationsEnabled: true,
        notifRestFinished: profile.notifRestFinished !== false,
        notifWorkoutCompletion: profile.notifWorkoutCompletion !== false,
        notifWorkoutReminder: profile.notifWorkoutReminder !== false,
        workoutReminderTime: profile.workoutReminderTime || '18:00',
        notifWaterReminder: Boolean(profile.notifWaterReminder),
        waterReminderIntervalMin: profile.waterReminderIntervalMin || 120,
        customReminders: profile.customReminders || [],
      }).catch(() => {});
    }
  }, [
    firebaseUser,
    profile?.onboardingCompleted,
    profile?.pushNotificationsEnabled,
    profile?.notifRestFinished,
    profile?.notifWorkoutCompletion,
    profile?.notifWorkoutReminder,
    profile?.workoutReminderTime,
    profile?.notifWaterReminder,
    profile?.waterReminderIntervalMin,
    profile?.customReminders,
  ]);

  useEffect(() => {
    const applyDeepLink = (urlStr: string) => {
      try {
        const parsed = new URL(urlStr, window.location.origin);
        const tabParam = parsed.searchParams.get('tab');
        const resumeParam = parsed.searchParams.get('resume');
        if (tabParam === 'workouts') {
          setActiveTab('workouts');
          if (resumeParam === '1' && activeSession) {
            setIsExecutionOverlayOpen(true);
          }
        } else if (tabParam === 'nutrition') {
          setActiveTab('progress');
          setProgressSubTab('nutricao');
        } else if (tabParam === 'profile') {
          setActiveTab('profile');
        } else if (tabParam === 'home') {
          setActiveTab('home');
        }
      } catch {
        // ignore
      }
    };

    if (typeof window !== 'undefined' && window.location.search) {
      applyDeepLink(window.location.href);
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_CLICK_NAVIGATE' && event.data.url) {
          applyDeepLink(event.data.url);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, [activeSession]);

  // Onboarding completion handler
  const handleCompleteOnboarding = async (
    profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'>
  ) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const userPath = `users/${uid}`;
    const syncedProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
      ...profileData,
      userId: uid,
      mascotForm: goalToMascotForm(profileData.goal),
      avatarType: 'pombo_custom',
    };
    try {
      await setDoc(doc(db, 'users', uid), {
        ...syncedProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Generate personalized initial workout sheets respecting user's individual profile & split
      const recommendedPlans = generatePersonalizedWorkouts(
        syncedProfile as UserProfile,
        EXERCISES_CATALOG
      );
      for (let i = 0; i < recommendedPlans.length; i++) {
        const wId = `workout_init_${Date.now()}_${i + 1}`;
        await setDoc(doc(db, 'users', uid, 'workouts', wId), {
          ...recommendedPlans[i],
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // If user provided initial weight, save initial BodyMeasurement
      if (syncedProfile.weightKg && syncedProfile.weightKg >= 20) {
        const mId = `meas_init_${Date.now()}`;
        await setDoc(doc(db, 'users', uid, 'measurements', mId), {
          userId: uid,
          dateISO: new Date().toISOString().slice(0, 10),
          weightKg: syncedProfile.weightKg,
          ...(syncedProfile.heightCm ? { heightCm: syncedProfile.heightCm } : {}),
          notes: 'Medição inicial de cadastro',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setProfile(syncedProfile as UserProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }
  };

  // Profile partial update
  const handleUpdateProfile = async (partial: Partial<UserProfile>) => {
    if (!firebaseUser || !profile) return;
    const uid = firebaseUser.uid;
    const cleanPartial = Object.fromEntries(
      Object.entries(partial).filter(([, v]) => v !== undefined)
    ) as Partial<UserProfile>;

    // Automatically keep mascotForm synced with goal if goal was updated without explicit mascotForm
    if (cleanPartial.goal && !cleanPartial.mascotForm) {
      cleanPartial.mascotForm = goalToMascotForm(cleanPartial.goal);
    }

    // Save to localStorage for immediate offline/fallback resilience
    try {
      const storageKey = `pombofit_profile_custom_${uid}`;
      const existingRaw = localStorage.getItem(storageKey);
      const existing = existingRaw ? (JSON.parse(existingRaw) as Partial<UserProfile>) : {};
      localStorage.setItem(storageKey, JSON.stringify({ ...existing, ...cleanPartial }));
    } catch {
      // ignore storage quota errors
    }

    // Optimistically update local profile state immediately
    setProfile((prev) => (prev ? { ...prev, ...cleanPartial } : prev));

    try {
      await updateDoc(doc(db, 'users', uid), {
        userId: uid,
        ...cleanPartial,
        updatedAt: serverTimestamp(),
      });
    } catch {
      try {
        await setDoc(
          doc(db, 'users', uid),
          {
            userId: uid,
            displayName: profile.displayName || firebaseUser.displayName || 'Atleta PomboFit',
            ...cleanPartial,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore profile sync deferred to local storage:', err);
      }
    }
  };

  // Regenerate individualized workout sheets based on user's current profile & split
  const handleRegeneratePersonalizedWorkouts = async (
    overrideProfile?: Partial<UserProfile>
  ) => {
    if (!firebaseUser || !profile) return;
    const uid = firebaseUser.uid;
    const mergedProfile: UserProfile = {
      ...profile,
      ...overrideProfile,
      userId: uid,
      mascotForm: goalToMascotForm((overrideProfile?.goal || profile.goal) ?? 'gain_muscle'),
    };

    const generatedPlans = generatePersonalizedWorkouts(mergedProfile, [
      ...EXERCISES_CATALOG,
      ...customExercises,
    ]);

    try {
      for (const existing of workouts) {
        if (existing.id) {
          await deleteDoc(doc(db, 'users', uid, 'workouts', existing.id));
        }
      }
      for (let i = 0; i < generatedPlans.length; i++) {
        const wId = `workout_pers_${Date.now()}_${i + 1}`;
        await setDoc(doc(db, 'users', uid, 'workouts', wId), {
          ...generatedPlans[i],
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('Error regenerating personalized workouts:', err);
    }
  };

  const handleToggleFavoriteExercise = async (exerciseId: string) => {
    if (!profile) return;
    const currentFavs = profile.favoriteExerciseIds || [];
    const nextFavs = currentFavs.includes(exerciseId)
      ? currentFavs.filter((id) => id !== exerciseId)
      : [...currentFavs, exerciseId].slice(0, 100);
    await handleUpdateProfile({ favoriteExerciseIds: nextFavs });
  };

  const handleAwardXp = async (amount: number) => {
    if (!profile) return;
    const prevLevel = profile.level || calculateLevelFromXp(profile.xp || 100).level;
    const nextXp = (profile.xp || 100) + amount;
    const nextLevel = calculateLevelFromXp(nextXp).level;
    await handleUpdateProfile({
      xp: nextXp,
      level: nextLevel,
    });
    if (nextLevel > prevLevel) {
      setLevelUpData({
        isOpen: true,
        newLevel: nextLevel,
        unlockedItems: [],
      });
    }
  };

  // Start a live workout session
  const handleStartWorkout = (plan: WorkoutPlan) => {
    if (!firebaseUser) return;
    const newSession: ActiveSessionState = {
      sessionId: `sess_${Date.now()}`,
      userId: firebaseUser.uid,
      workoutId: plan.id,
      workoutName: plan.name,
      muscleGroups: plan.muscleGroups,
      startedAtMs: Date.now(),
      elapsedSecondsBeforePause: 0,
      isPaused: false,
      exercises: plan.exercises.map((slot) => {
        const prevLog = exerciseLogs.find((l) => l.exerciseId === slot.exerciseId);
        const defaultWeight = prevLog ? prevLog.maxWeightKg : 20;
        const parsedReps = parseInt(slot.reps, 10) || 10;
        return {
          slotId: slot.id,
          exerciseId: slot.exerciseId,
          notes: slot.notes,
          restSeconds: slot.restSeconds || 60,
          sets: Array.from({ length: Math.max(1, slot.sets) }, (_, idx) => ({
            setNumber: idx + 1,
            plannedReps: slot.reps,
            weightKg: defaultWeight,
            repsDone: parsedReps,
            completed: false,
          })),
        };
      }),
      restTimer: {
        active: false,
        remainingSeconds: 0,
        totalSeconds: 60,
      },
    };
    handleUpdateActiveSession(newSession);
    setIsExecutionOverlayOpen(true);
    syncServerWorkoutSessionPush({
      userId: firebaseUser.uid,
      action: 'start',
      workoutId: plan.id,
      workoutName: plan.name,
      estimatedDurationMin: plan.estimatedDurationMin || profile?.sessionDurationMin || 50,
    }).catch(() => {});
  };

  // Finish & persist completed workout session + per-exercise history + gamification XP/Achievements
  const handleFinishWorkoutSession = async (
    finalState: ActiveSessionState,
    durationSeconds: number,
    updateOriginalPlan?: boolean
  ) => {
    if (!firebaseUser || !profile) {
      return { totalVolumeKg: 0, setsCompleted: 0, exercisesCount: 0, prCount: 0 };
    }
    const uid = firebaseUser.uid;
    syncServerWorkoutSessionPush({
      userId: uid,
      action: 'complete',
      workoutId: finalState.workoutId,
      workoutName: finalState.workoutName,
    }).catch(() => {});
    const nowISO = new Date().toISOString();

    const loggedSets: LoggedSetEntry[] = [];
    let totalVolumeKg = 0;
    let prCount = 0;
    const recentExIds = new Set<string>(profile.recentExerciseIds || []);

    for (const exBlock of finalState.exercises) {
      const exCatalog = getExerciseById(exBlock.exerciseId);
      const exName = exCatalog?.name || exBlock.exerciseId;
      const completedInEx = exBlock.sets.filter((s) => s.completed);

      if (completedInEx.length > 0) {
        recentExIds.add(exBlock.exerciseId);
        let exMaxWeight = 0;
        let exMaxReps = 0;
        let exVolume = 0;

        for (const s of completedInEx) {
          const vol = s.weightKg * s.repsDone;
          exVolume += vol;
          totalVolumeKg += vol;
          if (s.weightKg > exMaxWeight) exMaxWeight = s.weightKg;
          if (s.repsDone > exMaxReps) exMaxReps = s.repsDone;

          loggedSets.push({
            exerciseId: exBlock.exerciseId,
            exerciseName: exName,
            setNumber: s.setNumber,
            plannedReps: s.plannedReps,
            weightKg: s.weightKg,
            repsDone: s.repsDone,
            completed: true,
            completedAtISO: s.completedAtISO || nowISO,
          });
        }

        const prevBestWeight = exerciseLogs
          .filter((l) => l.exerciseId === exBlock.exerciseId)
          .reduce((max, item) => Math.max(max, item.maxWeightKg), 0);

        const isPR = exMaxWeight > prevBestWeight && exMaxWeight > 0;
        if (isPR) prCount += 1;

        const logId = `log_${Date.now()}_${exBlock.exerciseId.slice(0, 20)}`;
        const setsSummary = completedInEx
          .map((s) => `${s.weightKg}kg×${s.repsDone}`)
          .join(', ')
          .slice(0, 290);

        await setDoc(doc(db, 'users', uid, 'exerciseLogs', logId), {
          userId: uid,
          exerciseId: exBlock.exerciseId,
          exerciseName: exName.slice(0, 120),
          muscleGroup: exCatalog?.muscleGroup || 'Peito',
          sessionId: finalState.sessionId,
          dateISO: nowISO,
          maxWeightKg: exMaxWeight,
          maxReps: exMaxReps,
          totalVolumeKg: Math.round(exVolume),
          setsCount: completedInEx.length,
          setsSummary,
          isPR,
          createdAt: serverTimestamp(),
        });
      }
    }

    // Save WorkoutSession document with explicit 'manual' data origin
    const calculatedCalories = Math.round(Math.max(1, durationSeconds / 60) * 6.2);
    await setDoc(doc(db, 'users', uid, 'sessions', finalState.sessionId), {
      userId: uid,
      workoutId: finalState.workoutId,
      workoutName: finalState.workoutName.slice(0, 100),
      muscleGroups: finalState.muscleGroups.slice(0, 12),
      dateISO: nowISO,
      durationSeconds: Math.max(1, durationSeconds),
      totalVolumeKg: Math.round(totalVolumeKg),
      setsCompleted: loggedSets.length,
      exercisesCount: finalState.exercises.length,
      prCount,
      activeCaloriesKcal: calculatedCalories,
      dataSource: 'manual',
      loggedSets: loggedSets.slice(0, 120),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Write completed workout to Apple Health / Health Connect if native bridge & permission exist
    try {
      const bridge = (window as any).PomboFitHealthBridge;
      if (
        profile.healthConnected &&
        (profile.healthPermissions || []).includes('workouts') &&
        bridge &&
        typeof bridge.writeWorkout === 'function'
      ) {
        await bridge.writeWorkout({
          title: finalState.workoutName,
          startISO: new Date(Date.now() - durationSeconds * 1000).toISOString(),
          endISO: nowISO,
          durationSeconds,
          caloriesBurned: calculatedCalories,
          totalVolumeKg: Math.round(totalVolumeKg),
        });
      }
    } catch {
      // ignore native bridge write error so user flow is never interrupted
    }

    // Update UserProfile XP, Level, Unlocked Achievements & Accessories
    const newTotalSessions = sessions.length + 1;
    const unlockedAch = new Set<string>(profile.unlockedAchievementIds || []);
    const unlockedAcc = new Set<string>(
      profile.unlockedAccessories || [
        'headband_classic',
        'outfit_classic',
        'shoes_classic',
        'pose_determined',
      ]
    );

    if (newTotalSessions >= 1) {
      unlockedAch.add('first_workout');
      unlockedAcc.add('headband_purple_pro');
    }
    if (newTotalSessions >= 5) {
      unlockedAch.add('five_workouts');
      unlockedAcc.add('shoes_speed_violet');
    }
    if (newTotalSessions >= 10) {
      unlockedAch.add('ten_workouts');
      unlockedAcc.add('pose_double_biceps');
    }
    if (prCount > 0) {
      unlockedAch.add('first_pr');
      unlockedAcc.add('acc_wristwraps_pro');
    }

    const prevLevel = profile.level || calculateLevelFromXp(profile.xp || 100).level;
    const nextXp = (profile.xp || 100) + 120 + prCount * 50;
    const nextLevel = calculateLevelFromXp(nextXp).level;

    // Detect newly unlocked accessories based on newLevel & achievements
    const newlyUnlockedItems: MascotAccessoryItem[] = [];
    for (const item of MASCOT_ACCESSORIES) {
      if (unlockedAcc.has(item.id)) continue;
      const isLevelUnlocked = item.requiredLevel <= nextLevel;
      const isAchUnlocked =
        item.requiredAchievementId && unlockedAch.has(item.requiredAchievementId);
      if (isLevelUnlocked || isAchUnlocked) {
        unlockedAcc.add(item.id);
        newlyUnlockedItems.push(item);
      }
    }

    await handleUpdateProfile({
      xp: nextXp,
      level: nextLevel,
      unlockedAchievementIds: Array.from(unlockedAch).slice(0, 50),
      unlockedAccessories: Array.from(unlockedAcc).slice(0, 100),
      recentExerciseIds: Array.from(recentExIds).slice(-30),
    });

    if (nextLevel > prevLevel || newlyUnlockedItems.length > 0) {
      setLevelUpData({
        isOpen: true,
        newLevel: nextLevel,
        unlockedItems: newlyUnlockedItems,
      });
    }

    // Optionally update original workout plan with executed sets, loads & newly added exercises
    if (updateOriginalPlan && finalState.workoutId) {
      const existingPlan = workouts.find((w) => w.id === finalState.workoutId);
      if (existingPlan) {
        const existingExerciseIds = new Set(existingPlan.exercises.map((s) => s.exerciseId));
        const updatedExercises = existingPlan.exercises.map((slot) => {
          const match = finalState.exercises.find((e) => e.exerciseId === slot.exerciseId);
          if (!match) return slot;
          const maxLoad = Math.max(...match.sets.map((s) => s.weightKg || 0), slot.targetWeightKg || 0);
          const firstDone = match.sets.find((s) => s.completed)?.repsDone;
          return {
            ...slot,
            sets: match.sets.length,
            reps: firstDone ? `${firstDone}` : slot.reps,
            targetWeightKg: maxLoad > 0 ? maxLoad : slot.targetWeightKg,
          };
        });

        // Append any newly added exercises during session
        for (const exBlock of finalState.exercises) {
          if (!existingExerciseIds.has(exBlock.exerciseId)) {
            const firstDone = exBlock.sets.find((s) => s.completed)?.repsDone;
            const maxLoad = Math.max(...exBlock.sets.map((s) => s.weightKg || 0), 0);
            updatedExercises.push({
              id: `slot_added_${Date.now()}_${updatedExercises.length}`,
              exerciseId: exBlock.exerciseId,
              sets: exBlock.sets.length,
              reps: firstDone ? `${firstDone}` : (exBlock.sets[0]?.plannedReps || '10-12'),
              restSeconds: exBlock.restSeconds || 60,
              notes: exBlock.notes || 'Adicionado durante o treino',
              ...(maxLoad > 0 ? { targetWeightKg: maxLoad } : {}),
            });
          }
        }

        await updateDoc(doc(db, 'users', uid, 'workouts', finalState.workoutId), {
          exercises: updatedExercises,
          updatedAt: serverTimestamp(),
        });
      }
    }

    handleUpdateActiveSession(null);

    return {
      totalVolumeKg: Math.round(totalVolumeKg),
      setsCompleted: loggedSets.length,
      exercisesCount: finalState.exercises.length,
      prCount,
    };
  };

  // CRUD Handlers for Workouts, Measurements, Photos, Habits, Calendar
  const handleSaveWorkoutPlan = async (
    planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = existingId || `workout_${Date.now()}`;
    try {
      if (existingId) {
        await updateDoc(doc(db, 'users', uid, 'workouts', existingId), {
          name: planData.name,
          description: planData.description || '',
          muscleGroups: planData.muscleGroups,
          scheduledDays: planData.scheduledDays,
          estimatedDurationMin: planData.estimatedDurationMin,
          exercises: planData.exercises,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', uid, 'workouts', id), {
          ...planData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/workouts/${id}`);
    }
  };

  const handleDeleteWorkoutPlan = async (workoutId: string) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/workouts/${workoutId}`);
    }
  };

  // Start a completely free, unstructured workout session (Opção 1 da Central de Ações)
  const handleStartFreeWorkout = (
    selectedExercises: ExerciseItem[],
    customTitle = 'Treino Livre',
    muscleGroups: string[] = []
  ) => {
    if (!firebaseUser) return;
    const derivedMuscles =
      muscleGroups.length > 0
        ? muscleGroups
        : Array.from(new Set(selectedExercises.map((e) => e.muscleGroup)));

    const newSession: ActiveSessionState = {
      sessionId: `sess_free_${Date.now()}`,
      userId: firebaseUser.uid,
      workoutId: `free_${Date.now()}`,
      workoutName: customTitle.trim() || 'Treino Livre',
      muscleGroups: (derivedMuscles.length > 0 ? derivedMuscles : ['Peito']) as any,
      startedAtMs: Date.now(),
      elapsedSecondsBeforePause: 0,
      isPaused: false,
      isFreeWorkout: true,
      exercises: selectedExercises.map((ex, slotIdx) => {
        const prevLog = exerciseLogs.find((l) => l.exerciseId === ex.id);
        const defaultWeight = prevLog ? prevLog.maxWeightKg : 20;
        return {
          slotId: `slot_free_${Date.now()}_${slotIdx}`,
          exerciseId: ex.id,
          notes: ex.importantNotes ? ex.importantNotes.slice(0, 80) : '',
          restSeconds: 60,
          sets: Array.from({ length: 3 }, (_, idx) => ({
            setNumber: idx + 1,
            plannedReps: '10-12',
            weightKg: defaultWeight,
            repsDone: 10,
            completed: false,
          })),
        };
      }),
      restTimer: {
        active: false,
        remainingSeconds: 0,
        totalSeconds: 60,
      },
    };
    handleUpdateActiveSession(newSession);
    setIsExecutionOverlayOpen(true);
    syncServerWorkoutSessionPush({
      userId: firebaseUser.uid,
      action: 'start',
      workoutId: newSession.workoutId,
      workoutName: newSession.workoutName,
      estimatedDurationMin: profile?.sessionDurationMin || 50,
    }).catch(() => {});
  };

  // Save a custom exercise created by the user (Opção 3 da Central de Ações)
  const handleSaveCustomExercise = async (newEx: ExerciseItem) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const customWithUser: ExerciseItem = {
      ...newEx,
      createdByUserId: uid,
      isCustom: true,
    };
    try {
      await setDoc(doc(db, 'users', uid, 'customExercises', newEx.id), {
        ...customWithUser,
        createdAt: serverTimestamp(),
      });
      setCustomExercises((prev) => [customWithUser, ...prev]);
    } catch (err) {
      console.warn('Failed saving custom exercise to Firestore, saved locally:', err);
      setCustomExercises((prev) => [customWithUser, ...prev]);
    }
  };

  // Save completed workout session as a brand new routine in user's workout plans
  const handleSaveAsNewWorkoutPlan = async (
    name: string,
    exercisesList: Array<{
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes: string;
    }>
  ) => {
    if (!firebaseUser || !profile) return;
    const derivedMuscles = Array.from(
      new Set(
        exercisesList
          .map((s) => getExerciseById(s.exerciseId)?.muscleGroup)
          .filter((m): m is any => !!m)
      )
    );
    await handleSaveWorkoutPlan({
      userId: firebaseUser.uid,
      name: name.trim() || 'Nova Ficha de Treino',
      description: 'Criada a partir de uma sessão de treino do PomboFit.',
      muscleGroups: derivedMuscles.length > 0 ? (derivedMuscles as any) : ['Peito'],
      scheduledDays: ['Seg', 'Qua', 'Sex'],
      estimatedDurationMin: 60,
      exercises: exercisesList.map((e, idx) => ({
        id: `slot_${Date.now()}_${idx}`,
        ...e,
      })),
    });
  };

  const handleSaveMeasurement = async (
    data: Omit<BodyMeasurement, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = existingId || `meas_${Date.now()}`;
    try {
      if (existingId) {
        await updateDoc(doc(db, 'users', uid, 'measurements', existingId), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', uid, 'measurements', id), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      const achSet = new Set(profile?.unlockedAchievementIds || []);
      achSet.add('body_tracker_init');
      await handleUpdateProfile({
        weightKg: data.weightKg,
        unlockedAchievementIds: Array.from(achSet),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/measurements/${id}`);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'measurements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/measurements/${id}`);
    }
  };

  const handleAddPhoto = async (data: Omit<ProgressPhoto, 'id' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = `photo_${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', uid, 'photos', id), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/photos/${id}`);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'photos', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/photos/${id}`);
    }
  };

  const handleSaveDailyHabit = async (
    data: Omit<DailyHabitLog, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const dateKey = data.dateKey;
    const exists = habits.some((h) => h.dateKey === dateKey);
    try {
      const payload: Record<string, any> = {
        userId: uid,
        dateKey: data.dateKey,
        waterMl: data.waterMl,
        waterGoalMl: data.waterGoalMl,
        sleepHours: data.sleepHours,
        recoveryScore: data.recoveryScore,
        meals: data.meals,
        notes: data.notes || '',
        updatedAt: serverTimestamp(),
      };
      if (typeof data.steps === 'number') payload.steps = data.steps;
      if (typeof data.activeCaloriesKcal === 'number') payload.activeCaloriesKcal = data.activeCaloriesKcal;
      if (typeof data.distanceKm === 'number') payload.distanceKm = data.distanceKm;
      if (typeof data.activeMinutes === 'number') payload.activeMinutes = data.activeMinutes;
      if (typeof data.heartRateBpm === 'number') payload.heartRateBpm = data.heartRateBpm;
      if (data.healthSource) payload.healthSource = data.healthSource;
      if (data.healthProvider) payload.healthProvider = data.healthProvider;

      if (exists) {
        await updateDoc(doc(db, 'users', uid, 'habits', dateKey), payload);
      } else {
        await setDoc(doc(db, 'users', uid, 'habits', dateKey), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      if (data.waterMl >= data.waterGoalMl && profile) {
        const achSet = new Set(profile.unlockedAchievementIds || []);
        if (!achSet.has('hydration_master')) {
          achSet.add('hydration_master');
          await handleUpdateProfile({ unlockedAchievementIds: Array.from(achSet) });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/habits/${dateKey}`);
    }
  };

  const handleImportHealthWorkoutSession = async (
    sessionData: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = `sess_health_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'users', uid, 'sessions', id), {
        ...sessionData,
        userId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/sessions/${id}`);
    }
  };

  const handleSaveCalendarEntry = async (
    data: Omit<CalendarEntry, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = existingId || `cal_${data.dateKey}`;
    const alreadyExists = calendarEntries.some((c) => c.id === id);
    try {
      if (alreadyExists) {
        await updateDoc(doc(db, 'users', uid, 'calendar', id), {
          dateKey: data.dateKey,
          workoutId: data.workoutId,
          workoutName: data.workoutName,
          entryType: data.entryType,
          notes: data.notes || '',
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', uid, 'calendar', id), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/calendar/${id}`);
    }
  };

  const handleDeleteCalendarEntry = async (id: string) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'calendar', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/calendar/${id}`);
    }
  };

  const handleLogRestDay = async (dateKey: string, reason: string) => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const id = `cal_${dateKey}`;
    try {
      await setDoc(doc(db, 'users', uid, 'calendar', id), {
        userId: uid,
        dateKey,
        entryType: 'rest',
        notes: reason || 'Descanso programado consciente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/calendar/${id}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(firebaseUser);
    } catch {
      await signOut(auth);
    }
  };

  // Loading state with Official Mascot & Dynamic Progress
  if (!isLoadingComplete || !authReady || profileLoading) {
    return <AppLoadingScreen step={loadingStep} isExiting={isLoadingComplete} />;
  }

  // Unauthenticated -> Show Splash + Auth Screen
  if (!firebaseUser) {
    return <AuthScreen />;
  }

  // Authenticated but onboarding not completed -> Show Smart Onboarding Wizard
  if (!profile || !profile.onboardingCompleted) {
    return (
      <OnboardingWizard
        uid={firebaseUser.uid}
        initialDisplayName={firebaseUser.displayName || 'Atleta PomboFit'}
        initialPhotoUrl={firebaseUser.photoURL || undefined}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  const weeklySessionsDone = sessions.filter(
    (s) => Date.now() - new Date(s.dateISO).getTime() <= 7 * 86400000
  ).length;

  const isDarkMode =
    profile.themePreference === 'dark' ||
    (profile.themePreference === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      className={`min-h-screen-safe w-full overflow-x-hidden flex flex-col pb-28 sm:pb-32 lg:pb-12 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#121019] text-purple-100 dark-theme'
          : 'bg-[#FAF8FF] text-[#1E1638]'
      }`}
    >
      <OfflineConnectivityBanner />

      {/* Clean 3-Zone Top Navigation Bar matching reference */}
      <header
        style={{
          paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        }}
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/60 px-3.5 sm:px-8 pb-2.5 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Identificação com foto circular da cabeça do Pombo e nome PomboFit */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              title="Personalizar Avatar (Foto pessoal ou Pombo)"
              className="relative transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 rounded-full ring-2 ring-purple-100 p-0.5"
            >
              <AvatarHeadDisplay profile={profile} sizeClassName="w-9 h-9 sm:w-11 sm:h-11" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="text-xl sm:text-2xl font-black text-[#1E1638] tracking-tight whitespace-nowrap cursor-pointer flex items-center"
            >
              <span className="text-[#5E2EE8]">P</span>ombo<span className="text-[#5E2EE8]">F</span>it
            </button>
          </div>

          {/* Zone 2: Clean navigation links on Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {(
              [
                { id: 'home', label: 'Início' },
                { id: 'workouts', label: 'Treinos' },
                { id: 'exercises', label: 'Exercícios' },
                { id: 'progress', label: 'Evolução' },
                { id: 'health', label: 'Saúde' },
                { id: 'profile', label: 'Perfil' },
              ] as const
            ).map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveTab(nav.id)}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 relative ${
                  activeTab === nav.id
                    ? 'text-[#5E2EE8] font-bold'
                    : 'hover:text-[#1E1638]'
                }`}
              >
                {nav.label}
                {activeTab === nav.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E2EE8] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Quick AI/Scanner Actions & Hamburger Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Action (+) Button on Desktop */}
            <button
              type="button"
              onClick={() => setIsQuickActionOpen(true)}
              title="Central de Ações Rápidas (Treino Livre, Nova Ficha, Criar Exercício)"
              className="hidden lg:flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl bg-gradient-to-r from-[#7650C9] to-[#5E2EE8] hover:from-[#6440B5] hover:to-[#4E21D0] text-white text-xs font-black shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ações</span>
            </button>
            {activeSession && (
              <button
                type="button"
                onClick={() => setIsExecutionOverlayOpen(true)}
                className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-[#5E2EE8] text-white text-xs font-extrabold hover:bg-[#4E21D0] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                <span className="hidden sm:inline">Retomar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              title="Scanner de Aparelhos"
              className="h-9 sm:h-10 px-2.5 rounded-xl bg-[#F6F3FF] text-[#5E2EE8] hover:bg-[#EBE3FF] transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPomboAIOpen(true)}
              title="Pombo IA — Assistente Inteligente"
              className="h-9 sm:h-10 px-2.5 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] hover:bg-[#E4DAFD] transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs font-extrabold shrink-0"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Pombo IA</span>
            </button>

            <PWAInstallButton />

            {/* Menu Hambúrguer Oficial (3 linhas roxas) */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Abrir menu"
              title="Menu de opções"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[#5E2EE8] hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <Menu className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container with Framer Motion Smooth Fade-In Transitions */}
      <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-8 py-4 sm:py-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <HomeDashboard
                profile={profile}
                workouts={workouts}
                sessions={sessions}
                habits={habits}
                activeSession={activeSession}
                onStartWorkout={handleStartWorkout}
                onResumeActiveSession={() => setIsExecutionOverlayOpen(true)}
                onNavigateTab={(tab, subtab) => {
                  setActiveTab(tab);
                  if (subtab) {
                    setProgressSubTab(subtab as any);
                  }
                }}
                onOpenFlexibleRoutine={() => setIsFlexibleRoutineOpen(true)}
                onInspectWorkoutPlan={() => setActiveTab('workouts')}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenPomboAI={() => setIsPomboAIOpen(true)}
                onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
              />
            )}

            {activeTab === 'workouts' && (
              <WorkoutsSection
                profile={profile}
                workouts={workouts}
                exerciseLogs={exerciseLogs}
                activeSession={activeSession}
                onStartWorkout={handleStartWorkout}
                onResumeSession={() => setIsExecutionOverlayOpen(true)}
                onDiscardActiveSession={() => {
                  if (firebaseUser) {
                    syncServerWorkoutSessionPush({
                      userId: firebaseUser.uid,
                      action: 'cancel',
                      workoutId: activeSession?.workoutId,
                      workoutName: activeSession?.workoutName,
                    }).catch(() => {});
                  }
                  handleUpdateActiveSession(null);
                }}
                onSaveWorkoutPlan={handleSaveWorkoutPlan}
                onDeleteWorkoutPlan={handleDeleteWorkoutPlan}
                onToggleFavoriteExercise={handleToggleFavoriteExercise}
              />
            )}

            {activeTab === 'exercises' && (
              <ExerciseLibraryBrowser
                favoriteIds={profile.favoriteExerciseIds || []}
                recentIds={profile.recentExerciseIds || []}
                exerciseLogs={exerciseLogs}
                onToggleFavorite={handleToggleFavoriteExercise}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressAndHistorySection
                profile={profile}
                workouts={workouts}
                sessions={sessions}
                exerciseLogs={exerciseLogs}
                measurements={measurements}
                photos={photos}
                habits={habits}
                calendarEntries={calendarEntries}
                initialSubTab={progressSubTab}
                onSaveMeasurement={handleSaveMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
                onAddPhoto={handleAddPhoto}
                onDeletePhoto={handleDeletePhoto}
                onSaveDailyHabit={handleSaveDailyHabit}
                onSaveCalendarEntry={handleSaveCalendarEntry}
                onDeleteCalendarEntry={handleDeleteCalendarEntry}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {activeTab === 'mascot' && (
              <MascotSection
                profile={profile}
                sessionsCount={sessions.length}
                weeklySessionsDone={weeklySessionsDone}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {activeTab === 'health' && (
              <HealthIntegrationSection
                profile={profile}
                habits={habits}
                sessions={sessions}
                onUpdateProfile={handleUpdateProfile}
                onSaveDailyHabit={handleSaveDailyHabit}
                onImportHealthWorkoutSession={handleImportHealthWorkoutSession}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSettingsSection
                profile={profile}
                userEmail={firebaseUser.email}
                workouts={workouts}
                sessions={sessions}
                measurements={measurements}
                onUpdateProfile={handleUpdateProfile}
                onRegenerateWorkouts={handleRegeneratePersonalizedWorkouts}
                onOpenHealthIntegration={() => setActiveTab('health')}
                onLogout={() => signOut(auth)}
                onDeleteAccount={handleDeleteAccount}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation Bar with Central Elevated Circular "+" Button */}
      <nav
        aria-label="Navegação Principal"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-100/60 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 relative">
          {/* Tab 1: Início */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer py-1 ${
              activeTab === 'home' ? 'text-[#5E2EE8]' : 'text-slate-400 hover:text-[#1E1638]'
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span
              className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                activeTab === 'home' ? 'font-black text-[#5E2EE8]' : 'font-semibold text-slate-500'
              }`}
            >
              Início
            </span>
            {activeTab === 'home' && (
              <span className="w-5 h-0.5 bg-[#5E2EE8] rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 2: Treinos */}
          <button
            type="button"
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer py-1 ${
              activeTab === 'workouts' ? 'text-[#5E2EE8]' : 'text-slate-400 hover:text-[#1E1638]'
            }`}
          >
            <Dumbbell className="w-5 h-5" strokeWidth={activeTab === 'workouts' ? 2.5 : 2} />
            <span
              className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                activeTab === 'workouts' ? 'font-black text-[#5E2EE8]' : 'font-semibold text-slate-500'
              }`}
            >
              Treinos
            </span>
            {activeTab === 'workouts' && (
              <span className="w-5 h-0.5 bg-[#5E2EE8] rounded-full mt-0.5" />
            )}
          </button>

          {/* CENTRAL ELEVATED CIRCULAR "+" ACTION BUTTON */}
          <div className="flex-1 flex items-center justify-center -mt-6 relative z-10">
            <button
              type="button"
              onClick={() => setIsQuickActionOpen(true)}
              aria-label="Abrir Central de Ações Rápidas (+)"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7650C9] via-[#5E2EE8] to-[#4D24C7] text-white flex items-center justify-center shadow-lg shadow-[#5E2EE8]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-white ring-2 ring-purple-200"
            >
              <Plus className="w-7 h-7 stroke-[3] text-white" />
            </button>
          </div>

          {/* Tab 3: Evolução */}
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer py-1 ${
              activeTab === 'progress' ? 'text-[#5E2EE8]' : 'text-slate-400 hover:text-[#1E1638]'
            }`}
          >
            <TrendingUp className="w-5 h-5" strokeWidth={activeTab === 'progress' ? 2.5 : 2} />
            <span
              className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                activeTab === 'progress' ? 'font-black text-[#5E2EE8]' : 'font-semibold text-slate-500'
              }`}
            >
              Evolução
            </span>
            {activeTab === 'progress' && (
              <span className="w-5 h-0.5 bg-[#5E2EE8] rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 4: Perfil */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer py-1 ${
              activeTab === 'profile' ? 'text-[#5E2EE8]' : 'text-slate-400 hover:text-[#1E1638]'
            }`}
          >
            <User className="w-5 h-5" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span
              className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                activeTab === 'profile' ? 'font-black text-[#5E2EE8]' : 'font-semibold text-slate-500'
              }`}
            >
              Perfil
            </span>
            {activeTab === 'profile' && (
              <span className="w-5 h-0.5 bg-[#5E2EE8] rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Slide-Over Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        userEmail={firebaseUser.email}
        onNavigateTab={(tab, subtab) => {
          setActiveTab(tab);
          if (subtab) setProgressSubTab(subtab as any);
          setIsDrawerOpen(false);
        }}
        onOpenAvatarModal={() => {
          setIsDrawerOpen(false);
          setIsAvatarModalOpen(true);
        }}
        onOpenFlexibleRoutine={() => {
          setIsDrawerOpen(false);
          setIsFlexibleRoutineOpen(true);
        }}
        onOpenScanner={() => {
          setIsDrawerOpen(false);
          setIsScannerOpen(true);
        }}
        onOpenPomboAI={() => {
          setIsDrawerOpen(false);
          setIsPomboAIOpen(true);
        }}
        onLogout={() => signOut(auth)}
      />

      {/* Flexible Routine Management Modal */}
      <FlexibleRoutineModal
        isOpen={isFlexibleRoutineOpen}
        onClose={() => setIsFlexibleRoutineOpen(false)}
        profile={profile}
        workouts={workouts}
        sessions={sessions}
        onUpdateProfile={handleUpdateProfile}
        onUpdateWorkoutPlan={handleSaveWorkoutPlan}
        onLogRestDay={handleLogRestDay}
      />

      {/* Equipment & Exercise Visual Scanner Modal */}
      <EquipmentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        favoriteIds={profile.favoriteExerciseIds || []}
        exerciseLogs={exerciseLogs}
        onToggleFavorite={handleToggleFavoriteExercise}
        onAddExerciseToWorkout={(exercise) => {
          setIsScannerOpen(false);
          setScannedExerciseDetail(exercise);
        }}
      />

      {/* Exercise Detail Modal from Scanner */}
      {scannedExerciseDetail && (
        <ExerciseDetailModal
          exercise={scannedExerciseDetail}
          isFavorite={(profile.favoriteExerciseIds || []).includes(scannedExerciseDetail.id)}
          exerciseLogs={exerciseLogs.filter((l) => l.exerciseId === scannedExerciseDetail.id)}
          onClose={() => setScannedExerciseDetail(null)}
          onToggleFavorite={() => handleToggleFavoriteExercise(scannedExerciseDetail.id)}
        />
      )}

      {/* Pombo IA — Intelligent Assistant Modal */}
      <PomboAIAssistantModal
        isOpen={isPomboAIOpen}
        onClose={() => setIsPomboAIOpen(false)}
        profile={profile}
        workouts={workouts}
        sessions={sessions}
        measurements={measurements}
        habits={habits}
      />

      {/* Avatar Customization Modal */}
      <AvatarCustomizerModal
        profile={profile}
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSaveAvatar={handleUpdateProfile}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpCelebrationModal
        isOpen={levelUpData.isOpen}
        newLevel={levelUpData.newLevel}
        unlockedItems={levelUpData.unlockedItems}
        onEquipNow={async (item) => {
          const updates: Partial<UserProfile> = {
            avatarType: 'pombo_custom',
          };
          switch (item.category) {
            case 'hat':
              updates.equippedHat = item.id;
              break;
            case 'glasses':
              updates.equippedGlasses = item.id;
              break;
            case 'mask':
              updates.equippedMask = item.id;
              break;
            case 'headband':
              updates.equippedHeadband = item.id;
              break;
            case 'outfit':
              updates.equippedOutfit = item.id;
              break;
            case 'special':
              updates.equippedSpecial = item.id;
              break;
          }
          await handleUpdateProfile(updates);
        }}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Live Workout Execution Full-Screen Overlay */}
      {activeSession && isExecutionOverlayOpen && (
        <ActiveWorkoutExecutionOverlay
          session={activeSession}
          profile={profile}
          exerciseLogs={exerciseLogs}
          onUpdateSession={handleUpdateActiveSession}
          onFinishSession={handleFinishWorkoutSession}
          onMinimizeSession={() => setIsExecutionOverlayOpen(false)}
          onCancelSession={() => {
            if (firebaseUser) {
              syncServerWorkoutSessionPush({
                userId: firebaseUser.uid,
                action: 'cancel',
                workoutId: activeSession.workoutId,
                workoutName: activeSession.workoutName,
              }).catch(() => {});
            }
            handleUpdateActiveSession(null);
            setIsExecutionOverlayOpen(false);
          }}
          onToggleFavoriteExercise={handleToggleFavoriteExercise}
          onAwardXp={handleAwardXp}
          onSaveAsNewWorkoutPlan={handleSaveAsNewWorkoutPlan}
        />
      )}

      {/* Central Action Center (+) Bottom Sheet Menu */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onStartFreeWorkout={() => {
          setIsQuickActionOpen(false);
          setIsFreeWorkoutPrepOpen(true);
        }}
        onCreateNewWorkoutPlan={() => {
          setIsQuickActionOpen(false);
          setActiveTab('workouts');
        }}
        onCreateCustomExercise={() => {
          setIsQuickActionOpen(false);
          setIsCustomExerciseModalOpen(true);
        }}
      />

      {/* Free Workout Preparation & Exercise Selector Modal (Opção 1) */}
      <FreeWorkoutPrepModal
        isOpen={isFreeWorkoutPrepOpen}
        onClose={() => setIsFreeWorkoutPrepOpen(false)}
        customExercises={customExercises}
        onStartExecution={(sessionExercises, workoutName, muscleGroups) => {
          if (!firebaseUser) return;
          const newSession: ActiveSessionState = {
            sessionId: `sess_free_${Date.now()}`,
            userId: firebaseUser.uid,
            workoutId: `free_${Date.now()}`,
            workoutName: workoutName.trim() || 'Treino Livre',
            muscleGroups,
            startedAtMs: Date.now(),
            elapsedSecondsBeforePause: 0,
            isPaused: false,
            isFreeWorkout: true,
            exercises: sessionExercises,
            restTimer: {
              active: false,
              remainingSeconds: 0,
              totalSeconds: 60,
            },
          };
          handleUpdateActiveSession(newSession);
          setIsFreeWorkoutPrepOpen(false);
          setIsExecutionOverlayOpen(true);
          syncServerWorkoutSessionPush({
            userId: firebaseUser.uid,
            action: 'start',
            workoutId: newSession.workoutId,
            workoutName: newSession.workoutName,
            estimatedDurationMin: profile?.sessionDurationMin || 50,
          }).catch(() => {});
        }}
      />

      {/* Custom Exercise Registration Modal (Opção 3) */}
      <CustomExerciseModal
        isOpen={isCustomExerciseModalOpen}
        onClose={() => setIsCustomExerciseModalOpen(false)}
        userId={firebaseUser?.uid || 'user_guest'}
        onSaveExercise={handleSaveCustomExercise}
      />
    </div>
  );
}
