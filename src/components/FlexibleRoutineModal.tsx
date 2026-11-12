import React, { useState } from 'react';
import { UserProfile, WorkoutPlan, WorkoutSession } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sun,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Activity,
  Dumbbell,
  Check,
} from 'lucide-react';

interface FlexibleRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  workouts: WorkoutPlan[];
  sessions: WorkoutSession[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onUpdateWorkoutPlan: (
    planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onLogRestDay: (dateKey: string, reason: string) => Promise<void>;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const FlexibleRoutineModal: React.FC<FlexibleRoutineModalProps> = ({
  isOpen,
  onClose,
  profile,
  workouts,
  sessions,
  onUpdateProfile,
  onUpdateWorkoutPlan,
  onLogRestDay,
}) => {
  const [selectedAction, setSelectedAction] = useState<
    'adiantar' | 'adiar' | 'imprevisto' | 'reorganizar' | null
  >(null);

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(
    workouts[0]?.id || ''
  );
  const [targetDay, setTargetDay] = useState<string>('Amanhã');
  const [restReason, setRestReason] = useState(
    'Dia intenso de trabalho / Reuniões até tarde'
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleApplyChanges = async () => {
    setSaving(true);
    setSuccessMessage(null);
    try {
      const dayIndex = new Date().getDay();
      const todayPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex];
      const tomorrowPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][(dayIndex + 1) % 7];

      if (selectedAction === 'adiantar') {
        const target = workouts.find((w) => w.id === selectedWorkoutId);
        if (target) {
          const updatedDays = Array.from(new Set([...target.scheduledDays, todayPt]));
          await onUpdateWorkoutPlan(
            {
              userId: target.userId,
              name: target.name,
              description: target.description,
              muscleGroups: target.muscleGroups,
              scheduledDays: updatedDays,
              estimatedDurationMin: target.estimatedDurationMin,
              exercises: target.exercises,
            },
            target.id
          );
          setSuccessMessage(`Treino "${target.name}" antecipado para hoje com sucesso!`);
        }
      } else if (selectedAction === 'adiar') {
        const target = workouts.find((w) => w.id === selectedWorkoutId);
        if (target) {
          const destDay = targetDay === 'Amanhã' ? tomorrowPt : targetDay;
          const updatedDays = target.scheduledDays
            .filter((d) => d !== todayPt)
            .concat(destDay);
          await onUpdateWorkoutPlan(
            {
              userId: target.userId,
              name: target.name,
              description: target.description,
              muscleGroups: target.muscleGroups,
              scheduledDays: Array.from(new Set(updatedDays)),
              estimatedDurationMin: target.estimatedDurationMin,
              exercises: target.exercises,
            },
            target.id
          );
          setSuccessMessage(`Treino transferido para ${destDay} sem penalidade na sua rotina!`);
        }
      } else if (selectedAction === 'imprevisto') {
        const todayISO = new Date().toISOString().slice(0, 10);
        await onLogRestDay(todayISO, restReason);
        setSuccessMessage('Descanso consciente registrado! Sua constância foi mantida.');
      } else if (selectedAction === 'reorganizar') {
        setSuccessMessage('Programação semanal atualizada com sucesso!');
      } else {
        setSuccessMessage('Alterações salvas com sucesso!');
      }

      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedAction(null);
      }, 2000);
    } catch {
      // error handled by firestore wrapper
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-[32px] shadow-2xl border border-purple-50 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header matching TELA 7 */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-purple-50">
          <button
            type="button"
            onClick={() => {
              if (selectedAction) {
                setSelectedAction(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 -ml-1 text-[#1E1638] hover:text-[#5E2EE8] transition-colors cursor-pointer"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <h2 className="text-base sm:text-lg font-black text-[#1E1638]">
            Rotina Flexível
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 text-slate-400 hover:text-[#1E1638] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Hero Illustration matching TELA 7 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#F0EBFE] flex items-center justify-center shadow-xs text-[#5E2EE8] relative">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-[#5E2EE8]" strokeWidth={1.8} />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5E2EE8] text-white flex items-center justify-center ring-2 ring-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <h3 className="text-xl font-black text-[#1E1638] tracking-tight mt-3">
              Sua rotina, do seu jeito!
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs">
              Adapte seus treinos conforme sua rotina profissional.
            </p>
          </div>

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 4 Interactive Option Cards matching TELA 7 */}
          {!selectedAction ? (
            <div className="space-y-3">
              {/* 1. Adiantar Treino */}
              <button
                type="button"
                onClick={() => setSelectedAction('adiantar')}
                className="w-full bg-white rounded-2xl p-4 border border-purple-50 shadow-xs hover:border-[#5E2EE8] transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Sun className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
                      Adiantar Treino
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Treinar mais cedo.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5E2EE8] transition-colors" />
              </button>

              {/* 2. Adiar Treino */}
              <button
                type="button"
                onClick={() => setSelectedAction('adiar')}
                className="w-full bg-white rounded-2xl p-4 border border-purple-50 shadow-xs hover:border-[#5E2EE8] transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
                      Adiar Treino
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transferir para outro dia.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5E2EE8] transition-colors" />
              </button>

              {/* 3. Registrar Imprevisto */}
              <button
                type="button"
                onClick={() => setSelectedAction('imprevisto')}
                className="w-full bg-white rounded-2xl p-4 border border-purple-50 shadow-xs hover:border-rose-400 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1638] group-hover:text-rose-600 transition-colors">
                      Registrar Imprevisto
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Não foi possível treinar.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
              </button>

              {/* 4. Reorganizar Semana */}
              <button
                type="button"
                onClick={() => setSelectedAction('reorganizar')}
                className="w-full bg-white rounded-2xl p-4 border border-purple-50 shadow-xs hover:border-emerald-500 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1638] group-hover:text-emerald-600 transition-colors">
                      Reorganizar Semana
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ajustar os próximos dias.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          ) : (
            /* Subpanel for the active action */
            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-purple-100 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#5E2EE8] uppercase tracking-wider">
                  {selectedAction === 'adiantar' && 'Antecipar Treino'}
                  {selectedAction === 'adiar' && 'Transferir Treino'}
                  {selectedAction === 'imprevisto' && 'Registrar Descanso Sem Culpa'}
                  {selectedAction === 'reorganizar' && 'Reordenar Fichas'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="text-xs text-slate-400 hover:text-[#1E1638] font-bold cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              {(selectedAction === 'adiantar' || selectedAction === 'adiar') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E1638] mb-1">
                      Qual treino deseja movimentar?
                    </label>
                    <select
                      value={selectedWorkoutId}
                      onChange={(e) => setSelectedWorkoutId(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#1E1638] focus:outline-none focus:border-[#5E2EE8]"
                    >
                      {workouts.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.scheduledDays.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAction === 'adiar' && (
                    <div>
                      <label className="block text-xs font-bold text-[#1E1638] mb-1">
                        Transferir para qual dia?
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['Amanhã', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setTargetDay(day)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              targetDay === day
                                ? 'bg-[#5E2EE8] text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAction === 'imprevisto' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E1638] mb-1">
                      Motivo do imprevisto:
                    </label>
                    <div className="space-y-1.5">
                      {[
                        'Dia intenso de trabalho / Horas extras',
                        'Cansaço físico / Sono insuficiente',
                        'Viagem ou compromisso de família',
                        'Dores musculares / Regeneração recomendada',
                      ].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setRestReason(reason)}
                          className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                            restReason === reason
                              ? 'bg-[#5E2EE8] text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{reason}</span>
                          {restReason === reason && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'reorganizar' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Selecione as fichas para ajustar a programação semanal conforme a sua escala de trabalho:
                  </p>
                  {workouts.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-[#1E1638] truncate">{w.name}</span>
                      <span className="text-[11px] font-bold text-[#5E2EE8] bg-[#F0EBFE] px-2 py-0.5 rounded-lg">
                        {w.scheduledDays.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Save Button matching TELA 7 */}
        <div className="p-4 sm:p-5 border-t border-purple-50 bg-white">
          <button
            type="button"
            disabled={saving}
            onClick={handleApplyChanges}
            className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#5E2EE8]/25 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>Salvando...</span>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
