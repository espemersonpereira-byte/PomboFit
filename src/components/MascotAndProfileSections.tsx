import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  FitnessGoal,
  ExperienceLevel,
  EquipmentCategory,
  WorkoutPlan,
  WorkoutSession,
  BodyMeasurement,
  AccessoryCategory,
  WorkoutSplitCategory,
  WorkoutSplitType,
  CustomPushReminder,
} from '../types';
import {
  getDevicePushCapabilities,
  subscribeUserToWebPush,
  unsubscribeUserFromWebPush,
  getServerPushStatus,
  syncServerPushPreferences,
  sendServerTestPush,
  testRestAlerts,
} from '../utils/restAlerts';
import { RewardsGallery } from './RewardsGallery';
import {
  MASCOT_DATA,
  MASCOT_ACCESSORIES,
  ACHIEVEMENTS_CATALOG,
  calculateLevelFromXp,
  goalToMascotForm,
  WORKOUT_SPLITS_CATALOG,
  MUSCLE_COMBO_OPTIONS,
  checkSplitCompatibility,
} from '../data/gamificationAndMascot';
import {
  AlertCircle,
  Award,
  Bell,
  Check,
  CheckCircle2,
  Download,
  HeartPulse,
  KeyRound,
  Layers,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Shirt,
  Smartphone,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { PWAInstallButton } from './PWAInstallBar';
import {
  AvatarHeadDisplay,
  AvatarCustomizerModal,
} from './AvatarCustomizerModal';
import {
  MascotAnatomicalOverlays,
  AccessoryThumbnail,
  getMascotFormScaleClass,
} from './MascotAccessoryArt';

interface MascotSectionProps {
  profile: UserProfile;
  sessionsCount: number;
  weeklySessionsDone: number;
  onUpdateProfile: (partial: Partial<UserProfile>) => Promise<void>;
}

export const MascotSection: React.FC<MascotSectionProps> = ({
  profile,
  sessionsCount,
  weeklySessionsDone,
  onUpdateProfile,
}) => {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerCategory, setCustomizerCategory] = useState<AccessoryCategory>('outfit');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'art'>('interactive');

  const activeMascotForm = profile.mascotForm || goalToMascotForm(profile.goal || 'gain_muscle');
  const activeMascot = MASCOT_DATA[activeMascotForm] || MASCOT_DATA.pombo_grande;
  const levelInfo = calculateLevelFromXp(profile.xp || 100);
  const unlockedAch = profile.unlockedAchievementIds || [];
  const outfitItems = MASCOT_ACCESSORIES.filter((a) => a.category === 'outfit');
  const currentOutfit = profile.equippedOutfit || 'outfit_classic';

  const handleGoalTransformationChange = async (newGoal: FitnessGoal) => {
    const newForm = goalToMascotForm(newGoal);
    await onUpdateProfile({
      goal: newGoal,
      mascotForm: newForm,
      avatarType: 'pombo_custom',
    });
  };

  const handleQuickSkinChange = async (outfitId: string) => {
    setViewMode('interactive');
    await onUpdateProfile({
      avatarType: 'pombo_custom',
      equippedOutfit: outfitId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Featured Mascot Transformation Hero Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Interactive vs Official Art Switcher */}
          <div className="flex items-center gap-1.5 bg-[#FAF9FC] p-1 rounded-2xl border border-slate-200 mb-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'interactive'
                  ? 'bg-[#7650C9] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#24212B]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Pombo 3D (Com Skins)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('art')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'art'
                  ? 'bg-[#7650C9] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#24212B]'
              }`}
            >
              <span>Arte {activeMascot.name}</span>
            </button>
          </div>

          <div
            onClick={() => {
              setCustomizerCategory('outfit');
              setShowCustomizer(true);
            }}
            title="Clique para abrir o Provador e trocar skins/acessórios"
            className="w-full max-w-xs aspect-[380/320] rounded-3xl bg-gradient-to-b from-[#F2EDFF] to-white border-2 border-[#E4D9FF] p-4 flex items-center justify-center relative overflow-hidden cursor-pointer group hover:border-[#7650C9] transition-all"
          >
            {viewMode === 'interactive' ? (
              <div
                className={`w-full h-full relative flex items-center justify-center transition-transform duration-300 ${getMascotFormScaleClass(
                  activeMascotForm
                )}`}
              >
                <img
                  src="/assets/mascots/pombo_hero_bust.png"
                  alt={activeMascot.name}
                  className="w-full h-full object-contain select-none filter drop-shadow-md"
                />
                <MascotAnatomicalOverlays
                  equippedHat={profile.equippedHat}
                  equippedGlasses={profile.equippedGlasses}
                  equippedMask={profile.equippedMask}
                  equippedHeadband={profile.equippedHeadband || 'headband_classic'}
                  equippedOutfit={currentOutfit}
                  equippedSpecial={profile.equippedSpecial}
                  mascotForm={activeMascotForm}
                />
              </div>
            ) : (
              <img
                src={activeMascot.imageUrl}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/mascots/pombo_hero_bust.png';
                }}
                alt={activeMascot.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain select-none rounded-2xl"
              />
            )}
            <div className="absolute top-3 left-3 bg-[#7650C9] text-white text-xs font-extrabold px-3 py-1 rounded-xl font-mono-tabular z-20 shadow-xs">
              Nível {levelInfo.level}
            </div>
            <div className="absolute bottom-2.5 right-3 bg-white/95 text-[#7650C9] border border-purple-200 text-[10px] font-extrabold px-2.5 py-1 rounded-xl z-20 shadow-xs flex items-center gap-1 group-hover:bg-[#7650C9] group-hover:text-white transition-colors">
              <Shirt className="w-3 h-3" />
              <span>Trocar Skin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setQuoteIdx((i) => (i + 1) % activeMascot.quotes.length)}
            className="mt-3 text-xs font-bold text-[#7650C9] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ouvir nova mensagem do {activeMascot.name}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCustomizerCategory('outfit');
              setShowCustomizer(true);
            }}
            className="mt-2.5 w-full max-w-xs py-2.5 px-4 rounded-2xl bg-[#7650C9] text-white text-xs font-black hover:bg-[#643FB5] shadow-sm shadow-[#7650C9]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Personalizar Skins e Acessórios no Provador</span>
          </button>
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="text-xs font-bold text-[#7650C9] uppercase tracking-wider">
              Transformação Ativa · {activeMascot.goalLabel}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#24212B] mt-1">
              {activeMascot.name}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{activeMascot.description}</p>
          </div>

          {/* Speech Bubble */}
          <div className="bg-[#F2EDFF] border border-[#E4D9FF] rounded-2xl p-4 text-xs sm:text-sm font-medium text-[#24212B]">
            &ldquo;{activeMascot.quotes[quoteIdx]}&rdquo;
          </div>

          {/* XP & Level Progress */}
          <div className="bg-[#FAF9FC] border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <strong className="text-[#24212B]">
                Experiência de Consistência: {profile.xp} XP
              </strong>
              <span className="text-slate-500 font-mono-tabular">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP p/ Nível{' '}
                {levelInfo.level + 1}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${levelInfo.progressPercent}%` }}
                className="h-full bg-[#7650C9] transition-all"
              />
            </div>
          </div>

          {/* Switch Transformation / Goal (Preserving History) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#24212B] block">
              1. Alternar Forma Física e Objetivo do Pombo (preserva todo seu histórico):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['lose_weight', 'gain_muscle', 'get_strong'] as FitnessGoal[]).map((g) => {
                const m = MASCOT_DATA[goalToMascotForm(g)];
                const isCurrent = profile.goal === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGoalTransformationChange(g)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isCurrent
                        ? 'border-[#7650C9] bg-[#F2EDFF]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain rounded-lg bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#24212B] truncate">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{m.goalLabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Quick Skin / Outfit Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#24212B] flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-[#7650C9]" />
                <span>2. Trocar Skin / Uniforme do Personagem em Tempo Real:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomizerCategory('hat');
                  setShowCustomizer(true);
                }}
                className="text-[11px] font-bold text-[#7650C9] hover:underline cursor-pointer"
              >
                + Chapéus, Óculos e Máscaras
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {outfitItems.map((skin) => {
                const isEquipped = currentOutfit === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => handleQuickSkinChange(skin.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isEquipped
                        ? 'border-[#7650C9] bg-[#F2EDFF] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-[#7650C9]/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      <AccessoryThumbnail accessoryId={skin.id} className="w-7 h-7 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-[#24212B] truncate">
                        {skin.slotLabel}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {isEquipped ? 'Equipada' : 'Equipar Skin'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Missions (Respecting Rest Days) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#24212B]">
              Missões da Semana & Consistência Saudável
            </h3>
            <p className="text-xs text-slate-500">
              Evolua com equilíbrio — seus dias de descanso são essenciais e respeitados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FAF9FC] border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <strong className="text-[#24212B]">Meta Semanal de Treinos</strong>
              <span className="font-mono-tabular font-bold text-[#7650C9]">
                {Math.min(weeklySessionsDone, profile.weeklyDays)}/{profile.weeklyDays}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((weeklySessionsDone / Math.max(1, profile.weeklyDays)) * 100)
                  )}%`,
                }}
                className="h-full bg-[#7650C9]"
              />
            </div>
            <p className="text-[11px] text-slate-500">Recompensa: +200 XP ao concluir a semana.</p>
          </div>

          <div className="bg-[#FAF9FC] border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <strong className="text-[#24212B]">Respeitar Dias de Descanso</strong>
              <span className="font-bold text-emerald-700">Em dia</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Você possui {Math.max(0, 7 - profile.weeklyDays)} dias de recuperação programados na semana.
            </p>
          </div>

          <div className="bg-[#FAF9FC] border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <strong className="text-[#24212B]">Total de Sessões na Conta</strong>
              <span className="font-mono-tabular font-bold text-[#7650C9]">
                {sessionsCount} treinos
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cada treino concluído libera novos acessórios e medalhas para o Pombo.
            </p>
          </div>
        </div>
      </div>

      {/* Reformulated Collectibles & Rewards Gallery */}
      <RewardsGallery
        profile={profile}
        onUpdateProfile={onUpdateProfile}
        onOpenCustomizer={(cat) => {
          if (cat) setCustomizerCategory(cat);
          setShowCustomizer(true);
        }}
      />

      {/* Achievements & Medals Gallery */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-extrabold text-[#24212B] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#7650C9]" />
          <span>Conquistas & Medalhas Desbloqueadas ({unlockedAch.length}/{ACHIEVEMENTS_CATALOG.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {ACHIEVEMENTS_CATALOG.map((ach) => {
            const unlocked = unlockedAch.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  unlocked
                    ? 'bg-[#F2EDFF] border-[#7650C9]'
                    : 'bg-[#FAF9FC] border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      unlocked ? 'bg-[#7650C9] text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#7650C9] font-mono-tabular">
                    +{ach.xpReward} XP
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-[#24212B]">{ach.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <AvatarCustomizerModal
        profile={profile}
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        onSaveAvatar={onUpdateProfile}
        initialCategory={customizerCategory}
      />
    </div>
  );
};

const EQUIPMENT_OPTIONS: EquipmentCategory[] = [
  'Máquinas',
  'Halteres',
  'Barras',
  'Cabos',
  'Peso corporal',
  'Elásticos',
  'Equipamentos funcionais',
  'Outros equipamentos',
];

interface ProfileSettingsSectionProps {
  profile: UserProfile;
  userEmail?: string | null;
  workouts: WorkoutPlan[];
  sessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  onUpdateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  onRegenerateWorkouts?: (overrideProfile?: Partial<UserProfile>) => Promise<void>;
  onOpenHealthIntegration?: () => void;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  profile,
  userEmail,
  workouts,
  sessions,
  measurements,
  onUpdateProfile,
  onRegenerateWorkouts,
  onOpenHealthIntegration,
  onLogout,
  onDeleteAccount,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [photoURL] = useState(profile.photoURL || '');
  const [age, setAge] = useState<string>(profile.age ? String(profile.age) : '');
  const [heightCm, setHeightCm] = useState<string>(profile.heightCm ? String(profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState<string>(profile.weightKg ? String(profile.weightKg) : '');
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experienceLevel);
  const [weeklyDays, setWeeklyDays] = useState<number>(profile.weeklyDays);
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(profile.sessionDurationMin);
  const [workoutSplitCategory, setWorkoutSplitCategory] = useState<WorkoutSplitCategory>(
    profile.workoutSplitCategory || 'ai_auto'
  );
  const [workoutSplitType, setWorkoutSplitType] = useState<WorkoutSplitType>(
    profile.workoutSplitType || 'ai_auto'
  );
  const [customMuscleCombos, setCustomMuscleCombos] = useState<string[]>(
    profile.customMuscleCombos && profile.customMuscleCombos.length > 0
      ? profile.customMuscleCombos
      : ['peito_triceps', 'costas_biceps', 'pernas_completas']
  );
  const [waterGoalMl, setWaterGoalMl] = useState<number>(profile.waterGoalMl || 2500);
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentCategory[]>(
    profile.availableEquipment && profile.availableEquipment.length > 0
      ? profile.availableEquipment
      : ['Máquinas', 'Halteres', 'Barras', 'Cabos']
  );
  const [limitations, setLimitations] = useState(profile.limitations || '');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(profile.unitSystem || 'metric');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [regeneratedBanner, setRegeneratedBanner] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Password Change & Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Real Web Push & Notification Preferences State
  const [pushCaps, setPushCaps] = useState(() => getDevicePushCapabilities());
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(
    Boolean(profile.pushNotificationsEnabled) && getDevicePushCapabilities().permission === 'granted'
  );
  const [pushDeviceCount, setPushDeviceCount] = useState<number>(0);
  const [pushBusy, setPushBusy] = useState<boolean>(false);
  const [pushFeedback, setPushFeedback] = useState<{ type: 'ok' | 'err' | 'info'; msg: string } | null>(null);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('19:30');

  useEffect(() => {
    let mounted = true;
    setPushCaps(getDevicePushCapabilities());
    if (profile.userId) {
      getServerPushStatus(profile.userId).then((st) => {
        if (!mounted || !st) return;
        setPushSubscribed(Boolean(st.subscribed));
        setPushDeviceCount(st.subscriptionCount || 0);
      });
    }
    return () => {
      mounted = false;
    };
  }, [profile.userId]);

  const handleToggleWebPushSubscription = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      if (pushSubscribed && profile.pushNotificationsEnabled !== false) {
        await unsubscribeUserFromWebPush(profile.userId);
        await onUpdateProfile({ pushNotificationsEnabled: false });
        await syncServerPushPreferences(profile.userId, { pushNotificationsEnabled: false });
        setPushSubscribed(false);
        setPushDeviceCount(0);
        setPushFeedback({
          type: 'info',
          msg: 'Notificações Push desativadas neste dispositivo.',
        });
      } else {
        const res = await subscribeUserToWebPush(profile.userId, {
          pushNotificationsEnabled: true,
          notifRestFinished: profile.notifRestFinished !== false,
          notifWorkoutCompletion: profile.notifWorkoutCompletion !== false,
          notifWorkoutReminder: profile.notifWorkoutReminder !== false,
          workoutReminderTime: profile.workoutReminderTime || '18:00',
          notifWaterReminder: Boolean(profile.notifWaterReminder),
          waterReminderIntervalMin: profile.waterReminderIntervalMin || 120,
          customReminders: profile.customReminders || [],
        });
        setPushCaps(getDevicePushCapabilities());
        if (res.ok && res.subscribed) {
          await onUpdateProfile({ pushNotificationsEnabled: true });
          setPushSubscribed(true);
          const st = await getServerPushStatus(profile.userId);
          setPushDeviceCount(st?.subscriptionCount || 1);
          setPushFeedback({
            type: 'ok',
            msg: 'Web Push Real ativado! Você receberá alertas mesmo com o app fechado ou tela bloqueada.',
          });
        } else {
          setPushFeedback({
            type: 'err',
            msg: res.error || 'Não foi possível ativar as notificações Push.',
          });
        }
      }
    } finally {
      setPushBusy(false);
    }
  };

  const handleUpdateNotifPref = async (updates: Partial<UserProfile>) => {
    await onUpdateProfile(updates);
    const merged = {
      pushNotificationsEnabled: updates.pushNotificationsEnabled ?? (profile.pushNotificationsEnabled !== false),
      notifRestFinished: updates.notifRestFinished ?? (profile.notifRestFinished !== false),
      notifWorkoutCompletion: updates.notifWorkoutCompletion ?? (profile.notifWorkoutCompletion !== false),
      notifWorkoutReminder: updates.notifWorkoutReminder ?? (profile.notifWorkoutReminder !== false),
      workoutReminderTime: updates.workoutReminderTime ?? (profile.workoutReminderTime || '18:00'),
      notifWaterReminder: updates.notifWaterReminder ?? Boolean(profile.notifWaterReminder),
      waterReminderIntervalMin: updates.waterReminderIntervalMin ?? (profile.waterReminderIntervalMin || 120),
      customReminders: updates.customReminders ?? (profile.customReminders || []),
    };
    await syncServerPushPreferences(profile.userId, merged);
  };

  const handleAddCustomReminder = async () => {
    if (!newReminderTitle.trim()) return;
    const item: CustomPushReminder = {
      id: `rem_${Date.now()}`,
      title: newReminderTitle.trim().slice(0, 60),
      time: newReminderTime || '19:30',
      days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      enabled: true,
    };
    const nextList = [...(profile.customReminders || []), item];
    setNewReminderTitle('');
    await handleUpdateNotifPref({ customReminders: nextList });
  };

  const handleTriggerRealPushTest = async (delaySeconds: number) => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      if (!pushSubscribed) {
        const subRes = await subscribeUserToWebPush(profile.userId);
        setPushCaps(getDevicePushCapabilities());
        if (!subRes.ok) {
          setPushFeedback({
            type: 'err',
            msg: subRes.error || 'Ative as notificações Push primeiro para testar o envio real.',
          });
          return;
        }
        setPushSubscribed(true);
      }

      const testRes = await sendServerTestPush(profile.userId, delaySeconds);
      if (testRes.ok) {
        setPushFeedback({
          type: 'ok',
          msg:
            delaySeconds > 0
              ? `Push agendado no servidor para daqui a ${delaySeconds} segundos! Minimize o app ou bloqueie a tela do celular agora para testar.`
              : 'Notificação Push real enviada pelo servidor! Verifique a barra de notificações do seu dispositivo.',
        });
      } else {
        setPushFeedback({
          type: 'err',
          msg: testRes.error || 'Falha ao disparar Push de teste.',
        });
      }
    } finally {
      setPushBusy(false);
    }
  };

  const compatibility = checkSplitCompatibility(workoutSplitType, weeklyDays, customMuscleCombos, {
    goal,
    experienceLevel,
  });

  const toggleEquipmentOption = (eq: EquipmentCategory) => {
    setAvailableEquipment((prev) =>
      prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]
    );
  };

  const toggleMuscleCombo = (comboId: string) => {
    setCustomMuscleCombos((prev) =>
      prev.includes(comboId) ? prev.filter((x) => x !== comboId) : [...prev, comboId]
    );
  };

  const handleSelectSplitCategory = (cat: WorkoutSplitCategory) => {
    setWorkoutSplitCategory(cat);
    if (cat === 'ai_auto') {
      setWorkoutSplitType('ai_auto');
    } else if (cat === 'letters') {
      setWorkoutSplitType(
        weeklyDays <= 2 ? 'AB' : weeklyDays === 3 ? 'ABC' : weeklyDays === 4 ? 'ABCD' : weeklyDays === 5 ? 'ABCDE' : 'ABCDEF'
      );
    } else if (cat === 'modality') {
      setWorkoutSplitType(
        weeklyDays <= 2 ? 'full_body' : weeklyDays === 4 ? 'upper_lower' : 'push_pull_legs'
      );
    } else if (cat === 'muscle_groups') {
      setWorkoutSplitType('muscle_groups');
    }
  };

  const buildProfileUpdates = (): Partial<UserProfile> => ({
    displayName: displayName.trim() || 'Atleta PomboFit',
    photoURL: photoURL.trim(),
    ...(age ? { age: Math.min(120, Math.max(10, Number(age) || 28)) } : {}),
    ...(heightCm ? { heightCm: Math.min(250, Math.max(80, Number(heightCm) || 175)) } : {}),
    ...(weightKg ? { weightKg: Math.min(350, Math.max(20, Number(weightKg) || 75)) } : {}),
    goal,
    mascotForm: goalToMascotForm(goal),
    experienceLevel,
    weeklyDays,
    sessionDurationMin,
    workoutSplitCategory,
    workoutSplitType,
    customMuscleCombos: workoutSplitType === 'muscle_groups' ? customMuscleCombos : [],
    waterGoalMl,
    availableEquipment: availableEquipment.slice(0, 15),
    limitations: limitations.trim().slice(0, 500),
    unitSystem,
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile(buildProfileUpdates());
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndRegenerateWorkouts = async () => {
    if (!onRegenerateWorkouts) return;
    setRegenerating(true);
    try {
      const updates = buildProfileUpdates();
      await onUpdateProfile(updates);
      await onRegenerateWorkouts(updates);
      setRegeneratedBanner(true);
      setTimeout(() => setRegeneratedBanner(false), 4000);
    } finally {
      setRegenerating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'err', msg: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'err', msg: 'A confirmação de senha não confere.' });
      return;
    }
    if (!auth.currentUser) return;
    setUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStatus({ type: 'ok', msg: 'Senha atualizada com sucesso!' });
    } catch {
      setPasswordStatus({
        type: 'err',
        msg: 'Para alterar a senha, faça login novamente ou clique em "Enviar E-mail de Redefinição".',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!userEmail) return;
    setPasswordStatus(null);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      setPasswordStatus({
        type: 'ok',
        msg: `E-mail de redefinição enviado para ${userEmail}!`,
      });
    } catch {
      setPasswordStatus({
        type: 'err',
        msg: 'Não foi possível enviar o e-mail de redefinição agora.',
      });
    }
  };

  const handleExportAllData = () => {
    const backupObject = {
      exportedAt: new Date().toISOString(),
      app: 'PomboFit',
      profile,
      workouts,
      sessions,
      measurements,
    };
    const blob = new Blob([JSON.stringify(backupObject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pombofit_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PWAInstallButton variant="card" />

      {/* Mobile Health & Devices Integration Card (Apple Health / Health Connect) */}
      {onOpenHealthIntegration && (
        <div className="bg-white border border-[#EDE7FD] rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-[#1E1638]">
                  Saúde e Dispositivos (Apple Health / Health Connect)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    profile.healthConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {profile.healthConnected ? 'Conectado' : 'Não conectado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure permissões de leitura/escrita, sincronize passos, calorias ativas, distância e treinos reais.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenHealthIntegration}
            className="w-full sm:w-auto justify-center px-5 py-3 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>
              {profile.healthConnected
                ? 'Gerenciar Integração de Saúde'
                : 'Conectar Saúde do Celular'}
            </span>
          </button>
        </div>
      )}

      {/* Personal Profile & Training Settings Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="relative group transition-transform active:scale-95 cursor-pointer"
              title="Clique para personalizar seu avatar"
            >
              <AvatarHeadDisplay profile={profile} sizeClassName="w-14 h-14" />
              <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                Editar
              </div>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#24212B]">{profile.displayName}</h2>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="text-[11px] font-bold text-[#7650C9] bg-[#F2EDFF] hover:bg-[#E4D9FF] px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Personalizar Foto / Pombo
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {userEmail || 'Conta autenticada Firebase'} • Mascote:{' '}
                <strong className="text-[#7650C9]">
                  {MASCOT_DATA[goalToMascotForm(goal)].name}
                </strong>
              </p>
            </div>
          </div>

          {savedBanner && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Configurações e Mascote atualizados!</span>
            </div>
          )}

          {regeneratedBanner && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Novas fichas individuais geradas pela IA para o seu perfil!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#24212B] mb-1">Nome Completo</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">Idade (anos)</label>
            <input
              type="number"
              min={10}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ex: 28"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">Altura (cm)</label>
            <input
              type="number"
              min={80}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="Ex: 175"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">Peso Atual (kg)</label>
            <input
              type="number"
              step="0.1"
              min={20}
              max={350}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Ex: 75"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Objetivo Principal (Mascote)
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
            >
              <option value="lose_weight">Emagrecimento (Pombo Seco)</option>
              <option value="gain_muscle">Ganho de Massa Muscular (Pombo Grande)</option>
              <option value="get_strong">Força e Condicionamento (Pombo Forte)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Nível de Experiência
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
            >
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Frequência Semanal (Dias)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={weeklyDays}
              onChange={(e) => setWeeklyDays(Math.min(7, Math.max(1, Number(e.target.value) || 4)))}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Duração por Sessão (min)
            </label>
            <input
              type="number"
              min={15}
              max={240}
              value={sessionDurationMin}
              onChange={(e) => setSessionDurationMin(Number(e.target.value) || 60)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Meta Diária de Água (ml)
            </label>
            <input
              type="number"
              step={100}
              value={waterGoalMl}
              onChange={(e) => setWaterGoalMl(Number(e.target.value) || 2500)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-mono-tabular font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Sistema de Unidades
            </label>
            <select
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value as 'metric' | 'imperial')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
            >
              <option value="metric">Métrico (kg / cm)</option>
              <option value="imperial">Imperial (lb / in)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Limitações ou Restrições
            </label>
            <input
              type="text"
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="Ex: Evitar sobrecarga no ombro..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>

        {/* Workout Split & Organization Section in Profile Settings */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#24212B] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7650C9]" />
                <span>Divisão e Organização dos Treinos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Altere sua divisão de treino a qualquer momento ou deixe a IA escolher a estrutura ideal.
              </p>
            </div>
          </div>

          {/* 4 Split Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { id: 'ai_auto' as WorkoutSplitCategory, label: 'Decisão pela IA', sub: 'Deixe a IA decidir por mim' },
              { id: 'letters' as WorkoutSplitCategory, label: 'Divisão por Letras', sub: 'AB, ABC, ABCD, ABCDE, ABCDEF' },
              { id: 'modality' as WorkoutSplitCategory, label: 'Outras Modalidades', sub: 'Full Body, Upper/Lower, PPL' },
              { id: 'muscle_groups' as WorkoutSplitCategory, label: 'Por Grupos Musculares', sub: 'Combinações personalizadas' },
            ].map((cat) => {
              const active = workoutSplitCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectSplitCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#7650C9] bg-[#F2EDFF] text-[#24212B]'
                      : 'border-slate-200 bg-[#FAF9FC] text-slate-600'
                  }`}
                >
                  <div className="text-xs font-extrabold text-[#24212B]">{cat.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{cat.sub}</div>
                </button>
              );
            })}
          </div>

          {workoutSplitCategory === 'letters' && (
            <div className="flex flex-wrap gap-2">
              {WORKOUT_SPLITS_CATALOG.filter((s) => s.category === 'letters').map((split) => (
                <button
                  key={split.id}
                  type="button"
                  onClick={() => setWorkoutSplitType(split.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    workoutSplitType === split.id
                      ? 'bg-[#7650C9] text-white border-[#7650C9]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {split.title}
                </button>
              ))}
            </div>
          )}

          {workoutSplitCategory === 'modality' && (
            <div className="flex flex-wrap gap-2">
              {WORKOUT_SPLITS_CATALOG.filter((s) => s.category === 'modality').map((split) => (
                <button
                  key={split.id}
                  type="button"
                  onClick={() => setWorkoutSplitType(split.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    workoutSplitType === split.id
                      ? 'bg-[#7650C9] text-white border-[#7650C9]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {split.title}
                </button>
              ))}
            </div>
          )}

          {workoutSplitCategory === 'muscle_groups' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {MUSCLE_COMBO_OPTIONS.map((combo) => {
                const active = customMuscleCombos.includes(combo.id);
                return (
                  <button
                    key={combo.id}
                    type="button"
                    onClick={() => toggleMuscleCombo(combo.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-[#7650C9] text-white border-[#7650C9]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{combo.label}</span>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Compatibility Alert or Confirmation */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              compatibility.isCompatible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
              {compatibility.isCompatible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-extrabold">{compatibility.title}</div>
                <div className="text-[11px] mt-0.5 leading-relaxed">{compatibility.explanation}</div>
              </div>
            </div>

            {!compatibility.isCompatible && (
              <button
                type="button"
                onClick={() => {
                  const sug = WORKOUT_SPLITS_CATALOG.find(
                    (s) => s.id === compatibility.suggestedSplitType
                  );
                  if (sug) {
                    setWorkoutSplitCategory(sug.category);
                    setWorkoutSplitType(sug.id);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Usar sugerida: {compatibility.suggestedSplitLabel}
              </button>
            )}
          </div>
        </div>

        {/* Available Equipment Selector */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-bold text-[#24212B]">
            Equipamentos Disponíveis para Treino
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => {
              const selected = availableEquipment.includes(eq);
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipmentOption(eq)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#7650C9] text-white border-[#7650C9]'
                      : 'bg-[#FAF9FC] text-slate-600 border-slate-200 hover:border-[#7650C9]'
                  }`}
                >
                  {eq}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {onRegenerateWorkouts && (
            <button
              type="button"
              disabled={regenerating || saving}
              onClick={handleSaveAndRegenerateWorkouts}
              className="px-5 py-3 rounded-2xl bg-[#F2EDFF] text-[#5E2EE8] border border-[#D8C8FF] text-xs font-extrabold hover:bg-[#E4D9FF] flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              <span>
                {regenerating
                  ? 'Recriando Fichas com IA...'
                  : 'Salvar e Recriar Minhas Fichas com IA'}
              </span>
            </button>
          )}

          <button
            type="submit"
            disabled={saving || regenerating}
            className="px-6 py-3 rounded-2xl bg-[#7650C9] text-white text-xs font-extrabold hover:bg-[#6440B5] cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações do Perfil'}
          </button>
        </div>
      </form>

      {/* Aparência (Modo Claro, Escuro e Automático) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7650C9] flex items-center justify-center font-bold">
            🎨
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#24212B]">Aparência do Aplicativo</h3>
            <p className="text-xs text-slate-500">Escolha o tema visual ideal para o seu treino.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {(
            [
              {
                id: 'light',
                title: 'Claro',
                desc: 'Visual limpo e tradicional do PomboFit.',
                icon: '☀️',
              },
              {
                id: 'dark',
                title: 'Escuro',
                desc: 'Grafite profundo com roxo vibrante.',
                icon: '🌙',
              },
              {
                id: 'system',
                title: 'Automático',
                desc: 'Acompanha as configurações do dispositivo.',
                icon: '💻',
              },
            ] as const
          ).map((opt) => {
            const currentTheme = profile.themePreference || 'light';
            const isSelected = currentTheme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateProfile({ themePreference: opt.id as any })}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#7650C9] bg-[#FAF8FF] shadow-xs'
                    : 'border-slate-200 bg-white hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{opt.icon}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-[#7650C9] bg-[#7650C9] text-white'
                        : 'border-slate-300 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#24212B]">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configurable Real Web Push Notifications, Reminders & Workout Timer Preferences */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#24212B] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7650C9]" />
                <span>Notificações Push Reais e Alertas de Treino</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  pushSubscribed && profile.pushNotificationsEnabled !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : pushCaps.permission === 'denied'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {pushSubscribed && profile.pushNotificationsEnabled !== false
                  ? `Push Ativo (${pushDeviceCount || 1} disp.)`
                  : pushCaps.permission === 'denied'
                  ? 'Permissão Bloqueada'
                  : 'Push Desativado'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Receba avisos de fim de descanso entre séries, lembrete de conclusão de treino e hidratação diretamente no celular — mesmo com o aplicativo minimizado, fechado ou com a tela bloqueada.
            </p>
          </div>

          <button
            type="button"
            disabled={pushBusy}
            onClick={handleToggleWebPushSubscription}
            className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              pushSubscribed && profile.pushNotificationsEnabled !== false
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-[#5E2EE8] text-white hover:bg-[#4E21D0] shadow-sm'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {pushBusy
                ? 'Sincronizando...'
                : pushSubscribed && profile.pushNotificationsEnabled !== false
                ? 'Desativar Notificações Push'
                : 'Ativar Notificações Push no Celular'}
            </span>
          </button>
        </div>

        {/* iOS / iPhone 16.4+ Home Screen Installation Guidance */}
        {pushCaps.isIOS && !pushCaps.isStandalone && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <p className="font-extrabold flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Instrução para iPhone / iPad (iOS 16.4+):</span>
            </p>
            <p className="leading-relaxed">
              No iOS, notificações Web Push com tela bloqueada exigem que o PomboFit esteja instalado na Tela de Início. Toque no botão <strong>Compartilhar</strong> do Safari, escolha <strong>Adicionar à Tela de Início</strong>, abra o aplicativo pelo ícone criado e toque em <strong>Ativar Notificações Push</strong>.
            </p>
          </div>
        )}

        {pushFeedback && (
          <div
            className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 ${
              pushFeedback.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : pushFeedback.type === 'err'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-[#FAF8FF] text-[#5E2EE8] border border-purple-200'
            }`}
          >
            <span>{pushFeedback.msg}</span>
            <button
              type="button"
              onClick={() => setPushFeedback(null)}
              className="text-[11px] underline opacity-80 cursor-pointer shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Categories & Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              {
                key: 'notifRestFinished',
                label: 'Push ao finalizar descanso entre séries (tela bloqueada / 2º plano)',
              },
              {
                key: 'notifWorkoutCompletion',
                label: 'Aviso de término estimado de treino em andamento',
              },
              {
                key: 'autoStartRestTimer',
                label: 'Iniciar cronômetro automaticamente após concluir série',
              },
              {
                key: 'soundAlerts',
                label: 'Alerta sonoro e vibração ao finalizar descanso no app',
              },
              {
                key: 'notifWorkoutReminder',
                label: 'Lembrete diário de treino nos dias programados',
              },
              {
                key: 'notifWaterReminder',
                label: 'Lembrete periódico de hidratação (08h às 22h)',
              },
              {
                key: 'notifWeeklyGoal',
                label: 'Aviso de progresso da meta semanal',
              },
              {
                key: 'notifAchievements',
                label: 'Alerta de conquistas e evolução do Pombo',
              },
            ] as const
          ).map((item) => {
            const checked =
              item.key === 'notifWaterReminder'
                ? Boolean(profile[item.key])
                : profile[item.key] !== false;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] border border-slate-200 cursor-pointer"
              >
                <span className="text-xs font-semibold text-[#24212B] pr-3">{item.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => handleUpdateNotifPref({ [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-[#7650C9]"
                />
              </label>
            );
          })}
        </div>

        {/* Schedule Configuration for Workout Reminder & Hydration Interval */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-[#FAF9FC] border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-[#24212B]">
              Horário do Lembrete de Treino
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={profile.workoutReminderTime || '18:00'}
                onChange={(e) => handleUpdateNotifPref({ workoutReminderTime: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
              <span className="text-[11px] text-slate-500">
                Disparo automático via servidor no seu fuso horário.
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9FC] border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-[#24212B]">
              Intervalo do Lembrete de Hidratação
            </label>
            <div className="flex items-center gap-2">
              <select
                value={profile.waterReminderIntervalMin || 120}
                onChange={(e) =>
                  handleUpdateNotifPref({ waterReminderIntervalMin: Number(e.target.value) || 120 })
                }
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value={60}>A cada 60 minutos</option>
                <option value={90}>A cada 90 minutos</option>
                <option value={120}>A cada 2 horas</option>
                <option value={180}>A cada 3 horas</option>
              </select>
              <span className="text-[11px] text-slate-500">
                Ativo quando o lembrete de água está marcado.
              </span>
            </div>
          </div>
        </div>

        {/* Custom Reminders List */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-[#24212B]">
            Lembretes Personalizados (Creatina, Mobilidade, Pré-treino, etc.)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              placeholder="Ex: Tomar Creatina 5g"
              className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
            <input
              type="time"
              value={newReminderTime}
              onChange={(e) => setNewReminderTime(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
            <button
              type="button"
              onClick={handleAddCustomReminder}
              className="px-4 py-2.5 rounded-xl bg-[#F2EDFF] text-[#5E2EE8] text-xs font-extrabold hover:bg-[#E4D9FF] cursor-pointer"
            >
              + Adicionar Lembrete
            </button>
          </div>

          {Array.isArray(profile.customReminders) && profile.customReminders.length > 0 && (
            <div className="space-y-2 pt-1">
              {profile.customReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rem.enabled}
                      onChange={(e) => {
                        const updated = (profile.customReminders || []).map((r) =>
                          r.id === rem.id ? { ...r, enabled: e.target.checked } : r
                        );
                        handleUpdateNotifPref({ customReminders: updated });
                      }}
                      className="w-4 h-4 accent-[#7650C9]"
                    />
                    <span className="font-bold text-[#24212B]">{rem.title}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#5E2EE8] font-mono text-[11px] font-bold">
                      {rem.time}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = (profile.customReminders || []).filter((r) => r.id !== rem.id);
                      handleUpdateNotifPref({ customReminders: filtered });
                    }}
                    className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real Push & Local Sound/Vibration Verification Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={pushBusy}
            onClick={() => handleTriggerRealPushTest(0)}
            className="px-4 py-2.5 rounded-xl bg-[#5E2EE8] text-white text-xs font-extrabold hover:bg-[#4E21D0] cursor-pointer disabled:opacity-60"
          >
            🔔 Testar Push Real Agora
          </button>
          <button
            type="button"
            disabled={pushBusy}
            onClick={() => handleTriggerRealPushTest(5)}
            className="px-4 py-2.5 rounded-xl bg-[#F2EDFF] text-[#5E2EE8] border border-[#D8C8FF] text-xs font-extrabold hover:bg-[#E4D9FF] cursor-pointer disabled:opacity-60"
          >
            🔒 Testar com Tela Bloqueada (daqui a 5s)
          </button>
          <button
            type="button"
            onClick={() => {
              const res = testRestAlerts();
              setPushFeedback({
                type: 'info',
                msg: `Som tocado no app! Vibração: ${
                  res.vibrationStatus.supported
                    ? res.vibrationStatus.executed
                      ? 'Executada no dispositivo'
                      : 'Disponível'
                    : 'Controlada pelo sistema (iOS)'
                }.`,
              });
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#24212B] hover:bg-slate-50 cursor-pointer"
          >
            🔊 Testar Som e Vibração no App
          </button>
        </div>
      </div>

      {/* Password Change & Account Security Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-[#24212B] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#7650C9]" />
            <span>Segurança e Alteração de Senha</span>
          </h3>
          {userEmail && (
            <button
              type="button"
              onClick={handleSendResetEmail}
              className="text-xs font-bold text-[#7650C9] hover:underline cursor-pointer"
            >
              Enviar E-mail de Redefinição de Senha
            </button>
          )}
        </div>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={updatingPassword}
            className="py-2.5 px-4 rounded-xl bg-[#1E1638] text-white text-xs font-bold hover:bg-[#2F2356] cursor-pointer"
          >
            {updatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>

        {passwordStatus && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
              passwordStatus.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {passwordStatus.msg}
          </div>
        )}
      </div>

      {/* Data Export, Session Logout & Account Deletion */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[#24212B]">
            Backup, Exportação de Dados e Sessão
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exporte todo seu histórico, fichas, registros e medidas em formato JSON a qualquer momento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportAllData}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#F2EDFF] text-[#7650C9] text-xs font-bold hover:bg-[#E4D9FF] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar Meus Dados</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#24212B] hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair da Conta</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirmModal(true)}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Excluir Conta</span>
          </button>
        </div>
      </div>

      <AvatarCustomizerModal
        profile={profile}
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSaveAvatar={onUpdateProfile}
      />

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-extrabold">Confirmar Exclusão Permanente</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Atenção: excluir sua conta apagará permanentemente seu perfil, suas fichas personalizadas, histórico de treinos, recordes, medições corporais e fotos de evolução no Cloud Firestore. Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Manter Minha Conta
              </button>
              <button
                type="button"
                onClick={onDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Sim, Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

