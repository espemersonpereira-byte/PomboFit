import React, { useState } from 'react';
import {
  ExerciseItem,
  MuscleCategory,
  EquipmentCategory,
  MovementPattern,
  AnatomicalZoneId,
} from '../types';
import { X, Dumbbell, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

export interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExercise: (newExercise: ExerciseItem) => Promise<void>;
  userId: string;
}

const MUSCLE_OPTIONS: MuscleCategory[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraços',
  'Abdômen',
  'Quadríceps',
  'Posteriores de coxa',
  'Glúteos',
  'Panturrilhas',
  'Cardio',
];

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

const MOVEMENT_OPTIONS: MovementPattern[] = [
  'Empurrar',
  'Puxar',
  'Agachar',
  'Dobradiça de quadril',
  'Isolado',
  'Core / Estabilização',
  'Cardio / Metabólico',
];

// Zone mapper helper
function mapMuscleToZones(muscle: MuscleCategory): AnatomicalZoneId[] {
  switch (muscle) {
    case 'Peito':
      return ['chest', 'upper_chest'];
    case 'Costas':
      return ['lats', 'traps', 'lower_back'];
    case 'Ombros':
      return ['front_delts', 'side_delts', 'rear_delts'];
    case 'Bíceps':
      return ['biceps'];
    case 'Tríceps':
      return ['triceps'];
    case 'Antebraços':
      return ['forearms'];
    case 'Abdômen':
      return ['abs', 'obliques'];
    case 'Quadríceps':
      return ['quads'];
    case 'Posteriores de coxa':
      return ['hamstrings'];
    case 'Glúteos':
      return ['glutes'];
    case 'Panturrilhas':
      return ['calves'];
    case 'Cardio':
    default:
      return ['cardio_system'];
  }
}

export const CustomExerciseModal: React.FC<CustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onSaveExercise,
  userId,
}) => {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleCategory>('Peito');
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleCategory[]>([]);
  const [equipment, setEquipment] = useState<EquipmentCategory>('Halteres');
  const [movementType, setMovementType] = useState<MovementPattern>('Isolado');
  const [description, setDescription] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSecondaryMuscle = (m: MuscleCategory) => {
    if (m === muscleGroup) return;
    setSecondaryMuscles((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome do exercício.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const exerciseId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const primaryZones = mapMuscleToZones(muscleGroup);
    const secondaryZones = secondaryMuscles.flatMap(mapMuscleToZones);

    const newExercise: ExerciseItem = {
      id: exerciseId,
      name: name.trim(),
      muscleGroup,
      equipment,
      movementType,
      posture: 'standing_press',
      primaryMuscles: [muscleGroup],
      secondaryMuscles: secondaryMuscles.map(String),
      primaryZoneIds: primaryZones,
      secondaryZoneIds: secondaryZones,
      startingPosition: 'Posição inicial correta com boa postura e alinhamento.',
      executionSteps: description.trim()
        ? description.trim().split('\n').filter(Boolean)
        : ['Execute o movimento com amplitude controlada e respiração fluida.'],
      endingPosition: 'Retorne à posição inicial de forma controlada.',
      breathingTip: 'Expire na fase concêntrica (esforço) e inspire na fase excêntrica.',
      importantNotes: importantNotes.trim() || 'Mantenha a postura e contração constante.',
      commonMistakes: ['Excesso de carga comprometendo a postura'],
      safetyPrecautions: 'Respeite seus limites articulares.',
      jointStressTags: [],
      demonstrationImageUrl: imageUrl.trim() || '/assets/mascots/pombo_head.jpg',
      isCustom: true,
      createdByUserId: userId,
      customNotes: importantNotes.trim(),
    };

    try {
      await onSaveExercise(newExercise);
      onClose();
    } catch (err) {
      console.error('Error saving custom exercise:', err);
      setErrorMsg('Não foi possível salvar o exercício. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-[#FAF8FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Biblioteca Pessoal
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1E1638]">
                Criar Exercício Personalizado
              </h3>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block font-bold text-[#1E1638] mb-1">
              Nome do Exercício *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Elevação Pélvica com Halter, Supino no Chão..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
            />
          </div>

          {/* Grupo Muscular Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1E1638] mb-1">
                Músculo Principal *
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => {
                  const val = e.target.value as MuscleCategory;
                  setMuscleGroup(val);
                  setSecondaryMuscles((prev) => prev.filter((m) => m !== val));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
              >
                {MUSCLE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipamento */}
            <div>
              <label className="block font-bold text-[#1E1638] mb-1">
                Equipamento *
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as EquipmentCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
              >
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Padrão de Movimento */}
          <div>
            <label className="block font-bold text-[#1E1638] mb-1">
              Padrão de Movimento
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementPattern)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
            >
              {MOVEMENT_OPTIONS.map((mv) => (
                <option key={mv} value={mv}>
                  {mv}
                </option>
              ))}
            </select>
          </div>

          {/* Grupos Musculares Secundários */}
          <div>
            <label className="block font-bold text-[#1E1638] mb-1.5">
              Músculos Secundários (Opcional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTIONS.filter((m) => m !== muscleGroup).map((m) => {
                const isSelected = secondaryMuscles.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggleSecondaryMuscle(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5E2EE8] text-white border-[#5E2EE8]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instruções / Descrição */}
          <div>
            <label className="block font-bold text-[#1E1638] mb-1">
              Instruções de Execução
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva passo a passo como executar o exercício..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
            />
          </div>

          {/* Observações / Cuidados */}
          <div>
            <label className="block font-bold text-[#1E1638] mb-1">
              Observações e Cuidados Posturais
            </label>
            <input
              type="text"
              value={importantNotes}
              onChange={(e) => setImportantNotes(e.target.value)}
              placeholder="Ex: Manter escápulas travadas, não hiperestender a lombar..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
            />
          </div>

          {/* Imagem Opcional */}
          <div>
            <label className="block font-bold text-[#1E1638] mb-1">
              Link da Imagem Demonstrativa (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto_exercicio.jpg"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#5E2EE8] rounded-xl text-xs text-[#1E1638] focus:outline-hidden"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Se deixar em branco, o PomboFit usará o avatar do mascote Pombo.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#5E2EE8] hover:bg-[#4E21D0] disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Exercício'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
