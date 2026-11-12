import React, { useState, useMemo } from 'react';
import { LoggedSetEntry, AnatomicalZoneId, MuscleCategory } from '../types';
import { Dumbbell, Layers, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { EXERCISES_CATALOG } from '../data/exercisesCatalog';

export interface HumanAnatomicalPostWorkoutMapProps {
  loggedSets: LoggedSetEntry[];
  sessionName?: string;
  className?: string;
  theme?: 'dark' | 'light';
}

export type MuscleIntensity = 'high' | 'medium' | 'low' | 'none';

export interface GroupContribution {
  name: string;
  key: string;
  zones: AnatomicalZoneId[];
  isPrimary: boolean;
  intensity: MuscleIntensity;
  setsCount: number;
  totalVolumeKg: number;
  exercises: Array<{
    name: string;
    sets: number;
    volumeKg: number;
    maxWeight: number;
  }>;
}

// Maps exercise categories to anatomical zones
const MUSCLE_GROUP_CONFIG: Array<{
  name: string;
  key: string;
  view: 'front' | 'back' | 'both';
  zones: AnatomicalZoneId[];
  categoryMatches: string[];
}> = [
  {
    name: 'Peitoral',
    key: 'peitoral',
    view: 'front',
    zones: ['chest', 'upper_chest'],
    categoryMatches: ['Peito', 'Peitoral'],
  },
  {
    name: 'Ombros',
    key: 'ombros',
    view: 'both',
    zones: ['front_delts', 'side_delts', 'rear_delts'],
    categoryMatches: ['Ombros'],
  },
  {
    name: 'Costas',
    key: 'costas',
    view: 'back',
    zones: ['lats', 'traps', 'lower_back'],
    categoryMatches: ['Costas'],
  },
  {
    name: 'Bíceps',
    key: 'biceps',
    view: 'front',
    zones: ['biceps'],
    categoryMatches: ['Bíceps'],
  },
  {
    name: 'Tríceps',
    key: 'triceps',
    view: 'back',
    zones: ['triceps'],
    categoryMatches: ['Tríceps'],
  },
  {
    name: 'Antebraços',
    key: 'antebracos',
    view: 'both',
    zones: ['forearms'],
    categoryMatches: ['Antebraços'],
  },
  {
    name: 'Abdômen',
    key: 'abdomen',
    view: 'front',
    zones: ['abs', 'obliques'],
    categoryMatches: ['Abdômen', 'Core'],
  },
  {
    name: 'Quadríceps',
    key: 'quadriceps',
    view: 'front',
    zones: ['quads'],
    categoryMatches: ['Quadríceps', 'Pernas'],
  },
  {
    name: 'Isquiotibiais',
    key: 'isquiotibiais',
    view: 'back',
    zones: ['hamstrings'],
    categoryMatches: ['Posteriores de coxa', 'Posterior', 'Isquiotibiais'],
  },
  {
    name: 'Glúteos',
    key: 'gluteos',
    view: 'back',
    zones: ['glutes'],
    categoryMatches: ['Glúteos'],
  },
  {
    name: 'Panturrilha',
    key: 'panturrilha',
    view: 'both',
    zones: ['calves'],
    categoryMatches: ['Panturrilhas', 'Panturrilha'],
  },
];

export const HumanAnatomicalPostWorkoutMap: React.FC<HumanAnatomicalPostWorkoutMapProps> = ({
  loggedSets,
  sessionName,
  className = '',
  theme = 'dark',
}) => {
  // Only consider completed sets
  const completedSets = useMemo(
    () => (loggedSets || []).filter((s) => s.completed),
    [loggedSets]
  );

  // Compute active muscle data based on actual exercises completed
  const { groups, zoneIntensityMap, maxSetsInWorkout } = useMemo(() => {
    // Group logged sets by exerciseId
    const exerciseAggregates = new Map<
      string,
      {
        exerciseId: string;
        exerciseName: string;
        setsCount: number;
        volumeKg: number;
        maxWeight: number;
      }
    >();

    completedSets.forEach((set) => {
      const existing = exerciseAggregates.get(set.exerciseId) || {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName || 'Exercício',
        setsCount: 0,
        volumeKg: 0,
        maxWeight: 0,
      };
      existing.setsCount += 1;
      existing.volumeKg += (set.weightKg || 0) * (set.repsDone || 0);
      if ((set.weightKg || 0) > existing.maxWeight) existing.maxWeight = set.weightKg || 0;
      exerciseAggregates.set(set.exerciseId, existing);
    });

    // Map exercises to muscle groups
    const groupContributions: GroupContribution[] = [];
    const zoneIntensities: Record<string, MuscleIntensity> = {};
    let highestSets = 0;

    MUSCLE_GROUP_CONFIG.forEach((cfg) => {
      const contributingExercises: GroupContribution['exercises'] = [];
      let totalSets = 0;
      let totalVolume = 0;
      let hasPrimary = false;

      exerciseAggregates.forEach((agg) => {
        // Look up catalog item
        const catalogEx = EXERCISES_CATALOG.find((e: { id: string }) => e.id === agg.exerciseId);
        const exCategory = catalogEx?.muscleGroup || '';
        const exName = agg.exerciseName.toLowerCase();

        // Check if catalog category matches
        const matchesCategory = cfg.categoryMatches.some(
          (m: string) =>
            exCategory.toLowerCase().includes(m.toLowerCase()) ||
            exName.includes(m.toLowerCase())
        );

        // Check primary zones
        const isPrimaryZone = catalogEx?.primaryZoneIds?.some((z: AnatomicalZoneId) => cfg.zones.includes(z));
        const isSecondaryZone = catalogEx?.secondaryZoneIds?.some((z: AnatomicalZoneId) => cfg.zones.includes(z));

        if (matchesCategory || isPrimaryZone || isSecondaryZone) {
          contributingExercises.push({
            name: agg.exerciseName,
            sets: agg.setsCount,
            volumeKg: agg.volumeKg,
            maxWeight: agg.maxWeight,
          });
          totalSets += agg.setsCount;
          totalVolume += agg.volumeKg;
          if (matchesCategory || isPrimaryZone) {
            hasPrimary = true;
          }
        }
      });

      if (totalSets > highestSets) {
        highestSets = totalSets;
      }

      if (totalSets > 0) {
        groupContributions.push({
          name: cfg.name,
          key: cfg.key,
          zones: cfg.zones,
          isPrimary: hasPrimary,
          intensity: 'medium', // will recalculate below relative to max
          setsCount: totalSets,
          totalVolumeKg: totalVolume,
          exercises: contributingExercises.sort((a, b) => b.sets - a.sets),
        });
      }
    });

    // Calculate relative intensity (high / medium / low) based on workout volume
    groupContributions.forEach((g) => {
      if (highestSets === 0) {
        g.intensity = 'low';
      } else {
        const ratio = g.setsCount / highestSets;
        if (ratio >= 0.7) {
          g.intensity = 'high';
        } else if (ratio >= 0.35) {
          g.intensity = 'medium';
        } else {
          g.intensity = 'low';
        }
      }

      g.zones.forEach((z) => {
        // Retain highest intensity if shared
        const current = zoneIntensities[z];
        if (!current || (current === 'low' && g.intensity !== 'low') || (current === 'medium' && g.intensity === 'high')) {
          zoneIntensities[z] = g.intensity;
        }
      });
    });

    return {
      groups: groupContributions.sort((a, b) => b.setsCount - a.setsCount),
      zoneIntensityMap: zoneIntensities,
      maxSetsInWorkout: highestSets,
    };
  }, [completedSets]);

  // Selected muscle group for interactive inspection
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(
    groups.length > 0 ? groups[0].key : null
  );

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.key === selectedGroupKey) || groups[0] || null;
  }, [groups, selectedGroupKey]);

  // Color palette for anatomical muscles matching Rivlo reference (#84CC16 / #A3E635 lime neon on dark)
  const getIntensityColors = (intensity: MuscleIntensity, isSelected = false) => {
    switch (intensity) {
      case 'high':
        return {
          fill: '#84CC16', // Vibrant Lime Green
          stroke: '#A3E635',
          glow: 'drop-shadow(0 0 6px rgba(132, 204, 22, 0.85))',
          badgeBg: 'bg-[#84CC16] text-[#121214]',
        };
      case 'medium':
        return {
          fill: '#A3E635', // Medium Lime
          stroke: '#BEF264',
          glow: 'drop-shadow(0 0 4px rgba(163, 230, 53, 0.65))',
          badgeBg: 'bg-[#A3E635] text-[#121214]',
        };
      case 'low':
        return {
          fill: '#65A30D', // Olive Green
          stroke: '#84CC16',
          glow: 'drop-shadow(0 0 3px rgba(101, 163, 13, 0.45))',
          badgeBg: 'bg-[#65A30D] text-white',
        };
      case 'none':
      default:
        return {
          fill: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          stroke: 'rgba(255, 255, 255, 0.16)',
          glow: 'none',
          badgeBg: 'bg-white/10 text-slate-400',
        };
    }
  };

  const getZoneColorStyle = (zoneId: AnatomicalZoneId, groupKey: string) => {
    const isThisGroupSelected = selectedGroupKey === groupKey;
    const intensity = zoneIntensityMap[zoneId] || 'none';
    const colors = getIntensityColors(intensity, isThisGroupSelected);

    if (intensity === 'none') {
      return {
        fill: isThisGroupSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        stroke: isThisGroupSelected ? '#94A3B8' : 'rgba(255, 255, 255, 0.18)',
        strokeWidth: isThisGroupSelected ? 1.5 : 0.8,
      };
    }

    return {
      fill: colors.fill,
      stroke: isThisGroupSelected ? '#FFFFFF' : colors.stroke,
      strokeWidth: isThisGroupSelected ? 2 : 1,
      filter: colors.glow,
      cursor: 'pointer',
      transition: 'all 0.25s ease',
    };
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-3xl p-4 sm:p-6 transition-colors shadow-xl ${
        isDark ? 'bg-[#121214] text-white border border-[#26262B]' : 'bg-white text-[#1E1638] border border-purple-100'
      } ${className}`}
    >
      {/* 1. Header do Mapa Muscular (exatamente como a Imagem 2) */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            MAPA MUSCULAR
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white mt-0.5">
            Músculos neste treino
          </h2>
          {sessionName && (
            <span className="text-xs text-slate-400 block mt-0.5">
              {sessionName}
            </span>
          )}
        </div>

        {/* Escala de Intensidade: Menos ---- Mais com ícone de barra de peso */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1">
            <span className="text-[10px] text-slate-400">Menos</span>
            {/* Visual Barbell Gradient Indicator */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3 rounded-xs bg-slate-500" />
              <div className="w-14 sm:w-18 h-1.5 rounded-full bg-gradient-to-r from-[#65A30D] via-[#84CC16] to-[#A3E635] shadow-xs" />
              <span className="w-1.5 h-3 rounded-xs bg-[#A3E635]" />
            </div>
            <span className="text-[10px] text-[#A3E635] font-bold">Mais</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {completedSets.length} séries registradas
          </span>
        </div>
      </div>

      {/* 2. Dual Anatomical Human Body (Frente e Costas) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 my-5">
        {/* Vista Frontal */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Frente
          </span>

          <div className="relative w-full max-w-[200px] aspect-[1/2.2] flex items-center justify-center">
            <svg
              viewBox="0 0 100 220"
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Human Body Silhouette Base (Subtle Charcoal Outlines) */}
              {/* Head & Neck */}
              <path
                d="M 50 10 C 44 10, 42 16, 42 22 C 42 28, 45 32, 47 34 L 46 38 L 41 40 L 59 40 L 54 38 L 53 34 C 55 32, 58 28, 58 22 C 58 16, 56 10, 50 10 Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {/* Trapezius / Clavicle lines */}
              <path
                d="M 41 40 L 32 43 M 59 40 L 68 43"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {/* Front Deltoids (Left & Right) */}
              <g
                onClick={() => setSelectedGroupKey('ombros')}
                className="cursor-pointer"
              >
                {/* Left Deltoid */}
                <path
                  d="M 32 43 C 28 44, 25 48, 25 54 C 25 60, 28 64, 30 65 L 32 58 L 33 48 Z"
                  style={getZoneColorStyle('front_delts', 'ombros')}
                />
                {/* Right Deltoid */}
                <path
                  d="M 68 43 C 72 44, 75 48, 75 54 C 75 60, 72 64, 70 65 L 68 58 L 67 48 Z"
                  style={getZoneColorStyle('front_delts', 'ombros')}
                />
              </g>

              {/* Pectoral (Left & Right) */}
              <g
                onClick={() => setSelectedGroupKey('peitoral')}
                className="cursor-pointer"
              >
                {/* Left Pec */}
                <path
                  d="M 49 42 L 35 44 C 33 48, 33 55, 36 60 C 40 62, 46 62, 49 59 Z"
                  style={getZoneColorStyle('chest', 'peitoral')}
                />
                {/* Right Pec */}
                <path
                  d="M 51 42 L 65 44 C 67 48, 67 55, 64 60 C 60 62, 54 62, 51 59 Z"
                  style={getZoneColorStyle('chest', 'peitoral')}
                />
              </g>

              {/* Biceps & Arms */}
              <g
                onClick={() => setSelectedGroupKey('biceps')}
                className="cursor-pointer"
              >
                {/* Left Bicep */}
                <path
                  d="M 30 65 C 28 66, 26 70, 26 76 C 26 81, 28 84, 30 85 L 32 78 L 32 68 Z"
                  style={getZoneColorStyle('biceps', 'biceps')}
                />
                {/* Right Bicep */}
                <path
                  d="M 70 65 C 72 66, 74 70, 74 76 C 74 81, 72 84, 70 85 L 68 78 L 68 68 Z"
                  style={getZoneColorStyle('biceps', 'biceps')}
                />
              </g>

              {/* Forearms */}
              <g
                onClick={() => setSelectedGroupKey('antebracos')}
                className="cursor-pointer"
              >
                {/* Left Forearm */}
                <path
                  d="M 29 86 C 26 88, 23 94, 21 104 C 20 108, 22 110, 24 110 L 27 100 L 29 90 Z"
                  style={getZoneColorStyle('forearms', 'antebracos')}
                />
                {/* Right Forearm */}
                <path
                  d="M 71 86 C 74 88, 77 94, 79 104 C 80 108, 78 110, 76 110 L 73 100 L 71 90 Z"
                  style={getZoneColorStyle('forearms', 'antebracos')}
                />
                {/* Hands */}
                <path
                  d="M 22 110 C 20 112, 19 116, 20 120 C 21 123, 23 124, 25 120 Z M 78 110 C 80 112, 81 116, 80 120 C 79 123, 77 124, 75 120 Z"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.8"
                />
              </g>

              {/* Abdomen (Rectus Abdominis 6-Pack + Obliques) */}
              <g
                onClick={() => setSelectedGroupKey('abdomen')}
                className="cursor-pointer"
              >
                {/* Core block with segmented abdominal packs */}
                <path
                  d="M 44 63 L 56 63 L 55 92 L 45 92 Z"
                  style={getZoneColorStyle('abs', 'abdomen')}
                />
                {/* Segment lines for abs */}
                <line x1="45" y1="70" x2="55" y2="70" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
                <line x1="45" y1="78" x2="55" y2="78" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
                <line x1="45" y1="85" x2="55" y2="85" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
                <line x1="50" y1="63" x2="50" y2="92" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />

                {/* Left Oblique */}
                <path
                  d="M 37 63 C 35 68, 36 78, 41 88 L 44 88 L 43 63 Z"
                  style={getZoneColorStyle('obliques', 'abdomen')}
                />
                {/* Right Oblique */}
                <path
                  d="M 63 63 C 65 68, 64 78, 59 88 L 56 88 L 57 63 Z"
                  style={getZoneColorStyle('obliques', 'abdomen')}
                />
              </g>

              {/* Pelvis / Hips outline */}
              <path
                d="M 42 93 L 50 99 L 58 93 L 60 98 L 50 106 L 40 98 Z"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.8"
              />

              {/* Quadriceps (Thighs Frontal) */}
              <g
                onClick={() => setSelectedGroupKey('quadriceps')}
                className="cursor-pointer"
              >
                {/* Left Quad (Outer & Inner Heads: Vastus Lateralis + Rectus Femoris + Vastus Medialis) */}
                <path
                  d="M 38 98 C 34 105, 33 118, 35 132 C 36 136, 40 138, 42 136 C 44 125, 45 110, 48 98 Z"
                  style={getZoneColorStyle('quads', 'quadriceps')}
                />
                {/* Right Quad */}
                <path
                  d="M 62 98 C 66 105, 67 118, 65 132 C 64 136, 60 138, 58 136 C 56 125, 55 110, 52 98 Z"
                  style={getZoneColorStyle('quads', 'quadriceps')}
                />
              </g>

              {/* Knees */}
              <circle cx="39" cy="141" r="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <circle cx="61" cy="141" r="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />

              {/* Calves & Shins (Frontal) */}
              <g
                onClick={() => setSelectedGroupKey('panturrilha')}
                className="cursor-pointer"
              >
                {/* Left Tibialis / Calves */}
                <path
                  d="M 36 145 C 33 150, 32 162, 34 175 C 35 180, 38 184, 40 184 C 42 178, 43 162, 42 145 Z"
                  style={getZoneColorStyle('calves', 'panturrilha')}
                />
                {/* Right Tibialis / Calves */}
                <path
                  d="M 64 145 C 67 150, 68 162, 66 175 C 65 180, 62 184, 60 184 C 58 178, 57 162, 58 145 Z"
                  style={getZoneColorStyle('calves', 'panturrilha')}
                />
              </g>

              {/* Feet */}
              <path
                d="M 35 185 L 31 198 L 41 198 L 40 185 Z M 65 185 L 69 198 L 59 198 L 60 185 Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.8"
              />
            </svg>
          </div>
        </div>

        {/* Vista Posterior (Costas) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Costas
          </span>

          <div className="relative w-full max-w-[200px] aspect-[1/2.2] flex items-center justify-center">
            <svg
              viewBox="0 0 100 220"
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Head & Neck Posterior */}
              <path
                d="M 50 10 C 44 10, 42 16, 42 22 C 42 28, 45 32, 47 34 L 46 38 L 41 40 L 59 40 L 54 38 L 53 34 C 55 32, 58 28, 58 22 C 58 16, 56 10, 50 10 Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {/* Trapezius & Upper Back */}
              <g
                onClick={() => setSelectedGroupKey('costas')}
                className="cursor-pointer"
              >
                {/* Trapezius kite/diamond shape */}
                <path
                  d="M 50 34 L 41 40 L 32 44 L 44 58 L 50 68 L 56 58 L 68 44 L 59 40 Z"
                  style={getZoneColorStyle('traps', 'costas')}
                />
                {/* Lats (Latissimus Dorsi wings) */}
                <path
                  d="M 33 46 C 30 54, 30 65, 36 78 C 42 80, 45 78, 48 72 L 44 58 Z"
                  style={getZoneColorStyle('lats', 'costas')}
                />
                <path
                  d="M 67 46 C 70 54, 70 65, 64 78 C 58 80, 55 78, 52 72 L 56 58 Z"
                  style={getZoneColorStyle('lats', 'costas')}
                />
              </g>

              {/* Rear Deltoids */}
              <g
                onClick={() => setSelectedGroupKey('ombros')}
                className="cursor-pointer"
              >
                <path
                  d="M 32 44 C 27 46, 25 50, 25 56 C 25 61, 28 64, 30 64 L 32 54 Z"
                  style={getZoneColorStyle('rear_delts', 'ombros')}
                />
                <path
                  d="M 68 44 C 73 46, 75 50, 75 56 C 75 61, 72 64, 70 64 L 68 54 Z"
                  style={getZoneColorStyle('rear_delts', 'ombros')}
                />
              </g>

              {/* Triceps (Back of arms) */}
              <g
                onClick={() => setSelectedGroupKey('triceps')}
                className="cursor-pointer"
              >
                {/* Left Tricep (lateral + long head) */}
                <path
                  d="M 29 65 C 27 67, 26 73, 26 80 C 27 84, 29 86, 31 85 L 32 76 L 31 66 Z"
                  style={getZoneColorStyle('triceps', 'triceps')}
                />
                {/* Right Tricep */}
                <path
                  d="M 71 65 C 73 67, 74 73, 74 80 C 73 84, 71 86, 69 85 L 68 76 L 69 66 Z"
                  style={getZoneColorStyle('triceps', 'triceps')}
                />
              </g>

              {/* Forearms Back */}
              <g
                onClick={() => setSelectedGroupKey('antebracos')}
                className="cursor-pointer"
              >
                <path
                  d="M 29 86 C 26 88, 23 94, 21 104 C 20 108, 22 110, 24 110 L 27 100 L 29 90 Z"
                  style={getZoneColorStyle('forearms', 'antebracos')}
                />
                <path
                  d="M 71 86 C 74 88, 77 94, 79 104 C 80 108, 78 110, 76 110 L 73 100 L 71 90 Z"
                  style={getZoneColorStyle('forearms', 'antebracos')}
                />
              </g>

              {/* Lower Back (Lumbar & Spinal Erector) */}
              <g
                onClick={() => setSelectedGroupKey('costas')}
                className="cursor-pointer"
              >
                <path
                  d="M 45 74 L 55 74 L 54 90 L 46 90 Z"
                  style={getZoneColorStyle('lower_back', 'costas')}
                />
              </g>

              {/* Glutes (Gluteus Maximus & Medius) */}
              <g
                onClick={() => setSelectedGroupKey('gluteos')}
                className="cursor-pointer"
              >
                {/* Left Glute */}
                <path
                  d="M 38 90 C 35 95, 35 106, 38 114 C 42 118, 47 116, 49 110 L 49 92 Z"
                  style={getZoneColorStyle('glutes', 'gluteos')}
                />
                {/* Right Glute */}
                <path
                  d="M 62 90 C 65 95, 65 106, 62 114 C 58 118, 53 116, 51 110 L 51 92 Z"
                  style={getZoneColorStyle('glutes', 'gluteos')}
                />
              </g>

              {/* Hamstrings (Posterior Thigh) */}
              <g
                onClick={() => setSelectedGroupKey('isquiotibiais')}
                className="cursor-pointer"
              >
                {/* Left Hamstring */}
                <path
                  d="M 38 115 C 35 120, 34 130, 36 137 C 39 140, 43 138, 46 134 C 47 127, 48 120, 48 115 Z"
                  style={getZoneColorStyle('hamstrings', 'isquiotibiais')}
                />
                {/* Right Hamstring */}
                <path
                  d="M 62 115 C 65 120, 66 130, 64 137 C 61 140, 57 138, 54 134 C 53 127, 52 120, 52 115 Z"
                  style={getZoneColorStyle('hamstrings', 'isquiotibiais')}
                />
              </g>

              {/* Calves Posterior (Gastrocnemius Diamond Heads) */}
              <g
                onClick={() => setSelectedGroupKey('panturrilha')}
                className="cursor-pointer"
              >
                {/* Left Calf (Gastrocnemius) */}
                <path
                  d="M 36 142 C 32 146, 31 156, 33 166 C 35 174, 39 180, 41 180 C 43 174, 44 160, 42 142 Z"
                  style={getZoneColorStyle('calves', 'panturrilha')}
                />
                {/* Right Calf */}
                <path
                  d="M 64 142 C 68 146, 69 156, 67 166 C 65 174, 61 180, 59 180 C 57 174, 56 160, 58 142 Z"
                  style={getZoneColorStyle('calves', 'panturrilha')}
                />
                {/* Achilles tendon lines */}
                <line x1="39" y1="180" x2="39" y2="190" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <line x1="61" y1="180" x2="61" y2="190" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              </g>

              {/* Feet Posterior */}
              <path
                d="M 37 190 L 33 200 L 41 200 Z M 63 190 L 67 200 L 59 200 Z"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.8"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Instrução e Carrossel Horizontal de Chips dos Grupos Musculares (Imagem 2) */}
      <div className="space-y-3 pt-1">
        <p className="text-xs text-slate-400 font-medium">
          Toque no mapa ou escolha um grupo abaixo. Deslize para ver todos.
        </p>

        {/* Scrollable Pills Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {groups.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              Nenhuma série concluída neste treino para mapear.
            </span>
          ) : (
            groups.map((group) => {
              const isSelected = group.key === selectedGroupKey;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setSelectedGroupKey(group.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#84CC16] text-[#121214] shadow-md ring-2 ring-[#A3E635]'
                      : isDark
                      ? 'bg-[#1E1E22] text-slate-300 hover:bg-[#28282E] border border-white/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      group.intensity === 'high'
                        ? 'bg-[#84CC16]'
                        : group.intensity === 'medium'
                        ? 'bg-[#A3E635]'
                        : 'bg-[#65A30D]'
                    }`}
                  />
                  <span>{group.name}</span>
                  <span className="text-[10px] opacity-75 font-mono-tabular">
                    ({group.setsCount}s)
                  </span>
                </button>
              );
            })
          )}
        </div>

        <p className="text-[11px] text-slate-500 font-normal">
          Toque em um grupo para ver os detalhes abaixo. Cada grupo usa a cor da sua porção mais treinada.
        </p>
      </div>

      {/* 4. Detalhes do Grupo Selecionado (Card Expansível) */}
      {selectedGroup && (
        <div className={`mt-4 rounded-2xl p-4 transition-all ${
          isDark ? 'bg-[#1A1A1E] border border-[#2E2E36]' : 'bg-[#FAF8FF] border border-purple-100'
        }`}>
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white">
                  {selectedGroup.name}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedGroup.isPrimary ? 'bg-[#84CC16]/20 text-[#A3E635]' : 'bg-white/10 text-slate-300'
                }`}>
                  {selectedGroup.isPrimary ? 'Foco Principal' : 'Estímulo Secundário'}
                </span>
              </div>
              <span className="text-xs text-slate-400 block mt-1">
                {selectedGroup.setsCount} séries concluídas no treino · {selectedGroup.totalVolumeKg.toLocaleString('pt-BR')} kg de volume
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#84CC16]/15 flex items-center justify-center text-[#A3E635] shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>

          {/* Exercícios que contribuíram */}
          <div className="mt-3 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Exercícios que Estimularam {selectedGroup.name}
            </span>

            <div className="space-y-1.5">
              {selectedGroup.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#121214] border border-white/5' : 'bg-white border border-purple-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <strong className="text-white block truncate">{ex.name}</strong>
                    <span className="text-[10px] text-slate-400">
                      {ex.sets} {ex.sets === 1 ? 'série concluída' : 'séries concluídas'}
                      {ex.maxWeight > 0 ? ` · Carga máxima: ${ex.maxWeight} kg` : ''}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#A3E635] font-mono-tabular shrink-0">
                    {ex.volumeKg > 0 ? `${ex.volumeKg.toLocaleString('pt-BR')} kg` : `${ex.sets} séries`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
