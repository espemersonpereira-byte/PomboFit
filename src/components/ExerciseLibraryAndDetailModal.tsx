import React, { useState, useMemo } from 'react';
import {
  ExerciseItem,
  ExerciseHistoryLog,
  MuscleCategory,
  EquipmentCategory,
} from '../types';
import {
  EXERCISES_CATALOG,
  MUSCLE_CATEGORIES,
  EQUIPMENT_CATEGORIES,
  findAlternativeExercises,
} from '../data/exercisesCatalog';
import {
  AnatomicalMuscleMap,
  ExerciseDemonstrationCard,
  ExerciseVerifiedVisual,
  resolveExerciseApparatus,
} from './AnatomicalVisuals';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  History,
  Maximize2,
  Plus,
  Search,
  ShieldAlert,
  Star,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react';

const DISPLAY_MUSCLE_LABELS: Record<MuscleCategory, string> = {
  Peito: 'Peitoral',
  Costas: 'Costas',
  Ombros: 'Ombros',
  Bíceps: 'Bíceps',
  Tríceps: 'Tríceps',
  Antebraços: 'Antebraços',
  Quadríceps: 'Quadríceps',
  'Posteriores de coxa': 'Posteriores de coxa',
  Glúteos: 'Glúteos',
  Panturrilhas: 'Panturrilhas',
  Abdômen: 'Abdômen',
  Cardio: 'Cardio',
};

const CATEGORY_REPRESENTATIVE_EXERCISE_ID: Record<MuscleCategory, string> = {
  Peito: 'peito_supino_reto_barra',
  Costas: 'costas_puxada_alta_aberta',
  Ombros: 'ombros_desenvolvimento_halteres',
  Bíceps: 'biceps_rosca_direta_barra_reta',
  Tríceps: 'triceps_pulley_corda',
  Antebraços: 'antebracos_rosca_punho_barra',
  Quadríceps: 'quadriceps_leg_press_45',
  'Posteriores de coxa': 'posteriores_mesa_flexora',
  Glúteos: 'gluteos_elevacao_pelvica_barra',
  Panturrilhas: 'panturrilhas_em_pe_maquina',
  Abdômen: 'abdomen_crunch_polia_alta_corda',
  Cardio: 'cardio_corrida_esteira',
};

