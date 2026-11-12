import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  DailyHabitLog,
  WorkoutSession,
  HealthProviderId,
  HealthPermissionCategory,
} from '../types';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  FileUp,
  Flame,
  Footprints,
  Heart,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Unlink,
  Watch,
} from 'lucide-react';

interface HealthIntegrationSectionProps {
  profile: UserProfile;
  habits: DailyHabitLog[];
  sessions: WorkoutSession[];
  onUpdateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  onSaveDailyHabit: (data: Omit<DailyHabitLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onImportHealthWorkoutSession?: (
    sessionData: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
}

interface PermissionMeta {
  id: HealthPermissionCategory;
  label: string;
  description: string;
  unit: string;
}

const HEALTH_PERMISSIONS_CATALOG: PermissionMeta[] = [
  {
    id: 'steps',
    label: 'Passos do dia',
    description: 'Contagem diária de passos registrados pelo celular ou smartwatch.',
    unit: 'passos',
  },
  {
    id: 'distance',
    label: 'Distância caminhada / corrida',
    description: 'Quilometragem percorrida em deslocamentos e corridas.',
    unit: 'km',
  },
  {
    id: 'active_calories',
    label: 'Calorias ativas',
    description: 'Energia gasta em movimento e atividades físicas reais.',
    unit: 'kcal',
  },
  {
    id: 'workouts',
    label: 'Treinos registrados',
    description: 'Sessões de exercício salvas no Apple Health ou Health Connect (sem duplicar treinos manuais).',
    unit: 'sessões',
  },
  {
    id: 'active_minutes',
    label: 'Tempo de exercício',
    description: 'Minutos totais de atividade física moderada ou intensa no dia.',
    unit: 'min',
  },
  {
    id: 'heart_rate',
    label: 'Frequência cardíaca',
    description: 'Média de batimentos por minuto (BPM), quando disponível no dispositivo.',
    unit: 'bpm',
  },
];

// Detect native/hybrid bridge availability (Capacitor / React Native WebView / Native iOS & Android bridges)
function detectRuntimeBridgeEnvironment() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const win = typeof window !== 'undefined' ? (window as any) : {};

  const hasAppleHealthKitBridge = Boolean(
    win.webkit?.messageHandlers?.healthKit ||
      win.Capacitor?.Plugins?.HealthKit ||
      win.AppleHealthKit
  );

  const hasAndroidHealthConnectBridge = Boolean(
    win.AndroidHealthConnect ||
      win.Capacitor?.Plugins?.HealthConnect ||
      win.HealthConnect
  );

  const isNativeHybrid = hasAppleHealthKitBridge || hasAndroidHealthConnectBridge;

  return {
    isIOS,
    isAndroid,
    hasAppleHealthKitBridge,
    hasAndroidHealthConnectBridge,
    isNativeHybrid,
  };
}

export const HealthIntegrationSection: React.FC<HealthIntegrationSectionProps> = ({
  profile,
  habits,
  sessions,
  onUpdateProfile,
  onSaveDailyHabit,
  onImportHealthWorkoutSession,
}) => {
  const runtimeEnv = useMemo(() => detectRuntimeBridgeEnvironment(), []);
  const todayISO = new Date().toISOString().slice(0, 10);

  const currentProvider: HealthProviderId = profile.healthProvider || 'none';
  const isConnected = Boolean(profile.healthConnected && currentProvider !== 'none');

  const [selectedPermissions, setSelectedPermissions] = useState<HealthPermissionCategory[]>(
    profile.healthPermissions && profile.healthPermissions.length > 0
      ? profile.healthPermissions
      : ['steps', 'distance', 'active_calories', 'workouts', 'active_minutes', 'heart_rate']
  );

  const [explicitConsentChecked, setExplicitConsentChecked] = useState<boolean>(isConnected);
  const [syncing, setSyncing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'info' | 'success' | 'warning';
    text: string;
  } | null>(null);

  // Today's habit log
  const todayHabit = useMemo(
    () =>
      habits.find((h) => h.dateKey === todayISO) || {
        id: todayISO,
        userId: profile.userId,
        dateKey: todayISO,
        waterMl: 0,
        waterGoalMl: profile.waterGoalMl || 2500,
        sleepHours: 7.5,
        recoveryScore: 8,
        meals: [],
        notes: '',
      },
    [habits, todayISO, profile.userId, profile.waterGoalMl]
  );

  // Authorized Sync / Import fields (for exported Apple Health / Health Connect data or verified device sync)
  const [syncDate, setSyncDate] = useState(todayISO);
  const [inputSteps, setInputSteps] = useState<string>(
    todayHabit.steps !== undefined ? String(todayHabit.steps) : ''
  );
  const [inputDistanceKm, setInputDistanceKm] = useState<string>(
    todayHabit.distanceKm !== undefined ? String(todayHabit.distanceKm) : ''
  );
  const [inputActiveCalories, setInputActiveCalories] = useState<string>(
    todayHabit.activeCaloriesKcal !== undefined ? String(todayHabit.activeCaloriesKcal) : ''
  );
  const [inputActiveMinutes, setInputActiveMinutes] = useState<string>(
    todayHabit.activeMinutes !== undefined ? String(todayHabit.activeMinutes) : ''
  );
  const [inputHeartRate, setInputHeartRate] = useState<string>(
    todayHabit.heartRateBpm !== undefined ? String(todayHabit.heartRateBpm) : ''
  );

  // Optional workout import from health file
  const [importWorkoutTitle, setImportWorkoutTitle] = useState('');
  const [importWorkoutDurationMin, setImportWorkoutDurationMin] = useState('');
  const [importWorkoutCalories, setImportWorkoutCalories] = useState('');

  const togglePermission = (permId: HealthPermissionCategory) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Connect to Apple Health or Health Connect with explicit user authorization
  const handleConnectProvider = async (provider: 'apple_health' | 'health_connect') => {
    if (!explicitConsentChecked) {
      setStatusBanner({
        type: 'warning',
        text: 'Antes de conectar, marque a caixa de autorização explícita abaixo para confirmar o compartilhamento das permissões selecionadas.',
      });
      return;
    }

    if (selectedPermissions.length === 0) {
      setStatusBanner({
        type: 'warning',
        text: 'Selecione pelo menos uma categoria de dado (ex: Passos, Calorias ativas, Distância) para autorizar.',
      });
      return;
    }

    setSyncing(true);
    setStatusBanner(null);

    try {
      const win = window as any;
      let nativePayload: Partial<{
        steps: number;
        distanceKm: number;
        activeCaloriesKcal: number;
        activeMinutes: number;
        heartRateBpm: number;
      }> | null = null;

      // 1. If running inside a Native/Hybrid container, invoke the real native bridge
      if (provider === 'apple_health' && runtimeEnv.hasAppleHealthKitBridge) {
        if (win.Capacitor?.Plugins?.HealthKit?.requestAuthorization) {
          await win.Capacitor.Plugins.HealthKit.requestAuthorization({
            read: selectedPermissions,
          });
          const res = await win.Capacitor.Plugins.HealthKit.queryDailySummary({
            date: todayISO,
          });
          if (res) nativePayload = res;
        }
      } else if (provider === 'health_connect' && runtimeEnv.hasAndroidHealthConnectBridge) {
        if (win.Capacitor?.Plugins?.HealthConnect?.requestPermissions) {
          await win.Capacitor.Plugins.HealthConnect.requestPermissions({
            permissions: selectedPermissions,
          });
          const res = await win.Capacitor.Plugins.HealthConnect.readDailyRecords({
            date: todayISO,
          });
          if (res) nativePayload = res;
        }
      }

      const nowISO = new Date().toISOString();

      await onUpdateProfile({
        healthProvider: provider,
        healthConnected: true,
        healthPermissions: selectedPermissions,
        healthLastSyncISO: nowISO,
      });

      // If native bridge returned real values immediately, save them; otherwise never invent fake values
      if (nativePayload) {
        await onSaveDailyHabit({
          userId: profile.userId,
          dateKey: todayISO,
          waterMl: todayHabit.waterMl,
          waterGoalMl: todayHabit.waterGoalMl,
          sleepHours: todayHabit.sleepHours,
          recoveryScore: todayHabit.recoveryScore,
          meals: todayHabit.meals,
          notes: todayHabit.notes || '',
          ...(selectedPermissions.includes('steps') && nativePayload.steps !== undefined
            ? { steps: Math.max(0, Math.round(nativePayload.steps)) }
            : {}),
          ...(selectedPermissions.includes('distance') && nativePayload.distanceKm !== undefined
            ? { distanceKm: Math.max(0, Math.round(nativePayload.distanceKm * 100) / 100) }
            : {}),
          ...(selectedPermissions.includes('active_calories') &&
          nativePayload.activeCaloriesKcal !== undefined
            ? { activeCaloriesKcal: Math.max(0, Math.round(nativePayload.activeCaloriesKcal)) }
            : {}),
          ...(selectedPermissions.includes('active_minutes') &&
          nativePayload.activeMinutes !== undefined
            ? { activeMinutes: Math.max(0, Math.round(nativePayload.activeMinutes)) }
            : {}),
          ...(selectedPermissions.includes('heart_rate') &&
          nativePayload.heartRateBpm !== undefined
            ? { heartRateBpm: Math.max(30, Math.round(nativePayload.heartRateBpm)) }
            : {}),
          healthSource: 'health_integration',
          healthProvider: provider,
        });
      }

      const providerName = provider === 'apple_health' ? 'Apple Health (iOS)' : 'Health Connect (Android)';

      if (runtimeEnv.isNativeHybrid) {
        setStatusBanner({
          type: 'success',
          text: `Permissões concedidas e ponte nativa ${providerName} conectada com sucesso!`,
        });
      } else {
        setStatusBanner({
          type: 'info',
          text: `Autorização para ${providerName} configurada! Como você está acessando via navegador Web/PWA (que bloqueia leitura direta em segundo plano do ${providerName}), nenhum dado fictício foi gerado. Utilize abaixo a importação de arquivo exportado (.xml/.json/.csv) ou sincronização verificada.`,
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect integration & revoke permissions
  const handleDisconnect = async () => {
    setSyncing(true);
    try {
      await onUpdateProfile({
        healthProvider: 'none',
        healthConnected: false,
        healthPermissions: [],
      });
      setExplicitConsentChecked(false);
      setStatusBanner({
        type: 'info',
        text: 'Integração desconectada e permissões revogadas com sucesso.',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Parse Apple Health XML/JSON/CSV or Health Connect JSON/CSV file export
  const handleHealthFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isConnected) {
      setStatusBanner({
        type: 'warning',
        text: 'Conecte e autorize primeiro o Apple Health ou Health Connect acima antes de importar dados.',
      });
      return;
    }

    setSyncing(true);
    setStatusBanner(null);

    try {
      const text = await file.text();
      let parsedSteps: number | undefined;
      let parsedDistanceKm: number | undefined;
      let parsedCalories: number | undefined;
      let parsedMinutes: number | undefined;
      let parsedHr: number | undefined;

      // 1. Try JSON format (Health Connect / Apple Health JSON export)
      if (file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        const root = Array.isArray(json) ? json[0] || {} : json.data || json;
        if (typeof root.steps === 'number') parsedSteps = root.steps;
        if (typeof root.stepCount === 'number') parsedSteps = root.stepCount;
        if (typeof root.distanceKm === 'number') parsedDistanceKm = root.distanceKm;
        if (typeof root.distanceMeters === 'number')
          parsedDistanceKm = Math.round((root.distanceMeters / 1000) * 100) / 100;
        if (typeof root.activeCalories === 'number') parsedCalories = root.activeCalories;
        if (typeof root.activeCaloriesKcal === 'number') parsedCalories = root.activeCaloriesKcal;
        if (typeof root.activeMinutes === 'number') parsedMinutes = root.activeMinutes;
        if (typeof root.exerciseMinutes === 'number') parsedMinutes = root.exerciseMinutes;
        if (typeof root.heartRateBpm === 'number') parsedHr = root.heartRateBpm;
        if (typeof root.restingHeartRate === 'number') parsedHr = root.restingHeartRate;
      }
      // 2. Try Apple Health XML format (<Record type="HKQuantityTypeIdentifierStepCount" value="..." />)
      else if (file.name.endsWith('.xml') || text.includes('HKQuantityTypeIdentifier')) {
        const sumRegexValues = (identifier: string) => {
          const regex = new RegExp(
            `type="${identifier}"[^>]*value="([0-9.]+)"`,
            'g'
          );
          let match: RegExpExecArray | null;
          let sum = 0;
          let count = 0;
          while ((match = regex.exec(text)) !== null) {
            sum += parseFloat(match[1]) || 0;
            count += 1;
          }
          return { sum, count };
        };

        const stepsRes = sumRegexValues('HKQuantityTypeIdentifierStepCount');
        if (stepsRes.count > 0) parsedSteps = Math.round(stepsRes.sum);

        const calRes = sumRegexValues('HKQuantityTypeIdentifierActiveEnergyBurned');
        if (calRes.count > 0) parsedCalories = Math.round(calRes.sum);

        const distRes = sumRegexValues('HKQuantityTypeIdentifierDistanceWalkingRunning');
        if (distRes.count > 0) parsedDistanceKm = Math.round(distRes.sum * 100) / 100;

        const minRes = sumRegexValues('HKQuantityTypeIdentifierAppleExerciseTime');
        if (minRes.count > 0) parsedMinutes = Math.round(minRes.sum);

        const hrRes = sumRegexValues('HKQuantityTypeIdentifierHeartRate');
        if (hrRes.count > 0) parsedHr = Math.round(hrRes.sum / hrRes.count);
      }
      // 3. Try CSV format (steps,distance_km,active_calories,active_minutes,heart_rate)
      else {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length >= 2) {
          const headers = lines[0].toLowerCase().split(/[,;]/);
          const vals = lines[lines.length - 1].split(/[,;]/);
          headers.forEach((h, i) => {
            const num = parseFloat(vals[i]);
            if (isNaN(num)) return;
            if (h.includes('step') || h.includes('passo')) parsedSteps = Math.round(num);
            if (h.includes('dist')) parsedDistanceKm = Math.round(num * 100) / 100;
            if (h.includes('cal') || h.includes('kcal')) parsedCalories = Math.round(num);
            if (h.includes('min') || h.includes('tempo')) parsedMinutes = Math.round(num);
            if (h.includes('hr') || h.includes('bpm') || h.includes('freq')) parsedHr = Math.round(num);
          });
        }
      }

      if (parsedSteps !== undefined) setInputSteps(String(parsedSteps));
      if (parsedDistanceKm !== undefined) setInputDistanceKm(String(parsedDistanceKm));
      if (parsedCalories !== undefined) setInputActiveCalories(String(parsedCalories));
      if (parsedMinutes !== undefined) setInputActiveMinutes(String(parsedMinutes));
      if (parsedHr !== undefined) setInputHeartRate(String(parsedHr));

      setStatusBanner({
        type: 'success',
        text: `Arquivo "${file.name}" lido com sucesso! Revise os valores importados abaixo e clique em "Sincronizar Dados Autorizados".`,
      });
    } catch {
      setStatusBanner({
        type: 'warning',
        text: 'Não foi possível interpretar este arquivo. Use um arquivo .xml/.json/.csv exportado do Apple Health ou Health Connect.',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Manual / File-backed Sync button handler respecting granted permissions and deduplicating workouts
  const handleManualSyncNow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isConnected) {
      setStatusBanner({
        type: 'warning',
        text: 'Conecte primeiro o Apple Health (iOS) ou Health Connect (Android) para sincronizar.',
      });
      return;
    }

    setSyncing(true);
    setStatusBanner(null);

    try {
      const targetHabit =
        habits.find((h) => h.dateKey === syncDate) || {
          id: syncDate,
          userId: profile.userId,
          dateKey: syncDate,
          waterMl: 0,
          waterGoalMl: profile.waterGoalMl || 2500,
          sleepHours: 7.5,
          recoveryScore: 8,
          meals: [],
          notes: '',
        };

      const stepsVal =
        selectedPermissions.includes('steps') && inputSteps.trim() !== ''
          ? Math.max(0, Math.min(200000, Math.round(Number(inputSteps) || 0)))
          : targetHabit.steps;

      const distVal =
        selectedPermissions.includes('distance') && inputDistanceKm.trim() !== ''
          ? Math.max(0, Math.min(500, Math.round((Number(inputDistanceKm) || 0) * 100) / 100))
          : targetHabit.distanceKm;

      const calVal =
        selectedPermissions.includes('active_calories') && inputActiveCalories.trim() !== ''
          ? Math.max(0, Math.min(20000, Math.round(Number(inputActiveCalories) || 0)))
          : targetHabit.activeCaloriesKcal;

      const minVal =
        selectedPermissions.includes('active_minutes') && inputActiveMinutes.trim() !== ''
          ? Math.max(0, Math.min(1440, Math.round(Number(inputActiveMinutes) || 0)))
          : targetHabit.activeMinutes;

      const hrVal =
        selectedPermissions.includes('heart_rate') &&
        inputHeartRate.trim() !== '' &&
        Number(inputHeartRate) >= 30
          ? Math.max(30, Math.min(250, Math.round(Number(inputHeartRate))))
          : targetHabit.heartRateBpm;

      await onSaveDailyHabit({
        userId: profile.userId,
        dateKey: syncDate,
        waterMl: targetHabit.waterMl,
        waterGoalMl: targetHabit.waterGoalMl,
        sleepHours: targetHabit.sleepHours,
        recoveryScore: targetHabit.recoveryScore,
        meals: targetHabit.meals,
        notes: targetHabit.notes || '',
        ...(stepsVal !== undefined ? { steps: stepsVal } : {}),
        ...(distVal !== undefined ? { distanceKm: distVal } : {}),
        ...(calVal !== undefined ? { activeCaloriesKcal: calVal } : {}),
        ...(minVal !== undefined ? { activeMinutes: minVal } : {}),
        ...(hrVal !== undefined ? { heartRateBpm: hrVal } : {}),
        healthSource: 'health_integration',
        healthProvider: currentProvider,
      });

      // Check if user also wants to import a workout from mobile health (with strict deduplication!)
      let workoutDedupMessage = '';
      if (
        selectedPermissions.includes('workouts') &&
        importWorkoutTitle.trim() &&
        onImportHealthWorkoutSession
      ) {
        const cleanTitle = importWorkoutTitle.trim();
        const alreadyExistsOnDate = sessions.some(
          (s) =>
            s.dateISO.slice(0, 10) === syncDate &&
            s.workoutName.toLowerCase() === cleanTitle.toLowerCase()
        );

        if (alreadyExistsOnDate) {
          workoutDedupMessage = ` (Treino "${cleanTitle}" já constava em ${syncDate} e foi ignorado para evitar duplicidade).`;
        } else {
          const durMin = Math.max(1, Math.min(360, Number(importWorkoutDurationMin) || 45));
          const kcal = Math.max(0, Math.min(5000, Number(importWorkoutCalories) || 0));
          await onImportHealthWorkoutSession({
            userId: profile.userId,
            workoutId: `health_import_${Date.now()}`,
            workoutName: cleanTitle.slice(0, 100),
            muscleGroups: ['Cardio'],
            dateISO: new Date(`${syncDate}T12:00:00`).toISOString(),
            durationSeconds: durMin * 60,
            totalVolumeKg: 0,
            setsCompleted: 1,
            exercisesCount: 1,
            prCount: 0,
            loggedSets: [],
            notes: `Importado via ${
              currentProvider === 'apple_health' ? 'Apple Health' : 'Health Connect'
            }`,
            dataSource: 'health_integration',
            healthProvider: currentProvider,
            ...(kcal > 0 ? { activeCaloriesKcal: kcal } : {}),
          });
          setImportWorkoutTitle('');
          setImportWorkoutDurationMin('');
          setImportWorkoutCalories('');
          workoutDedupMessage = ` Treino "${cleanTitle}" importado sem duplicidade!`;
        }
      }

      const nowISO = new Date().toISOString();
      await onUpdateProfile({
        healthPermissions: selectedPermissions,
        healthLastSyncISO: nowISO,
      });

      setStatusBanner({
        type: 'success',
        text: `Sincronização concluída em ${new Date(nowISO).toLocaleTimeString('pt-BR')}! Origem marcada como ${
          currentProvider === 'apple_health' ? 'Apple Health (iOS)' : 'Health Connect (Android)'
        }.${workoutDedupMessage}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#4B1BD6] via-[#5E2EE8] to-[#7C4DFF] rounded-3xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              <Watch className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">
                Central Oficial · Saúde e Dispositivos
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Apple Health &amp; Health Connect
              </h2>
              <p className="text-xs text-purple-100 mt-0.5">
                Sincronize passos, calorias ativas, distância, frequência cardíaca e treinos reais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                isConnected
                  ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/40'
                  : 'bg-white/15 text-purple-100 border border-white/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'
                }`}
              />
              {isConnected
                ? currentProvider === 'apple_health'
                  ? 'Conectado: Apple Health'
                  : 'Conectado: Health Connect'
                : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* ARCHITECTURAL TRANSPARENCY NOTICE (MANDATORY PER SECTION 5) */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-4 sm:p-5 space-y-2">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-950 leading-relaxed">
            <strong className="font-extrabold text-amber-900 block text-sm">
              Diagnóstico Técnico de Arquitetura ({runtimeEnv.isNativeHybrid ? 'Container Híbrido Nativo Detectado' : 'Modo Web / PWA no Navegador'})
            </strong>
            {runtimeEnv.isNativeHybrid ? (
              <p>
                A ponte nativa para acesso ao kit de saúde do sistema operacional está ativa neste dispositivo. Seus dados autorizados são lidos diretamente mediante sua permissão.
              </p>
            ) : (
              <p>
                Você está executando o PomboFit como <strong>Web App / PWA via navegador</strong>. Por segurança dos sistemas iOS e Android, navegadores web não têm acesso direto em segundo plano ao banco nativo do <strong>Apple HealthKit</strong> ou <strong>Android Health Connect</strong> sem um empacotador nativo (Capacitor / React Native).{' '}
                <strong>O PomboFit jamais finge conexão ou inventa passos/calorias automáticas.</strong> A arquitetura de ponte nativa (<code className="font-mono bg-amber-100 px-1 rounded">window.Capacitor.Plugins.HealthKit / HealthConnect</code>) já está integrada e pronta, e no modo Web/PWA você pode importar arquivos exportados do Apple Health / Health Connect ou sincronizar os dados reais registrados no seu aparelho abaixo.
              </p>
            )}
          </div>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-2.5 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusBanner.type === 'warning'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-[#F4F0FF] border-[#DDD3F8] text-[#1E1638]'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* CONNECTION STATUS & PROVIDER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Apple Health (iOS) */}
        <div
          className={`bg-white rounded-3xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
            isConnected && currentProvider === 'apple_health'
              ? 'border-[#5E2EE8] shadow-md'
              : 'border-slate-200'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E1638]">
                    Apple Health (iOS)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    iPhone &amp; Apple Watch (HealthKit)
                  </span>
                </div>
              </div>
              {isConnected && currentProvider === 'apple_health' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sincroniza contagem de passos, distância caminhada/corrida, energia ativa (kcal), minutos de exercício, batimentos cardíacos e treinos do iOS.
            </p>
          </div>

          <button
            type="button"
            disabled={syncing}
            onClick={() => handleConnectProvider('apple_health')}
            className={`w-full py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isConnected && currentProvider === 'apple_health'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[#5E2EE8] text-white hover:bg-[#4E21D0]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>
              {isConnected && currentProvider === 'apple_health'
                ? 'Atualizar Permissões do Apple Health'
                : 'Conectar com Apple Health (iOS)'}
            </span>
          </button>
        </div>

        {/* Card 2: Health Connect (Android) */}
        <div
          className={`bg-white rounded-3xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
            isConnected && currentProvider === 'health_connect'
              ? 'border-[#5E2EE8] shadow-md'
              : 'border-slate-200'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E1638]">
                    Health Connect (Android)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Android, Samsung Health, Google Fit &amp; Wear OS
                  </span>
                </div>
              </div>
              {isConnected && currentProvider === 'health_connect' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Integra passos diários, calorias ativas, distância percorrida, tempo de atividade, frequência cardíaca e sessões do ecossistema Android.
            </p>
          </div>

          <button
            type="button"
            disabled={syncing}
            onClick={() => handleConnectProvider('health_connect')}
            className={`w-full py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isConnected && currentProvider === 'health_connect'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[#1E1638] text-white hover:bg-[#2F2356]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>
              {isConnected && currentProvider === 'health_connect'
                ? 'Atualizar Permissões do Health Connect'
                : 'Conectar com Health Connect (Android)'}
            </span>
          </button>
        </div>
      </div>

      {/* EXPLICIT USER AUTHORIZATION & GRANULAR PERMISSIONS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block">
              Controle de Privacidade do Usuário
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-[#1E1638]">
              Permissões de Dados de Saúde Compartilhados
            </h3>
            <p className="text-xs text-slate-500">
              Escolha exatamente quais métricas você autoriza o PomboFit a ler e sincronizar.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500">
            {selectedPermissions.length} de {HEALTH_PERMISSIONS_CATALOG.length} selecionadas
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HEALTH_PERMISSIONS_CATALOG.map((perm) => {
            const checked = selectedPermissions.includes(perm.id);
            return (
              <label
                key={perm.id}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  checked
                    ? 'border-[#5E2EE8] bg-[#F6F3FF]'
                    : 'border-slate-200 bg-[#FAF9FC] hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePermission(perm.id)}
                  className="w-4 h-4 mt-0.5 accent-[#5E2EE8] shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#1E1638]">{perm.label}</div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {perm.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Explicit Consent Checkbox */}
        <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 cursor-pointer">
          <input
            type="checkbox"
            checked={explicitConsentChecked}
            onChange={(e) => setExplicitConsentChecked(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-[#5E2EE8] shrink-0"
          />
          <div className="text-xs text-[#1E1638] leading-relaxed">
            <strong className="font-extrabold block">
              Autorização Explícita de Leitura de Dados de Saúde
            </strong>
            Autorizo o PomboFit a importar exclusivamente as categorias marcadas acima para exibição no meu Dashboard e Histórico Pessoal. Posso revogar esta permissão e desconectar a qualquer momento.
          </div>
        </label>
      </div>

      {/* STATUS PANEL: CONNECTION STATUS, GRANTED PERMISSIONS, LAST SYNC, SYNC & DISCONNECT BUTTONS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#1E1638] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#5E2EE8]" />
              <span>Status da Conexão e Sincronização</span>
            </h3>
            <p className="text-xs text-slate-500">
              Última sincronização:{' '}
              <strong className="text-[#1E1638]">
                {profile.healthLastSyncISO
                  ? new Date(profile.healthLastSyncISO).toLocaleString('pt-BR')
                  : 'Nenhuma sincronização realizada ainda'}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={!isConnected || syncing}
              onClick={() => handleManualSyncNow()}
              className="px-4 py-2.5 rounded-xl bg-[#5E2EE8] hover:bg-[#4E21D0] disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar Agora</span>
            </button>

            {isConnected && (
              <button
                type="button"
                disabled={syncing}
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Unlink className="w-4 h-4" />
                <span>Desconectar Integração</span>
              </button>
            )}
          </div>
        </div>

        {/* Granted permissions list */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Permissões Concedidas Atualmente:
          </span>
          {!isConnected || (profile.healthPermissions || []).length === 0 ? (
            <p className="text-xs text-slate-500 bg-[#FAF9FC] p-3 rounded-xl border border-slate-100">
              Nenhuma integração ativa no momento. Conecte o Apple Health ou Health Connect acima para habilitar a sincronização.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.healthPermissions || []).map((permId) => {
                const meta = HEALTH_PERMISSIONS_CATALOG.find((p) => p.id === permId);
                return (
                  <span
                    key={permId}
                    className="px-3 py-1.5 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{meta?.label || permId}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AUTHORIZED HEALTH DATA SYNC & FILE IMPORTER (XML / JSON / CSV + VERIFIED ENTRY) */}
      {isConnected && (
        <form
          onSubmit={handleManualSyncNow}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block">
                Sincronização de Dados Reais ({currentProvider === 'apple_health' ? 'Apple Health' : 'Health Connect'})
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1E1638]">
                Importar Arquivo de Saúde ou Sincronizar Leitura do Aparelho
              </h3>
              <p className="text-xs text-slate-500">
                Importe um arquivo exportado (.xml, .json, .csv) do seu celular ou informe os valores exatos exibidos no seu aplicativo de saúde hoje.
              </p>
            </div>

            <label className="px-4 py-2.5 rounded-xl bg-[#F0EBFE] hover:bg-[#E4DCFC] text-[#5E2EE8] text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors">
              <FileUp className="w-4 h-4" />
              <span>Importar Arquivo (.xml / .json / .csv)</span>
              <input
                type="file"
                accept=".xml,.json,.csv,.txt"
                onChange={handleHealthFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1638] mb-1">
                Data da Sincronização
              </label>
              <input
                type="date"
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm font-bold font-mono-tabular"
              />
            </div>

            {selectedPermissions.includes('steps') && (
              <div>
                <label className="block text-xs font-bold text-[#1E1638] mb-1">
                  Passos do Dia
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={200000}
                  value={inputSteps}
                  onChange={(e) => setInputSteps(e.target.value)}
                  placeholder="Ex: 8450"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-base font-black font-mono-tabular"
                />
              </div>
            )}

            {selectedPermissions.includes('distance') && (
              <div>
                <label className="block text-xs font-bold text-[#1E1638] mb-1">
                  Distância Caminhada / Corrida (km)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={500}
                  value={inputDistanceKm}
                  onChange={(e) => setInputDistanceKm(e.target.value)}
                  placeholder="Ex: 5.8"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-base font-black font-mono-tabular"
                />
              </div>
            )}

            {selectedPermissions.includes('active_calories') && (
              <div>
                <label className="block text-xs font-bold text-[#1E1638] mb-1">
                  Calorias Ativas da Saúde (kcal)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20000}
                  value={inputActiveCalories}
                  onChange={(e) => setInputActiveCalories(e.target.value)}
                  placeholder="Ex: 380"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-base font-black font-mono-tabular"
                />
              </div>
            )}

            {selectedPermissions.includes('active_minutes') && (
              <div>
                <label className="block text-xs font-bold text-[#1E1638] mb-1">
                  Tempo de Exercício (min)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1440}
                  value={inputActiveMinutes}
                  onChange={(e) => setInputActiveMinutes(e.target.value)}
                  placeholder="Ex: 45"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-base font-black font-mono-tabular"
                />
              </div>
            )}

            {selectedPermissions.includes('heart_rate') && (
              <div>
                <label className="block text-xs font-bold text-[#1E1638] mb-1">
                  Frequência Cardíaca Média (bpm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={30}
                  max={250}
                  value={inputHeartRate}
                  onChange={(e) => setInputHeartRate(e.target.value)}
                  placeholder="Ex: 74"
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-base font-black font-mono-tabular"
                />
              </div>
            )}
          </div>

          {/* Optional Workout Import with Automatic Deduplication */}
          {selectedPermissions.includes('workouts') && (
            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#5E2EE8]">
                  Importar Sessão de Treino do Dispositivo (Com Anti-Duplicidade)
                </span>
                <span className="text-[11px] text-slate-500">Opcional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={importWorkoutTitle}
                  onChange={(e) => setImportWorkoutTitle(e.target.value)}
                  placeholder="Nome da atividade (ex: Corrida Externa)"
                  className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={importWorkoutDurationMin}
                  onChange={(e) => setImportWorkoutDurationMin(e.target.value)}
                  placeholder="Duração (min)"
                  className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold font-mono-tabular"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={importWorkoutCalories}
                  onChange={(e) => setImportWorkoutCalories(e.target.value)}
                  placeholder="Calorias ativas (kcal)"
                  className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold font-mono-tabular"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={syncing}
              className="px-6 py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Dados Autorizados'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
