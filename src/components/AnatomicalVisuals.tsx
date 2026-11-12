import React, { useState, useMemo } from 'react';
import { ExerciseItem, AnatomicalZoneId, MascotForm, ExerciseHistoryLog } from '../types';
import { MASCOT_DATA } from '../data/gamificationAndMascot';
import { CheckCircle2, Columns2, Maximize2 } from 'lucide-react';

/* =========================================================================
   1. MAPA ANATÔMICO MUSCULAR (DUAL VIEW: FRENTE E COSTAS)
   ========================================================================= */

interface AnatomicalMuscleMapProps {
  primaryZones: AnatomicalZoneId[];
  secondaryZones: AnatomicalZoneId[];
  compact?: boolean;
  mascotForm?: MascotForm;
  exerciseLogs?: ExerciseHistoryLog[];
}

export const AnatomicalMuscleMap: React.FC<AnatomicalMuscleMapProps> = ({
  primaryZones,
  secondaryZones,
  compact = false,
  mascotForm = 'pombo_seco',
  exerciseLogs = [],
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<{
    title: string;
    zones: AnatomicalZoneId[];
    categories: string[];
    type: 'Principal' | 'Secundário' | 'Estabilizador';
  } | null>(null);

  const frontCleanImg = '/assets/anatomy/pombo_official_front_clean.jpg';
  const backCleanImg = '/assets/anatomy/pombo_official_back_clean.jpg';

  const muscleGroupsMap = [
    { title: 'Peitoral', zones: ['chest', 'upper_chest'] as AnatomicalZoneId[], categories: ['Peito', 'Peitoral'] },
    { title: 'Ombros', zones: ['front_delts', 'side_delts', 'rear_delts'] as AnatomicalZoneId[], categories: ['Ombros'] },
    { title: 'Bíceps', zones: ['biceps'] as AnatomicalZoneId[], categories: ['Bíceps'] },
    { title: 'Tríceps', zones: ['triceps'] as AnatomicalZoneId[], categories: ['Tríceps'] },
    { title: 'Costas', zones: ['lats', 'traps', 'lower_back'] as AnatomicalZoneId[], categories: ['Costas'] },
    { title: 'Abdômen', zones: ['abs', 'obliques'] as AnatomicalZoneId[], categories: ['Abdômen'] },
    { title: 'Quadríceps', zones: ['quads'] as AnatomicalZoneId[], categories: ['Quadríceps', 'Pernas'] },
    { title: 'Glúteos', zones: ['glutes'] as AnatomicalZoneId[], categories: ['Glúteos'] },
    { title: 'Posteriores', zones: ['hamstrings'] as AnatomicalZoneId[], categories: ['Posteriores de coxa', 'Posterior'] },
    { title: 'Panturrilhas', zones: ['calves'] as AnatomicalZoneId[], categories: ['Panturrilhas'] },
  ];

  const getStatusForMuscle = (zones: AnatomicalZoneId[]): 'Principal' | 'Secundário' | 'Estabilizador' => {
    if (zones.some((z) => primaryZones.includes(z))) return 'Principal';
    if (zones.some((z) => secondaryZones.includes(z))) return 'Secundário';
    return 'Estabilizador';
  };

  const getBadgeColor = (status: 'Principal' | 'Secundário' | 'Estabilizador') => {
    if (status === 'Principal') return 'bg-[#FF5722] text-white border-[#D84315] animate-pulse';
    if (status === 'Secundário') return 'bg-[#FF8A65] text-white border-[#E64A19]';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getMuscleGlowStyle = (status: 'Principal' | 'Secundário' | 'Estabilizador') => {
    if (status === 'Principal') {
      return {
        fill: '#FF5722',
        fillOpacity: 0.78,
        stroke: '#D84315',
        strokeWidth: 1.5,
        filter: 'drop-shadow(0 0 6px #FF5722)',
      };
    }
    if (status === 'Secundário') {
      return {
        fill: '#FF8A65',
        fillOpacity: 0.65,
        stroke: '#E64A19',
        strokeWidth: 1.2,
        filter: 'drop-shadow(0 0 4px #FF8A65)',
      };
    }
    return {
      fill: '#94A3B8',
      fillOpacity: 0.22,
      stroke: '#CBD5E1',
      strokeWidth: 0.8,
    };
  };

  const getMuscleQuickStats = (categories: string[]) => {
    const logs = exerciseLogs.filter((l) =>
      categories.some((cat) => l.muscleGroup?.toLowerCase() === cat.toLowerCase())
    );
    let totalSets = 0;
    let totalVolume = 0;
    logs.forEach((l) => {
      totalSets += l.setsCount || 3;
      totalVolume += l.totalVolumeKg || 0;
    });
    return { totalSets, totalVolume };
  };

  const selectedMuscleStats = useMemo(() => {
    if (!selectedMuscle) return { totalSets: 0, totalVolume: 0, exercises: [] };
    const matchingCategories = selectedMuscle.categories || [selectedMuscle.title];
    const logsForMuscle = exerciseLogs.filter((l) =>
      matchingCategories.some((cat) => l.muscleGroup?.toLowerCase() === cat.toLowerCase())
    );

    let totalSets = 0;
    let totalVolume = 0;
    const exerciseMap = new Map<string, { name: string; setsCount: number; volumeKg: number; maxWeight: number }>();

    logsForMuscle.forEach((l) => {
      totalSets += l.setsCount || 3;
      totalVolume += l.totalVolumeKg || 0;
      const existing = exerciseMap.get(l.exerciseId) || { name: l.exerciseName, setsCount: 0, volumeKg: 0, maxWeight: 0 };
      existing.setsCount += l.setsCount || 3;
      existing.volumeKg += l.totalVolumeKg || 0;
      if (l.maxWeightKg > existing.maxWeight) existing.maxWeight = l.maxWeightKg;
      exerciseMap.set(l.exerciseId, existing);
    });

    return {
      totalSets,
      totalVolume,
      exercises: Array.from(exerciseMap.values()).sort((a, b) => b.volumeKg - a.volumeKg),
    };
  }, [selectedMuscle, exerciseLogs]);

  // Anatomical SVG Paths directly registered to the PomboFit Mascot illustration
  const frontMusclePaths: Record<string, string> = {
    // 1. Peitoral: peito sob o pescoço e clavículas
    chest: 'M 38 29 C 43 27, 49 28, 49 37 C 44 38, 38 36, 38 31 Z M 51 28 C 57 28, 62 31, 62 36 C 56 38, 51 37, 51 28 Z',
    // 2. Ombros: deltoides direito e esquerdo sobre as articulações dos braços
    shoulders: 'M 26 24 C 36 22, 38 28, 35 36 C 29 36, 25 30, 26 24 Z M 72 26 C 84 27, 83 36, 76 39 C 71 36, 70 30, 72 26 Z',
    // 3. Bíceps e Braços: braço levantado flexionado e braço de apoio
    biceps: 'M 22 14 C 34 13, 37 23, 33 34 C 23 35, 18 25, 22 14 Z M 20 34 C 26 34, 28 42, 24 50 C 18 48, 16 40, 20 34 Z M 77 34 C 88 35, 88 44, 82 50 C 76 47, 75 40, 77 34 Z M 80 50 C 89 52, 88 60, 82 64 C 77 62, 76 56, 80 50 Z',
    // 4. Abdômen: parede abdominal (gomos centrais)
    abs: 'M 43 38 C 47 38, 53 38, 57 38 C 58 48, 55 52, 50 53 C 45 52, 42 48, 43 38 Z',
    // 5. Quadríceps: coxas anteriores
    quads: 'M 38 52 C 48 51, 48 60, 46 68 C 38 68, 36 60, 38 52 Z M 54 51 C 64 52, 66 60, 64 68 C 56 68, 54 60, 54 51 Z',
  };

  const backMusclePaths: Record<string, string> = {
    // 6. Trapézio e Costas: trapézio superior e dorsais
    traps_lats: 'M 40 23 C 50 20, 60 23, 65 31 C 60 41, 40 41, 35 31 Z M 35 31 C 41 33, 44 43, 41 49 C 33 46, 31 38, 35 31 Z M 65 31 C 69 38, 67 46, 59 49 C 56 43, 59 33, 65 31 Z',
    // 7. Lombar: região lombar e eretores da espinha
    lower_back: 'M 43 42 C 49 42, 51 42, 57 42 C 58 50, 56 54, 50 55 C 44 54, 42 50, 43 42 Z',
    // 8. Tríceps: braços posteriores
    triceps: 'M 20 28 C 30 26, 32 35, 28 44 C 22 42, 19 35, 20 28 Z M 70 26 C 80 28, 81 35, 74 44 C 70 38, 68 32, 70 26 Z',
    // 9. Glúteos e Posteriores: glúteos e posteriores de coxa
    glutes_hams: 'M 38 48 C 50 46, 62 48, 64 58 C 58 64, 42 64, 36 58 Z M 38 58 C 46 58, 47 67, 44 72 C 37 72, 36 64, 38 58 Z M 56 58 C 64 58, 64 64, 62 72 C 55 72, 54 67, 56 58 Z',
    // 10. Panturrilhas: gastrocnêmio e sóleo
    calves: 'M 30 68 C 40 68, 42 77, 38 84 C 32 84, 28 77, 30 68 Z M 60 68 C 70 68, 72 77, 68 84 C 62 84, 58 77, 60 68 Z',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-6">
      {/* Header com legenda de estímulo */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-purple-50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E2EE8] block">
            Mascote Oficial PomboFit
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[#1E1638]">
            Painel Anatômico de Frequência Muscular (Frente e Costas)
          </h3>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-[#FAF8FF] px-3 py-1.5 rounded-xl border border-purple-100">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722] inline-block shadow-xs" />
            Principal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A65] inline-block shadow-xs" />
            Secundário
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            Estabilizador
          </span>
        </div>
      </div>

      {/* FILEIRA SUPERIOR — VISTA FRONTAL (5 REPRESENTAÇÕES DO MASCOTE) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5E2EE8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5E2EE8]" />
            Fileira Superior — Vista Frontal
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Músculos destacados diretamente no corpo do PomboFit
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'chest', title: 'Peitoral', zones: ['chest', 'upper_chest'] as AnatomicalZoneId[], categories: ['Peito', 'Peitoral'] },
            { id: 'shoulders', title: 'Ombros (Deltoides)', zones: ['front_delts', 'side_delts'] as AnatomicalZoneId[], categories: ['Ombros'] },
            { id: 'biceps', title: 'Bíceps e Braços', zones: ['biceps', 'forearms'] as AnatomicalZoneId[], categories: ['Bíceps', 'Antebraços'] },
            { id: 'abs', title: 'Abdômen', zones: ['abs', 'obliques'] as AnatomicalZoneId[], categories: ['Abdômen'] },
            { id: 'quads', title: 'Quadríceps', zones: ['quads'] as AnatomicalZoneId[], categories: ['Quadríceps', 'Pernas'] },
          ].map((item) => {
            const status = getStatusForMuscle(item.zones);
            const stats = getMuscleQuickStats(item.categories);
            const glow = getMuscleGlowStyle(status);
            const pathD = frontMusclePaths[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedMuscle({ title: item.title, zones: item.zones, categories: item.categories, type: status })}
                className="bg-gradient-to-b from-white to-[#FAF8FF] border border-purple-100/90 hover:border-[#5E2EE8] rounded-2xl p-2.5 flex flex-col items-center text-center transition-all hover:scale-[1.03] shadow-2xs hover:shadow-md cursor-pointer group"
              >
                {/* Figura de corpo inteiro do mascote com destaque anatômico direto no corpo */}
                <div className="relative w-full aspect-[1/1.9] bg-white exercise-illustration-canvas rounded-xl border border-purple-50 overflow-hidden flex items-center justify-center p-1 shadow-inner">
                  <img
                    src={frontCleanImg}
                    alt={`${item.title} — PomboFit`}
                    className="w-full h-full object-contain filter drop-shadow-xs select-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/mascots/pombo_seco.jpg';
                    }}
                  />
                  {/* Máscara anatômica vetorial desenhada sobre o músculo específico */}
                  {pathD && (
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <path
                        d={pathD}
                        style={{
                          fill: glow.fill,
                          fillOpacity: glow.fillOpacity,
                          stroke: glow.stroke,
                          strokeWidth: glow.strokeWidth,
                          filter: glow.filter,
                        }}
                      />
                    </svg>
                  )}
                </div>

                {/* Identificação textual limpa abaixo da figura (sem sobrepor o corpo) */}
                <div className="mt-2 w-full flex flex-col items-center">
                  <span className="text-xs font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors truncate w-full">
                    {item.title}
                  </span>
                  <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeColor(status)}`}>
                    {status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-tabular mt-1 truncate w-full">
                    {stats.totalSets > 0 ? `${stats.totalSets} séries · ${stats.totalVolume.toLocaleString('pt-BR')}kg` : '0 séries'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILEIRA INFERIOR — VISTA POSTERIOR (5 REPRESENTAÇÕES DO MASCOTE DE COSTAS) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8042F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8042F7]" />
            Fileira Inferior — Vista Posterior
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Corpo inteiro posterior do mascote oficial PomboFit
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'traps_lats', title: 'Trapézio e Costas', zones: ['traps', 'lats'] as AnatomicalZoneId[], categories: ['Costas'] },
            { id: 'lower_back', title: 'Lombar', zones: ['lower_back'] as AnatomicalZoneId[], categories: ['Costas'] },
            { id: 'triceps', title: 'Tríceps', zones: ['triceps'] as AnatomicalZoneId[], categories: ['Tríceps'] },
            { id: 'glutes_hams', title: 'Glúteos e Posteriores', zones: ['glutes', 'hamstrings'] as AnatomicalZoneId[], categories: ['Glúteos', 'Posteriores de coxa', 'Posterior'] },
            { id: 'calves', title: 'Panturrilhas', zones: ['calves'] as AnatomicalZoneId[], categories: ['Panturrilhas'] },
          ].map((item) => {
            const status = getStatusForMuscle(item.zones);
            const stats = getMuscleQuickStats(item.categories);
            const glow = getMuscleGlowStyle(status);
            const pathD = backMusclePaths[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedMuscle({ title: item.title, zones: item.zones, categories: item.categories, type: status })}
                className="bg-gradient-to-b from-white to-[#FAF8FF] border border-purple-100/90 hover:border-[#8042F7] rounded-2xl p-2.5 flex flex-col items-center text-center transition-all hover:scale-[1.03] shadow-2xs hover:shadow-md cursor-pointer group"
              >
                {/* Figura oficial de costas do mascote PomboFit com destaque anatômico direto */}
                <div className="relative w-full aspect-[1/1.9] bg-white exercise-illustration-canvas rounded-xl border border-purple-50 overflow-hidden flex items-center justify-center p-1 shadow-inner">
                  <img
                    src={backCleanImg}
                    alt={`${item.title} — PomboFit Costas`}
                    className="w-full h-full object-contain filter drop-shadow-xs select-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/mascots/pombo_seco.jpg';
                    }}
                  />
                  {/* Máscara anatômica vetorial desenhada sobre o músculo posterior */}
                  {pathD && (
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <path
                        d={pathD}
                        style={{
                          fill: glow.fill,
                          fillOpacity: glow.fillOpacity,
                          stroke: glow.stroke,
                          strokeWidth: glow.strokeWidth,
                          filter: glow.filter,
                        }}
                      />
                    </svg>
                  )}
                </div>

                {/* Identificação textual limpa abaixo da figura */}
                <div className="mt-2 w-full flex flex-col items-center">
                  <span className="text-xs font-bold text-[#1E1638] group-hover:text-[#8042F7] transition-colors truncate w-full">
                    {item.title}
                  </span>
                  <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getBadgeColor(status)}`}>
                    {status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-tabular mt-1 truncate w-full">
                    {stats.totalSets > 0 ? `${stats.totalSets} séries · ${stats.totalVolume.toLocaleString('pt-BR')}kg` : '0 séries'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUICK SELECT CHIPS FOR ALL MUSCLES */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 justify-center">
        {muscleGroupsMap.map((m) => {
          const status = getStatusForMuscle(m.zones);
          return (
            <button
              key={m.title}
              type="button"
              onClick={() => setSelectedMuscle({ title: m.title, zones: m.zones, categories: m.categories, type: status })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${getBadgeColor(status)}`}
            >
              <span>{m.title}</span>
              <span className="text-[9px] opacity-80 uppercase">({status})</span>
            </button>
          );
        })}
      </div>

      {/* DETAILED MUSCLE MODAL */}
      {selectedMuscle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-purple-100 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${selectedMuscle.type === 'Principal' ? 'bg-[#FF5722]' : selectedMuscle.type === 'Secundário' ? 'bg-[#FF8A65]' : 'bg-[#E5E7EB]'}`} />
                <h3 className="text-base font-black text-[#1E1638]">{selectedMuscle.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMuscle(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-[#FAF8FF] p-3 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#5E2EE8] block">Análise de Estímulo (Dados Reais)</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block">Status Atual:</span>
                    <strong className="text-[#5E2EE8]">{selectedMuscle.type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total de Séries:</span>
                    <strong className="text-[#1E1638] font-mono-tabular">{selectedMuscleStats.totalSets} séries</strong>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block">Volume Total Acumulado:</span>
                  <strong className="text-[#1E1638] font-mono-tabular text-sm">{selectedMuscleStats.totalVolume.toLocaleString('pt-BR')} kg</strong>
                </div>
              </div>

              <div className="space-y-2">
                <strong className="block text-[#1E1638]">Exercícios que Estimularam este Grupo:</strong>
                {selectedMuscleStats.exercises.length === 0 ? (
                  <p className="text-slate-500 italic">
                    Nenhum exercício deste grupo foi registrado em treinos recentes. Complete treinos para acumular volume.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedMuscleStats.exercises.map((ex, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <strong className="block text-[#1E1638]">{ex.name}</strong>
                          <span className="text-[10px] text-slate-500">{ex.setsCount} séries · Carga máx: {ex.maxWeight} kg</span>
                        </div>
                        <span className="font-mono-tabular font-bold text-[#5E2EE8] text-xs">
                          {ex.volumeKg.toLocaleString('pt-BR')} kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMuscle(null)}
              className="w-full py-3 rounded-2xl bg-[#5E2EE8] text-white text-xs font-black hover:bg-[#4E21D0] cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   2. MAPEAMENTO BIOMECÂNICO VERIFICADO DE TODOS OS 176 EXERCÍCIOS
   ========================================================================= */

export type ApparatusArchetype =
  | 'leg_press_45'
  | 'calf_leg_press_45'
  | 'leg_press_horizontal'
  | 'leg_extension_chair'
  | 'lying_leg_curl_table'
  | 'seated_leg_curl_chair'
  | 'standing_leg_curl'
  | 'hack_squat_machine'
  | 'smith_machine_squat'
  | 'barbell_squat_rack'
  | 'lunge_split_squat'
  | 'hip_thrust_bench'
  | 'abductor_adductor_chair'
  | 'glute_cable_kickback'
  | 'standing_calf_machine'
  | 'seated_calf_machine'
  | 'bench_flat_press'
  | 'bench_incline_press'
  | 'bench_incline_barbell'
  | 'bench_decline_press'
  | 'dumbbell_bench_flat'
  | 'dumbbell_fly_flat'
  | 'dumbbell_incline_fly'
  | 'dumbbell_pullover'
  | 'seated_chest_press_machine'
  | 'peck_deck_fly_machine'
  | 'reverse_peck_deck'
  | 'cable_crossover_high'
  | 'cable_crossover_low'
  | 'low_pulley_crossover'
  | 'resistance_band_standing'
  | 'pushup_floor'
  | 'lat_pulldown_high_pulley'
  | 'seated_row_low_pulley'
  | 'bent_over_row_barbell'
  | 'dumbbell_row_bent'
  | 'single_arm_serrote'
  | 't_bar_row_cavalinho'
  | 'pullup_graviton'
  | 'deadlift_barbell'
  | 'roman_chair_extension'
  | 'dumbbell_shrug'
  | 'overhead_press_barbell'
  | 'barbell_standing_ohp'
  | 'barbell_upright_row'
  | 'lateral_raise_dumbbells'
  | 'front_raise_plate'
  | 'plate_front_raise'
  | 'cable_face_pull_rope'
  | 'biceps_curl_standing'
  | 'biceps_hammer_dumbbell'
  | 'biceps_preacher_scott'
  | 'biceps_incline_bench'
  | 'seated_concentration_curl'
  | 'cable_biceps_curl_low'
  | 'triceps_pulley_rope'
  | 'triceps_rope_pulley'
  | 'triceps_lying_skullcrusher'
  | 'triceps_dips_parallel'
  | 'triceps_overhead_french'
  | 'wrist_curl_forearm'
  | 'crunch_cable_mat'
  | 'kneeling_cable_crunch'
  | 'ab_wheel_rollout'
  | 'plank_isometric'
  | 'dumbbell_goblet_squat'
  | 'step_up_box'
  | 'wall_sit_isometric'
  | 'kettlebell_swing'
  | 'battle_rope_waves'
  | 'cardio_running_treadmill'
  | 'cardio_stationary_bike'
  | 'cardio_elliptical'
  | 'cardio_stairs_erg'
  | 'cardio_rowing_erg'
  | 'cardio_jump_rope'
  | 'cardio_jumping_jacks'
  | 'cardio_mountain_climber'
  | 'cardio_burpee';

export function resolveExerciseApparatus(exercise: ExerciseItem): {
  archetype: ApparatusArchetype;
  apparatusTitle: string;
  kinematicCallout: string;
  startImageUrl: string;
  endImageUrl: string;
  bothImageUrl: string;
} {
  const id = exercise.id.toLowerCase();
  const name = exercise.name.toLowerCase();
  const cacheBust = '?v=20261106';

  const buildResult = (
    archetype: ApparatusArchetype,
    _titleOverride: string,
    kinematicCallout: string
  ) => ({
    archetype,
    apparatusTitle: `${exercise.name} (${exercise.equipment})`,
    kinematicCallout,
    startImageUrl: exercise.startImageUrl || `/exercises/${exercise.id}_start.jpg${cacheBust}`,
    endImageUrl: exercise.endImageUrl || `/exercises/${exercise.id}_end.jpg${cacheBust}`,
    bothImageUrl: exercise.endImageUrl || `/exercises/${exercise.id}_end.jpg${cacheBust}`,
  });

  // 1. Leg Press 45° e Panturrilha no Leg Press 45°
  if (id.includes('panturrilhas_leg_press_45') || name.includes('panturrilha no leg press')) {
    return buildResult(
      'calf_leg_press_45',
      'Aparelho Leg Press 45° (Foco Panturrilhas)',
      'Apoio da ponta dos pés na borda inferior da plataforma a 45° · Flexão plantar controlada'
    );
  }

  if (id.includes('leg_press_45') || name.includes('leg press 45')) {
    return buildResult(
      'leg_press_45',
      'Aparelho Leg Press 45° Inclinado',
      'Costas apoiadas no encosto e pés na plataforma a 45° · Flexão e extensão completa das pernas'
    );
  }

  // 2. Leg Press Horizontal
  if (id.includes('leg_press_horizontal') || name.includes('leg press horizontal')) {
    return buildResult(
      'leg_press_horizontal',
      'Máquina Leg Press Horizontal Sentado',
      'Sentado com costas apoiadas · Empurrar a plataforma frontal até estender os joelhos'
    );
  }

  // 3. Cadeira Extensora
  if (id.includes('cadeira_extensora') || name.includes('cadeira extensora')) {
    return buildResult(
      'leg_extension_chair',
      'Máquina Cadeira Extensora',
      'Sentado com tornozelos posicionados atrás do rolo acolchoado · Extensão total dos joelhos'
    );
  }

  // 4. Mesa Flexora / Flexões de Posteriores Deitado
  if (
    id.includes('mesa_flexora') ||
    name.includes('mesa flexora') ||
    id.includes('flexao_nordica') ||
    id.includes('flexao_bola_suica') ||
    id.includes('flexora_elastico_deitado')
  ) {
    return buildResult(
      'lying_leg_curl_table',
      'Máquina Mesa Flexora (Deitado)',
      'Deitado com tornozelos posicionados sob o rolo · Flexão dos joelhos aproximando os calcanhares dos glúteos'
    );
  }

  // 5. Cadeira Flexora Sentado
  if (id.includes('cadeira_flexora') || name.includes('cadeira flexora')) {
    return buildResult(
      'seated_leg_curl_chair',
      'Máquina Cadeira Flexora (Sentado)',
      'Sentado com coxas travadas · Flexão dos joelhos para baixo e para trás contra o rolo'
    );
  }

  // 6. Flexora em Pé / Coice na Polia
  if (id.includes('flexora_unilateral_em_pe') || id.includes('flexora_polia_baixa')) {
    return buildResult(
      'standing_leg_curl',
      'Flexora Vertical / Polia Baixa em Pé',
      'Tronco estabilizado em pé · Flexão unilateral do joelho puxando a carga para trás'
    );
  }

  // 7. Hack Machine
  if (id.includes('hack_machine') || name.includes('hack')) {
    return buildResult(
      'hack_squat_machine',
      'Máquina Hack Squat 45°',
      'Costas no encosto deslizante e ombros sob as almofadas · Agachamento guiado nos trilhos'
    );
  }

  // 8. Step-Up / Subida no Caixote / Sissy Squat
  if (id.includes('step_up') || id.includes('subida_banco') || id.includes('sissy_squat')) {
    return buildResult(
      'step_up_box',
      'Caixote / Step de Subida Unilateral',
      'Pé apoiado sobre o caixote · Impulso vertical até estender completamente o joelho e o quadril'
    );
  }

  // 9. Cadeira Isométrica na Parede / Tibial Anterior
  if (id.includes('isometrico_parede') || id.includes('tibial_anterior')) {
    return buildResult(
      'wall_sit_isometric',
      'Apoio Dorsal na Parede (Isometria / Tibial)',
      'Costas totalmente apoiadas na parede · Estabilização de membros inferiores com coluna neutra'
    );
  }

  // 10. Agachamento Goblet / Sumô com Halter / Belt Squat
  if (id.includes('goblet') || id.includes('sumo_halter') || id.includes('belt_squat')) {
    return buildResult(
      'dumbbell_goblet_squat',
      'Agachamento Goblet / Sumô com Halter',
      'Halter seguro junto ao centro de massa · Descida profunda mantendo joelhos alinhados aos pés'
    );
  }

  // 11. Agachamento Búlgaro / Afundo / Passada / Recuo
  if (
    id.includes('agachamento_bulgaro') ||
    id.includes('afundo') ||
    id.includes('passada') ||
    id.includes('recuo')
  ) {
    return buildResult(
      'lunge_split_squat',
      'Halteres + Base Dividida (Agachamento Búlgaro / Afundo)',
      'Base dividida unilateral · Descida vertical flexionando o joelho da frente até 90°'
    );
  }

  // 12. Agachamento Livre / Smith
  if (id.includes('smith') && !id.includes('supino') && !id.includes('stiff')) {
    return buildResult(
      'smith_machine_squat',
      'Máquina Barra Guiada Smith',
      'Barra guiada sobre os trapézios · Agachamento controlado mantendo a coluna neutra'
    );
  }

  if (id.includes('agachamento') || name.includes('agachamento')) {
    return buildResult(
      'barbell_squat_rack',
      'Gaiola de Agachamento Livre com Barra',
      'Barra apoiada sobre os trapézios · Descida até coxas paralelas ao solo e subida firme'
    );
  }

  // 13. Elevação Pélvica / Ponte de Glúteos
  if (
    id.includes('elevacao_pelvica') ||
    id.includes('ponte_gluteos') ||
    name.includes('elevação pélvica') ||
    name.includes('glute bridge')
  ) {
    return buildResult(
      'hip_thrust_bench',
      'Banco + Barra Acolchoada (Elevação Pélvica)',
      'Escápulas apoiadas no banco · Extensão completa do quadril elevando a barra com contração dos glúteos'
    );
  }

  // 14. Cadeira Abdutora / Adutora
  if (
    id.includes('cadeira_abdutora') ||
    id.includes('cadeira_adutora') ||
    name.includes('cadeira abdutora') ||
    name.includes('cadeira adutora')
  ) {
    return buildResult(
      'abductor_adductor_chair',
      id.includes('adutora') ? 'Máquina Cadeira Adutora' : 'Máquina Cadeira Abdutora',
      id.includes('adutora')
        ? 'Sentado com apoio interno nos joelhos · Fechamento das pernas contra a resistência'
        : 'Sentado com apoio externo nos joelhos · Abertura das pernas focando glúteo médio'
    );
  }

  // 15. Glúteo Coice na Polia / Abdução no Cabo
  if (
    exercise.muscleGroup === 'Glúteos' ||
    id.includes('coice_polia') ||
    id.includes('abducao_quadril') ||
    id.includes('pull_through') ||
    id.includes('quatro_apoios') ||
    id.includes('extensao_quadril_maquina') ||
    id.includes('abducao_deitado')
  ) {
    return buildResult(
      'glute_cable_kickback',
      'Estação de Polia Baixa com Caneleira (Glúteos)',
      'Tornozeleira acoplada ao cabo inferior · Extensão / abdução posterior do quadril contraindo o glúteo'
    );
  }

  // 16. Panturrilhas (Sentado vs Em Pé)
  if (id.includes('panturrilhas_sentado') || name.includes('panturrilha sentado')) {
    return buildResult(
      'seated_calf_machine',
      'Máquina de Panturrilha Sentado',
      'Sentado com apoio acolchoado sobre os joelhos · Elevação máxima dos calcanhares'
    );
  }

  if (exercise.muscleGroup === 'Panturrilhas') {
    return buildResult(
      'standing_calf_machine',
      'Máquina de Panturrilha em Pé',
      'Apoio nos ombros e ponta dos pés na plataforma · Subida máxima na ponta dos pés'
    );
  }

  // 17. Peito: Supino Inclinado, Crucifixo, Pullover, Supino Máquina, Peck Deck, Crossover, Flexão, Supino Reto
  if (id.includes('pullover')) {
    return buildResult(
      'dumbbell_pullover',
      'Banco Reto + Halter (Pullover)',
      'Deitado no banco · Extensão e flexão de ombros levando o halter de trás da cabeça até a linha do peito'
    );
  }

  if (id.includes('crucifixo_inclinado_halteres')) {
    return buildResult(
      'dumbbell_incline_fly',
      'Banco Inclinado 35° + Halteres (Crucifixo Inclinado)',
      'Reclinado a 35° · Abertura ampla em arco e adução peitoral superior no topo'
    );
  }

  if (id.includes('crucifixo_reto_halteres')) {
    return buildResult(
      'dumbbell_fly_flat',
      'Banco Reto + Halteres (Crucifixo Reto)',
      'Deitado no banco plano · Abertura em arco dos braços alongando o peitoral e fechamento no topo'
    );
  }

  if (id.includes('supino_inclinado_barra')) {
    return buildResult(
      'bench_incline_barbell',
      'Banco Inclinado 35° com Barra',
      'Reclinado a 35° · Descer a barra até a região clavicular e empurrar até estender os braços'
    );
  }

  if (
    (id.includes('inclinado') || name.includes('inclinado')) &&
    exercise.muscleGroup === 'Peito' &&
    !id.includes('flexao')
  ) {
    return buildResult(
      'bench_incline_press',
      `Banco Inclinado 35° (${exercise.equipment})`,
      'Reclinado no banco a 35° · Empurrar a carga da linha clavicular até a extensão dos braços'
    );
  }

  if (id.includes('crucifixo_inverso_maquina')) {
    return buildResult(
      'reverse_peck_deck',
      'Máquina Peck Deck Inverso (Deltoide Posterior)',
      'Peito apoiado no encosto · Abertura horizontal dos braços trabalhando deltoide posterior'
    );
  }

  if (id.includes('peck_deck') || id.includes('voador')) {
    return buildResult(
      'peck_deck_fly_machine',
      'Máquina Peck Deck / Voador Peitoral',
      'Sentado com costas apoiadas · Fechamento dos braços unindo as manoplas à frente do peito'
    );
  }

  if (id.includes('supino_maquina') || id.includes('supino_convergente')) {
    return buildResult(
      'seated_chest_press_machine',
      'Máquina de Supino Sentado (Chest Press)',
      'Sentado na máquina de supino · Empurrar as alças à frente até estender os cotovelos'
    );
  }

  if (id.includes('crossover') || id.includes('crucifixo_polia')) {
    return buildResult(
      id.includes('baixa') ? 'low_pulley_crossover' : 'cable_crossover_high',
      'Estação Dupla de Cabos (Crossover)',
      'Em pé no centro da torre de cabos · Adução dos braços em arco até unir as mãos à frente do peitoral'
    );
  }

  if (id.includes('elastico') && !id.includes('deitado') && !id.includes('sentado') && !id.includes('acima_cabeca')) {
    return buildResult(
      'resistance_band_standing',
      'Faixa Elástica de Resistência (Em Pé)',
      'Base estável sobre o elástico · Tração contínua contra a resistência progressiva da banda'
    );
  }

  if (id.includes('flexao_bracos') || id.includes('flexao_inclinada') || id.includes('flexao_diamante')) {
    return buildResult(
      'pushup_floor',
      'Solo — Flexão de Braços em Prancha Alta',
      'Corpo alinhado dos tornozelos aos ombros · Flexão dos cotovelos próxima ao solo e extensão completa'
    );
  }

  if (id.includes('supino_reto_halteres')) {
    return buildResult(
      'dumbbell_bench_flat',
      'Banco Reto com Halteres (Supino Reto)',
      'Deitado de costas no banco · Descer os halteres na linha do peito e empurrar até o topo'
    );
  }

  if (exercise.muscleGroup === 'Peito') {
    return buildResult(
      id.includes('declinado') ? 'bench_decline_press' : 'bench_flat_press',
      `Banco de Supino (${exercise.equipment})`,
      'Deitado de costas no banco com pés firmes no solo · Descer ao peito e empurrar até estender os braços'
    );
  }

  // 18. Costas: Puxada Frontal, Remada Baixa, Remada Cavalinho, Serrote, Remada Curvada, Banco Romano, Encolhimento, Barra Fixa, Levantamento Terra
  if (id.includes('extensao_lombar_banco_romano')) {
    return buildResult(
      'roman_chair_extension',
      'Banco Romano 45° (Extensão Lombar)',
      'Quadril apoiado no suporte a 45° · Flexão controlada do tronco e extensão até alinhar a coluna'
    );
  }

  if (id.includes('encolhimento_halteres') || id.includes('caminhada_fazendeiro')) {
    return buildResult(
      'dumbbell_shrug',
      'Halteres Pesados em Pé (Trapézio / Pegada)',
      'Em pé com halteres ao lado das coxas · Elevação vertical dos ombros e sustentação firme da pegada'
    );
  }

  if (id.includes('encolhimento_barra') || id.includes('remada_alta') || id.includes('rolo_punho')) {
    return buildResult(
      'barbell_upright_row',
      'Barra em Pé (Trapézio / Deltoides)',
      'Postura ereta segurando a barra · Puxada vertical controlada mantendo a barra próxima ao tronco'
    );
  }

  if (id.includes('serrote') || id.includes('coice_halter')) {
    return buildResult(
      'single_arm_serrote',
      'Banco Plano + Halter (Apoio Unilateral)',
      'Joelho e mão de apoio no banco com coluna reta · Tração / extensão unilateral com halter'
    );
  }

  if (id.includes('puxada_') || id.includes('pulldown_')) {
    return buildResult(
      'lat_pulldown_high_pulley',
      'Estação de Polia Alta (Puxada / Pulldown)',
      'Sentado ou em pé diante da polia alta · Tração dorsal com controle escapular completo'
    );
  }

  if (id.includes('face_pull') || id.includes('duplo_biceps_polia_alta') || id.includes('frances_corda_polia')) {
    return buildResult(
      'cable_face_pull_rope',
      'Estação de Polia Alta com Corda',
      'Em pé diante da polia alta · Tração / extensão com corda mantendo estabilidade escapular'
    );
  }

  if (
    id.includes('remada_baixa') ||
    id.includes('remada_unilateral_polia') ||
    id.includes('remada_corda_polia') ||
    id.includes('remada_elastico_sentado')
  ) {
    return buildResult(
      'seated_row_low_pulley',
      'Estação de Polia Baixa (Remada Sentado)',
      'Sentado com pés apoiados na plataforma · Puxar o acessório em direção ao abdômen retraindo as escápulas'
    );
  }

  if (
    id.includes('remada_cavalinho') ||
    id.includes('remada_maquina_apoio_peito') ||
    name.includes('cavalinho')
  ) {
    return buildResult(
      't_bar_row_cavalinho',
      'Aparelho Remada Cavalinho / Barra T',
      'Tronco inclinado a 45° · Puxar a manopla da barra T em direção ao tórax'
    );
  }

  if (
    id.includes('remada_curvada_halteres') ||
    id.includes('crucifixo_inverso_halteres') ||
    id.includes('stiff_halteres') ||
    id.includes('stiff_unilateral_halter')
  ) {
    return buildResult(
      'dumbbell_row_bent',
      'Halteres com Tronco Inclinado (Coluna Neutra)',
      'Quadril projetado para trás e coluna alinhada · Movimento controlado com halteres'
    );
  }

  if (id.includes('remada_curvada') || id.includes('remada_unilateral')) {
    return buildResult(
      'bent_over_row_barbell',
      `Remada Curvada (${exercise.equipment})`,
      'Tronco inclinado a 45° com coluna reta · Puxar a carga da linha dos joelhos até o abdômen'
    );
  }

  if (
    id.includes('barra_fixa') ||
    id.includes('chinup') ||
    id.includes('graviton') ||
    id.includes('remada_invertida') ||
    id.includes('suspensao_barra')
  ) {
    return buildResult(
      'pullup_graviton',
      'Estação de Barra Fixa / Graviton',
      'Mãos na barra superior · Tracionar o corpo para cima até o queixo ultrapassar a linha da barra'
    );
  }

  if (
    id.includes('levantamento_terra') ||
    id.includes('terra_sumo') ||
    name.includes('levantamento terra') ||
    id.includes('stiff') ||
    id.includes('bom_dia')
  ) {
    return buildResult(
      'deadlift_barbell',
      `Levantamento Terra / Stiff (${exercise.equipment})`,
      'Coluna neutra e pés firmes · Extensão de quadril e tronco mantendo a barra próxima às pernas'
    );
  }

  // 19. Ombros: Desenvolvimento Militar, Desenvolvimento Sentado, Elevação Lateral, Elevação Frontal
  if (id.includes('desenvolvimento_militar_barra')) {
    return buildResult(
      'barbell_standing_ohp',
      'Barra Reta em Pé (Desenvolvimento Militar)',
      'Em pé com core travado · Empurrar a barra da linha clavicular até acima da cabeça'
    );
  }

  if (id.includes('kettlebell')) {
    return buildResult(
      'kettlebell_swing',
      'Kettlebell de Ferro Fundido',
      'Explosão potente de quadril e estabilização escapular com kettlebell'
    );
  }

  if (id.includes('desenvolvimento') || name.includes('desenvolvimento')) {
    return buildResult(
      'overhead_press_barbell',
      `Banco de Desenvolvimento (${exercise.equipment})`,
      'Empurrar os pesos da altura dos ombros diretamente para cima até estender os braços'
    );
  }

  if (id.includes('elevacao_frontal_anilha')) {
    return buildResult(
      'plate_front_raise',
      'Anilha Olímpica em Pé (Elevação Frontal)',
      'Segurando a anilha nas laterais · Elevar à frente do tronco até a linha dos ombros'
    );
  }

  if (id.includes('elevacao_lateral') || name.includes('elevação lateral')) {
    return buildResult(
      'lateral_raise_dumbbells',
      `Elevação Lateral (${exercise.equipment})`,
      'Em pé com postura firme · Elevar os braços lateralmente até a linha dos ombros'
    );
  }

  if (id.includes('elevacao_frontal') || exercise.muscleGroup === 'Ombros') {
    return buildResult(
      'front_raise_plate',
      `Elevação Frontal / Ombros (${exercise.equipment})`,
      'Postura ereta · Elevar a carga à frente do corpo até a linha dos ombros com controle'
    );
  }

  // 20. Bíceps: Concentrada, Polia Baixa, Martelo/Alternada, Scott, Inclinada, Direta
  if (id.includes('rosca_concentrada') || id.includes('rosca_punho_halter') || id.includes('pronacao_supinacao')) {
    return buildResult(
      'seated_concentration_curl',
      'Banco Plano + Halter (Isolamento Unilateral Sentado)',
      'Sentado com braço apoiado na parte interna da coxa · Flexão isolada de máxima precisão'
    );
  }

  if (
    id.includes('rosca_polia_baixa') ||
    id.includes('rosca_martelo_corda_polia') ||
    id.includes('rosca_inversa_polia') ||
    id.includes('coice_polia_baixa')
  ) {
    return buildResult(
      'cable_biceps_curl_low',
      'Estação de Polia Baixa com Cabo',
      'Em pé diante da polia baixa com cotovelos estáveis · Tensão contínua do cabo durante todo o arco'
    );
  }

  if (id.includes('rosca_alternada') || id.includes('rosca_martelo_halteres') || id.includes('rosca_zottman')) {
    return buildResult(
      'biceps_hammer_dumbbell',
      'Par de Halteres em Pé (Rosca Alternada / Martelo)',
      'Em pé com cotovelos fixos ao lado do tronco · Flexão dos antebraços com halteres'
    );
  }

  if (id.includes('scott') || name.includes('scott')) {
    return buildResult(
      'biceps_preacher_scott',
      'Banco Rosca Scott (Preacher Bench)',
      'Braços apoiados no pupitre inclinado · Flexão completa dos cotovelos elevando a carga'
    );
  }

  if ((id.includes('inclinada') || id.includes('spider')) && exercise.muscleGroup === 'Bíceps') {
    return buildResult(
      'biceps_incline_bench',
      'Banco Inclinado 45° com Halteres',
      'Apoiado no banco a 45° com braços alinhados · Flexão dos cotovelos isolando o bíceps'
    );
  }

  if (exercise.muscleGroup === 'Bíceps') {
    return buildResult(
      'biceps_curl_standing',
      `Rosca Bíceps em Pé (${exercise.equipment})`,
      'Em pé com cotovelos fixos ao lado do tronco · Subir a barra contraindo o bíceps no topo'
    );
  }

  // 21. Tríceps: Corda, Testa, Paralelas, Francês, Pulley Barra
  if (id.includes('triceps_pulley_corda') || id.includes('triceps_elastico_acima_cabeca')) {
    return buildResult(
      'triceps_rope_pulley',
      'Estação de Polia Alta com Corda (Tríceps)',
      'Cotovelos fixos ao lado do tronco · Empurrar a corda para baixo abrindo as pontas no final'
    );
  }

  if (id.includes('testa') || name.includes('testa')) {
    return buildResult(
      'triceps_lying_skullcrusher',
      `Banco Reto (${exercise.name})`,
      'Deitado no banco com braços verticais · Flexionar e estender os antebraços acima da testa'
    );
  }

  if (id.includes('paralelas') || id.includes('mergulho')) {
    return buildResult(
      'triceps_dips_parallel',
      'Estação de Barras Paralelas / Mergulho',
      'Corpo suspenso nas barras paralelas · Descer flexionando os cotovelos a 90° e empurrar até estender'
    );
  }

  if (id.includes('frances') || name.includes('francês')) {
    return buildResult(
      'triceps_overhead_french',
      `Tríceps Francês Acima da Cabeça (${exercise.equipment})`,
      'Braços elevados com cotovelos apontados para cima · Estender os antebraços acima da cabeça'
    );
  }

  if (exercise.muscleGroup === 'Tríceps') {
    return buildResult(
      'triceps_pulley_rope',
      `Polia Alta — Tríceps Pulley (${exercise.equipment})`,
      'Em pé diante da polia alta com cotovelos fixos · Empurrar a barra para baixo até estender os braços'
    );
  }

  // 22. Antebraços
  if (exercise.muscleGroup === 'Antebraços') {
    return buildResult(
      'wrist_curl_forearm',
      `Banco Plano — Rosca de Punho (${exercise.equipment})`,
      'Sentado com antebraços apoiados sobre as coxas · Flexão e extensão máxima dos punhos'
    );
  }

  // 23. Abdômen: Polia Alta Ajoelhado, Roda Abdominal, Prancha, Solo
  if (id.includes('crunch_polia_alta_corda')) {
    return buildResult(
      'kneeling_cable_crunch',
      'Polia Alta com Corda Ajoelhado (Abdominal)',
      'Ajoelhado no colchonete segurando a corda · Flexão da coluna levando o tórax em direção aos joelhos'
    );
  }

  if (id.includes('roda_abdominal')) {
    return buildResult(
      'ab_wheel_rollout',
      'Roda Abdominal (Ab Wheel) no Colchonete',
      'Ajoelhado segurando a roda abdominal · Deslizar à frente estendendo o corpo e retornar contraindo o core'
    );
  }

  if (id.includes('lenhador_polia') || id.includes('pallof_press')) {
    return buildResult(
      'low_pulley_crossover',
      'Estação de Cabo — Rotação / Anti-Rotação do Core',
      'Base atlética lateral à polia · Tracionar ou sustentar o cabo ativando oblíquos e transverso'
    );
  }

  if (id.includes('prancha') || name.includes('prancha')) {
    return buildResult(
      'plank_isometric',
      'Colchonete — Estabilização Abdominal (Prancha)',
      'Apoio nos antebraços e pontas dos pés · Alinhamento corporal com abdômen contraído'
    );
  }

  if (exercise.muscleGroup === 'Abdômen') {
    return buildResult(
      'crunch_cable_mat',
      `Colchonete / Estação Abdominal (${exercise.equipment})`,
      'Flexão da coluna aproximando o tórax da pelve com contração máxima do reto abdominal'
    );
  }

  // 24. Cardio: Remo, Pular Corda, Corda Naval, Elíptico, Polichinelos, Escalador, Burpee, Bike, Escada, Esteira
  if (id.includes('remo_ergometrico')) {
    return buildResult(
      'cardio_rowing_erg',
      'Remo Ergométrico (Rowing Machine)',
      'Impulso potente das pernas seguido pela tração da manopla até a linha inferior do peito'
    );
  }

  if (id.includes('pular_corda')) {
    return buildResult(
      'cardio_jump_rope',
      'Corda de Pular de Velocidade',
      'Saltos leves na ponta dos pés girando a corda pelos punhos com postura ereta'
    );
  }

  if (id.includes('corda_naval') || id.includes('battle_rope')) {
    return buildResult(
      'battle_rope_waves',
      'Corda Naval Pesada (Battle Rope)',
      'Base semi-agachada · Ondulações alternadas explosivas de alta intensidade metabólica'
    );
  }

  if (id.includes('eliptico')) {
    return buildResult(
      'cardio_elliptical',
      'Aparelho Elíptico / Transport',
      'Passada contínua sem impacto articular sincronizando tração e empurrão das hastes móveis'
    );
  }

  if (id.includes('polichinelos')) {
    return buildResult(
      'cardio_jumping_jacks',
      'Peso Corporal — Polichinelos',
      'Saltos coordenados abrindo as pernas e elevando os braços acima da cabeça'
    );
  }

  if (id.includes('escalador') || id.includes('mountain_climber')) {
    return buildResult(
      'cardio_mountain_climber',
      'Solo — Escalador (Mountain Climber)',
      'Mãos apoiadas em prancha alta · Corrida estacionária alternando os joelhos em direção ao peito'
    );
  }

  if (id.includes('burpee')) {
    return buildResult(
      'cardio_burpee',
      'Peso Corporal — Burpee Completo',
      'Transição explosiva da prancha no solo para o salto vertical com braços estendidos'
    );
  }

  if (id.includes('bike') || id.includes('bicicleta')) {
    return buildResult(
      'cardio_stationary_bike',
      'Bicicleta Ergométrica',
      'Sentado no selim ajustado · Pedalada contínua alternando fase de impulsão e recuperação'
    );
  }

  if (id.includes('escada') || name.includes('escada')) {
    return buildResult(
      'cardio_stairs_erg',
      'Escada Ergométrica / Simulador de Degraus',
      'Subida contínua de degraus mantendo postura ereta e apoio de segurança'
    );
  }

  return buildResult(
    'cardio_running_treadmill',
    'Esteira Ergométrica / Estação Cardio',
    'Passada atlética ritmada mantendo tronco ereto e respiração controlada'
  );
}

/* =========================================================================
   3. COMPONENTE VISUAL VERIFICADO DO MASCOTE OFICIAL (IMAGENS ESTÁTICAS)
   ========================================================================= */

interface ExerciseVerifiedVisualProps {
  exercise: ExerciseItem;
  phase?: 'main' | 'start' | 'end';
  compact?: boolean;
  className?: string;
}

export const ExerciseVerifiedVisual: React.FC<ExerciseVerifiedVisualProps> = ({
  exercise,
  phase = 'main',
  compact = false,
  className = '',
}) => {
  const { startImageUrl, endImageUrl } = useMemo(
    () => resolveExerciseApparatus(exercise),
    [exercise]
  );

  const [startError, setStartError] = useState(false);
  const [endError, setEndError] = useState(false);

  React.useEffect(() => {
    setStartError(false);
    setEndError(false);
  }, [exercise.id]);

  if (compact) {
    return (
      <div className={`w-full h-full bg-white exercise-illustration-canvas flex items-center justify-center overflow-hidden select-none ${className}`}>
        {startError ? (
          <div className="flex flex-col items-center justify-center text-center p-1 bg-amber-50 rounded-lg border border-amber-200 w-full h-full">
            <span className="text-[8px] font-black uppercase text-amber-800 leading-tight">
              Demonstração Pendente
            </span>
          </div>
        ) : (
          <img
            src={startImageUrl}
            alt={exercise.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setStartError(true)}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  const getPostureLabel = (posture: string) => {
    switch (posture) {
      case 'bench_flat':
        return 'Posição: Deitado no Banco';
      case 'bench_incline':
        return 'Posição: Banco Inclinado (Encostado)';
      case 'seated_curl':
      case 'seated_row':
      case 'leg_machine':
        return 'Posição: Sentado no Aparelho';
      case 'standing_press':
      case 'standing_curl':
      case 'standing_row':
      case 'squat':
      case 'lunge':
        return 'Posição: Em Pé / Base Estável';
      case 'floor_core':
      case 'pushup_plank':
        return 'Posição: No Solo / Colchonete';
      default:
        return 'Posição Postural Verificada';
    }
  };

  const renderCard = (isStart: boolean) => {
    const src = isStart ? startImageUrl : endImageUrl;
    const hasError = isStart ? startError : endError;
    const setErr = isStart ? setStartError : setEndError;

    return (
      <div className={`bg-white border ${isStart ? 'border-purple-100' : 'border-purple-200'} rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between h-full shadow-2xs min-w-0`}>
        <div className="w-full space-y-1 shrink-0">
          <span className={`w-full text-center py-1 px-1.5 rounded-lg ${isStart ? 'bg-[#F0EBFE] text-[#5E2EE8]' : 'bg-[#5E2EE8] text-white'} text-[10px] sm:text-[11px] font-black uppercase tracking-wider block truncate`}>
            {isStart ? '1. Posição Inicial' : '2. Posição Final'}
          </span>
          <span className="w-full text-center text-[9px] font-bold text-[#5E2EE8] bg-[#FAF8FF] py-0.5 px-1 rounded border border-purple-50 block truncate">
            {getPostureLabel(exercise.posture)} · {exercise.equipment}
          </span>
        </div>

        <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden py-2 px-1">
          {hasError ? (
            <div className="flex flex-col items-center justify-center text-center p-3 bg-amber-50/90 rounded-2xl border border-amber-200 w-full h-full">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md mb-1">
                Demonstração Pendente
              </span>
              <span className="text-[11px] font-black text-[#1E1638] leading-tight">{exercise.name}</span>
              <p className="text-[9px] text-slate-600 mt-1 line-clamp-2 px-1 leading-snug">
                {isStart ? exercise.startingPosition : exercise.endingPosition}
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-white exercise-illustration-canvas rounded-xl overflow-hidden p-1 border border-purple-100/60">
              <img
                src={src}
                alt={`${exercise.name} - ${isStart ? 'Inicial' : 'Final'}`}
                referrerPolicy="no-referrer"
                onError={() => setErr(true)}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
              />
              <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider">
                Verificado PomboFit
              </div>
            </div>
          )}
        </div>

        <div className="w-full pt-1.5 border-t border-slate-100 text-[9px] text-slate-400 text-center font-bold truncate">
          {exercise.muscleGroup} · {exercise.movementType}
        </div>
      </div>
    );
  };

  if (phase === 'start') {
    return <div className={`w-full h-full ${className}`}>{renderCard(true)}</div>;
  }
  if (phase === 'end') {
    return <div className={`w-full h-full ${className}`}>{renderCard(false)}</div>;
  }

  return (
    <div className={`w-full h-full grid grid-cols-2 gap-2 sm:gap-3 items-stretch select-none ${className}`}>
      {renderCard(true)}
      {renderCard(false)}
    </div>
  );
};

/* =========================================================================
   4. CARTÃO DE DEMONSTRAÇÃO ESTÁTICA COM AS DUAS POSIÇÕES DO MASCOTE OFICIAL
   ========================================================================= */

interface ExerciseDemonstrationCardProps {
  exercise: ExerciseItem;
  showPhaseSelector?: boolean;
  compact?: boolean;
}

export const ExerciseDemonstrationCard: React.FC<ExerciseDemonstrationCardProps> = ({
  exercise,
  showPhaseSelector = true,
  compact = false,
}) => {
  const [selectedView, setSelectedView] = useState<'both' | 'start' | 'end'>('both');
  const { apparatusTitle, kinematicCallout } = useMemo(
    () => resolveExerciseApparatus(exercise),
    [exercise]
  );

  return (
    <div className="bg-white border border-[#EDE8F9] rounded-3xl overflow-hidden shadow-xs w-full">
      <div className="relative bg-gradient-to-b from-[#F6F3FF] via-[#FFFFFF] to-[#FAF8FF] p-3 sm:p-4 rounded-t-3xl border-b border-[#EDE8F9] flex flex-col items-center justify-center">
        {/* Cabeçalho de Identificação do Exercício e Equipamento */}
        <div className="w-full flex flex-wrap items-center justify-between gap-1.5 mb-2.5 z-10">
          <span className="text-xs font-extrabold text-[#5E2EE8]">
            {exercise.equipment} · {exercise.muscleGroup}
          </span>
          <span className="text-[11px] font-bold text-slate-600">
            Instrutor Oficial Pombo Seco
          </span>
        </div>

        {/* Ilustrações Estáticas do Mascote Oficial Executando o Exercício (Início e Final) */}
        <div
          className={`w-full ${
            compact
              ? 'h-52 sm:h-60'
              : selectedView === 'both'
              ? 'h-56 sm:h-68'
              : 'h-64 sm:h-76'
          } flex items-center justify-center relative`}
        >
          <ExerciseVerifiedVisual
            exercise={exercise}
            phase={selectedView === 'both' ? 'main' : selectedView}
            compact={false}
          />
        </div>

        {/* Identificação do Aparelho e Biomecânica */}
        <div className="w-full mt-2.5 text-center px-1">
          <span className="text-xs font-black text-[#1E1638] block leading-snug">
            Equipamento: {apparatusTitle}
          </span>
          <span className="text-[11px] text-slate-600 font-medium block leading-snug mt-0.5">
            {kinematicCallout}
          </span>
        </div>
      </div>

      {showPhaseSelector && (
        <div className="p-3 sm:p-4 bg-[#F8F6FC] border-t border-slate-100 space-y-3">
          {/* Seletor Estático das Duas Posições (Sem animações ou players) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#1E1638] uppercase tracking-wider">
              Visualização das Posições:
            </span>
            <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedView('both')}
                className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  selectedView === 'both'
                    ? 'bg-[#5E2EE8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#1E1638]'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5 shrink-0" />
                <span>Início + Final</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedView('start')}
                className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  selectedView === 'start'
                    ? 'bg-[#5E2EE8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#1E1638]'
                }`}
              >
                <Maximize2 className="w-3 h-3 shrink-0 hidden xs:inline" />
                <span>1. Inicial</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedView('end')}
                className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  selectedView === 'end'
                    ? 'bg-[#5E2EE8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#1E1638]'
                }`}
              >
                <Maximize2 className="w-3 h-3 shrink-0 hidden xs:inline" />
                <span>2. Final</span>
              </button>
            </div>
          </div>

          {/* Descrições Estáticas da Posição Inicial e Posição Final */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white border border-purple-100 rounded-xl p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block mb-1">
                1. Posição Inicial
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {exercise.startingPosition}
              </p>
            </div>

            <div className="bg-white border border-purple-200 rounded-xl p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block mb-1">
                2. Posição Final (Contração)
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {exercise.endingPosition}
              </p>
            </div>
          </div>

          {/* Músculo Alvo e Cuidado Postural */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-purple-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#5E2EE8] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Músculos Trabalhados:</strong>
                <span>{exercise.primaryMuscles.join(', ')}</span>
              </div>
            </div>

            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 flex items-start gap-2">
                <div>
                  <strong className="block font-bold">Cuidado Postural:</strong>
                  <span>{exercise.commonMistakes[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