interface ExerciseDetailModalProps {
  exercise: ExerciseItem;
  exerciseLogs: ExerciseHistoryLog[];
  isFavorite: boolean;
  onToggleFavorite: (exerciseId: string) => void;
  onClose: () => void;
  onAddToWorkout?: (exercise: ExerciseItem) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  exerciseLogs,
  isFavorite,
  onToggleFavorite,
  onClose,
  onAddToWorkout,
}) => {
  const { apparatusTitle, kinematicCallout } = useMemo(
    () => resolveExerciseApparatus(exercise),
    [exercise]
  );

  const myLogs = useMemo(
    () =>
      exerciseLogs
        .filter((l) => l.exerciseId === exercise.id)
        .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()),
    [exerciseLogs, exercise.id]
  );

  const bestWeight = useMemo(
    () => (myLogs.length > 0 ? Math.max(...myLogs.map((l) => l.maxWeightKg)) : 0),
    [myLogs]
  );

  return (
    <div
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white w-full max-w-lg max-h-[90dvh] rounded-[28px] sm:rounded-[32px] flex flex-col overflow-hidden shadow-2xl border border-purple-50">
        {/* Top Solid Purple Header */}
        <div className="bg-[#5E2EE8] text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 text-white hover:text-purple-200 transition-colors cursor-pointer"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="text-center min-w-0 px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block truncate">
              {DISPLAY_MUSCLE_LABELS[exercise.muscleGroup]} · {exercise.equipment}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
              {exercise.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(exercise.id)}
            className="p-1.5 -mr-1 text-white hover:text-amber-300 transition-colors cursor-pointer"
            aria-label="Favoritar exercício"
          >
            <Star
              className={`w-6 h-6 ${
                isFavorite
                  ? 'text-amber-300 fill-amber-300'
                  : 'text-white stroke-[2]'
              }`}
            />
          </button>
        </div>

        {/* Scrollable Body with all mandatory technical sections */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Mascot Instructor Verification Header */}
          <div className="bg-[#F4F0FF] border border-[#E4DCFC] rounded-2xl p-3 flex items-center gap-3">
            <img
              src="/assets/mascots/pombo_head.jpg"
              alt="Instrutor Pombo"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#5E2EE8] shrink-0"
            />
            <div className="text-xs text-[#1E1638] leading-snug min-w-0">
              <strong className="font-extrabold text-[#5E2EE8] block truncate">
                Aparelho Verificado: {apparatusTitle}
              </strong>
              <span className="text-slate-600 block">
                {kinematicCallout}
              </span>
            </div>
          </div>

          {/* 5. Demonstração Visual Verificada Correspondente ao Exercício e Aparelho */}
          <ExerciseDemonstrationCard exercise={exercise} showPhaseSelector={true} />

          {/* Dual Anatomical Muscle Map (Front and Back with active zones) */}
          <div className="w-full">
            <AnatomicalMuscleMap
              primaryZones={exercise.primaryZoneIds}
              secondaryZones={exercise.secondaryZoneIds}
              compact={true}
            />
          </div>

          {/* Equipamento, Músculo Principal e Músculos Secundários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0 shadow-2xs">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Equipamento Utilizado
                </span>
                <span className="text-xs font-black text-[#1E1638] block">
                  {exercise.equipment} ({apparatusTitle})
                </span>
              </div>
            </div>

            <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Músculos Principais
                </span>
                <span className="text-xs font-black text-[#1E1638] block">
                  {exercise.primaryMuscles.join(', ')}
                </span>
              </div>
            </div>
          </div>

          {exercise.secondaryMuscles.length > 0 && (
            <div className="bg-[#FAF8FF] border border-purple-100 rounded-2xl px-3.5 py-2.5 text-xs text-slate-600">
              <strong className="text-[#1E1638] font-extrabold">Músculos Secundários (Sinergistas): </strong>
              {exercise.secondaryMuscles.join(', ')}
            </div>
          )}

          {/* Posição Inicial */}
          <div className="bg-white rounded-2xl border border-purple-50 p-4 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block">
              Posição Inicial e Ajuste do Aparelho
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {exercise.startingPosition}
            </p>
          </div>

          {/* Execução Correta Passo a Passo */}
          <div className="bg-white rounded-2xl border border-purple-50 p-4 space-y-3 shadow-xs">
            <h3 className="text-sm font-black text-[#1E1638]">
              Instruções de Execução Passo a Passo
            </h3>
            <div className="space-y-2.5">
              {exercise.executionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#5E2EE8] text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Amplitude do Movimento & Respiração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-xs text-slate-600 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                <span>Amplitude e Finalização</span>
              </span>
              <p className="leading-relaxed">{exercise.endingPosition}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-xs text-slate-600 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>Cadência & Respiração</span>
              </span>
              <p className="leading-relaxed">{exercise.breathingTip}</p>
            </div>
          </div>

          {/* Erros Comuns */}
          {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Erros Comuns a Evitar</span>
              </span>
              <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                {exercise.commonMistakes.map((err, i) => (
                  <li key={i} className="leading-relaxed">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Orientações de Segurança */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              <span>Orientações de Segurança Articular</span>
            </span>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {exercise.safetyPrecautions}
            </p>
          </div>

          {/* Personal History for this Exercise */}
          {myLogs.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#F4F0FF] border border-[#E4DCFC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1E1638] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#5E2EE8]" />
                  <span>Seu Histórico Real neste Exercício</span>
                </span>
                <span className="text-xs font-black text-[#5E2EE8] font-mono-tabular">
                  Recorde: {bestWeight} kg
                </span>
              </div>
              <div className="space-y-1">
                {myLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-[11px] text-slate-600 bg-white/80 px-2.5 py-1.5 rounded-xl"
                  >
                    <span>{new Date(log.dateISO).toLocaleDateString('pt-BR')}</span>
                    <span className="font-mono-tabular font-bold text-[#1E1638]">
                      {log.setsSummary} (Máx: {log.maxWeightKg}kg)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="p-4 border-t border-purple-50 bg-white">
          <button
            type="button"
            onClick={() => {
              if (onAddToWorkout) {
                onAddToWorkout(exercise);
              }
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#5E2EE8]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{onAddToWorkout ? 'Adicionar à Ficha' : 'Fechar Detalhes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ExerciseLibraryBrowserProps {
  favoriteIds: string[];
  recentIds: string[];
  exerciseLogs: ExerciseHistoryLog[];
  onToggleFavorite: (exerciseId: string) => void;
  onSelectForWorkout?: (exercise: ExerciseItem) => void;
  selectionModeTitle?: string;
  onCloseSelectionModal?: () => void;
}

export const ExerciseLibraryBrowser: React.FC<ExerciseLibraryBrowserProps> = ({
  favoriteIds,
  recentIds,
  exerciseLogs,
  onToggleFavorite,
  onSelectForWorkout,
  selectionModeTitle,
  onCloseSelectionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'Todos' | 'Favoritos' | 'Recentes' | MuscleCategory
  >('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentCategory | 'Todos'>('Todos');
  const [inspectExercise, setInspectExercise] = useState<ExerciseItem | null>(null);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EXERCISES_CATALOG.filter((ex) => {
      if (selectedCategory === 'Favoritos') {
        if (!favoriteIds.includes(ex.id)) return false;
      } else if (selectedCategory === 'Recentes') {
        if (!recentIds.includes(ex.id)) return false;
      } else if (selectedCategory !== 'Todos') {
        if (ex.muscleGroup !== selectedCategory) return false;
      }

      if (selectedEquipment !== 'Todos' && ex.equipment !== selectedEquipment) {
        return false;
      }

      if (q) {
        const displayCat = DISPLAY_MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup;
        const hay = `${ex.name} ${ex.muscleGroup} ${displayCat} ${ex.equipment} ${ex.movementType} ${ex.primaryMuscles.join(' ')} ${ex.secondaryMuscles.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedEquipment, favoriteIds, recentIds]);

  const categoryCards = useMemo(() => {
    return MUSCLE_CATEGORIES.map((cat) => {
      const repId = CATEGORY_REPRESENTATIVE_EXERCISE_ID[cat];
      const repExercise =
        EXERCISES_CATALOG.find((e) => e.id === repId) ||
        EXERCISES_CATALOG.find((e) => e.muscleGroup === cat) ||
        EXERCISES_CATALOG[0];
      return {
        muscleGroup: cat,
        displayName: DISPLAY_MUSCLE_LABELS[cat],
        count: EXERCISES_CATALOG.filter((e) => e.muscleGroup === cat).length,
        representativeExercise: repExercise,
      };
    });
  }, []);

  const showCategoryOverview =
    selectedCategory === 'Todos' &&
    selectedEquipment === 'Todos' &&
    !searchQuery.trim();

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto">
      {selectionModeTitle && (
        <div className="flex items-center justify-between pb-2 border-b border-purple-50">
          <h3 className="text-base font-extrabold text-[#1E1638]">{selectionModeTitle}</h3>
          {onCloseSelectionModal && (
            <button
              type="button"
              onClick={onCloseSelectionModal}
              className="px-3.5 py-2 rounded-xl bg-purple-50 text-xs font-bold text-[#5E2EE8] cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>
      )}

      {/* Search + Equipment Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar exercício, aparelho ou músculo (ex: Leg Press 45, Extensora)..."
            className="w-full h-12 pl-12 pr-10 rounded-2xl bg-white border border-slate-200 text-sm text-[#1E1638] placeholder-slate-400 font-medium focus:border-[#5E2EE8] focus:ring-2 focus:ring-[#5E2EE8]/20 focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value as EquipmentCategory | 'Todos')}
          className="h-12 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#1E1638] focus:border-[#5E2EE8] focus:outline-none shadow-2xs cursor-pointer shrink-0"
        >
          <option value="Todos">Todos os Equipamentos</option>
          {EQUIPMENT_CATEGORIES.map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
        </select>
      </div>

      {/* Horizontal Category Pills: All 12 Official Muscle Groups + Favoritos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {(
          [
            { id: 'Todos', label: `Todos (${EXERCISES_CATALOG.length})` },
            { id: 'Favoritos', label: `★ Favoritos (${favoriteIds.length})` },
            ...MUSCLE_CATEGORIES.map((m) => ({
              id: m,
              label: DISPLAY_MUSCLE_LABELS[m],
            })),
          ] as const
        ).map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#5E2EE8] text-white shadow-xs'
                  : 'bg-[#F0EBFE] text-[#5E2EE8] hover:bg-[#E5DCFD]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 12 Muscle Group Cards Overview vs Filtered Exercises List */}
      {showCategoryOverview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {categoryCards.map((item) => (
            <button
              key={item.muscleGroup}
              type="button"
              onClick={() => setSelectedCategory(item.muscleGroup)}
              className="w-full bg-white rounded-2xl p-4 border border-purple-50 shadow-xs hover:border-[#5E2EE8] transition-all flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF8FF] border border-purple-100 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  <ExerciseVerifiedVisual exercise={item.representativeExercise} compact />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors truncate">
                    {item.displayName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {item.count} exercícios verificados
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5E2EE8] transition-colors shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-500">
              {filteredExercises.length} exercícios encontrados
            </span>
            {(selectedCategory !== 'Todos' || selectedEquipment !== 'Todos' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setSelectedEquipment('Todos');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-[#5E2EE8] hover:underline cursor-pointer"
              >
                Ver todos os 12 grupos musculares
              </button>
            )}
          </div>

          {filteredExercises.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-50 p-8 text-center space-y-3">
              <img
                src="/assets/mascots/pombo_head.jpg"
                alt="PomboFit"
                className="w-14 h-14 rounded-full object-cover mx-auto border-2 border-[#5E2EE8]"
              />
              <h4 className="text-sm font-extrabold text-[#1E1638]">
                Nenhum exercício encontrado para este filtro
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tente buscar por outro termo ou limpar os filtros de equipamento e categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredExercises.map((ex) => {
                const { apparatusTitle } = resolveExerciseApparatus(ex);
                return (
                  <div
                    key={ex.id}
                    onClick={() => {
                      if (onSelectForWorkout) {
                        onSelectForWorkout(ex);
                      } else {
                        setInspectExercise(ex);
                      }
                    }}
                    className="w-full bg-white rounded-2xl p-3.5 border border-purple-50 shadow-xs hover:border-[#5E2EE8] transition-all flex items-center justify-between gap-3 text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-[#FAF8FF] border border-purple-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <ExerciseVerifiedVisual exercise={ex} compact />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors leading-snug">
                          {ex.name}
                        </h4>
                        <p className="text-xs text-[#5E2EE8] font-bold mt-0.5 truncate">
                          {apparatusTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {DISPLAY_MUSCLE_LABELS[ex.muscleGroup]} · Foco: {ex.primaryMuscles[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectForWorkout && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectExercise(ex);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#F0EBFE] text-[#5E2EE8] text-[11px] font-bold hover:bg-[#E4DCFC] cursor-pointer"
                        >
                          Ver 3D
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(ex.id);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-400 cursor-pointer"
                        aria-label="Favoritar"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            favoriteIds.includes(ex.id)
                              ? 'text-amber-400 fill-amber-400'
                              : 'stroke-[2]'
                          }`}
                        />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5E2EE8]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {inspectExercise && (
        <ExerciseDetailModal
          exercise={inspectExercise}
          exerciseLogs={exerciseLogs}
          isFavorite={favoriteIds.includes(inspectExercise.id)}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setInspectExercise(null)}
          onAddToWorkout={onSelectForWorkout}
        />
      )}
    </div>
  );
};

interface ExerciseSubstitutionModalProps {
  currentExercise: ExerciseItem;
  availableEquipment?: EquipmentCategory[];
  limitations?: string;
  onConfirmSubstitute: (newExercise: ExerciseItem) => void;
  onClose: () => void;
}

export const ExerciseSubstitutionModal: React.FC<ExerciseSubstitutionModalProps> = ({
  currentExercise,
  availableEquipment,
  limitations,
  onConfirmSubstitute,
  onClose,
}) => {
  const alternatives = useMemo(
    () => findAlternativeExercises(currentExercise, availableEquipment, limitations),
    [currentExercise, availableEquipment, limitations]
  );

  const [selectedCandidate, setSelectedCandidate] = useState<ExerciseItem | null>(
    alternatives[0] || null
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
          <span className="text-xs font-black text-[#5E2EE8] uppercase">
            Substituição de Exercício
          </span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <p className="text-xs text-slate-500">
            Exercício atual: <strong>{currentExercise.name}</strong> ({currentExercise.equipment})
          </p>
          <div className="space-y-2">
            {alternatives.map((alt) => {
              const { apparatusTitle } = resolveExerciseApparatus(alt);
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => setSelectedCandidate(alt)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                    selectedCandidate?.id === alt.id
                      ? 'border-[#5E2EE8] bg-[#F0EBFE]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF8FF] border border-purple-100 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <ExerciseVerifiedVisual exercise={alt} compact />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-[#1E1638] truncate">{alt.name}</h4>
                      <p className="text-[11px] text-[#5E2EE8] font-bold mt-0.5 truncate">
                        {apparatusTitle}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {alt.muscleGroup} · {alt.equipment}
                      </p>
                    </div>
                  </div>
                  {selectedCandidate?.id === alt.id && (
                    <Check className="w-4 h-4 text-[#5E2EE8] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-purple-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedCandidate}
            onClick={() => {
              if (selectedCandidate) {
                onConfirmSubstitute(selectedCandidate);
                onClose();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold hover:bg-[#4E21D0] disabled:opacity-50 cursor-pointer"
          >
            Confirmar Substituição
          </button>
        </div>
      </div>
    </div>
  );
};
