import React from 'react';
import { MascotAccessoryItem } from '../data/gamificationAndMascot';
import { Check, Sparkles, Trophy, X, Zap } from 'lucide-react';
import {
  AccessoryThumbnail,
  RarityBadge,
  RARITY_CONFIG,
} from './MascotAccessoryArt';

interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  newLevel: number;
  unlockedItems: MascotAccessoryItem[];
  onEquipNow: (item: MascotAccessoryItem) => Promise<void>;
  onClose: () => void;
}

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  isOpen,
  newLevel,
  unlockedItems,
  onEquipNow,
  onClose,
}) => {
  if (!isOpen) return null;

  const primaryItem = unlockedItems[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full border-2 border-purple-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-center relative">
        {/* Background Confetti / Sparkle Rays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(118,80,201,0.22),transparent_70%)] pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Fanfare Header */}
        <div className="pt-8 pb-3 px-6 relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-[#7650C9] text-white text-xs font-black uppercase tracking-wider shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-white text-white" />
            <span>Evolução de Consistência</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#1E1638] tracking-tight">
            SUBIU DE NÍVEL!
          </h2>
          <div className="text-sm font-extrabold text-[#7650C9]">
            Parabéns! Você alcançou o <span className="underline decoration-wavy">Nível {newLevel}</span>
          </div>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Sua disciplina nos treinos foi recompensada com novos colecionáveis para o seu Pombo!
          </p>
        </div>

        {/* Featured Unlocked Item Stage */}
        {primaryItem ? (
          <div className="px-6 py-4 relative z-10">
            <div
              className={`rounded-3xl p-5 border-2 ${
                RARITY_CONFIG[primaryItem.rarity].border
              } bg-gradient-to-b ${
                RARITY_CONFIG[primaryItem.rarity].cardBg
              } shadow-md flex flex-col items-center justify-center space-y-3 relative overflow-hidden`}
            >
              {/* Rarity & Slot */}
              <div className="w-full flex items-center justify-between">
                <RarityBadge rarity={primaryItem.rarity} size="md" />
                <span className="text-[11px] font-black text-[#7650C9] uppercase">
                  {primaryItem.categoryLabel}
                </span>
              </div>

              {/* Artwork */}
              <div className="w-28 h-28 flex items-center justify-center relative">
                <AccessoryThumbnail
                  accessoryId={primaryItem.id}
                  className="w-24 h-24 object-contain filter drop-shadow-md animate-bounce duration-1000"
                />
              </div>

              {/* Title & Lore */}
              <div>
                <h4 className="text-base font-black text-[#1E1638]">
                  {primaryItem.name}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">
                  {primaryItem.description}
                </p>
              </div>

              {/* Multiple items indicator if more than 1 item was unlocked */}
              {unlockedItems.length > 1 && (
                <div className="text-[11px] font-bold text-[#7650C9] bg-purple-100 px-3 py-1 rounded-xl">
                  + {unlockedItems.length - 1} outro(s) item(ns) adicionado(s) ao inventário!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="w-20 h-20 rounded-full bg-purple-100 text-[#7650C9] mx-auto flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Seu nível aumentou para {newLevel}! Continue treinando para desbloquear as próximas recompensas raras e lendárias!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 pt-2 space-y-2 relative z-10">
          {primaryItem && (
            <button
              type="button"
              onClick={async () => {
                await onEquipNow(primaryItem);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#7650C9] text-white text-xs font-black hover:bg-[#643FB5] shadow-lg shadow-[#7650C9]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Equipar {primaryItem.slotLabel} Agora no Pombo</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Guardar no Inventário
          </button>
        </div>
      </div>
    </div>
  );
};
