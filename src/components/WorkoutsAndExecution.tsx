import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkoutPlan,
  WorkoutExerciseSlot,
  ExerciseItem,
  ExerciseHistoryLog,
  ActiveSessionState,
  LoggedSetEntry,
  MuscleCategory,
  UserProfile,
} from '../types';
import {
  EXERCISES_CATALOG,
  MUSCLE_CATEGORIES,
  getExerciseById,
} from '../data/exercisesCatalog';
import { MASCOT_DATA } from '../data/gamificationAndMascot';
import {
  ExerciseDemonstrationCard,
  ExerciseVerifiedVisual,
  resolveExerciseApparatus,
} from './AnatomicalVisuals';
import {
  ExerciseDetailModal,
  ExerciseLibraryBrowser,
  ExerciseSubstitutionModal,
} from './ExerciseLibraryAndDetailModal';
import { HumanAnatomicalPostWorkoutMap } from './HumanAnatomicalPostWorkoutMap';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Dumbbell,
  Edit3,
  FileUp,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  ShieldAlert,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Bell,
  Smartphone,
} from 'lucide-react';
import {
  executeRestAlerts,
  unlockMobileAudio,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  isIOSDevice,
  sendRestFinishedNotification,
  scheduleRestNotificationInSW,
  cancelRestNotificationInSW,
  subscribeUserToWebPush,
} from '../utils/restAlerts';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function triggerRestAlert(soundEnabled: boolean, vibrationEnabled: boolean, userId?: string) {
  return executeRestAlerts({ soundEnabled, vibrationEnabled, userId });
}

interface WorkoutsSectionProps {
  profile: UserProfile;
  workouts: WorkoutPlan[];
  exerciseLogs: ExerciseHistoryLog[];
  activeSession: ActiveSessionState | null;
  onStartWorkout: (workout: WorkoutPlan) => void;
  onResumeSession: () => void;
  onDiscardActiveSession: () => void;
  onSaveWorkoutPlan: (
    planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDeleteWorkoutPlan: (workoutId: string) => Promise<void>;
  onToggleFavoriteExercise: (exerciseId: string) => void;
}

export const WorkoutsSection: React.FC<WorkoutsSectionProps> = ({
  profile,
  workouts,
  exerciseLogs,
  activeSession,
  onStartWorkout,
  onResumeSession,
  onDiscardActiveSession,
  onSaveWorkoutPlan,
  onDeleteWorkoutPlan,
  onToggleFavoriteExercise,
}) => {
  const [subTab, setSubTab] = useState<'fichas' | 'biblioteca' | 'importar'>('fichas');
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Editor state
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planDays, setPlanDays] = useState<string[]>(['Seg']);
  const [planDuration, setPlanDuration] = useState<number>(60);
  const [planSlots, setPlanSlots] = useState<WorkoutExerciseSlot[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [substitutingSlotIndex, setSubstitutingSlotIndex] = useState<number | null>(null);
  const [inspectExercise, setInspectExercise] = useState<ExerciseItem | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // OCR Import State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrPreviewTitle, setOcrPreviewTitle] = useState('');
  const [ocrPreviewSlots, setOcrPreviewSlots] = useState<
    Array<{
      rawDetectedName: string;
      matchedExerciseId: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes: string;
    }>
  >([]);

  const openCreateEditor = () => {
    setEditingPlan(null);
    setIsCreatingNew(true);
    setPlanName('Nova Ficha Personalizada');
    setPlanDesc('Treino montado sob medida');
    setPlanDays(['Seg']);
    setPlanDuration(profile.sessionDurationMin || 60);
    setPlanSlots([]);
  };

  const openEditEditor = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setIsCreatingNew(false);
    setPlanName(plan.name);
    setPlanDesc(plan.description || '');
    setPlanDays(plan.scheduledDays);
    setPlanDuration(plan.estimatedDurationMin);
    setPlanSlots([...plan.exercises]);
  };

  const handleDuplicatePlan = async (plan: WorkoutPlan) => {
    await onSaveWorkoutPlan({
      userId: profile.userId,
      name: `${plan.name} (Cópia)`,
      description: plan.description || '',
      muscleGroups: plan.muscleGroups,
      scheduledDays: plan.scheduledDays,
      estimatedDurationMin: plan.estimatedDurationMin,
      exercises: plan.exercises.map((s, idx) => ({
        ...s,
        id: `slot_${Date.now()}_${idx}`,
      })),
    });
  };

