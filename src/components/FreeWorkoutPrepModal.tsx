import React, { useState, useMemo } from 'react';
import { ExerciseItem, MuscleCategory } from '../types';
import { EXERCISES_CATALOG } from '../data/exercisesCatalog';
import {
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Play,
  Dumbbell,
  Check,
  Info,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface FreeWorkoutPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  customExercises?: ExerciseItem[];
  onStartExecution: (
    sessionExercises: Array<{
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
      }>;
    }>,
    workoutName: string,
    muscleGroups: MuscleCategory[]
  ) => void;
  onInspectExercise?: (exercise: ExerciseItem) => void;
}

const MUSCLE_FILTER_OPTIONS: Array<MuscleCategory | 'Todos'> = [
  'Todos',
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posteriores de coxa',
  'Glúteos',
  'Panturrilhas',
  'Abdômen',
  'Cardio',
];

export const FreeWorkoutPrepModal: React.FC<FreeWorkoutPrepModalProps> = ({
  isOpen,
  onClose,
  customExercises = [],
  onStartExecution,
  onInspectExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleCategory | 'Todos'>('Todos');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState('Treino Livre do Pombo');

  // Combine official database with custom exercises
  const allExercises = useMemo(() => {
    return [...customExercises, ...EXERCISES_CATALOG];
  }, [customExercises]);

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch =
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMuscle =
        selectedMuscle === 'Todos' ||
        ex.muscleGroup.toLowerCase() === selectedMuscle.toLowerCase();

      return matchesSearch && matchesMuscle;
    });
  }, [allExercises, searchQuery, selectedMuscle]);

  // Selected exercises full items in user order
  const selectedItems = useMemo(() => {
    return selectedExerciseIds
      .map((id) => allExercises.find((e) => e.id === id))
      .filter((e): e is ExerciseItem => Boolean(e));
  }, [selectedExerciseIds, allExercises]);

  const handleToggleAddExercise = (exerciseId: string) => {
    if (selectedExerciseIds.includes(exerciseId)) {
      setSelectedExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
    } else {
      setSelectedExerciseIds((prev) => [...prev, exerciseId]);
    }
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedExerciseIds.length - 1)
    ) {
      return;
    }
    const newArr = [...selectedExerciseIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setSelectedExerciseIds(newArr);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
  };

  const handleStartWorkout = () => {
    if (selectedItems.length === 0) return;

    // Collect involved muscle groups
    const distinctGroups = Array.from(
      new Set(selectedItems.map((e) => e.muscleGroup))
    );

    // Map into standard session exercise structure with 3 default sets
    const sessionExercises = selectedItems.map((ex, idx) => ({
      slotId: `free-slot-${idx}-${Date.now()}`,
      exerciseId: ex.id,
      notes: ex.importantNotes || 'Execução controlada',
      restSeconds: 60,
      sets: [
        { setNumber: 1, plannedReps: '10', weightKg: 20, repsDone: 10, completed: false },
        { setNumber: 2, plannedReps: '10', weightKg: 20, repsDone: 10, completed: false },
        { setNumber: 3, plannedReps: '10', weightKg: 20, repsDone: 10, completed: false },
      ],
    }));

    onStartExecution(sessionExercises, workoutTitle, distinctGroups);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7650C9] to-[#5E2EE8] text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block">
                Treino Personalizado na Hora
              </span>
              <input
                type="text"
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
                className="text-base sm:text-lg font-extrabold text-[#1E1638] bg-transparent border-b border-transparent hover:border-purple-200 focus:border-[#5E2EE8] focus:outline-hidden px-0 py-0.5"
                placeholder="Nome do Treino Livre"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Exercises Tray (if any selected) */}
        {selectedItems.length > 0 && (
          <div className="p-3 sm:p-4 bg-[#F8F5FF] border-b border-purple-100/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5E2EE8] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#5E2EE8]" />
                Exercícios Selecionados ({selectedItems.length})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Você pode reordenar ou remover a qualquer momento
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {selectedItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="bg-white border border-purple-200/80 rounded-2xl p-2 flex items-center gap-2.5 shrink-0 shadow-2xs group"
                >
                  <span className="w-5 h-5 rounded-full bg-[#5E2EE8] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="max-w-[130px] min-w-0">
                    <span className="text-xs font-bold text-[#1E1638] block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {item.muscleGroup}
                    </span>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveExercise(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-[#5E2EE8] disabled:opacity-20 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedItems.length - 1}
                      onClick={() => handleMoveExercise(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-[#5E2EE8] disabled:opacity-20 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(item.id)}
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      title="Remover exercício"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Muscle Filters */}
        <div className="p-3 sm:p-4 border-b border-purple-100/60 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar exercício pelo nome ou equipamento..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-2xl text-xs text-[#1E1638] placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Muscle Chips Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {MUSCLE_FILTER_OPTIONS.map((m) => {
              const active = selectedMuscle === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMuscle(m)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#5E2EE8] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises Catalog List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredCatalog.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum exercício encontrado com esses filtros.
            </div>
          ) : (
            filteredCatalog.map((ex) => {
              const isSelected = selectedExerciseIds.includes(ex.id);
              return (
                <div
                  key={ex.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#F7F3FF] border-[#5E2EE8]/50 shadow-2xs'
                      : 'bg-white border-slate-100 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={ex.startImageUrl || ex.demonstrationImageUrl || '/exercises/placeholder.jpg'}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/mascots/pombo_head.jpg';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-[#1E1638] truncate">
                          {ex.name}
                        </h4>
                        {ex.isCustom && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Personalizado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-[#5E2EE8]">{ex.muscleGroup}</span>
                        <span>•</span>
                        <span>{ex.equipment}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onInspectExercise && (
                      <button
                        type="button"
                        onClick={() => onInspectExercise(ex)}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#5E2EE8] hover:bg-purple-50 cursor-pointer"
                        title="Ver instruções anatômicas"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleAddExercise(ex.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#5E2EE8] text-white font-black shadow-xs'
                          : 'bg-[#FAF8FF] text-[#5E2EE8] hover:bg-[#5E2EE8] hover:text-white border border-purple-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Adicionado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Start Workout Action */}
        <div className="p-4 border-t border-purple-100 flex items-center justify-between gap-3 bg-white">
          <div>
            <span className="text-xs font-bold text-[#1E1638] block">
              {selectedItems.length} {selectedItems.length === 1 ? 'exercício selecionado' : 'exercícios selecionados'}
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedItems.length === 0 ? 'Selecione pelo menos 1 exercício' : 'Pronto para treinar!'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleStartWorkout}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7650C9] to-[#5E2EE8] hover:from-[#6440B5] hover:to-[#4E21D0] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-black flex items-center gap-2 shadow-md shadow-purple-500/25 cursor-pointer transition-transform hover:scale-102 active:scale-98"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Treino Livre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
