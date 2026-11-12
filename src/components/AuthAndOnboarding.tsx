import React, { useState, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  FitnessGoal,
  ExperienceLevel,
  EquipmentCategory,
  MuscleCategory,
  UserProfile,
  WorkoutSplitCategory,
  WorkoutSplitType,
} from '../types';
import {
  MASCOT_DATA,
  goalToMascotForm,
  WORKOUT_SPLITS_CATALOG,
  MUSCLE_COMBO_OPTIONS,
  checkSplitCompatibility,
} from '../data/gamificationAndMascot';
import { EQUIPMENT_CATEGORIES, MUSCLE_CATEGORIES } from '../data/exercisesCatalog';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  Dumbbell,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  AlertCircle,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallBar';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFirebaseAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'E-mail ou senha incorretos. Verifique seus dados ou entre com o Google.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
    }
    if (code === 'auth/weak-password') {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'O provedor E-mail/Senha ainda precisa ser ativado no Firebase Console. Utilize o botão "Entrar com Google".';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'A janela de autenticação foi fechada antes de concluir.';
    }
    return err instanceof Error ? err.message : 'Não foi possível autenticar no momento.';
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Por favor, informe seu nome completo.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem. Digite novamente.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, {
          displayName: name.trim(),
          photoURL: avatarPreview || undefined,
        });
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg('Link de redefinição de senha enviado para sua caixa de entrada.');
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // TELA 2 — CADASTRO (MATCHING REFERENCE EXACTLY)
  if (mode === 'register') {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden">
        {/* Top bar with back arrow */}
        <header className="px-6 py-4 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="p-2 -ml-2 text-[#1E1638] hover:text-[#5E2EE8] transition-colors cursor-pointer"
            aria-label="Voltar para login"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <PWAInstallButton />
        </header>

        {/* Content Container */}
        <main className="flex-1 flex flex-col justify-center px-6 py-2 max-w-sm mx-auto w-full z-10">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-black text-[#1E1638] tracking-tight">
              Cadastrar Conta
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Comece sua jornada fitness com o PomboFit!
            </p>
          </div>

          {/* Circular Photo Picker */}
          <div className="flex flex-col items-center mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-[#EDE7FD] flex items-center justify-center text-[#5E2EE8] hover:scale-105 active:scale-95 transition-transform overflow-hidden shadow-xs cursor-pointer ring-4 ring-[#F5F0FF]"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar selecionado"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-[#5E2EE8]" strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-[#5E2EE8] hover:underline mt-2 cursor-pointer"
            >
              Alterar Foto
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {/* Nome Completo */}
            <div className="relative">
              <User className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome Completo"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
              />
            </div>

            {/* E-mail */}
            <div className="relative">
              <Mail className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <Lock className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-[#5E2EE8] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirmar Senha */}
            <div className="relative">
              <Lock className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar Senha"
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-[#5E2EE8] cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#5E2EE8]/25 transition-all cursor-pointer disabled:opacity-60 mt-2"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-5 text-center text-xs text-slate-600">
            <span>Já tenho uma conta? </span>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="font-bold text-[#5E2EE8] hover:underline cursor-pointer"
            >
              Entrar
            </button>
          </div>
        </main>

        {/* Bottom decorative wave */}
        <div className="w-full h-12 bg-gradient-to-t from-[#5E2EE8]/20 via-[#5E2EE8]/5 to-transparent rounded-t-[32px] pointer-events-none" />
      </div>
    );
  }

  // TELA 1 — LOGIN & RESET (MATCHING REFERENCE EXACTLY)
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-end z-10">
        <PWAInstallButton />
      </header>

      {/* Main Login Screen */}
      <main className="flex-1 flex flex-col justify-center px-6 py-2 max-w-sm mx-auto w-full z-10">
        {/* Mascote Oficial Pombo Seco em Destaque */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center">
            <img
              src="/assets/mascots/pombo_hero_bust.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/mascots/pombo_head.jpg';
              }}
              alt="Pombo Seco Oficial"
              className="w-full h-full object-contain filter drop-shadow-lg select-none"
            />
          </div>

          {/* Logotipo PomboFit com P e F roxos */}
          <h1 className="text-3xl sm:text-4xl font-black text-[#1E1638] tracking-tight mt-1">
            <span className="text-[#5E2EE8]">P</span>ombo<span className="text-[#5E2EE8]">F</span>it
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Seu personal trainer na palma da mão!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'reset' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-bold text-[#1E1638]">Recuperar Senha</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Digite seu e-mail para receber as instruções de recuperação.
              </p>
            </div>

            <div className="relative">
              <Mail className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail cadastrado"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#5E2EE8]/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-bold text-[#5E2EE8] hover:underline cursor-pointer"
              >
                Voltar ao login
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Form Login */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {/* E-mail */}
              <div className="relative">
                <Mail className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
                />
              </div>

              {/* Senha */}
              <div className="relative">
                <Lock className="w-5 h-5 text-[#5E2EE8] absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-purple-100 bg-white focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none text-sm text-[#1E1638] placeholder-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-[#5E2EE8] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#5E2EE8]/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Separador ou */}
            <div className="my-3.5 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-[1px] bg-slate-200 flex-1" />
              <span>ou</span>
              <div className="h-[1px] bg-slate-200 flex-1" />
            </div>

            {/* Entrar com Google */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-[#1E1638] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>

            {/* Links Cadastrar novo usuário / Recuperar senha */}
            <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-bold text-[#5E2EE8] hover:underline cursor-pointer"
              >
                Cadastrar novo usuário
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-[#5E2EE8] hover:underline cursor-pointer"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </>
        )}
      </main>

      {/* Bottom decorative wave */}
      <div className="w-full h-12 bg-gradient-to-t from-[#5E2EE8]/20 via-[#5E2EE8]/5 to-transparent rounded-t-[32px] pointer-events-none" />
    </div>
  );
};

interface OnboardingWizardProps {
  uid: string;
  initialDisplayName: string;
  initialPhotoUrl?: string;
  onComplete: (profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  uid,
  initialDisplayName,
  initialPhotoUrl,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(initialDisplayName || '');
  const [age, setAge] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [goal, setGoal] = useState<FitnessGoal>('gain_muscle');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [trainingLocation, setTrainingLocation] = useState('Academia Completa');
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentCategory[]>([
    'Máquinas',
    'Halteres',
    'Barras',
    'Cabos',
    'Peso corporal',
  ]);
  const [weeklyDays, setWeeklyDays] = useState<number>(4);
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState<string>('');

  // Step 3: Workout Split Organization
  const [workoutSplitCategory, setWorkoutSplitCategory] = useState<WorkoutSplitCategory>('ai_auto');
  const [workoutSplitType, setWorkoutSplitType] = useState<WorkoutSplitType>('ai_auto');
  const [customMuscleCombos, setCustomMuscleCombos] = useState<string[]>([
    'peito_triceps',
    'costas_biceps',
    'pernas_completas',
  ]);
  const [incompatibilityConfirmed, setIncompatibilityConfirmed] = useState(false);

  const [priorityMuscles, setPriorityMuscles] = useState<MuscleCategory[]>([
    'Peito',
    'Costas',
    'Quadríceps',
  ]);
  const [limitations, setLimitations] = useState('');

  // Mandatory mapping: Emagrecimento -> Pombo Seco, Ganho de Massa -> Pombo Grande, Força -> Pombo Forte
  const activeMascotForm = goalToMascotForm(goal);
  const activeMascot = MASCOT_DATA[activeMascotForm];

  const compatibility = checkSplitCompatibility(workoutSplitType, weeklyDays, customMuscleCombos, {
    goal,
    experienceLevel,
  });

  const toggleEquip = (eq: EquipmentCategory) => {
    setAvailableEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const togglePriorityMuscle = (m: MuscleCategory) => {
    setPriorityMuscles((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m].slice(0, 6)
    );
  };

  const toggleMuscleCombo = (comboId: string) => {
    setIncompatibilityConfirmed(false);
    setCustomMuscleCombos((prev) =>
      prev.includes(comboId) ? prev.filter((item) => item !== comboId) : [...prev, comboId]
    );
  };

  const handleSelectSplitCategory = (cat: WorkoutSplitCategory) => {
    setWorkoutSplitCategory(cat);
    setIncompatibilityConfirmed(false);
    if (cat === 'ai_auto') {
      setWorkoutSplitType('ai_auto');
    } else if (cat === 'letters') {
      setWorkoutSplitType(weeklyDays <= 2 ? 'AB' : weeklyDays === 3 ? 'ABC' : weeklyDays === 4 ? 'ABCD' : weeklyDays === 5 ? 'ABCDE' : 'ABCDEF');
    } else if (cat === 'modality') {
      setWorkoutSplitType(weeklyDays <= 2 ? 'full_body' : weeklyDays === 4 ? 'upper_lower' : 'push_pull_legs');
    } else if (cat === 'muscle_groups') {
      setWorkoutSplitType('muscle_groups');
    }
  };

  const handleProceedFromStep3 = () => {
    if (!compatibility.isCompatible && !incompatibilityConfirmed) {
      return;
    }
    setStep(4);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const parsedDuration = customDuration
        ? Math.min(240, Math.max(15, Number(customDuration) || 60))
        : sessionDurationMin;

      const profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        userId: uid,
        displayName: displayName.trim() || initialDisplayName || 'Atleta PomboFit',
        ...(initialPhotoUrl ? { photoURL: initialPhotoUrl } : {}),
        ...(age && Number(age) >= 10 ? { age: Number(age) } : {}),
        ...(heightCm && Number(heightCm) >= 50 ? { heightCm: Number(heightCm) } : {}),
        ...(weightKg && Number(weightKg) >= 20 ? { weightKg: Number(weightKg) } : {}),
        goal,
        mascotForm: activeMascotForm,
        experienceLevel,
        trainingLocation: trainingLocation.slice(0, 60),
        availableEquipment:
          availableEquipment.length > 0 ? availableEquipment : ['Peso corporal'],
        weeklyDays,
        sessionDurationMin: parsedDuration,
        workoutSplitCategory,
        workoutSplitType,
        customMuscleCombos: workoutSplitType === 'muscle_groups' ? customMuscleCombos : [],
        priorityMuscles,
        limitations: limitations.trim().slice(0, 500),
        xp: 100,
        level: 1,
        streakDays: 0,
        unlockedAchievementIds: [],
        unlockedAccessories: [
          'headband_classic',
          'outfit_classic',
          'shoes_classic',
          'pose_determined',
        ],
        equippedHeadband: 'headband_classic',
        equippedOutfit: 'outfit_classic',
        equippedShoes: 'shoes_classic',
        equippedPose: 'pose_determined',
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        waterGoalMl: 2500,
        unitSystem: 'metric',
        autoStartRestTimer: true,
        soundAlerts: true,
        notifWorkoutReminder: true,
        notifWeeklyGoal: true,
        notifAchievements: true,
        notifWaterReminder: true,
        onboardingCompleted: true,
      };

      await onComplete(profileData);
    } finally {
      setSaving(false);
    }
  };

  const selectedSplitInfo = WORKOUT_SPLITS_CATALOG.find((s) => s.id === workoutSplitType);

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header & Step Progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7650C9] text-white font-extrabold flex items-center justify-center">
              P
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#24212B]">
                Avaliação Individual PomboFit
              </h1>
              <p className="text-xs text-slate-500">Etapa {step} de 4</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s <= step ? 'w-8 bg-[#7650C9]' : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#24212B]">
                Escolha seu Objetivo e seu Personagem Oficial
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Seu objetivo define o personagem que representará você em todo o aplicativo e orienta a programação individual dos seus treinos.
              </p>
            </div>

            {/* 3 Mandatory Mascot Transformations Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['lose_weight', 'gain_muscle', 'get_strong'] as FitnessGoal[]).map((g) => {
                const mForm = goalToMascotForm(g);
                const m = MASCOT_DATA[mForm];
                const selected = goal === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`text-left rounded-3xl p-4 border-2 transition-all cursor-pointer flex flex-col ${
                      selected
                        ? 'border-[#7650C9] bg-[#F2EDFF]/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-44 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-2 mb-3">
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7650C9] uppercase">
                        {m.goalLabel}
                      </span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-[#7650C9] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-[#24212B] mt-1">{m.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Personal & Body Data */}
            <div className="bg-[#FAF9FC] border border-slate-200 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-[#24212B]">
                Seus Dados Pessoais e Corporais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Como devemos chamar você? *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome ou apelido"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:border-[#7650C9] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Idade (anos)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={110}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 25"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:border-[#7650C9] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:col-span-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="Ex: 175"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:border-[#7650C9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="Ex: 72"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:border-[#7650C9] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-7 py-3.5 rounded-2xl bg-[#7650C9] text-white font-bold text-sm hover:bg-[#6440B5] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Próxima Etapa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#24212B]">
                Experiência, Frequência e Equipamentos
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Essas informações definem o volume, a seleção de aparelhos e a intensidade das suas séries.
              </p>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#24212B] uppercase tracking-wider">
                Nível de Experiência
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { id: 'beginner', label: 'Iniciante', desc: 'Menos de 6 meses de treino' },
                    { id: 'intermediate', label: 'Intermediário', desc: '6 meses a 2 anos consistentes' },
                    { id: 'advanced', label: 'Avançado', desc: 'Mais de 2 anos de experiência' },
                  ] as const
                ).map((lv) => (
                  <button
                    key={lv.id}
                    type="button"
                    onClick={() => setExperienceLevel(lv.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      experienceLevel === lv.id
                        ? 'border-[#7650C9] bg-[#F2EDFF] text-[#24212B]'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#24212B]">{lv.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{lv.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Days (2 to 7) & Session Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF9FC] border border-slate-200 rounded-3xl p-5">
              <div>
                <label className="block text-xs font-bold text-[#24212B] mb-2">
                  Dias disponíveis por semana: <span className="text-[#7650C9]">{weeklyDays} dias</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setWeeklyDays(d);
                        setIncompatibilityConfirmed(false);
                      }}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                        weeklyDays === d
                          ? 'bg-[#7650C9] text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {d}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24212B] mb-2">
                  Duração por sessão
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[30, 45, 60, 90].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setSessionDurationMin(min);
                        setCustomDuration('');
                      }}
                      className={`py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        sessionDurationMin === min && !customDuration
                          ? 'bg-[#7650C9] text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Ou personalizado (ex: 50 min)"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Training Location & Equipment */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Academia Completa', 'Academia de Condomínio', 'Treino em Casa / Calistenia'].map(
                  (loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setTrainingLocation(loc)}
                      className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                        trainingLocation === loc
                          ? 'border-[#7650C9] bg-[#F2EDFF] text-[#7650C9]'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  )
                )}
              </div>

              <label className="block text-xs font-bold text-[#24212B] pt-2">
                Equipamentos disponíveis (selecione todos que possui acesso)
              </label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_CATEGORIES.map((eq) => {
                  const active = availableEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquip(eq)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#7650C9] text-white border-[#7650C9]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-7 py-3.5 rounded-2xl bg-[#7650C9] text-white font-bold text-sm hover:bg-[#6440B5] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Próxima Etapa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#24212B]">
                Escolha da Divisão e Organização dos Treinos
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Defina como prefere organizar suas fichas semanais ou deixe a IA decidir a estrutura ideal para seus {weeklyDays} dias disponíveis.
              </p>
            </div>

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'ai_auto' as WorkoutSplitCategory,
                  label: 'Decisão pela IA',
                  desc: 'Não sei, deixe a IA decidir por mim',
                  icon: Sparkles,
                },
                {
                  id: 'letters' as WorkoutSplitCategory,
                  label: 'Divisão por Letras',
                  desc: 'AB, ABC, ABCD, ABCDE ou ABCDEF',
                  icon: Layers,
                },
                {
                  id: 'modality' as WorkoutSplitCategory,
                  label: 'Outras Modalidades',
                  desc: 'Full Body, Upper/Lower ou Push/Pull/Legs',
                  icon: Dumbbell,
                },
                {
                  id: 'muscle_groups' as WorkoutSplitCategory,
                  label: 'Por Grupos Musculares',
                  desc: 'Monte combinações personalizadas',
                  icon: ShieldCheck,
                },
              ].map((cat) => {
                const IconComp = cat.icon;
                const active = workoutSplitCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectSplitCategory(cat.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'border-[#7650C9] bg-[#F2EDFF]/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#EDE7FD] text-[#5E2EE8] flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      {active && (
                        <span className="w-5 h-5 rounded-full bg-[#7650C9] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#24212B]">{cat.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Option D: AI Auto Decision */}
            {workoutSplitCategory === 'ai_auto' && (
              <div className="bg-[#FAF8FF] border-2 border-[#7650C9] rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-[#5E2EE8]">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Recomendação Inteligente Ativa
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#24212B]">
                  &ldquo;Não sei, deixe a IA decidir por mim&rdquo;
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {compatibility.explanation}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[#EDE7FD] text-[#5E2EE8] text-xs font-extrabold">
                    Divisão Recomendada: {compatibility.suggestedSplitLabel}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-100 text-slate-600 text-xs font-bold">
                    Frequência: {weeklyDays}x/semana • {customDuration || sessionDurationMin} min
                  </span>
                </div>
              </div>
            )}

            {/* Option B: Letters (AB, ABC, ABCD, ABCDE, ABCDEF) */}
            {workoutSplitCategory === 'letters' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#24212B] uppercase tracking-wider">
                  Escolha a divisão por letras
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {WORKOUT_SPLITS_CATALOG.filter((s) => s.category === 'letters').map((split) => {
                    const active = workoutSplitType === split.id;
                    return (
                      <button
                        key={split.id}
                        type="button"
                        onClick={() => {
                          setWorkoutSplitType(split.id);
                          setIncompatibilityConfirmed(false);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#7650C9] bg-[#F2EDFF] text-[#24212B]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-[#24212B]">
                            {split.title}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#EDE7FD] text-[#5E2EE8]">
                            {split.sheetsCount} fichas
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {split.subtitle}
                        </p>
                        <div className="text-[11px] font-bold text-[#7650C9] mt-2">
                          {split.recommendedFor}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Option C: Other Modalities (Full Body, Upper/Lower, Push/Pull/Legs) */}
            {workoutSplitCategory === 'modality' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#24212B] uppercase tracking-wider">
                  Escolha a modalidade de organização
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {WORKOUT_SPLITS_CATALOG.filter((s) => s.category === 'modality').map((split) => {
                    const active = workoutSplitType === split.id;
                    return (
                      <button
                        key={split.id}
                        type="button"
                        onClick={() => {
                          setWorkoutSplitType(split.id);
                          setIncompatibilityConfirmed(false);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#7650C9] bg-[#F2EDFF] text-[#24212B]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-sm text-[#24212B]">{split.title}</div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {split.subtitle}
                        </p>
                        <div className="text-[11px] font-bold text-[#7650C9] mt-2">
                          {split.recommendedFor}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Option A: Muscle Group Combinations */}
            {workoutSplitCategory === 'muscle_groups' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#24212B] uppercase tracking-wider">
                    Selecione as combinações de grupos musculares ({customMuscleCombos.length} fichas selecionadas)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MUSCLE_COMBO_OPTIONS.map((combo) => {
                    const active = customMuscleCombos.includes(combo.id);
                    return (
                      <button
                        key={combo.id}
                        type="button"
                        onClick={() => toggleMuscleCombo(combo.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          active
                            ? 'border-[#7650C9] bg-[#F2EDFF] text-[#24212B]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-[#24212B]">{combo.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{combo.shortDesc}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            active ? 'bg-[#7650C9] text-white' : 'border border-slate-300'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compatibility Validation Box */}
            {!compatibility.isCompatible ? (
              <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold text-amber-950">
                      {compatibility.title}
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      {compatibility.explanation}
                    </p>
                    <p className="text-xs font-bold text-amber-950 mt-1.5">
                      {compatibility.adaptationNote}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const sug = WORKOUT_SPLITS_CATALOG.find(
                        (s) => s.id === compatibility.suggestedSplitType
                      );
                      if (sug) {
                        setWorkoutSplitCategory(sug.category);
                        setWorkoutSplitType(sug.id);
                        setIncompatibilityConfirmed(true);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold cursor-pointer hover:bg-[#4E21D0]"
                  >
                    Adotar sugestão: {compatibility.suggestedSplitLabel}
                  </button>

                  {compatibility.suggestedWeeklyDays !== weeklyDays && (
                    <button
                      type="button"
                      onClick={() => {
                        setWeeklyDays(compatibility.suggestedWeeklyDays);
                        setIncompatibilityConfirmed(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-amber-400 text-amber-950 text-xs font-bold cursor-pointer hover:bg-amber-100"
                    >
                      Mudar frequência para {compatibility.suggestedWeeklyDays} dias/semana
                    </button>
                  )}

                  {!(workoutSplitType === 'muscle_groups' && customMuscleCombos.length < 2) && (
                    <button
                      type="button"
                      onClick={() => setIncompatibilityConfirmed(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                        incompatibilityConfirmed
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      {incompatibilityConfirmed
                        ? 'Confirmado: Manter divisão rotativa'
                        : 'Manter minha escolha mesmo assim'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              workoutSplitCategory !== 'ai_auto' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-emerald-950">
                      {compatibility.title}
                    </div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      {compatibility.explanation}
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!compatibility.isCompatible && !incompatibilityConfirmed}
                onClick={handleProceedFromStep3}
                className="px-7 py-3.5 rounded-2xl bg-[#7650C9] text-white font-bold text-sm hover:bg-[#6440B5] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Próxima Etapa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#24212B]">
                Prioridades Musculares e Restrições Articulares
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                O PomboFit nunca prescreve exercícios incompatíveis com limitações informadas por você.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] mb-2">
                Grupos musculares prioritários
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_CATEGORIES.map((m) => {
                  const active = priorityMuscles.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => togglePriorityMuscle(m)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#7650C9] text-white border-[#7650C9]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#FAF9FC] border border-slate-200 rounded-3xl p-5">
              <label className="block text-xs font-bold text-[#24212B] mb-1.5">
                Possui alguma limitação ou sensibilidade articular? (Opcional)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Ex: &ldquo;Desconforto no ombro direito&rdquo;, &ldquo;Evitar impacto no joelho&rdquo;, &ldquo;Sensibilidade na lombar&rdquo;. Deixe em branco se não houver restrições.
              </p>
              <textarea
                rows={3}
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                placeholder="Descreva qualquer restrição ou deixe em branco..."
                className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-sm focus:border-[#7650C9] focus:outline-none"
              />
            </div>

            {/* Summary Card with Mascot & Split */}
            <div className="bg-[#F2EDFF] border border-[#E4D9FF] rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-5">
              <img
                src={activeMascot.imageUrl}
                alt={activeMascot.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 object-contain bg-white rounded-2xl p-2 border border-[#E4D9FF]"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs font-bold text-[#7650C9] uppercase">
                  Personagem Oficial Vinculado: {activeMascot.name} ({activeMascot.goalLabel})
                </div>
                <h4 className="text-base font-extrabold text-[#24212B] mt-0.5">
                  {workoutSplitType === 'ai_auto'
                    ? `Divisão IA (${compatibility.suggestedSplitLabel})`
                    : selectedSplitInfo?.title || 'Divisão Personalizada'}{' '}
                  · {weeklyDays} dias/semana · {customDuration || sessionDurationMin} min
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  A IA vai montar suas fichas individuais exclusivamente com base nas suas respostas acima.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleFinish}
                className="px-8 py-4 rounded-2xl bg-[#7650C9] text-white font-extrabold text-sm hover:bg-[#6440B5] transition-colors flex items-center gap-2 shadow-md shadow-[#7650C9]/20 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                <span>{saving ? 'Gerando fichas individuais com IA...' : 'Concluir e Gerar Meus Treinos'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