  const handleSaveEditor = async () => {
    if (!planName.trim() || planSlots.length === 0) return;
    setSavingPlan(true);
    try {
      const derivedMuscles = Array.from(
        new Set(
          planSlots
            .map((s) => getExerciseById(s.exerciseId)?.muscleGroup)
            .filter((m): m is MuscleCategory => !!m)
        )
      );
      await onSaveWorkoutPlan(
        {
          userId: profile.userId,
          name: planName.trim().slice(0, 100),
          description: planDesc.trim().slice(0, 400),
          muscleGroups: derivedMuscles.length > 0 ? derivedMuscles : ['Peito'],
          scheduledDays: planDays,
          estimatedDurationMin: Math.min(300, Math.max(10, Number(planDuration) || 60)),
          exercises: planSlots.slice(0, 30),
        },
        editingPlan?.id
      );
      setEditingPlan(null);
      setIsCreatingNew(false);
    } finally {
      setSavingPlan(false);
    }
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= planSlots.length) return;
    const copy = [...planSlots];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    setPlanSlots(copy);
  };

  // File upload handler for OCR Workout Import
  const handleFileUploadForOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrError(null);
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = String(reader.result || '');
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;
      await runOcrRequest({ base64Data, mimeType: file.type || 'image/jpeg' });
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Falha na leitura do arquivo.');
      setOcrLoading(false);
    }
  };

  const runOcrRequest = async (payload: {
    base64Data?: string;
    mimeType?: string;
    rawText?: string;
  }) => {
    setOcrLoading(true);
    setOcrError(null);
    try {
      const response = await fetch('/api/ocr-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          availableExercises: EXERCISES_CATALOG.map((e) => ({
            id: e.id,
            name: e.name,
            muscleGroup: e.muscleGroup,
          })),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Não foi possível extrair os exercícios.');
      }
      const extracted = json.data;
      setOcrPreviewTitle(extracted.sheetTitle || 'Ficha Importada');
      const mapped = (extracted.exercises || []).map(
        (item: {
          rawDetectedName: string;
          matchedExerciseId: string;
          sets: number;
          reps: string;
          restSeconds: number;
          notes: string;
        }) => {
          const exists = getExerciseById(item.matchedExerciseId);
          const fallbackMatch =
            exists ||
            EXERCISES_CATALOG.find((c) =>
              c.name.toLowerCase().includes((item.rawDetectedName || '').toLowerCase().slice(0, 6))
            ) ||
            EXERCISES_CATALOG[0];
          return {
            rawDetectedName: item.rawDetectedName || fallbackMatch.name,
            matchedExerciseId: fallbackMatch.id,
            sets: Math.max(1, Math.min(10, Number(item.sets) || 3)),
            reps: String(item.reps || '10-12'),
            restSeconds: Math.max(15, Number(item.restSeconds) || 60),
            notes: String(item.notes || ''),
          };
        }
      );
      setOcrPreviewSlots(mapped);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Erro ao processar ficha.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleConfirmOcrImport = async () => {
    if (ocrPreviewSlots.length === 0) return;
    setOcrLoading(true);
    try {
      const slots: WorkoutExerciseSlot[] = ocrPreviewSlots.map((item, idx) => ({
        id: `ocr_${Date.now()}_${idx}`,
        exerciseId: item.matchedExerciseId,
        sets: item.sets,
        reps: item.reps,
        restSeconds: item.restSeconds,
        notes: item.notes || `Importado (${item.rawDetectedName})`,
      }));
      const derivedMuscles = Array.from(
        new Set(
          slots
            .map((s) => getExerciseById(s.exerciseId)?.muscleGroup)
            .filter((m): m is MuscleCategory => !!m)
        )
      );
      await onSaveWorkoutPlan({
        userId: profile.userId,
        name: ocrPreviewTitle.trim() || 'Ficha Importada',
        description: 'Ficha importada e revisada no PomboFit',
        muscleGroups: derivedMuscles.length > 0 ? derivedMuscles : ['Peito'],
        scheduledDays: ['Seg'],
        estimatedDurationMin: 60,
        exercises: slots,
      });
      setOcrPreviewSlots([]);
      setOcrRawText('');
      setSubTab('fichas');
    } finally {
      setOcrLoading(false);
    }
  };

  // If editing or creating a Workout Plan
  if (isCreatingNew || editingPlan) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-5">
          <div>
            <span className="text-xs font-bold text-[#7650C9] uppercase">
              {isCreatingNew ? 'Criar Nova Ficha' : 'Editar Ficha de Treino'}
            </span>
            <h2 className="text-xl font-extrabold text-[#24212B]">
              {planName || 'Ficha Personalizada'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setIsCreatingNew(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={savingPlan || planSlots.length === 0}
              onClick={handleSaveEditor}
              className="px-6 py-2.5 rounded-xl bg-[#7650C9] text-white text-xs font-bold hover:bg-[#6440B5] cursor-pointer disabled:opacity-50"
            >
              {savingPlan ? 'Salvando...' : 'Salvar Ficha'}
            </button>
          </div>
        </div>

        {/* Sheet Metadata */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#24212B] mb-1">
                Nome da Ficha *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Ex: Segunda-feira — Peito e Tríceps"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24212B] mb-1">
                Duração Estimada (min)
              </label>
              <input
                type="number"
                value={planDuration}
                onChange={(e) => setPlanDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1">
              Descrição ou Observações da Sessão
            </label>
            <input
              type="text"
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              placeholder="Ex: Foco em progressão de carga nos compostos"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#24212B] mb-1.5">
              Dias da Semana Programados
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = planDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setPlanDays((prev) =>
                        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                      )
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#7650C9] text-white border-[#7650C9]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Exercises List in Sheet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#24212B]">
              Exercícios da Ficha ({planSlots.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowExercisePicker(true)}
              className="px-4 py-2.5 rounded-xl bg-[#7650C9] text-white text-xs font-bold hover:bg-[#6440B5] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar da Biblioteca</span>
            </button>
          </div>

          {planSlots.length === 0 ? (
            <div className="bg-[#FAF9FC] border border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-3">
              <Dumbbell className="w-8 h-8 text-[#7650C9] mx-auto" />
              <h4 className="text-sm font-bold text-[#24212B]">
                Sua ficha ainda não possui exercícios
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Selecione exercícios na biblioteca interna pré-cadastrada do PomboFit.
              </p>
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="px-5 py-2.5 rounded-xl bg-[#7650C9] text-white text-xs font-bold cursor-pointer"
              >
                Abrir Biblioteca de Exercícios
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {planSlots.map((slot, index) => {
                const ex = getExerciseById(slot.exerciseId);
                if (!ex) return null;
                return (
                  <div
                    key={slot.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#F2EDFF] text-[#7650C9] font-extrabold text-xs flex items-center justify-center font-mono-tabular">
                          {index + 1}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => setInspectExercise(ex)}
                            className="text-sm font-extrabold text-[#24212B] hover:text-[#7650C9] text-left cursor-pointer"
                          >
                            {ex.name}
                          </button>
                          <div className="text-[11px] text-slate-500">
                            {ex.muscleGroup} · {ex.equipment} · {ex.movementType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveSlot(index, -1)}
                          disabled={index === 0}
                          title="Mover para cima"
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlot(index, 1)}
                          disabled={index === planSlots.length - 1}
                          title="Mover para baixo"
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubstitutingSlotIndex(index)}
                          title="Substituir por alternativa compatível"
                          className="px-2.5 py-1.5 rounded-lg bg-[#F2EDFF] text-[#7650C9] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Substituir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPlanSlots((prev) => prev.filter((_, i) => i !== index))
                          }
                          title="Remover exercício"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Séries Planejadas
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={slot.sets}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setPlanSlots((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, sets: val } : item))
                            );
                          }}
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold font-mono-tabular text-center sm:text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Repetições
                        </label>
                        <input
                          type="text"
                          value={slot.reps}
                          onChange={(e) =>
                            setPlanSlots((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, reps: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Ex: 8-12"
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold font-mono-tabular text-center sm:text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Descanso (seg)
                        </label>
                        <input
                          type="number"
                          step={15}
                          min={15}
                          max={600}
                          value={slot.restSeconds}
                          onChange={(e) =>
                            setPlanSlots((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, restSeconds: Math.max(10, Number(e.target.value) || 60) }
                                  : item
                              )
                            )
                          }
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold font-mono-tabular text-center sm:text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Observações Técnicas
                        </label>
                        <input
                          type="text"
                          value={slot.notes}
                          onChange={(e) =>
                            setPlanSlots((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, notes: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Ex: Cadência controlada"
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal to pick exercise from internal library */}
        {showExercisePicker && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl p-6 overflow-y-auto shadow-2xl">
              <ExerciseLibraryBrowser
                favoriteIds={profile.favoriteExerciseIds || []}
                recentIds={profile.recentExerciseIds || []}
                exerciseLogs={exerciseLogs}
                onToggleFavorite={onToggleFavoriteExercise}
                selectionModeTitle="Selecionar Exercício para a Ficha"
                onCloseSelectionModal={() => setShowExercisePicker(false)}
                onSelectForWorkout={(ex) => {
                  setPlanSlots((prev) => [
                    ...prev,
                    {
                      id: `slot_${Date.now()}_${prev.length}`,
                      exerciseId: ex.id,
                      sets: 3,
                      reps: ex.muscleGroup === 'Cardio' ? '15 min' : '10-12',
                      restSeconds: 60,
                      notes: ex.importantNotes.slice(0, 80),
                    },
                  ]);
                  setShowExercisePicker(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Substitution Modal */}
        {substitutingSlotIndex !== null && (
          <ExerciseSubstitutionModal
            currentExercise={
              getExerciseById(planSlots[substitutingSlotIndex].exerciseId) || EXERCISES_CATALOG[0]
            }
            availableEquipment={profile.availableEquipment}
            limitations={profile.limitations}
            onClose={() => setSubstitutingSlotIndex(null)}
            onConfirmSubstitute={(newEx) => {
              setPlanSlots((prev) =>
                prev.map((item, idx) =>
                  idx === substitutingSlotIndex ? { ...item, exerciseId: newEx.id } : item
                )
              );
            }}
          />
        )}

        {inspectExercise && (
          <ExerciseDetailModal
            exercise={inspectExercise}
            exerciseLogs={exerciseLogs}
            isFavorite={(profile.favoriteExerciseIds || []).includes(inspectExercise.id)}
            onToggleFavorite={onToggleFavoriteExercise}
            onClose={() => setInspectExercise(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interrupted Session Recovery Banner */}
      {activeSession && (
        <div className="bg-[#F2EDFF] border-2 border-[#7650C9] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#7650C9] uppercase">
              Sessão em Andamento Recuperada
            </span>
            <h3 className="text-lg font-extrabold text-[#24212B]">
              {activeSession.workoutName}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Suas séries registradas foram preservadas com segurança. Retome exatamente de onde parou.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDiscardActiveSession}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={onResumeSession}
              className="px-5 py-2.5 rounded-xl bg-[#7650C9] text-white text-xs font-bold hover:bg-[#6440B5] flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Retomar Treino</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-navigation matching TELA 5: Minhas Fichas (X) | Biblioteca (Y) */}
      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 pb-1">
        <button
          type="button"
          onClick={() => setSubTab('fichas')}
          className={`px-2.5 sm:px-5 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center truncate ${
            subTab === 'fichas'
              ? 'bg-[#5E2EE8] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Minhas Fichas ({workouts.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('biblioteca')}
          className={`px-2.5 sm:px-5 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center truncate ${
            subTab === 'biblioteca'
              ? 'bg-[#5E2EE8] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Biblioteca ({EXERCISES_CATALOG.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('importar')}
          className={`px-2.5 sm:px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer sm:ml-auto text-center truncate ${
            subTab === 'importar'
              ? 'bg-[#5E2EE8] text-white shadow-xs'
              : 'bg-white border border-purple-100 text-[#5E2EE8] hover:bg-purple-50'
          }`}
        >
          Importar (OCR)
        </button>
      </div>

      {subTab === 'fichas' && (
        <div className="space-y-4">
          {/* Large CTA Button matching TELA 5 */}
          <button
            type="button"
            onClick={openCreateEditor}
            className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#5E2EE8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nova Ficha</span>
          </button>

          {/* Workout Cards matching TELA 5 */}
          <div className="space-y-3">
            {workouts.map((plan) => {
              // Find thumbnail illustration based on first muscle group or first exercise
              const firstEx =
                (plan.exercises[0] ? getExerciseById(plan.exercises[0].exerciseId) : null) ||
                EXERCISES_CATALOG.find((e) => e.muscleGroup === (plan.muscleGroups[0] || 'Peito')) ||
                EXERCISES_CATALOG[0];

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-[24px] p-4 border border-purple-50 shadow-xs hover:border-purple-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full">
                    {/* Verified 3D Biomechanical Illustration Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-[#FAF8FF] border border-purple-100 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <ExerciseVerifiedVisual exercise={firstEx} compact />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#1E1638] truncate leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {plan.scheduledDays.join(', ') || 'Dia livre'} · {plan.estimatedDurationMin} min · {plan.exercises.length} exercícios
                      </p>

                      {/* Muscle chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {plan.muscleGroups.slice(0, 3).map((mg) => (
                          <span
                            key={mg}
                            className="px-2 py-0.5 rounded-lg bg-[#FAF8FF] text-[#5E2EE8] text-[10px] font-bold border border-purple-100"
                          >
                            {mg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions matching TELA 5: Editar and ★ Iniciar */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => openEditEditor(plan)}
                      className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-[#1E1638] hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartWorkout(plan)}
                      className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-white shrink-0" />
                      <span>Iniciar</span>
                    </button>

                    {/* Secondary menu: Duplicate & Delete */}
                    <button
                      type="button"
                      onClick={() => handleDuplicatePlan(plan)}
                      title="Duplicar ficha"
                      className="w-10 h-10 rounded-xl text-slate-400 hover:text-[#5E2EE8] hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(plan.id)}
                      title="Excluir ficha"
                      className="w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'biblioteca' && (
        <ExerciseLibraryBrowser
          favoriteIds={profile.favoriteExerciseIds || []}
          recentIds={profile.recentExerciseIds || []}
          exerciseLogs={exerciseLogs}
          onToggleFavorite={onToggleFavoriteExercise}
        />
      )}

      {subTab === 'importar' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
          <div>
            <span className="text-xs font-bold text-[#7650C9] uppercase">
              Importação Inteligente via OCR
            </span>
            <h3 className="text-xl font-extrabold text-[#24212B] mt-1">
              Importar Ficha de PDF, Foto, Imagem ou Captura de Tela
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Envie a imagem/PDF da sua ficha ou cole o texto abaixo. O PomboFit identifica os exercícios, séries e repetições, relaciona com a biblioteca interna e exibe uma prévia editável antes de salvar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="border-2 border-dashed border-[#7650C9]/40 bg-[#F2EDFF]/40 hover:bg-[#F2EDFF]/70 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
              <FileUp className="w-10 h-10 text-[#7650C9] mb-3" />
              <span className="text-sm font-bold text-[#24212B]">
                Selecionar Foto, Captura de Tela ou PDF
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Formatos aceitos: PNG, JPG, WEBP, PDF
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUploadForOcr}
                className="hidden"
              />
            </label>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#24212B]">
                Ou cole o texto da sua planilha/ficha de treino:
              </label>
              <textarea
                rows={4}
                value={ocrRawText}
                onChange={(e) => setOcrRawText(e.target.value)}
                placeholder={'Exemplo:\nSupino Reto com Barra - 4x10\nCrucifixo Inclinado Halteres - 3x12\nTríceps Corda na Polia - 4x12'}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs focus:border-[#7650C9] focus:outline-none"
              />
              <button
                type="button"
                disabled={ocrLoading || !ocrRawText.trim()}
                onClick={() => runOcrRequest({ rawText: ocrRawText })}
                className="w-full py-3 rounded-xl bg-[#24212B] text-white text-xs font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                {ocrLoading ? 'Analisando e relacionando com a biblioteca...' : 'Identificar Exercícios do Texto'}
              </button>
            </div>
          </div>

          {ocrError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
              {ocrError}
            </div>
          )}

          {/* Interactive Preview before confirming import */}
          {ocrPreviewSlots.length > 0 && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#7650C9] uppercase">
                    Prévia da Importação — Revise e corrija manualmente se desejar
                  </span>
                  <input
                    type="text"
                    value={ocrPreviewTitle}
                    onChange={(e) => setOcrPreviewTitle(e.target.value)}
                    className="block mt-1 px-3 py-1.5 rounded-xl border border-slate-200 text-base font-extrabold text-[#24212B]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmOcrImport}
                  className="px-6 py-3 rounded-2xl bg-[#7650C9] text-white text-xs font-bold hover:bg-[#6440B5] flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Importação da Ficha</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {ocrPreviewSlots.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FAF9FC] border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-3">
                      <span className="text-[10px] text-slate-400 block">Texto Identificado</span>
                      <strong className="text-xs text-[#24212B]">{item.rawDetectedName}</strong>
                    </div>
                    <div className="sm:col-span-5">
                      <span className="text-[10px] text-slate-400 block">
                        Exercício na Biblioteca PomboFit
                      </span>
                      <select
                        value={item.matchedExerciseId}
                        onChange={(e) =>
                          setOcrPreviewSlots((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, matchedExerciseId: e.target.value } : row
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                      >
                        {EXERCISES_CATALOG.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({ex.muscleGroup})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block">Séries</span>
                      <input
                        type="number"
                        value={item.sets}
                        onChange={(e) =>
                          setOcrPreviewSlots((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, sets: Number(e.target.value) || 3 } : row
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono-tabular"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block">Repetições</span>
                      <input
                        type="text"
                        value={item.reps}
                        onChange={(e) =>
                          setOcrPreviewSlots((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, reps: e.target.value } : row
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono-tabular"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-extrabold text-[#24212B]">
              Confirmar Exclusão da Ficha
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir esta ficha de treino? Seu histórico de sessões anteriores já realizadas permanecerá salvo normalmente.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteWorkoutPlan(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Excluir Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ActiveWorkoutExecutionOverlayProps {
  session: ActiveSessionState;
  profile: UserProfile;
  exerciseLogs: ExerciseHistoryLog[];
  onUpdateSession: (updated: ActiveSessionState) => void;
  onFinishSession: (
    finalSession: ActiveSessionState,
    durationSeconds: number,
    updateOriginalPlan?: boolean
  ) => Promise<{
    totalVolumeKg: number;
    setsCompleted: number;
    exercisesCount: number;
    prCount: number;
  }>;
  onMinimizeSession: () => void;
  onCancelSession: () => void;
  onToggleFavoriteExercise: (exerciseId: string) => void;
  onAwardXp?: (amount: number) => void;
  onSaveAsNewWorkoutPlan?: (
    name: string,
    exercises: Array<{
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes: string;
    }>
  ) => Promise<void>;
}

export const ActiveWorkoutExecutionOverlay: React.FC<ActiveWorkoutExecutionOverlayProps> = ({
  session,
  profile,
  exerciseLogs,
  onUpdateSession,
  onFinishSession,
  onMinimizeSession,
  onCancelSession,
  onToggleFavoriteExercise,
  onAwardXp,
  onSaveAsNewWorkoutPlan,
}) => {
  const [elapsedSec, setElapsedSec] = useState<number>(session.elapsedSecondsBeforePause || 0);
  const [executionViewTab, setExecutionViewTab] = useState<'exercises' | 'muscle_map'>('exercises');
  const [isSavingAsRoutine, setIsSavingAsRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState(session.workoutName);
  const [routineSavedSuccess, setRoutineSavedSuccess] = useState(false);
  const [proToastMessage, setProToastMessage] = useState<string | null>(null);
  const [inspectExercise, setInspectExercise] = useState<ExerciseItem | null>(null);
  const [substituteSlotIndex, setSubstituteSlotIndex] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(profile.soundAlerts !== false);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(profile.vibrationAlerts !== false);
  const [restFinishedToast, setRestFinishedToast] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermissionStatus());
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showBackMenu, setShowBackMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [showEarlyTerminateModal, setShowEarlyTerminateModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [updateOriginalPlan, setUpdateOriginalPlan] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<{
    durationSeconds: number;
    totalVolumeKg: number;
    setsCompleted: number;
    exercisesCount: number;
    prCount: number;
  } | null>(null);

  // Live logged sets for real-time post-workout and in-progress muscle map
  const liveLoggedSets = useMemo<LoggedSetEntry[]>(() => {
    const list: LoggedSetEntry[] = [];
    session.exercises.forEach((ex) => {
      const catalogItem = getExerciseById(ex.exerciseId);
      ex.sets.forEach((s) => {
        if (s.completed) {
          list.push({
            exerciseId: ex.exerciseId,
            exerciseName: catalogItem?.name || ex.exerciseId,
            setNumber: s.setNumber,
            plannedReps: s.plannedReps,
            weightKg: s.weightKg,
            repsDone: s.repsDone,
            completed: true,
            completedAtISO: s.completedAtISO || new Date().toISOString(),
          });
        }
      });
    });
    return list;
  }, [session.exercises]);

  const handleSavePartialProgress = async () => {
    setFinishing(true);
    try {
      const stats = await onFinishSession(session, elapsedSec, false);
      setShowEarlyTerminateModal(false);
      setCompletionSummary({
        durationSeconds: elapsedSec,
        ...stats,
      });
    } finally {
      setFinishing(false);
    }
  };

  // Live session elapsed timer + Wall-clock Rest countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (!session.isPaused && !completionSummary) {
        const delta = Math.max(0, Math.floor((now - session.startedAtMs) / 1000));
        setElapsedSec(session.elapsedSecondsBeforePause + delta);
      }

      if (session.restTimer.active && session.restTimer.remainingSeconds > 0) {
        // Wall-clock calculation guarantees countdown accuracy even when browser tab is throttled
        const restStart = session.restTimer.startedAtMs || now;
        const totalSec = session.restTimer.totalSeconds || 60;
        const elapsedRest = Math.max(0, Math.floor((now - restStart) / 1000));
        const trueRemaining = Math.max(0, totalSec - elapsedRest);

        if (trueRemaining <= 0) {
          triggerRestAlert(soundEnabled, vibrationEnabled);
          setRestFinishedToast(true);
          onUpdateSession({
            ...session,
            restTimer: {
              ...session.restTimer,
              active: false,
              remainingSeconds: 0,
            },
          });
        } else if (trueRemaining !== session.restTimer.remainingSeconds) {
          onUpdateSession({
            ...session,
            restTimer: {
              ...session.restTimer,
              remainingSeconds: trueRemaining,
            },
          });
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [session, soundEnabled, vibrationEnabled, completionSummary, onUpdateSession]);

  // Handle visibility change: notify user with Pombo bust when rest expires in the background
  useEffect(() => {
    let backgroundTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden && session.restTimer.active && session.restTimer.remainingSeconds > 0) {
        const now = Date.now();
        const restStart = session.restTimer.startedAtMs || now;
        const totalSec = session.restTimer.totalSeconds || 60;
        const elapsedRest = Math.max(0, Math.floor((now - restStart) / 1000));
        const remainingMs = Math.max(0, (totalSec - elapsedRest) * 1000);

        if (backgroundTimer) clearTimeout(backgroundTimer);
        backgroundTimer = setTimeout(() => {
          if (document.hidden) {
            sendRestFinishedNotification().catch(() => {});
          }
        }, remainingMs);
      } else if (!document.hidden) {
        if (backgroundTimer) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (backgroundTimer) clearTimeout(backgroundTimer);
    };
  }, [session.restTimer]);

  // Synchronize rest countdown with Backend Web Push & pombo-notification-sw.js
  useEffect(() => {
    if (session.restTimer.active && (session.restTimer.totalSeconds || 0) > 0) {
      const now = Date.now();
      const restStart = session.restTimer.startedAtMs || now;
      const totalSec = session.restTimer.totalSeconds || 60;
      const targetTimestamp = restStart + totalSec * 1000;
      if (targetTimestamp > now) {
        scheduleRestNotificationInSW(targetTimestamp, {
          userId: profile.userId,
          restSeconds: totalSec,
          workoutId: session.workoutId,
          workoutName: session.workoutName,
        });
      }
    } else if (!session.restTimer.active) {
      cancelRestNotificationInSW(profile.userId, 'Timer de descanso finalizado ou cancelado');
    }
  }, [
    session.restTimer.active,
    session.restTimer.startedAtMs,
    session.restTimer.totalSeconds,
    profile.userId,
    session.workoutId,
    session.workoutName,
  ]);

  // Auto-dismiss Pombo rest finished banner after 7 seconds
  useEffect(() => {
    if (restFinishedToast) {
      const timer = setTimeout(() => {
        setRestFinishedToast(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [restFinishedToast]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSetsCount = useMemo(
    () => session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
    [session.exercises]
  );
  const completedSetsCount = useMemo(
    () =>
      session.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
        0
      ),
    [session.exercises]
  );
  const progressPct =
    totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  const handleSetFieldChange = (
    exIdx: number,
    setIdx: number,
    field: 'weightKg' | 'repsDone',
    value: number
  ) => {
    const updatedExercises = session.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)),
      };
    });
    onUpdateSession({ ...session, exercises: updatedExercises });
  };

  const handleAdjustWeight = (exIdx: number, setIdx: number, delta: number) => {
    const cur = session.exercises[exIdx]?.sets[setIdx]?.weightKg || 0;
    const next = Math.max(0, Math.round((cur + delta) * 10) / 10);
    handleSetFieldChange(exIdx, setIdx, 'weightKg', next);
  };

  const handleAdjustReps = (exIdx: number, setIdx: number, delta: number) => {
    const cur = session.exercises[exIdx]?.sets[setIdx]?.repsDone || 0;
    const next = Math.max(0, cur + delta);
    handleSetFieldChange(exIdx, setIdx, 'repsDone', next);
  };

  const handleDeleteSet = (exIdx: number, setIdx: number) => {
    const updatedExercises = session.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const remainingSets = ex.sets.filter((_, j) => j !== setIdx);
      return {
        ...ex,
        sets: remainingSets.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
      };
    });
    onUpdateSession({ ...session, exercises: updatedExercises });
  };

  const handleToggleSetCompleted = (exIdx: number, setIdx: number) => {
    unlockMobileAudio();
    const targetEx = session.exercises[exIdx];
    const targetSet = targetEx.sets[setIdx];
    const nowCompleted = !targetSet.completed;

    let isPro = targetSet.isPro;
    let proAwarded = targetSet.proAwarded;

    if (nowCompleted) {
      const historyMaxWeight = exerciseLogs
        .filter((l) => l.exerciseId === targetEx.exerciseId)
        .reduce((max, item) => Math.max(max, item.maxWeightKg), 0);

      let sessionMaxWeight = 0;
      for (let j = 0; j < setIdx; j++) {
        const prevSet = targetEx.sets[j];
        if (prevSet && prevSet.completed && prevSet.weightKg > sessionMaxWeight) {
          sessionMaxWeight = prevSet.weightKg;
        }
      }

      const referenceWeight = Math.max(historyMaxWeight, sessionMaxWeight);
      const isHigherWeight = referenceWeight > 0 && targetSet.weightKg > referenceWeight;
      const isFirstSetWithLoad = referenceWeight === 0 && targetSet.weightKg > 0 && setIdx > 0;

      if (isHigherWeight || isFirstSetWithLoad) {
        isPro = true;
        if (!proAwarded) {
          proAwarded = true;
          onAwardXp?.(25);
          setProToastMessage('Você evoluiu! Nova carga PRO! (+25 XP)');
          setTimeout(() => setProToastMessage(null), 3500);
        }
      } else {
        isPro = false;
      }
    } else {
      isPro = false;
    }

    const updatedExercises = session.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) =>
          j === setIdx
            ? {
                ...s,
                completed: nowCompleted,
                completedAtISO: nowCompleted ? new Date().toISOString() : undefined,
                isPro,
                proAwarded,
              }
            : s
        ),
      };
    });

    const shouldStartRest = nowCompleted && profile.autoStartRestTimer !== false;
    const allSetsCompletedNow = targetEx.sets.every((s, j) => (j === setIdx ? nowCompleted : s.completed));

    // Auto-advance to the next exercise when all sets of the current exercise are completed
    if (nowCompleted && allSetsCompletedNow && exIdx < session.exercises.length - 1) {
      setTimeout(() => {
        const nextEl = document.getElementById(`exercise-card-${exIdx + 1}`);
        if (nextEl) {
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add brief visual pulse to confirm focus
          nextEl.classList.add('ring-4', 'ring-[#5E2EE8]/40');
          setTimeout(() => {
            nextEl.classList.remove('ring-4', 'ring-[#5E2EE8]/40');
          }, 1400);
        }
      }, 350);
    }

    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      restTimer: shouldStartRest
        ? {
            active: true,
            remainingSeconds: targetEx.restSeconds || 60,
            totalSeconds: targetEx.restSeconds || 60,
            startedAtMs: Date.now(),
          }
        : session.restTimer,
    });
  };

  const handleAddExtraSet = (exIdx: number, isWarmup = false) => {
    const updatedExercises = session.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      const nextNum = ex.sets.length + 1;
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            setNumber: nextNum,
            plannedReps: isWarmup ? '15 (Aquec.)' : (lastSet?.plannedReps || '10'),
            weightKg: isWarmup ? Math.round((lastSet?.weightKg || 40) * 0.5) : (lastSet?.weightKg || 20),
            repsDone: isWarmup ? 15 : (lastSet?.repsDone || 10),
            completed: false,
          },
        ],
      };
    });
    onUpdateSession({ ...session, exercises: updatedExercises });
  };

  const handleConfirmFinishWorkout = async () => {
    setFinishing(true);
    try {
      const stats = await onFinishSession(session, elapsedSec, updateOriginalPlan);
      setShowFinishConfirm(false);
      setCompletionSummary({
        durationSeconds: elapsedSec,
        ...stats,
      });
    } finally {
      setFinishing(false);
    }
  };

  const activeMascot = MASCOT_DATA[profile.mascotForm || 'pombo_grande'];

  if (completionSummary) {
    return (
      <div
        style={{
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
        }}
        className="fixed inset-0 z-50 bg-[#0E0D14] text-white overflow-y-auto p-3 sm:p-6 flex flex-col items-center"
      >
        <div className="max-w-2xl w-full space-y-6 pb-20">
          {/* Header & Mascot Celebration */}
          <div className="bg-[#181622] border border-purple-900/50 rounded-3xl p-6 sm:p-7 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#84CC16] via-[#A3E635] to-[#7650C9]" />
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#26203D] p-2 border border-purple-500/30 shadow-lg relative">
              <img
                src={activeMascot.imageUrl}
                alt={activeMascot.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#84CC16] text-[#0A1A05] text-[10px] font-black uppercase tracking-wider shadow">
                Concluído!
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs font-black text-[#A3E635] uppercase tracking-wider">
                Treino Sincronizado com Sucesso
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {session.workoutName}
              </h2>
              <p className="text-xs text-purple-200/80 mt-2 italic max-w-md mx-auto">
                &ldquo;{activeMascot.quotes[0]}&rdquo; — <strong>{activeMascot.name}</strong>
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="bg-[#201D2D] border border-purple-900/40 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-purple-300/70 uppercase block">Tempo</span>
                <strong className="text-base sm:text-lg font-black text-white font-mono-tabular">
                  {formatDuration(completionSummary.durationSeconds)}
                </strong>
              </div>
              <div className="bg-[#201D2D] border border-purple-900/40 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-purple-300/70 uppercase block">Séries</span>
                <strong className="text-base sm:text-lg font-black text-[#A3E635] font-mono-tabular">
                  {completionSummary.setsCompleted}
                </strong>
              </div>
              <div className="bg-[#201D2D] border border-purple-900/40 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-purple-300/70 uppercase block">Volume</span>
                <strong className="text-base sm:text-lg font-black text-white font-mono-tabular">
                  {completionSummary.totalVolumeKg} kg
                </strong>
              </div>
              <div className="bg-[#201D2D] border border-purple-900/40 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-purple-300/70 uppercase block">Recordes</span>
                <strong className="text-base sm:text-lg font-black text-[#A3E635] font-mono-tabular">
                  {completionSummary.prCount} PRs
                </strong>
              </div>
            </div>

            {/* Salvar como Nova Ficha (se aplicável ou se solicitado) */}
            {onSaveAsNewWorkoutPlan && (
              <div className="mt-5 p-4 rounded-2xl bg-[#201D2D]/90 border border-purple-500/20 text-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <div>
                      <h4 className="text-xs font-black text-white">Salvar como Nova Ficha</h4>
                      <p className="text-[10px] text-purple-200/70">
                        Transforme os exercícios realizados hoje em uma rotina reutilizável.
                      </p>
                    </div>
                  </div>
                  {routineSavedSuccess && (
                    <span className="px-2.5 py-1 rounded-full bg-[#84CC16]/20 border border-[#84CC16] text-[#A3E635] text-[10px] font-black">
                      Salvo! ✓
                    </span>
                  )}
                </div>

                {!routineSavedSuccess ? (
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                      type="text"
                      value={newRoutineName}
                      onChange={(e) => setNewRoutineName(e.target.value)}
                      placeholder="Ex: Treino de Sábado — Posterior + Glúteos"
                      className="flex-1 px-3 py-2 rounded-xl bg-[#14121F] border border-purple-700/50 text-white text-xs placeholder:text-purple-300/40 focus:outline-none focus:border-[#84CC16]"
                    />
                    <button
                      type="button"
                      disabled={isSavingAsRoutine || !newRoutineName.trim()}
                      onClick={async () => {
                        setIsSavingAsRoutine(true);
                        try {
                          const slotsToSave = session.exercises.map((s) => ({
                            exerciseId: s.exerciseId,
                            sets: s.sets.length,
                            reps: s.sets[0]?.plannedReps || '10',
                            restSeconds: s.restSeconds || 60,
                            notes: s.notes || '',
                          }));
                          await onSaveAsNewWorkoutPlan(newRoutineName.trim(), slotsToSave);
                          setRoutineSavedSuccess(true);
                        } catch (err) {
                          console.error('Falha ao salvar ficha:', err);
                        } finally {
                          setIsSavingAsRoutine(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#5E2EE8] hover:bg-[#4E21D0] disabled:opacity-50 text-white text-xs font-black cursor-pointer transition-colors shrink-0"
                    >
                      {isSavingAsRoutine ? 'Salvando...' : 'Salvar Ficha'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#A3E635] font-bold mt-1">
                    ✓ Ficha &quot;{newRoutineName}&quot; adicionada aos seus treinos com sucesso!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* MAPA MUSCULAR PÓS-TREINO — ANATOMIA HUMANA DUAL (FRENTE E COSTAS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>🧬</span>
                <span>Mapa Muscular da Sessão</span>
              </h3>
              <span className="text-[11px] text-purple-200/70">
                {liveLoggedSets.length} séries registradas
              </span>
            </div>

            <HumanAnatomicalPostWorkoutMap
              loggedSets={liveLoggedSets}
              sessionName={session.workoutName}
              theme="dark"
            />
          </div>

          {/* Botão de Conclusão Final */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onMinimizeSession}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7650C9] to-[#5E2EE8] hover:from-[#6440B5] hover:to-[#4E21D0] text-white font-black text-sm active:scale-[0.99] transition-all cursor-pointer shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <span>Concluir e Voltar ao Início</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8FF] flex flex-col overflow-hidden h-[100dvh] max-h-[100dvh]">
      {proToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#7650C9] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black animate-bounce">
          <Sparkles className="w-4 h-4 fill-white shrink-0" />
          <span>{proToastMessage}</span>
        </div>
      )}
      {restFinishedToast && (
        <div className="fixed top-14 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1E1638] text-white p-3.5 sm:p-4 rounded-3xl border-2 border-purple-500 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#7650C9] to-[#5E2EE8] overflow-hidden shrink-0 border-2 border-purple-300 shadow-md flex items-center justify-center">
                <img
                  src="/assets/mascots/pombo_hero_bust.png"
                  alt="PomboFit"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-white flex items-center gap-1.5 truncate">
                  <span>Seu descanso acabou!</span>
                  <span>🕊️💪</span>
                </h4>
                <p className="text-[11px] text-purple-200 mt-0.5 leading-snug">
                  Hora da próxima série com foco total! O Pombo está pronto!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRestFinishedToast(false)}
              className="px-3.5 py-2 rounded-xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white text-xs font-black shrink-0 cursor-pointer shadow-md active:scale-95 transition-all"
            >
              Bora!
            </button>
          </div>
        </div>
      )}
      {/* 1. CABEÇALHO DO TREINO — 3 Regiões (Navegação, Identificação, Ações) */}
      <header
        style={{
          paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
          paddingBottom: '8px',
        }}
        className="px-3 sm:px-6 bg-white border-b border-purple-100 flex flex-col gap-2 shrink-0 shadow-2xs"
      >
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-1.5">
          {/* PRIMEIRA REGIÃO — NAVEGAÇÃO & CRONÔMETRO & OPÇÕES */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowBackMenu(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#FAF8FF] border border-purple-100 text-[#5E2EE8] hover:bg-[#F2EDFF] text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
              title="Voltar"
            >
              <span>← Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF8FF] border border-purple-100 text-[#1E1638] font-mono-tabular text-xs font-black shrink-0">
                <Clock className="w-3.5 h-3.5 text-[#5E2EE8]" />
                <span>{formatDuration(elapsedSec)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={finishing || completedSetsCount === 0}
                onClick={() => setShowFinishConfirm(true)}
                className="h-9 px-3.5 rounded-xl bg-[#5E2EE8] hover:bg-[#4D24C7] text-white text-xs font-extrabold cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {finishing ? 'Salvando...' : 'Finalizar'}
              </button>
              <button
                type="button"
                onClick={() => setShowOptionsMenu(true)}
                title="Menu de Opções"
                className="w-9 h-9 rounded-xl border border-purple-100 bg-[#FAF8FF] text-[#5E2EE8] hover:bg-[#F2EDFF] flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SEGUNDA REGIÃO — IDENTIFICAÇÃO (Nome e Progresso sem cortes) */}
          <div className="min-w-0 pt-0.5">
            <h2 className="text-sm sm:text-base font-black text-[#1E1638] truncate leading-tight">
              {session.workoutName}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
              <span className="truncate">{session.muscleGroups.join(', ')}</span>
              <span className="font-mono-tabular font-bold text-[#5E2EE8] shrink-0 ml-2">
                {completedSetsCount}/{totalSetsCount} séries ({progressPct}%)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 shrink-0">
        <div
          style={{ width: `${progressPct}%` }}
          className="h-full bg-[#5E2EE8] transition-all duration-300"
        />
      </div>

      {/* SUB-BAR DE VISUALIZAÇÃO: Alternador entre Exercícios e Mapa Muscular em tempo real */}
      <div className="bg-white border-b border-purple-100 px-3 py-2 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-2xl bg-[#F2EDFF] border border-purple-100">
            <button
              type="button"
              onClick={() => setExecutionViewTab('exercises')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                executionViewTab === 'exercises'
                  ? 'bg-[#5E2EE8] text-white shadow-xs'
                  : 'text-purple-900 hover:text-[#5E2EE8]'
              }`}
            >
              <span>🏋️</span>
              <span>Exercícios ({completedSetsCount}/{totalSetsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setExecutionViewTab('muscle_map')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                executionViewTab === 'muscle_map'
                  ? 'bg-[#5E2EE8] text-white shadow-xs'
                  : 'text-purple-900 hover:text-[#5E2EE8]'
              }`}
            >
              <span>🧬</span>
              <span>Mapa Muscular</span>
              <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
            </button>
          </div>

          {executionViewTab === 'exercises' && (
            <button
              type="button"
              onClick={() => setShowAddExercisePicker(true)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF8FF] border border-purple-200 text-[#5E2EE8] hover:bg-[#F2EDFF] text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Adicionar Exercício</span>
              <span className="sm:hidden">+ Exercício</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: Alternância entre Lista de Exercícios e Mapa Anatômico Humano */}
      {executionViewTab === 'muscle_map' ? (
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 max-w-4xl w-full mx-auto pb-44 sm:pb-48">
          <div className="mb-3 p-3.5 rounded-2xl bg-white border border-purple-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-[#1E1638] flex items-center gap-1.5">
                <span>⚡</span>
                <span>Ativação Muscular em Tempo Real</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                Os músculos são iluminados em verde neon à medida que você completa as séries.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#84CC16]/20 text-[#4D7C0F] text-[10px] font-black">
              {liveLoggedSets.length} séries feitas
            </span>
          </div>

          <HumanAnatomicalPostWorkoutMap
            loggedSets={liveLoggedSets}
            sessionName={session.workoutName}
            theme="dark"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-4 max-w-4xl w-full mx-auto pb-44 sm:pb-48">
          {session.exercises.map((exSlot, exIdx) => {
          const exercise = getExerciseById(exSlot.exerciseId) || EXERCISES_CATALOG[0];
          const { apparatusTitle } = resolveExerciseApparatus(exercise);
          const prevLogs = exerciseLogs.filter((l) => l.exerciseId === exercise.id);
          const lastPerf = prevLogs.length > 0 ? prevLogs[0] : null;

          return (
            <div
              key={exSlot.slotId}
              id={`exercise-card-${exIdx}`}
              className="bg-white border border-purple-100 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs"
            >
              {/* Exercise Header Card (Compact & Elegant) */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FAF8FF] border border-purple-100 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    <ExerciseVerifiedVisual exercise={exercise} compact />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-[#5E2EE8] uppercase tracking-wider block truncate">
                      Exercício {exIdx + 1} · {exercise.muscleGroup}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#1E1638] leading-snug truncate">
                      {exercise.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {apparatusTitle} · Meta: {exSlot.sets.length} séries ({exSlot.sets[0]?.plannedReps || '10'} reps)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectExercise(exercise)}
                    title="Ver Instruções e Demonstração 3D"
                    className="p-2 rounded-xl bg-[#FAF8FF] border border-purple-100 text-[#5E2EE8] hover:bg-[#F2EDFF] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubstituteSlotIndex(exIdx)}
                    title="Substituir exercício"
                    className="p-2 rounded-xl bg-[#FAF8FF] border border-purple-100 text-[#5E2EE8] hover:bg-[#F2EDFF] cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Previous performance indicator */}
              <div className="text-[11px] text-slate-500 bg-[#FAF8FF] px-3 py-1.5 rounded-xl border border-purple-50 flex items-center justify-between">
                <span>Histórico Anterior:</span>
                <strong className="text-[#1E1638] font-mono-tabular">
                  {lastPerf ? `${lastPerf.maxWeightKg} kg × ${lastPerf.maxReps} reps` : 'Sem registro anterior'}
                </strong>
              </div>

              {/* 3. ORGANIZAÇÃO DAS SÉRIES — Linhas Horizontais (Rivlo layout) */}
              <div className="space-y-2.5 pt-1">
                {exSlot.sets.map((s, setIdx) => (
                  <div
                    key={s.setNumber}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 sm:gap-4 ${
                      s.completed
                        ? 'bg-[#F2EDFF]/70 border-[#5E2EE8]'
                        : 'bg-[#FAF9FC] border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    {/* Left: Set Number & History */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#1E1638] text-white font-mono-tabular text-xs sm:text-sm font-black flex items-center justify-center shadow-xs">
                        {s.setNumber}
                      </span>
                      {s.isPro && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#7650C9] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-3 h-3 fill-white" />
                          <span>PRO</span>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono-tabular hidden sm:inline">
                        ↶ {lastPerf ? `${lastPerf.maxWeightKg} kg · ${lastPerf.maxReps} reps` : 'Sem registro'}
                      </span>
                    </div>

                    {/* Middle: Weight & Reps Inputs (Rivlo style horizontal) */}
                    <div className="flex items-center gap-2 flex-1 justify-end sm:justify-center">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min={0}
                          max={999}
                          value={s.weightKg === 0 ? '' : s.weightKg}
                          placeholder="0"
                          onChange={(e) => {
                            const v = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                            handleSetFieldChange(exIdx, setIdx, 'weightKg', v);
                          }}
                          className="w-16 sm:w-20 h-10 px-2 rounded-xl bg-white border border-slate-300 text-sm sm:text-base font-black font-mono-tabular text-center text-[#1E1638] focus:border-[#5E2EE8] focus:outline-none shadow-2xs"
                        />
                        <span className="text-[11px] font-bold text-slate-500">kg</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={999}
                          value={s.repsDone === 0 ? '' : s.repsDone}
                          placeholder="0"
                          onChange={(e) => {
                            const v = e.target.value === '' ? 0 : Math.max(0, Math.round(Number(e.target.value)));
                            handleSetFieldChange(exIdx, setIdx, 'repsDone', v);
                          }}
                          className="w-16 sm:w-20 h-10 px-2 rounded-xl bg-white border border-slate-300 text-sm sm:text-base font-black font-mono-tabular text-center text-[#1E1638] focus:border-[#5E2EE8] focus:outline-none shadow-2xs"
                        />
                        <span className="text-[11px] font-bold text-slate-500">reps</span>
                      </div>
                    </div>

                    {/* Right: Actions (Delete & Circular Check Button) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {exSlot.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSet(exIdx, setIdx)}
                          title="Remover série"
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleSetCompleted(exIdx, setIdx)}
                        title={s.completed ? 'Série concluída' : 'Concluir série'}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                          s.completed
                            ? 'bg-[#10B981] text-white'
                            : 'bg-white border-2 border-[#5E2EE8] text-[#5E2EE8] hover:bg-[#F2EDFF]'
                        }`}
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. AQUECIMENTO E SÉRIES ADICIONAIS */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleAddExtraSet(exIdx, true)}
                  className="px-3 py-2 rounded-xl bg-[#FAF8FF] text-[#5E2EE8] border border-purple-100 text-xs font-bold hover:bg-[#F2EDFF] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aquecimento</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddExtraSet(exIdx, false)}
                  className="px-3.5 py-2 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold hover:bg-[#4E21D0] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Série</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Adicionar Exercício Button */}
        <button
          type="button"
          onClick={() => setShowAddExercisePicker(true)}
          className="w-full py-4 rounded-3xl border-2 border-dashed border-[#5E2EE8]/40 bg-[#FAF8FF] hover:bg-[#F2EDFF] text-[#5E2EE8] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
      )}

      {/* Modal para Adicionar Exercício à Sessão Atual */}
      {showAddExercisePicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl p-6 overflow-y-auto shadow-2xl">
            <ExerciseLibraryBrowser
              favoriteIds={profile.favoriteExerciseIds || []}
              recentIds={profile.recentExerciseIds || []}
              exerciseLogs={exerciseLogs}
              onToggleFavorite={onToggleFavoriteExercise}
              selectionModeTitle="Adicionar Exercício ao Treino Atual"
              onCloseSelectionModal={() => setShowAddExercisePicker(false)}
              onSelectForWorkout={(ex) => {
                const prevLog = exerciseLogs.find((l) => l.exerciseId === ex.id);
                const defaultWeight = prevLog ? prevLog.maxWeightKg : 20;
                const newSlotEntry = {
                  slotId: `slot_added_${Date.now()}`,
                  exerciseId: ex.id,
                  notes: ex.importantNotes.slice(0, 80),
                  restSeconds: 60,
                  sets: Array.from({ length: 3 }, (_, idx) => ({
                    setNumber: idx + 1,
                    plannedReps: '10-12',
                    weightKg: defaultWeight,
                    repsDone: 10,
                    completed: false,
                  })),
                };
                onUpdateSession({
                  ...session,
                  exercises: [...session.exercises, newSlotEntry],
                });
                setShowAddExercisePicker(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 5. DESCANSO FIXO NA PARTE INFERIOR — Largura Proporcionada para iPhone */}
      <div
        style={{
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
        }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E1638] text-white border-t border-purple-900 shadow-2xl px-3 py-2"
      >
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#5E2EE8] flex items-center justify-center text-white shrink-0 shadow-inner">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-300 block truncate">
                Descanso
              </span>
              <span className="text-base sm:text-lg font-black font-mono-tabular text-white leading-none block">
                {formatDuration(session.restTimer.remainingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {/* Quick sound toggle */}
            <button
              type="button"
              onClick={() => {
                unlockMobileAudio();
                setSoundEnabled((s) => !s);
              }}
              title={soundEnabled ? 'Som ativado' : 'Som desativado'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-purple-600/60 border-purple-400 text-white'
                  : 'bg-white/10 border-white/20 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Quick mobile background notification button */}
            {notifPermission !== 'granted' && (
              <button
                type="button"
                onClick={async () => {
                  unlockMobileAudio();
                  const res = await requestNotificationPermission();
                  setNotifPermission(res);
                  if (res === 'granted') {
                    await sendRestFinishedNotification();
                  }
                }}
                title="Ativar alerta ao sair do app"
                className="px-2 py-1 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 animate-bounce"
              >
                <Bell className="w-3 h-3" />
                <span>Avisar no Celular</span>
              </button>
            )}

            {[45, 60, 90].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  unlockMobileAudio();
                  onUpdateSession({
                    ...session,
                    restTimer: {
                      active: true,
                      remainingSeconds: sec,
                      totalSeconds: sec,
                      startedAtMs: Date.now(),
                    },
                  });
                }}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold font-mono-tabular cursor-pointer shrink-0"
              >
                {sec}s
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                unlockMobileAudio();
                const willBeActive = !session.restTimer.active;
                const now = Date.now();
                onUpdateSession({
                  ...session,
                  restTimer: {
                    ...session.restTimer,
                    active: willBeActive,
                    startedAtMs: willBeActive ? now - (session.restTimer.totalSeconds - session.restTimer.remainingSeconds) * 1000 : session.restTimer.startedAtMs,
                  },
                });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#5E2EE8] hover:bg-[#4E21D0] text-white text-[11px] font-extrabold cursor-pointer shrink-0"
            >
              {session.restTimer.active ? 'Pausar' : 'Iniciar'}
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateSession({
                  ...session,
                  restTimer: { active: false, remainingSeconds: 0, totalSeconds: 60 },
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-extrabold cursor-pointer shrink-0"
            >
              Pular
            </button>
          </div>
        </div>
      </div>

      {/* MENU DE OPÇÕES DA EXECUÇÃO */}
      {showOptionsMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-[#1E1638]">Opções de Treino</h3>
              <button
                type="button"
                onClick={() => setShowOptionsMenu(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  unlockMobileAudio();
                  setSoundEnabled((s) => !s);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-[#1E1638] text-xs font-bold flex items-center justify-between hover:bg-[#F2EDFF] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-[#5E2EE8]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span>Alertas Sonoros</span>
                </div>
                <span className="text-[11px] font-black text-[#5E2EE8]">
                  {soundEnabled ? 'Ativado' : 'Desativado'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVibrationEnabled((v) => !v)}
                className="w-full px-4 py-3 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-[#1E1638] text-xs font-bold flex items-center justify-between hover:bg-[#F2EDFF] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#5E2EE8] shrink-0" />
                  <div className="text-left">
                    <span>Vibração Tátil (Haptic)</span>
                    {isIOSDevice() && (
                      <span className="block text-[10px] font-normal text-amber-700 mt-0.5 leading-tight">
                        No iPhone (iOS), as vibrações em navegadores são restritas pela Apple.
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-black text-[#5E2EE8] shrink-0 ml-2">
                  {vibrationEnabled ? 'Ativado' : 'Desativado'}
                </span>
              </button>

              {/* Notificação Mobile Push com Busto do Pombo */}
              <button
                type="button"
                onClick={async () => {
                  unlockMobileAudio();
                  const subRes = await subscribeUserToWebPush(profile.userId);
                  setNotifPermission(subRes.permission);
                  if (subRes.permission === 'granted') {
                    await sendRestFinishedNotification(profile.userId);
                  } else if (notifPermission !== 'granted') {
                    const res = await requestNotificationPermission();
                    setNotifPermission(res);
                    if (res === 'granted') {
                      await sendRestFinishedNotification(profile.userId);
                    }
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-[#1E1638] text-xs font-bold flex items-center justify-between hover:bg-[#F2EDFF] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-[#5E2EE8] shrink-0" />
                  <div className="text-left">
                    <span>Notificações Push em 2º Plano / Tela Bloqueada</span>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5 leading-tight">
                      Avisa pelo servidor mesmo com o app fechado ou tela bloqueada
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-black text-[#5E2EE8] shrink-0 ml-2">
                  {notifPermission === 'granted'
                    ? 'Push Ativo ✅'
                    : notifPermission === 'denied'
                    ? 'Bloqueado ⚠️'
                    : 'Ativar 🔔'}
                </span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  unlockMobileAudio();
                  triggerRestAlert(soundEnabled, vibrationEnabled);
                  setRestFinishedToast(true);
                  if (notifPermission === 'granted') {
                    await sendRestFinishedNotification();
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-100 to-[#F2EDFF] border border-purple-200 text-[#5E2EE8] text-xs font-extrabold hover:bg-purple-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
              >
                <span>🔊 Testar Alerta Completo (Som, Vibração & Pombo)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  onMinimizeSession();
                }}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Minimizar Treino (Continuar em segundo plano)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowEarlyTerminateModal(true);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2.5 hover:bg-amber-100 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Encerrar Treino Antecipadamente</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowOptionsMenu(false)}
              className="w-full py-3 rounded-2xl bg-[#1E1638] text-white text-xs font-extrabold hover:bg-slate-800 cursor-pointer mt-2"
            >
              Fechar Menu
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CONCLUSÃO DE TREINO */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F2EDFF] text-[#7650C9] flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#24212B]">Finalizar Treino?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Você completou <strong>{completedSetsCount}</strong> de <strong>{totalSetsCount}</strong> séries em <strong>{formatDuration(elapsedSec)}</strong>.
              </p>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF9FC] border border-slate-200 text-left cursor-pointer hover:border-[#7650C9] transition-colors">
              <input
                type="checkbox"
                checked={updateOriginalPlan}
                onChange={(e) => setUpdateOriginalPlan(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#7650C9] rounded accent-[#7650C9]"
              />
              <div className="text-xs">
                <span className="font-bold text-[#24212B] block">
                  Atualizar ficha original com estas cargas e séries
                </span>
                <span className="text-slate-500 block mt-1 leading-relaxed">
                  {updateOriginalPlan
                    ? 'As novas cargas e contagem de séries substituirão os valores originais da sua ficha.'
                    : 'A ficha original permanecerá inalterada. As cargas e repetições de hoje serão gravadas no seu histórico.'}
                </span>
              </div>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Continuar Treinando
              </button>
              <button
                type="button"
                disabled={finishing}
                onClick={handleConfirmFinishWorkout}
                className="flex-1 py-3.5 rounded-2xl bg-[#7650C9] text-white text-xs font-black hover:bg-[#643FB5] shadow-md shadow-[#7650C9]/25 disabled:opacity-60"
              >
                {finishing ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLTAR ACTION MENU MODAL */}
      {showBackMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <h3 className="text-lg font-black text-[#1E1638]">Menu de Navegação</h3>
            <p className="text-xs text-slate-500">
              O que você deseja fazer com este treino em andamento?
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBackMenu(false)}
                className="w-full py-3 rounded-2xl bg-[#5E2EE8] text-white text-xs font-extrabold hover:bg-[#4E21D0] cursor-pointer"
              >
                Continuar Treinando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBackMenu(false);
                  onMinimizeSession();
                }}
                className="w-full py-3 rounded-2xl bg-purple-50 text-[#5E2EE8] text-xs font-extrabold hover:bg-purple-100 cursor-pointer"
              >
                Minimizar Treino (Continuar depois)
              </button>
              <button
                type="button"
                onClick={() => setShowBackMenu(false)}
                className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EARLY TERMINATION MODAL */}
      {showEarlyTerminateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#1E1638]">Encerrar Treino Antecipadamente</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Você concluiu <strong>{completedSetsCount}</strong> de <strong>{totalSetsCount}</strong> séries. Como deseja proceder?
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={finishing || completedSetsCount === 0}
                onClick={handleSavePartialProgress}
                className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] text-white text-xs font-extrabold hover:bg-[#4E21D0] cursor-pointer disabled:opacity-40"
              >
                Salvar Progresso Parcial (Registrar o que foi feito)
              </button>
              <button
                type="button"
                onClick={() => setShowEarlyTerminateModal(false)}
                className="w-full py-3.5 rounded-2xl bg-purple-50 text-[#5E2EE8] text-xs font-extrabold hover:bg-purple-100 cursor-pointer"
              >
                Continuar Treinando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEarlyTerminateModal(false);
                  setShowDiscardConfirm(true);
                }}
                className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer"
              >
                Descartar Sessão (Não registrar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCARD CONFIRMATION MODAL */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-center">
            <h3 className="text-lg font-black text-red-600">Descartar Esta Sessão?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Atenção: ao descartar, nenhuma carga ou série realizada nesta sessão será salva no histórico. Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onCancelSession();
                }}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Sim, Descartar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectExercise && (
        <ExerciseDetailModal
          exercise={inspectExercise}
          exerciseLogs={exerciseLogs}
          isFavorite={(profile.favoriteExerciseIds || []).includes(inspectExercise.id)}
          onToggleFavorite={onToggleFavoriteExercise}
          onClose={() => setInspectExercise(null)}
        />
      )}

      {substituteSlotIndex !== null && (
        <ExerciseSubstitutionModal
          currentExercise={
            getExerciseById(session.exercises[substituteSlotIndex].exerciseId) ||
            EXERCISES_CATALOG[0]
          }
          availableEquipment={profile.availableEquipment}
          limitations={profile.limitations}
          onClose={() => setSubstituteSlotIndex(null)}
          onConfirmSubstitute={(newEx) => {
            const updated = session.exercises.map((item, idx) =>
              idx === substituteSlotIndex ? { ...item, exerciseId: newEx.id } : item
            );
            onUpdateSession({ ...session, exercises: updated });
          }}
        />
      )}
    </div>
  );
};
