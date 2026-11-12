import React from 'react';
import { AccessoryCategory, AccessoryRarity } from '../types';
import {
  Crown,
  Glasses,
  Flame,
  Shirt,
  Sparkles,
  Shield,
  Trophy,
  Zap,
} from 'lucide-react';

/* =========================================================================
   1. RARITY BADGES & VISUAL IDENTITY
   ========================================================================= */

export const RARITY_CONFIG: Record<
  AccessoryRarity,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    glow: string;
    cardBg: string;
    gradient: string;
    icon: string;
  }
> = {
  common: {
    label: 'Comum',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeText: 'text-slate-600',
    border: 'border-slate-200',
    glow: 'shadow-slate-200/50',
    cardBg: 'from-slate-50/80 to-white',
    gradient: 'from-slate-400 to-slate-600',
    icon: 'Shield',
  },
  rare: {
    label: 'Raro',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    badgeText: 'text-cyan-700',
    border: 'border-cyan-300',
    glow: 'shadow-cyan-400/20 shadow-md',
    cardBg: 'from-cyan-50/60 to-white',
    gradient: 'from-cyan-500 to-blue-600',
    icon: 'Zap',
  },
  epic: {
    label: 'Épico',
    badgeBg: 'bg-purple-50 text-[#7650C9] border-[#E4D9FF]',
    badgeText: 'text-[#7650C9]',
    border: 'border-[#A382F7]',
    glow: 'shadow-purple-500/25 shadow-md',
    cardBg: 'from-purple-50/70 to-white',
    gradient: 'from-[#7650C9] to-[#9D71FD]',
    icon: 'Sparkles',
  },
  legendary: {
    label: 'Lendário',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-300',
    badgeText: 'text-amber-700',
    border: 'border-amber-400',
    glow: 'shadow-amber-500/30 shadow-lg',
    cardBg: 'from-amber-50/80 via-yellow-50/40 to-white',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    icon: 'Crown',
  },
};

export const RarityBadge: React.FC<{
  rarity: AccessoryRarity;
  size?: 'sm' | 'md';
}> = ({ rarity, size = 'sm' }) => {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-md border ${
        config.badgeBg
      } ${isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2.5 py-1'}`}
    >
      {rarity === 'legendary' && <Crown className={isSm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />}
      {rarity === 'epic' && <Sparkles className={isSm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />}
      {rarity === 'rare' && <Zap className={isSm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};

/* =========================================================================
   2. CATEGORY CONFIG & ICONS
   ========================================================================= */

export const CATEGORIES_CONFIG: Array<{
  id: AccessoryCategory;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { id: 'hat', label: 'Bonés e Chapéus', shortLabel: 'Chapéus', icon: 'Cap' },
  { id: 'glasses', label: 'Óculos', shortLabel: 'Óculos', icon: 'Glasses' },
  { id: 'mask', label: 'Máscaras', shortLabel: 'Máscaras', icon: 'Mask' },
  { id: 'headband', label: 'Faixas Esportivas', shortLabel: 'Faixas', icon: 'Headband' },
  { id: 'outfit', label: 'Roupas e Uniformes', shortLabel: 'Roupas', icon: 'Shirt' },
  { id: 'special', label: 'Acessórios Especiais', shortLabel: 'Especiais', icon: 'Trophy' },
];

/* =========================================================================
   3. HIGH-FIDELITY VECTOR ACCESSORY THUMBNAIL
   ========================================================================= */

export const AccessoryThumbnail: React.FC<{
  accessoryId: string;
  className?: string;
}> = ({ accessoryId, className = 'w-16 h-16' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0 select-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="purpleGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D71FD" />
          <stop offset="1" stopColor="#5E2EE8" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="cyanGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="darkGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#374151" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        <filter id="thumbGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. BONÉS E CHAPÉUS */}
      {(accessoryId === 'hat_snapback_purple' || accessoryId === 'bone') && (
        <g>
          {/* Sombra */}
          <ellipse cx="50" cy="72" rx="36" ry="7" fill="#000000" opacity="0.12" />
          {/* Copa do Boné */}
          <path
            d="M 22 56 C 22 30 34 22 50 22 C 66 22 78 30 78 56 Z"
            fill="url(#purpleGrad)"
            stroke="#4A1BB8"
            strokeWidth="1.5"
          />
          {/* Botão Superior */}
          <circle cx="50" cy="22" r="3.5" fill="#FFFFFF" />
          {/* Aba Reta / Curva */}
          <path
            d="M 16 54 Q 50 64 88 52 L 86 58 Q 50 70 14 60 Z"
            fill="#1E1638"
            stroke="#4A1BB8"
            strokeWidth="1.5"
          />
          {/* Logo bordado "P" */}
          <path
            d="M 46 34 L 52 34 C 55 34 57 36 57 39 C 57 42 55 44 52 44 L 46 44 Z"
            fill="#FFFFFF"
          />
          <rect x="46" y="34" width="2.5" height="15" fill="#FFFFFF" rx="1" />
        </g>
      )}

      {accessoryId === 'hat_beanie_street' && (
        <g>
          <ellipse cx="50" cy="74" rx="32" ry="6" fill="#000000" opacity="0.12" />
          {/* Gorro street */}
          <path
            d="M 26 56 C 26 28 36 22 50 22 C 64 22 74 28 74 56 Z"
            fill="url(#darkGrad)"
          />
          {/* Linhas de costura */}
          <path d="M 42 24 Q 40 40 40 56 M 50 22 Q 50 38 50 56 M 58 24 Q 60 40 60 56" stroke="#4B5563" strokeWidth="1" />
          {/* Barra dobrada roxa */}
          <rect x="22" y="52" width="56" height="15" rx="4" fill="url(#purpleGrad)" stroke="#4A1BB8" strokeWidth="1.5" />
          <circle cx="50" cy="20" r="4" fill="#9D71FD" />
        </g>
      )}

      {accessoryId === 'hat_visor_speed' && (
        <g>
          <ellipse cx="50" cy="68" rx="35" ry="5" fill="#000000" opacity="0.12" />
          {/* Faixa da viseira */}
          <path d="M 22 42 Q 50 36 78 42 L 78 50 Q 50 44 22 50 Z" fill="url(#purpleGrad)" stroke="#FFFFFF" strokeWidth="1.2" />
          {/* Aba translúcida */}
          <path
            d="M 16 46 Q 50 56 86 46 L 82 56 Q 50 68 18 56 Z"
            fill="#1E1638"
            opacity="0.9"
            stroke="#9D71FD"
            strokeWidth="1.5"
          />
        </g>
      )}

      {accessoryId === 'chapeu' && (
        <g>
          <ellipse cx="50" cy="68" rx="42" ry="8" fill="#111827" />
          <path d="M 30 62 C 30 36 38 30 50 30 C 62 30 70 36 70 62 Z" fill="#1F2937" />
          <rect x="30" y="54" width="40" height="7" fill="url(#purpleGrad)" />
        </g>
      )}

      {accessoryId === 'hat_ninja_hood' && (
        <g>
          <path
            d="M 24 76 C 20 40 30 18 50 18 C 70 18 80 40 76 76 Q 50 82 24 76 Z"
            fill="url(#darkGrad)"
            stroke="#4A1BB8"
            strokeWidth="1.5"
          />
          <ellipse cx="50" cy="48" rx="18" ry="20" fill="#0F172A" />
        </g>
      )}

      {accessoryId === 'hat_champion_crown' && (
        <g filter="url(#thumbGlow)">
          <ellipse cx="50" cy="70" rx="30" ry="6" fill="#000000" opacity="0.12" />
          {/* Coroa de Louros */}
          <path
            d="M 24 45 C 26 28 36 24 50 24 C 64 24 74 28 76 45"
            stroke="url(#goldGrad)"
            strokeWidth="4"
            fill="none"
          />
          {/* Folhas de Ouro */}
          {[26, 34, 42, 50, 58, 66, 74].map((x, i) => (
            <ellipse
              key={i}
              cx={x}
              cy={30 + Math.sin(i) * 5}
              rx="4"
              ry="7"
              transform={`rotate(${(i - 3) * 18} ${x} 32)`}
              fill="url(#goldGrad)"
              stroke="#B45309"
              strokeWidth="0.8"
            />
          ))}
          <circle cx="50" cy="20" r="3.5" fill="#FEF08A" />
        </g>
      )}

      {/* 2. ÓCULOS */}
      {accessoryId === 'oculos_sol' && (
        <g>
          <rect x="18" y="40" width="28" height="18" rx="6" fill="url(#darkGrad)" stroke="#1F2937" strokeWidth="1.5" />
          <rect x="54" y="40" width="28" height="18" rx="6" fill="url(#darkGrad)" stroke="#1F2937" strokeWidth="1.5" />
          <line x1="46" y1="46" x2="54" y2="46" stroke="#111827" strokeWidth="3" />
          <line x1="22" y1="43" x2="40" y2="43" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="58" y1="43" x2="76" y2="43" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </g>
      )}

      {accessoryId === 'oculos_esportivo' && (
        <g>
          <path
            d="M 14 44 Q 50 36 86 44 L 82 54 Q 50 46 18 54 Z"
            fill="url(#purpleGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <path
            d="M 22 47 Q 50 41 78 47"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            opacity="0.8"
            fill="none"
          />
        </g>
      )}

      {accessoryId === 'glasses_sport_shield' && (
        <g>
          <path
            d="M 14 40 Q 50 32 86 40 L 80 56 Q 50 50 20 56 Z"
            fill="url(#cyanGrad)"
            stroke="#1E1638"
            strokeWidth="1.5"
          />
          <path
            d="M 14 40 L 86 40 L 82 43 L 18 43 Z"
            fill="#111827"
          />
        </g>
      )}

      {accessoryId === 'glasses_cyber_visor' && (
        <g filter="url(#thumbGlow)">
          <path
            d="M 14 42 Q 50 36 86 42 L 80 54 Q 50 48 20 54 Z"
            fill="#5E2EE8"
            opacity="0.85"
            stroke="#A382F7"
            strokeWidth="1.8"
          />
          {/* Retículo HUD */}
          <circle cx="36" cy="47" r="4" stroke="#67E8F9" strokeWidth="1.2" fill="none" />
          <circle cx="64" cy="47" r="4" stroke="#67E8F9" strokeWidth="1.2" fill="none" />
          <line x1="36" y1="43" x2="36" y2="51" stroke="#67E8F9" strokeWidth="1" />
          <line x1="64" y1="43" x2="64" y2="51" stroke="#67E8F9" strokeWidth="1" />
        </g>
      )}

      {accessoryId === 'glasses_gold_aviator' && (
        <g filter="url(#thumbGlow)">
          <ellipse cx="32" cy="48" rx="14" ry="12" fill="#D97706" opacity="0.75" stroke="url(#goldGrad)" strokeWidth="2" />
          <ellipse cx="68" cy="48" rx="14" ry="12" fill="#D97706" opacity="0.75" stroke="url(#goldGrad)" strokeWidth="2" />
          <line x1="46" y1="43" x2="54" y2="43" stroke="url(#goldGrad)" strokeWidth="2.5" />
          <line x1="44" y1="47" x2="56" y2="47" stroke="url(#goldGrad)" strokeWidth="1.5" />
        </g>
      )}

      {/* 3. MÁSCARAS */}
      {accessoryId === 'hospitalar' && (
        <g>
          <path
            d="M 22 42 Q 50 38 78 42 L 72 70 Q 50 78 28 70 Z"
            fill="#38BDF8"
            stroke="#0284C7"
            strokeWidth="1.5"
          />
          <line x1="22" y1="52" x2="78" y2="52" stroke="#E0F2FE" strokeWidth="1.5" />
          <line x1="24" y1="60" x2="76" y2="60" stroke="#E0F2FE" strokeWidth="1.5" />
        </g>
      )}

      {accessoryId === 'mask_tactical_stealth' && (
        <g>
          <path
            d="M 24 38 Q 50 32 76 38 L 74 72 Q 50 82 26 72 Z"
            fill="url(#darkGrad)"
            stroke="#374151"
            strokeWidth="1.5"
          />
          {/* Logo Pombo no queixo */}
          <circle cx="50" cy="62" r="5" fill="#5E2EE8" />
          <path d="M 48 59 L 52 59 C 53 59 54 60 54 61 C 54 62 53 63 52 63 L 48 63 Z" fill="#FFFFFF" />
          <rect x="48" y="59" width="1.5" height="6" fill="#FFFFFF" />
        </g>
      )}

      {accessoryId === 'mask_altitude_pro' && (
        <g>
          <path
            d="M 20 40 Q 50 34 80 40 L 76 74 Q 50 82 24 74 Z"
            fill="#1F2937"
            stroke="#4B5563"
            strokeWidth="1.5"
          />
          {/* Duas válvulas de fluxo */}
          <circle cx="34" cy="58" r="8" fill="#111827" stroke="#9D71FD" strokeWidth="2" />
          <circle cx="66" cy="58" r="8" fill="#111827" stroke="#9D71FD" strokeWidth="2" />
          <circle cx="34" cy="58" r="3" fill="#9D71FD" />
          <circle cx="66" cy="58" r="3" fill="#9D71FD" />
        </g>
      )}

      {accessoryId === 'batman' && (
        <g>
          <path
            d="M 18 36 L 16 16 L 34 28 Q 50 25 66 28 L 84 16 L 82 36 Q 84 56 50 58 Q 16 56 18 36 Z"
            fill="#111827"
            stroke="#4B5563"
            strokeWidth="1.5"
          />
          <ellipse cx="34" cy="42" rx="6" ry="4" fill="#FFFFFF" />
          <ellipse cx="66" cy="42" rx="6" ry="4" fill="#FFFFFF" />
        </g>
      )}

      {accessoryId === 'mask_cyber_respirator' && (
        <g filter="url(#thumbGlow)">
          <path
            d="M 22 40 Q 50 34 78 40 L 74 74 Q 50 82 26 74 Z"
            fill="#1E293B"
            stroke="#67E8F9"
            strokeWidth="1.5"
          />
          <rect x="36" y="52" width="28" height="14" rx="4" fill="#0F172A" stroke="#A382F7" strokeWidth="1.5" />
          <line x1="40" y1="59" x2="60" y2="59" stroke="#9D71FD" strokeWidth="2" strokeDasharray="3 2" />
        </g>
      )}

      {accessoryId === 'mask_oni_warrior' && (
        <g filter="url(#thumbGlow)">
          <path
            d="M 20 38 Q 50 30 80 38 L 76 76 Q 50 86 24 76 Z"
            fill="#831843"
            stroke="url(#goldGrad)"
            strokeWidth="2"
          />
          {/* Presas Douradas */}
          <path d="M 32 58 L 36 66 L 40 58 Z" fill="url(#goldGrad)" />
          <path d="M 68 58 L 64 66 L 60 58 Z" fill="url(#goldGrad)" />
        </g>
      )}

      {/* 4. FAIXAS ESPORTIVAS */}
      {accessoryId === 'headband_classic' && (
        <g>
          <rect x="14" y="42" width="72" height="16" rx="8" fill="url(#purpleGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="16" y1="46" x2="84" y2="46" stroke="#C4B5FD" strokeWidth="1" strokeDasharray="4 2" />
          <line x1="16" y1="54" x2="84" y2="54" stroke="#C4B5FD" strokeWidth="1" strokeDasharray="4 2" />
        </g>
      )}

      {accessoryId === 'headband_stealth_black' && (
        <g>
          <rect x="14" y="42" width="72" height="16" rx="8" fill="url(#darkGrad)" stroke="#4B5563" strokeWidth="1.5" />
          <line x1="16" y1="50" x2="84" y2="50" stroke="#9CA3AF" strokeWidth="1.2" strokeDasharray="3 3" />
        </g>
      )}

      {accessoryId === 'headband_purple_pro' && (
        <g>
          <rect x="12" y="38" width="76" height="24" rx="10" fill="url(#purpleGrad)" stroke="#FFFFFF" strokeWidth="1.8" />
          <rect x="16" y="48" width="68" height="4" fill="#FFFFFF" opacity="0.9" rx="2" />
        </g>
      )}

      {accessoryId === 'headband_neon_purple' && (
        <g filter="url(#thumbGlow)">
          <rect x="12" y="40" width="76" height="20" rx="10" fill="#7650C9" stroke="#C4B5FD" strokeWidth="2" />
          <line x1="16" y1="50" x2="84" y2="50" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {accessoryId === 'headband_golden_champion' && (
        <g filter="url(#thumbGlow)">
          <rect x="12" y="38" width="76" height="24" rx="10" fill="url(#goldGrad)" stroke="#B45309" strokeWidth="2" />
          <circle cx="50" cy="50" r="6" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
          <path d="M 40 50 Q 45 44 50 50 Q 55 44 60 50" stroke="#B45309" strokeWidth="1.5" fill="none" />
        </g>
      )}

      {/* 5. ROUPAS E UNIFORMES */}
      {accessoryId === 'outfit_classic' && (
        <g>
          <path
            d="M 30 24 L 40 24 L 45 36 Q 50 38 55 36 L 60 24 L 70 24 L 76 56 L 68 78 L 32 78 L 24 56 Z"
            fill="#FFFFFF"
            stroke="#7650C9"
            strokeWidth="2"
          />
          {/* Laterais roxas */}
          <path d="M 24 56 L 32 78 L 38 78 L 32 56 Z" fill="url(#purpleGrad)" />
          <path d="M 76 56 L 68 78 L 62 78 L 68 56 Z" fill="url(#purpleGrad)" />
          {/* Logo P central */}
          <circle cx="50" cy="52" r="7" fill="url(#purpleGrad)" />
          <text x="50" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">P</text>
        </g>
      )}

      {accessoryId === 'outfit_hooded_tank' && (
        <g>
          <path
            d="M 24 22 C 24 16 36 12 50 12 C 64 12 76 16 76 22 L 74 38 L 26 38 Z"
            fill="url(#purpleGrad)"
            stroke="#4A1BB8"
            strokeWidth="1.5"
          />
          <path
            d="M 30 38 L 70 38 L 74 78 L 26 78 Z"
            fill="#FAF5FF"
            stroke="#7650C9"
            strokeWidth="2"
          />
        </g>
      )}

      {accessoryId === 'outfit_stealth_compression' && (
        <g>
          <path
            d="M 28 22 L 72 22 L 78 78 L 22 78 Z"
            fill="url(#darkGrad)"
            stroke="#374151"
            strokeWidth="2"
          />
          <path d="M 36 28 L 50 44 L 64 28" stroke="#4B5563" strokeWidth="1.5" fill="none" />
          <line x1="50" y1="44" x2="50" y2="76" stroke="#4B5563" strokeWidth="1.5" />
        </g>
      )}

      {accessoryId === 'outfit_elite_white' && (
        <g>
          <path
            d="M 28 20 L 72 20 L 78 78 L 22 78 Z"
            fill="#F8FAFC"
            stroke="#0F172A"
            strokeWidth="2"
          />
          <path d="M 46 20 L 54 20 L 58 78 L 42 78 Z" fill="url(#purpleGrad)" />
          <circle cx="50" cy="46" r="6" fill="#0F172A" />
          <polygon points="50,42 52,48 48,48" fill="#F8FAFC" />
        </g>
      )}

      {accessoryId === 'outfit_royal_gold' && (
        <g filter="url(#thumbGlow)">
          <path
            d="M 24 22 L 76 22 L 74 78 L 26 78 Z"
            fill="#1E1638"
            stroke="url(#goldGrad)"
            strokeWidth="2.5"
          />
          {/* Ombreiras douradas */}
          <rect x="18" y="22" width="16" height="8" rx="2" fill="url(#goldGrad)" />
          <rect x="66" y="22" width="16" height="8" rx="2" fill="url(#goldGrad)" />
          <polygon points="50,34 60,50 50,66 40,50" fill="url(#goldGrad)" stroke="#B45309" strokeWidth="1" />
        </g>
      )}

      {accessoryId === 'outfit_cyber_suit' && (
        <g filter="url(#thumbGlow)">
          <path
            d="M 24 20 L 76 20 L 74 78 L 26 78 Z"
            fill="#0F172A"
            stroke="#38BDF8"
            strokeWidth="2"
          />
          <line x1="30" y1="36" x2="70" y2="36" stroke="#A855F7" strokeWidth="2" />
          <line x1="34" y1="52" x2="66" y2="52" stroke="#A855F7" strokeWidth="2" />
          <circle cx="50" cy="44" r="5" fill="#38BDF8" />
        </g>
      )}

      {/* 6. ACESSÓRIOS ESPECIAIS */}
      {(accessoryId === 'special_powerlifting_belt' || accessoryId === 'acc_wristwraps_pro') && (
        <g>
          <path
            d="M 16 40 Q 50 36 84 40 L 84 62 Q 50 58 16 62 Z"
            fill="#451A03"
            stroke="#78350F"
            strokeWidth="2"
          />
          {/* Fivela de alavanca de aço */}
          <rect x="42" y="44" width="16" height="14" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          <rect x="46" y="48" width="8" height="6" fill="#94A3B8" />
          {/* Costuras */}
          <line x1="18" y1="44" x2="82" y2="44" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="18" y1="58" x2="82" y2="58" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
        </g>
      )}

      {accessoryId === 'acc_shaker_purple' && (
        <g>
          <ellipse cx="50" cy="80" rx="18" ry="4" fill="#000000" opacity="0.12" />
          {/* Corpo da coqueteleira */}
          <path
            d="M 36 34 L 40 76 Q 50 80 60 76 L 64 34 Z"
            fill="url(#purpleGrad)"
            stroke="#4A1BB8"
            strokeWidth="1.5"
          />
          {/* Tampa */}
          <rect x="34" y="24" width="32" height="10" rx="3" fill="#1E1638" stroke="#FFFFFF" strokeWidth="1" />
          {/* Bico com tampa flip */}
          <rect x="44" y="16" width="12" height="8" rx="2" fill="#A382F7" />
          <text x="50" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">1000ml</text>
        </g>
      )}

      {accessoryId === 'special_titanium_chain' && (
        <g filter="url(#thumbGlow)">
          <path
            d="M 22 28 Q 50 78 78 28"
            stroke="url(#goldGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 22 28 Q 50 78 78 28"
            stroke="#92400E"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
          />
        </g>
      )}

      {accessoryId === 'special_gold_medal' && (
        <g filter="url(#thumbGlow)">
          {/* Fita roxa */}
          <path d="M 32 20 L 46 54 L 54 54 L 68 20 Z" fill="url(#purpleGrad)" stroke="#4A1BB8" strokeWidth="1.2" />
          {/* Medalha redonda */}
          <circle cx="50" cy="64" r="16" fill="url(#goldGrad)" stroke="#B45309" strokeWidth="2" />
          <circle cx="50" cy="64" r="12" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
          <text x="50" y="69" textAnchor="middle" fill="#78350F" fontSize="13" fontWeight="900">1º</text>
        </g>
      )}

      {accessoryId === 'special_super_aura' && (
        <g filter="url(#thumbGlow)">
          <circle cx="50" cy="50" r="34" fill="url(#purpleGrad)" opacity="0.3" />
          <path
            d="M 50 14 Q 58 34 76 36 Q 58 48 64 74 Q 50 58 36 74 Q 42 48 24 36 Q 42 34 50 14 Z"
            fill="#A855F7"
            opacity="0.8"
          />
          <circle cx="50" cy="50" r="14" fill="#E9D5FF" opacity="0.9" />
        </g>
      )}

      {/* Fallback default icon */}
      {!accessoryId && (
        <circle cx="50" cy="50" r="28" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
      )}
    </svg>
  );
};

/* =========================================================================
   4. ANATOMICAL FIT ADJUSTMENT SYSTEM & OVERLAYS (380x320 MASCOT BUST)
   ========================================================================= */

export interface AccessoryTransform {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export type AnatomicalFitMap = Record<AccessoryCategory, AccessoryTransform>;

export const DEFAULT_ANATOMICAL_FIT: AnatomicalFitMap = {
  hat: { x: 0, y: 0, scale: 1, rotate: 0 },
  glasses: { x: 0, y: 0, scale: 1, rotate: 0 },
  mask: { x: 0, y: 0, scale: 1, rotate: 0 },
  headband: { x: 0, y: 0, scale: 1, rotate: 0 },
  outfit: { x: 0, y: 0, scale: 1, rotate: 0 },
  special: { x: 0, y: 0, scale: 1, rotate: 0 },
};

// Anatomical pivot points (in 380x320 coordinate space) for scaling & rotation
export const SLOT_PIVOTS: Record<AccessoryCategory, { cx: number; cy: number }> = {
  hat: { cx: 198, cy: 25 },
  headband: { cx: 198, cy: 28 },
  glasses: { cx: 204, cy: 47 },
  mask: { cx: 201, cy: 63 },
  outfit: { cx: 192, cy: 142 },
  special: { cx: 194, cy: 155 },
};

const ANATOMICAL_FIT_STORAGE_KEY = 'pombofit_anatomical_fit_v1';
const ANATOMICAL_FIT_EVENT = 'pombofit-anatomical-fit-changed';

export function loadAnatomicalFit(): AnatomicalFitMap {
  if (typeof window === 'undefined') return DEFAULT_ANATOMICAL_FIT;
  try {
    const raw = localStorage.getItem(ANATOMICAL_FIT_STORAGE_KEY);
    if (!raw) return DEFAULT_ANATOMICAL_FIT;
    const parsed = JSON.parse(raw);
    return {
      hat: { ...DEFAULT_ANATOMICAL_FIT.hat, ...(parsed.hat || {}) },
      glasses: { ...DEFAULT_ANATOMICAL_FIT.glasses, ...(parsed.glasses || {}) },
      mask: { ...DEFAULT_ANATOMICAL_FIT.mask, ...(parsed.mask || {}) },
      headband: { ...DEFAULT_ANATOMICAL_FIT.headband, ...(parsed.headband || {}) },
      outfit: { ...DEFAULT_ANATOMICAL_FIT.outfit, ...(parsed.outfit || {}) },
      special: { ...DEFAULT_ANATOMICAL_FIT.special, ...(parsed.special || {}) },
    };
  } catch {
    return DEFAULT_ANATOMICAL_FIT;
  }
}

export function saveAnatomicalFit(fit: AnatomicalFitMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANATOMICAL_FIT_STORAGE_KEY, JSON.stringify(fit));
    window.dispatchEvent(new CustomEvent(ANATOMICAL_FIT_EVENT, { detail: fit }));
  } catch {
    // ignore storage quota errors
  }
}

function getSlotTransformAttr(slot: AccessoryCategory, fitMap: AnatomicalFitMap): string {
  const t = fitMap[slot] || DEFAULT_ANATOMICAL_FIT[slot];
  if (!t || (t.x === 0 && t.y === 0 && t.scale === 1 && t.rotate === 0)) {
    return '';
  }
  const { cx, cy } = SLOT_PIVOTS[slot];
  return `translate(${t.x}, ${t.y}) translate(${cx}, ${cy}) rotate(${t.rotate}) scale(${t.scale}) translate(${-cx}, ${-cy})`;
}

interface MascotAnatomicalOverlaysProps {
  equippedHat?: string;
  equippedGlasses?: string;
  equippedMask?: string;
  equippedHeadband?: string;
  equippedOutfit?: string;
  equippedSpecial?: string;
  mascotForm?: 'pombo_seco' | 'pombo_grande' | 'pombo_bruto';
  customFit?: AnatomicalFitMap;
}

export const MascotAnatomicalOverlays: React.FC<MascotAnatomicalOverlaysProps> = ({
  equippedHat,
  equippedGlasses,
  equippedMask,
  equippedHeadband,
  equippedOutfit,
  equippedSpecial,
  mascotForm = 'pombo_grande',
  customFit,
}) => {
  const [storedFit, setStoredFit] = React.useState<AnatomicalFitMap>(() => loadAnatomicalFit());

  React.useEffect(() => {
    const handleFitChange = () => {
      setStoredFit(loadAnatomicalFit());
    };
    window.addEventListener(ANATOMICAL_FIT_EVENT, handleFitChange);
    window.addEventListener('storage', handleFitChange);
    return () => {
      window.removeEventListener(ANATOMICAL_FIT_EVENT, handleFitChange);
      window.removeEventListener('storage', handleFitChange);
    };
  }, []);

  const activeFit = customFit || storedFit;

  // Exact tank-top contour traced from pombo_hero_bust.png (380x320)
  const TANK_TOP_PATH =
    'M 152 86 L 174 86 C 180 104, 192 114, 202 114 C 210 114, 216 106, 218 96 L 228 96 C 234 110, 236 125, 236 140 C 232 158, 226 176, 224 195 Q 192 200, 160 195 C 158 176, 148 162, 146 152 C 158 140, 164 126, 162 110 C 160 98, 156 90, 152 86 Z';

  // Exact headband contour traced from pombo_hero_bust.png (X: 169..226, Y: 16..36)
  const HEADBAND_PATH = 'M 169 36 Q 198 24 226 36 L 225 26 Q 198 14 170 25 Z';

  return (
    <svg
      viewBox="0 0 380 320"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="overlayPurple" x1="168" y1="12" x2="230" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D71FD" />
          <stop offset="1" stopColor="#5E2EE8" />
        </linearGradient>
        <linearGradient id="overlayGold" x1="165" y1="12" x2="230" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="overlayDark" x1="160" y1="15" x2="232" y2="195" gradientUnits="userSpaceOnUse">
          <stop stopColor="#374151" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="overlayPigeonFeather" x1="170" y1="16" x2="225" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8C92A0" />
          <stop offset="0.5" stopColor="#7A808E" />
          <stop offset="1" stopColor="#646A77" />
        </linearGradient>
        <linearGradient id="overlayCyanMirror" x1="172" y1="38" x2="226" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67E8F9" />
          <stop offset="0.5" stopColor="#A855F7" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <filter id="auraGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="dropShadowHat" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* =================================================================
          0. SPECIAL AURA (Behind torso & head)
          ================================================================= */}
      {equippedSpecial === 'special_super_aura' && (
        <g transform={getSlotTransformAttr('special', activeFit)} filter="url(#auraGlow)">
          <path
            d="M 196 8 Q 230 44 262 66 Q 236 112 260 188 Q 194 162 128 188 Q 152 112 126 66 Q 158 44 196 8 Z"
            fill="#9333EA"
            opacity="0.42"
          />
          <circle cx="195" cy="112" r="76" fill="#C084FC" opacity="0.22" />
        </g>
      )}

      {/* =================================================================
          1. OUTFITS & UNIFORMS (Exact Tank Top Anatomy: Y 86..195, X 146..236)
          ================================================================= */}
      <g transform={getSlotTransformAttr('outfit', activeFit)}>
        {equippedOutfit === 'outfit_stealth_compression' && (
          <g filter="url(#dropShadowHat)">
            <path d={TANK_TOP_PATH} fill="url(#overlayDark)" stroke="#1F2937" strokeWidth="1.5" />
            {/* Collar & armhole trim */}
            <path
              d="M 174 86 C 180 104, 192 114, 202 114 C 210 114, 216 106, 218 96"
              stroke="#7650C9"
              strokeWidth="2.2"
              fill="none"
            />
            {/* Sculpted pecs & abs anatomical seams */}
            <path d="M 160 136 Q 182 146 198 138 Q 214 146 232 136" stroke="#4B5563" strokeWidth="1.8" fill="none" />
            <line x1="198" y1="138" x2="195" y2="194" stroke="#4B5563" strokeWidth="1.6" />
            <path d="M 174 156 Q 196 161 218 156" stroke="#374151" strokeWidth="1.4" fill="none" />
            <path d="M 173 174 Q 196 179 216 174" stroke="#374151" strokeWidth="1.4" fill="none" />
            {/* PomboFit Crest on Chest */}
            <circle cx="198" cy="126" r="6" fill="#7650C9" />
            <text x="198" y="129" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="900">P</text>
          </g>
        )}

        {equippedOutfit === 'outfit_hooded_tank' && (
          <g filter="url(#dropShadowHat)">
            <path d={TANK_TOP_PATH} fill="#FAF5FF" stroke="#7650C9" strokeWidth="1.6" />
            {/* Purple side panels */}
            <path
              d="M 146 152 C 158 140, 164 126, 162 110 L 168 112 C 170 132, 168 165, 166 195 L 160 195 C 158 176, 148 162, 146 152 Z"
              fill="url(#overlayPurple)"
            />
            <path
              d="M 236 140 C 232 158, 226 176, 224 195 L 216 195 C 218 168, 222 140, 226 116 L 233 118 C 235 126, 236 133, 236 140 Z"
              fill="url(#overlayPurple)"
            />
            {/* Draped hood resting around neck & traps (Y: 78..112) */}
            <path
              d="M 148 86 Q 174 74 202 82 Q 222 80 234 94 L 228 112 Q 202 122 174 112 L 148 96 Z"
              fill="url(#overlayPurple)"
              stroke="#4A1BB8"
              strokeWidth="1.5"
            />
            {/* Hood drawstrings */}
            <line x1="188" y1="112" x2="186" y2="132" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="208" y1="112" x2="210" y2="132" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Center Logo */}
            <circle cx="198" cy="140" r="9" fill="url(#overlayPurple)" />
            <text x="198" y="144" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">P</text>
          </g>
        )}

        {equippedOutfit === 'outfit_elite_white' && (
          <g filter="url(#dropShadowHat)">
            <path d={TANK_TOP_PATH} fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.8" />
            {/* Vertical center stripe */}
            <path d="M 190 113 L 204 113 L 200 197 L 186 197 Z" fill="url(#overlayPurple)" />
            {/* Gold collar trim */}
            <path
              d="M 174 86 C 180 104, 192 114, 202 114 C 210 114, 216 106, 218 96"
              stroke="url(#overlayGold)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Olympic Crest */}
            <circle cx="197" cy="142" r="8.5" fill="#0F172A" stroke="url(#overlayGold)" strokeWidth="1.5" />
            <polygon points="197,136 201,145 193,145" fill="#FEF08A" />
          </g>
        )}

        {equippedOutfit === 'outfit_royal_gold' && (
          <g filter="url(#dropShadowHat)">
            <path d={TANK_TOP_PATH} fill="#1E1638" stroke="url(#overlayGold)" strokeWidth="2.2" />
            {/* Gold shoulder straps / epaulets */}
            <path d="M 150 85 L 176 85 L 174 96 L 152 96 Z" fill="url(#overlayGold)" stroke="#B45309" strokeWidth="1" />
            <path d="M 216 94 L 231 94 L 233 104 L 218 104 Z" fill="url(#overlayGold)" stroke="#B45309" strokeWidth="1" />
            {/* Royal Gold Diamond Crest */}
            <polygon points="197,124 211,144 197,164 183,144" fill="url(#overlayGold)" stroke="#B45309" strokeWidth="1.4" />
            <text x="197" y="148" textAnchor="middle" fill="#1E1638" fontSize="10" fontWeight="900">P</text>
            {/* Gold abdominal trim lines */}
            <path d="M 172 174 Q 196 180 216 174" stroke="url(#overlayGold)" strokeWidth="1.5" fill="none" />
          </g>
        )}

        {equippedOutfit === 'outfit_cyber_suit' && (
          <g filter="url(#dropShadowHat)">
            <path d={TANK_TOP_PATH} fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
            {/* Cybernetic neon circuits following chest & abs */}
            <path d="M 158 134 Q 197 146 232 134" stroke="#A855F7" strokeWidth="2.2" fill="none" />
            <path d="M 168 158 Q 196 166 222 158" stroke="#38BDF8" strokeWidth="1.8" fill="none" />
            <path d="M 168 178 Q 196 184 220 178" stroke="#A855F7" strokeWidth="1.8" fill="none" />
            {/* Glowing Arc Reactor core on sternum */}
            <circle cx="198" cy="136" r="8" fill="#0284C7" stroke="#67E8F9" strokeWidth="2" />
            <circle cx="198" cy="136" r="4" fill="#E0F2FE" />
          </g>
        )}
      </g>

      {/* =================================================================
          2. SPECIALS (Neck Collar Y:88..96, Waistband Y:190..208, Wrists Y:192..208)
          ================================================================= */}
      <g transform={getSlotTransformAttr('special', activeFit)}>
        {equippedSpecial === 'special_titanium_chain' && (
          <g filter="url(#dropShadowHat)">
            <path
              d="M 168 88 C 174 126, 212 128, 220 95"
              stroke="url(#overlayGold)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 168 88 C 174 126, 212 128, 220 95"
              stroke="#92400E"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
          </g>
        )}

        {equippedSpecial === 'special_gold_medal' && (
          <g filter="url(#dropShadowHat)">
            {/* Neck Ribbon fitted to collar (168,88) and (220,95) */}
            <path
              d="M 168 86 L 192 132 L 202 132 L 221 94 L 214 92 L 197 125 L 176 85 Z"
              fill="url(#overlayPurple)"
              stroke="#4A1BB8"
              strokeWidth="1.2"
            />
            {/* 1st Place Gold Medal on Upper Chest (197, 140) */}
            <circle cx="197" cy="140" r="14" fill="url(#overlayGold)" stroke="#B45309" strokeWidth="2" />
            <circle cx="197" cy="140" r="10.5" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
            <text x="197" y="144" textAnchor="middle" fill="#78350F" fontSize="11" fontWeight="900">1º</text>
          </g>
        )}

        {equippedSpecial === 'special_powerlifting_belt' && (
          <g filter="url(#dropShadowHat)">
            {/* Fitted directly onto the shorts waistband (X: 158..226, Y: 190..208) */}
            <path
              d="M 158 190 Q 192 195 225 190 L 226 207 Q 192 212 157 207 Z"
              fill="#3B1C0A"
              stroke="#5B290B"
              strokeWidth="1.8"
            />
            {/* Brushed steel lever buckle at center waist (192, 199) */}
            <rect x="181" y="192" width="22" height="15" rx="3" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <rect x="186" y="196" width="12" height="7" fill="#94A3B8" rx="1" />
            {/* Heavy powerlifting stitching */}
            <path d="M 160 193 Q 192 198 223 193" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            <path d="M 160 204 Q 192 209 223 204" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" fill="none" />
          </g>
        )}

        {equippedSpecial === 'acc_wristwraps_pro' && (
          <g filter="url(#dropShadowHat)">
            {/* Left wrist wrap (anatomical wrist at X:115..135, Y:194..208) */}
            <g transform="rotate(-16 125 201)">
              <rect x="114" y="193" width="22" height="14" rx="3.5" fill="url(#overlayPurple)" stroke="#FFFFFF" strokeWidth="1.3" />
              <line x1="116" y1="200" x2="134" y2="200" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
            {/* Right wrist wrap (anatomical wrist at X:250..270, Y:191..205) */}
            <g transform="rotate(16 260 198)">
              <rect x="249" y="191" width="21" height="14" rx="3.5" fill="url(#overlayPurple)" stroke="#FFFFFF" strokeWidth="1.3" />
              <line x1="251" y1="198" x2="268" y2="198" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          </g>
        )}

        {equippedSpecial === 'acc_shaker_purple' && (
          <g filter="url(#dropShadowHat)">
            {/* 1000ml Shaker held by right hand (X: 256..282, Y: 185..232) */}
            <g transform="rotate(8 268 208)">
              <path
                d="M 256 194 L 259 232 Q 268 236 277 232 L 280 194 Z"
                fill="url(#overlayPurple)"
                stroke="#4A1BB8"
                strokeWidth="1.5"
              />
              <rect x="254" y="185" width="28" height="9" rx="2.5" fill="#1E1638" stroke="#FFFFFF" strokeWidth="1" />
              <rect x="264" y="179" width="8" height="6" rx="1.5" fill="#A382F7" />
              <text x="268" y="216" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900">1L</text>
            </g>
          </g>
        )}
      </g>

      {/* =================================================================
          3. HEADBANDS (Exact Brow Arch: X 169..226, Y 16..36)
          ================================================================= */}
      <g transform={getSlotTransformAttr('headband', activeFit)}>
        {equippedHeadband === 'none' && (
          /* Covers original purple headband with natural pigeon skull feathers when user unequips headband */
          <path d={HEADBAND_PATH} fill="url(#overlayPigeonFeather)" />
        )}

        {equippedHeadband === 'headband_stealth_black' && (
          <g filter="url(#dropShadowHat)">
            <path d={HEADBAND_PATH} fill="url(#overlayDark)" stroke="#374151" strokeWidth="1.2" />
            <path d="M 173 31 Q 198 20 223 31" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>
        )}

        {equippedHeadband === 'headband_purple_pro' && (
          <g filter="url(#dropShadowHat)">
            <path d={HEADBAND_PATH} fill="url(#overlayPurple)" stroke="#FFFFFF" strokeWidth="1.3" />
            <path d="M 173 31 Q 198 20 223 31" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.85" strokeLinecap="round" fill="none" />
            <circle cx="201" cy="25" r="4" fill="#FFFFFF" />
            <text x="201" y="27.5" textAnchor="middle" fill="#5E2EE8" fontSize="5.5" fontWeight="900">P</text>
          </g>
        )}

        {equippedHeadband === 'headband_neon_purple' && (
          <g filter="url(#auraGlow)">
            <path d={HEADBAND_PATH} fill="#7650C9" stroke="#C4B5FD" strokeWidth="1.6" />
            <path d="M 172 31 Q 198 20 224 31" stroke="#F472B6" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </g>
        )}

        {equippedHeadband === 'headband_golden_champion' && (
          <g filter="url(#dropShadowHat)">
            <path d={HEADBAND_PATH} fill="url(#overlayGold)" stroke="#B45309" strokeWidth="1.4" />
            <circle cx="201" cy="25" r="3.8" fill="#FEF08A" stroke="#B45309" strokeWidth="0.9" />
            <path d="M 189 26 Q 195 21 201 26 Q 207 21 213 26" stroke="#B45309" strokeWidth="1.1" fill="none" />
          </g>
        )}
      </g>

      {/* =================================================================
          4. MASKS (Fitted over Beak X:194..214, Y:53..70 & Cheeks X:170..223)
          ================================================================= */}
      <g transform={getSlotTransformAttr('mask', activeFit)}>
        {equippedMask === 'hospitalar' && (
          <g filter="url(#dropShadowHat)">
            {/* Ear straps to temples */}
            <path d="M 175 53 L 167 46 M 176 68 L 166 61" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" />
            {/* Contoured 3/4 mask over beak & lower face */}
            <path
              d="M 174 52 Q 192 52 205 48 Q 216 51 223 55 L 221 71 Q 205 79 176 72 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="1.4"
            />
            {/* Surgical pleats following beak contour */}
            <path d="M 176 58 Q 204 56 222 60" stroke="#E0F2FE" strokeWidth="1.2" fill="none" />
            <path d="M 176 63 Q 204 62 221 65" stroke="#E0F2FE" strokeWidth="1.2" fill="none" />
            <path d="M 177 68 Q 204 68 220 70" stroke="#E0F2FE" strokeWidth="1.2" fill="none" />
          </g>
        )}

        {equippedMask === 'mask_tactical_stealth' && (
          <g filter="url(#dropShadowHat)">
            <path d="M 174 52 L 166 46 M 175 68 L 165 62" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M 173 51 Q 192 51 205 47 Q 216 50 223 54 L 221 73 Q 204 81 175 73 Z"
              fill="url(#overlayDark)"
              stroke="#374151"
              strokeWidth="1.5"
            />
            {/* Beak ridge seam */}
            <path d="M 205 48 L 207 75" stroke="#4B5563" strokeWidth="1.2" />
            {/* PomboFit emblem on left cheek */}
            <circle cx="188" cy="63" r="4.2" fill="#5E2EE8" />
            <text x="188" y="65.5" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="900">P</text>
          </g>
        )}

        {equippedMask === 'mask_altitude_pro' && (
          <g filter="url(#dropShadowHat)">
            {/* Wide neoprene head strap */}
            <path d="M 173 53 L 165 49 L 165 62 L 174 68 Z" fill="#111827" />
            <path
              d="M 172 51 Q 192 50 205 46 Q 217 49 224 54 L 221 74 Q 204 82 174 74 Z"
              fill="#1F2937"
              stroke="#4B5563"
              strokeWidth="1.6"
            />
            {/* Left & Right O2 Flux Valves */}
            <circle cx="186" cy="63" r="5.5" fill="#111827" stroke="#9D71FD" strokeWidth="1.6" />
            <circle cx="186" cy="63" r="2" fill="#9D71FD" />
            <ellipse cx="217" cy="64" rx="3.8" ry="5" fill="#111827" stroke="#9D71FD" strokeWidth="1.4" />
            <circle cx="217" cy="64" r="1.5" fill="#9D71FD" />
            {/* Front beak intake grill */}
            <rect x="200" y="57" width="8" height="10" rx="2" fill="#374151" stroke="#9D71FD" strokeWidth="1" />
          </g>
        )}

        {equippedMask === 'batman' && (
          <g filter="url(#dropShadowHat)">
            {/* Tactical Hero Cowl fitted to 55px skull + bat ears */}
            <path
              d="M 168 44 L 165 8 L 180 23 Q 198 16 216 24 L 228 10 L 225 46 L 223 60 L 213 58 Q 206 51 196 58 L 170 60 Z"
              fill="#111827"
              stroke="#374151"
              strokeWidth="1.5"
            />
            {/* Eye cutouts aligned with Left Eye (191,46) and Right Eye (218,49) */}
            <polygon points="181,45 198,43 196,50 182,49" fill="#FFFFFF" opacity="0.92" />
            <polygon points="211,47 223,46 222,52 212,51" fill="#FFFFFF" opacity="0.92" />
          </g>
        )}

        {equippedMask === 'mask_cyber_respirator' && (
          <g filter="url(#dropShadowHat)">
            <path d="M 173 53 L 165 48 M 174 68 L 165 62" stroke="#38BDF8" strokeWidth="1.6" />
            <path
              d="M 172 51 Q 192 50 205 47 Q 217 50 224 55 L 221 74 Q 204 82 174 74 Z"
              fill="#0F172A"
              stroke="#67E8F9"
              strokeWidth="1.5"
            />
            {/* Glowing cyber respirator core over beak */}
            <rect x="193" y="56" width="18" height="12" rx="3" fill="#1E1638" stroke="#A855F7" strokeWidth="1.4" />
            <line x1="196" y1="62" x2="208" y2="62" stroke="#67E8F9" strokeWidth="1.8" strokeDasharray="2 2" />
          </g>
        )}

        {equippedMask === 'mask_oni_warrior' && (
          <g filter="url(#dropShadowHat)">
            <path d="M 173 52 L 165 47 M 174 68 L 165 62" stroke="#CA8A04" strokeWidth="1.6" />
            <path
              d="M 171 50 Q 192 49 205 46 Q 217 49 224 54 L 221 75 Q 204 83 174 75 Z"
              fill="#831843"
              stroke="url(#overlayGold)"
              strokeWidth="1.8"
            />
            {/* Samurai Oni Golden Fangs */}
            <polygon points="184,68 188,58 192,69" fill="url(#overlayGold)" stroke="#B45309" strokeWidth="0.6" />
            <polygon points="212,69 216,59 220,69" fill="url(#overlayGold)" stroke="#B45309" strokeWidth="0.6" />
          </g>
        )}
      </g>

      {/* =================================================================
          5. GLASSES (3/4 Perspective: Left Eye (191,46), Right Eye (218,49), Temple (169,43))
          ================================================================= */}
      <g transform={getSlotTransformAttr('glasses', activeFit)}>
        {equippedGlasses === 'oculos_sol' && (
          <g filter="url(#dropShadowHat)">
            {/* Left Temple Arm (Haste) */}
            <line x1="168" y1="42" x2="180" y2="43" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" />
            {/* Left Lens (Full view: X 179..201, Y 39..53) */}
            <rect
              x="179"
              y="39"
              width="22"
              height="14"
              rx="4"
              transform="rotate(3 190 46)"
              fill="url(#overlayDark)"
              stroke="#111827"
              strokeWidth="1.6"
            />
            {/* Right Lens (3/4 foreshortened: X 209..225, Y 42..55) */}
            <rect
              x="209"
              y="42"
              width="16"
              height="13"
              rx="3.5"
              transform="rotate(4 217 48)"
              fill="url(#overlayDark)"
              stroke="#111827"
              strokeWidth="1.6"
            />
            {/* Nose bridge over top of cere */}
            <path d="M 201 44 Q 205 42 209 45" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Lens shine */}
            <line x1="183" y1="42" x2="195" y2="43" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
            <line x1="212" y1="45" x2="221" y2="46" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {equippedGlasses === 'oculos_esportivo' && (
          <g filter="url(#dropShadowHat)">
            {/* Left Temple Arm */}
            <line x1="168" y1="42" x2="177" y2="42" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            {/* Contoured 3/4 Speed Visor Lens */}
            <path
              d="M 176 39 Q 204 34 226 42 L 224 54 Q 215 56 207 49 Q 203 47 199 50 Q 188 55 176 51 Z"
              fill="url(#overlayCyanMirror)"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <path d="M 181 42 Q 204 38 222 44" stroke="#FFFFFF" strokeWidth="1.3" opacity="0.85" fill="none" />
          </g>
        )}

        {equippedGlasses === 'glasses_sport_shield' && (
          <g filter="url(#dropShadowHat)">
            <line x1="168" y1="41" x2="176" y2="41" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M 175 38 Q 204 33 226 41 L 224 55 Q 214 56 206 49 Q 202 47 198 51 Q 186 55 175 51 Z"
              fill="url(#overlayPurple)"
              stroke="#1E1638"
              strokeWidth="1.5"
            />
            {/* Top brow bar */}
            <path d="M 175 38 Q 204 33 226 41 L 225 43 Q 204 36 175 40 Z" fill="#111827" />
            <line x1="182" y1="43" x2="196" y2="43" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" />
          </g>
        )}

        {equippedGlasses === 'glasses_cyber_visor' && (
          <g filter="url(#auraGlow)">
            <line x1="168" y1="42" x2="176" y2="42" stroke="#67E8F9" strokeWidth="2.2" strokeLinecap="round" />
            <path
              d="M 176 39 Q 204 34 226 42 L 224 54 Q 204 48 176 51 Z"
              fill="#5E2EE8"
              opacity="0.82"
              stroke="#67E8F9"
              strokeWidth="1.6"
            />
            {/* HUD reticles aligned with Left Pupil (191,46) and Right Pupil (218,49) */}
            <circle cx="191" cy="46" r="4" stroke="#67E8F9" strokeWidth="1.2" fill="none" />
            <circle cx="218" cy="49" r="3.2" stroke="#67E8F9" strokeWidth="1.2" fill="none" />
            <line x1="191" y1="41" x2="191" y2="51" stroke="#67E8F9" strokeWidth="0.9" />
            <line x1="218" y1="45" x2="218" y2="53" stroke="#67E8F9" strokeWidth="0.9" />
          </g>
        )}

        {equippedGlasses === 'glasses_gold_aviator' && (
          <g filter="url(#dropShadowHat)">
            <line x1="168" y1="41" x2="179" y2="41" stroke="url(#overlayGold)" strokeWidth="2" strokeLinecap="round" />
            {/* Double Gold Aviator Brow Bar */}
            <path d="M 179 40 L 224 43" stroke="url(#overlayGold)" strokeWidth="2" />
            <path d="M 199 43 L 210 44" stroke="url(#overlayGold)" strokeWidth="1.4" />
            {/* Left Teardrop Lens (190, 46) & Foreshortened Right Lens (217, 49) */}
            <ellipse cx="190" cy="46" rx="10.5" ry="7.5" fill="#D97706" opacity="0.72" stroke="url(#overlayGold)" strokeWidth="1.6" />
            <ellipse cx="217" cy="49" rx="7.5" ry="6.8" fill="#D97706" opacity="0.72" stroke="url(#overlayGold)" strokeWidth="1.6" />
          </g>
        )}
      </g>

      {/* =================================================================
          6. HATS, CAPS, BEANIES, CROWNS (Skull Width X:169..226, Top Y:17)
          ================================================================= */}
      <g transform={getSlotTransformAttr('hat', activeFit)}>
        {(equippedHat === 'hat_snapback_purple' || equippedHat === 'bone') && (
          <g filter="url(#dropShadowHat)">
            {/* Subtle shadow under visor */}
            <path d="M 170 36 Q 198 26 226 36 Q 198 40 170 36 Z" fill="#000000" opacity="0.28" />
            {/* Fitted Cap Crown hugging the 56px skull (X: 169..225, Y: 8..35) */}
            <path
              d="M 169 35 C 168 17, 180 8, 198 8 C 215 8, 226 17, 226 35 Q 198 24 169 35 Z"
              fill={equippedHat === 'bone' ? 'url(#overlayDark)' : 'url(#overlayPurple)'}
              stroke={equippedHat === 'bone' ? '#1F2937' : '#4A1BB8'}
              strokeWidth="1.5"
            />
            {/* Panel seams */}
            <path d="M 198 8 L 198 25" stroke={equippedHat === 'bone' ? '#374151' : '#4A1BB8'} strokeWidth="1" />
            <path d="M 198 8 C 185 13, 177 22, 175 33" stroke={equippedHat === 'bone' ? '#374151' : '#4A1BB8'} strokeWidth="0.9" fill="none" />
            <path d="M 198 8 C 211 13, 218 22, 220 33" stroke={equippedHat === 'bone' ? '#374151' : '#4A1BB8'} strokeWidth="0.9" fill="none" />
            {/* Top button */}
            <circle cx="198" cy="8" r="2.8" fill="#FFFFFF" />
            {/* 3/4 Perspective Visor projecting forward-right in the direction the pigeon faces */}
            <path
              d="M 169 34 Q 198 23 226 34 L 238 38 Q 206 28 175 37 Z"
              fill={equippedHat === 'bone' ? '#5E2EE8' : '#1E1638'}
              stroke="#4A1BB8"
              strokeWidth="1.3"
            />
            {/* Embroidered "P" Logo on front crown */}
            <path
              d="M 196 14 L 200 14 C 202.5 14, 204 15.5, 204 17.5 C 204 19.5, 202.5 21, 200 21 L 196 21 Z"
              fill="#FFFFFF"
            />
            <rect x="196" y="14" width="2" height="9" fill="#FFFFFF" rx="0.5" />
          </g>
        )}

        {equippedHat === 'hat_beanie_street' && (
          <g filter="url(#dropShadowHat)">
            {/* Knitted dome hugging skull (X: 170..225, Y: 7..33) */}
            <path
              d="M 170 33 C 169 15, 181 7, 198 7 C 215 7, 226 15, 225 33 Z"
              fill="url(#overlayDark)"
            />
            <path
              d="M 185 10 Q 183 21 183 32 M 198 7 Q 198 20 198 32 M 211 10 Q 213 21 213 32"
              stroke="#4B5563"
              strokeWidth="1.1"
              fill="none"
            />
            {/* Folded beanie cuff over brow (X: 168..227, Y: 24..36) */}
            <path
              d="M 168 36 Q 198 24 227 36 L 226 26 Q 198 15 169 26 Z"
              fill="url(#overlayPurple)"
              stroke="#4A1BB8"
              strokeWidth="1.5"
            />
            <circle cx="198" cy="6" r="3.5" fill="#9D71FD" />
          </g>
        )}

        {equippedHat === 'hat_visor_speed' && (
          <g filter="url(#dropShadowHat)">
            {/* Sport Visor Band matching headband curve */}
            <path
              d="M 169 35 Q 198 24 226 35 L 225 27 Q 198 16 170 26 Z"
              fill="url(#overlayPurple)"
              stroke="#FFFFFF"
              strokeWidth="1.3"
            />
            {/* Aerodynamic forward-right visor */}
            <path
              d="M 170 34 Q 198 23 226 34 L 239 38 Q 206 28 176 37 Z"
              fill="#1E1638"
              opacity="0.95"
              stroke="#9D71FD"
              strokeWidth="1.5"
            />
          </g>
        )}

        {equippedHat === 'chapeu' && (
          <g filter="url(#dropShadowHat)">
            {/* Proportional Fedora Brim (rx=35 instead of 46) */}
            <ellipse
              cx="198"
              cy="31"
              rx="35"
              ry="7.5"
              transform="rotate(2 198 31)"
              fill="#111827"
              stroke="#374151"
              strokeWidth="1.4"
            />
            {/* Fedora Crown fitted to skull */}
            <path
              d="M 173 30 C 172 15, 182 8, 198 8 C 214 8, 223 15, 222 30 Z"
              fill="#1F2937"
            />
            {/* Purple Silk Ribbon */}
            <path
              d="M 173 25 Q 198 21 222 25 L 222 30 Q 198 26 173 30 Z"
              fill="url(#overlayPurple)"
            />
          </g>
        )}

        {equippedHat === 'hat_ninja_hood' && (
          <g filter="url(#dropShadowHat)">
            {/* Fitted Ninja Balaclava wrapping skull & neck while leaving eyes & beak visible */}
            <path
              d="M 168 36 C 166 16, 180 10, 198 10 C 216 10, 227 18, 226 38 L 224 42 Q 198 28 168 36 Z"
              fill="url(#overlayDark)"
              stroke="#4A1BB8"
              strokeWidth="1.5"
            />
            <path d="M 170 33 Q 198 22 225 34" stroke="#7650C9" strokeWidth="2" fill="none" />
          </g>
        )}

        {equippedHat === 'hat_champion_crown' && (
          <g filter="url(#dropShadowHat)">
            {/* Golden Laurel Crown resting directly on the brow arch (X: 169..226) */}
            <path
              d="M 169 34 Q 198 22 226 34 L 225 27 Q 198 16 170 27 Z"
              fill="url(#overlayGold)"
              stroke="#B45309"
              strokeWidth="1.4"
            />
            {/* Golden Laurel Leaves & Spires */}
            {[173, 181, 189, 198, 207, 215, 223].map((x, i) => (
              <ellipse
                key={i}
                cx={x}
                cy={19 + Math.abs(i - 3) * 1.8}
                rx="3.6"
                ry="7"
                transform={`rotate(${(i - 3) * 12} ${x} 21)`}
                fill="url(#overlayGold)"
                stroke="#B45309"
                strokeWidth="0.9"
              />
            ))}
            <circle cx="198" cy="11" r="3.5" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
          </g>
        )}
      </g>
    </svg>
  );
};

export function getMascotFormScaleClass(
  form?: 'pombo_seco' | 'pombo_grande' | 'pombo_bruto'
): string {
  switch (form) {
    case 'pombo_seco':
      return 'scale-x-[0.94] scale-y-[1.02]';
    case 'pombo_bruto':
      return 'scale-x-[1.10] scale-y-[1.03]';
    case 'pombo_grande':
    default:
      return 'scale-x-[1.03] scale-y-[1.02]';
  }
}


