import React, { useState, useMemo } from 'react';
import { UserProfile, AccessoryCategory, AccessoryRarity } from '../types';
import {
  Check,
  Crown,
  Eye,
  Lock,
  Shirt,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  MASCOT_ACCESSORIES,
  MascotAccessoryItem,
  calculateLevelFromXp,
} from '../data/gamificationAndMascot';
import {
  AccessoryThumbnail,
  RarityBadge,
  RARITY_CONFIG,
  CATEGORIES_CONFIG,
} from './MascotAccessoryArt';

interface RewardsGalleryProps {
  profile: UserProfile;
  onUpdateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  onOpenCustomizer?: (category?: AccessoryCategory) => void;
}

export const RewardsGallery: React.FC<RewardsGalleryProps> = ({
  profile,
  onUpdateProfile,
  onOpenCustomizer,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'unlocked' | 'available' | 'locked'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<AccessoryCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<MascotAccessoryItem | null>(null);
  const [equipping, setEquipping] = useState(false);

  const userLevel = profile.level || calculateLevelFromXp(profile.xp || 100).level;
  const unlockedAch = profile.unlockedAchievementIds || [];
  const unlockedAcc = useMemo(() => {
    return new Set<string>(
      profile.unlockedAccessories || [
        'headband_classic',
        'outfit_classic',
        'outfit_hooded_tank',
        'outfit_stealth_compression',
        'hat_snapback_purple',
        'bone',
        'oculos_sol',
        'hospitalar',
        'headband_stealth_black',
        'shoes_classic',
        'pose_determined',
      ]
    );
  }, [profile.unlockedAccessories]);

  // Check if item is unlocked
  const isItemUnlocked = (item: MascotAccessoryItem) => {
    if (unlockedAcc.has(item.id)) return true;
    if (userLevel >= item.requiredLevel) return true;
    if (item.requiredAchievementId && unlockedAch.includes(item.requiredAchievementId)) return true;
    return false;
  };

  // Check if item is equipped
  const isItemEquipped = (item: MascotAccessoryItem) => {
    switch (item.category) {
      case 'hat':
        return profile.equippedHat === item.id;
      case 'glasses':
        return profile.equippedGlasses === item.id;
      case 'mask':
        return profile.equippedMask === item.id;
      case 'headband':
        return profile.equippedHeadband === item.id;
      case 'outfit':
        return profile.equippedOutfit === item.id;
      case 'special':
        return (
          profile.equippedSpecial === item.id ||
          profile.equippedShoes === item.id ||
          profile.equippedPose === item.id
        );
      default:
        return false;
    }
  };

  // Direct Equip / Unequip from detail or gallery
  const handleToggleEquip = async (item: MascotAccessoryItem) => {
    if (!isItemUnlocked(item)) return;
    setEquipping(true);

    try {
      const equipped = isItemEquipped(item);
      const updates: Partial<UserProfile> = {
        avatarType: 'pombo_custom',
      };

      switch (item.category) {
        case 'hat':
          updates.equippedHat = equipped ? 'none' : item.id;
          break;
        case 'glasses':
          updates.equippedGlasses = equipped ? 'none' : item.id;
          break;
        case 'mask':
          updates.equippedMask = equipped ? 'none' : item.id;
          break;
        case 'headband':
          updates.equippedHeadband = equipped ? 'none' : item.id;
          break;
        case 'outfit':
          updates.equippedOutfit = equipped ? 'outfit_classic' : item.id;
          break;
        case 'special':
          updates.equippedSpecial = equipped ? 'none' : item.id;
          if (item.slot === 'shoes') updates.equippedShoes = equipped ? 'shoes_classic' : item.id;
          if (item.slot === 'pose') updates.equippedPose = equipped ? 'pose_determined' : item.id;
          break;
      }

      await onUpdateProfile(updates);
    } finally {
      setEquipping(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return MASCOT_ACCESSORIES.filter((item) => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      const unlocked = isItemUnlocked(item);
      const equipped = isItemEquipped(item);

      // Status filter
      if (statusFilter === 'unlocked' && !unlocked) return false;
      if (statusFilter === 'locked' && unlocked) return false;
      if (statusFilter === 'available' && (!unlocked || equipped)) return false;

      return true;
    });
  }, [categoryFilter, statusFilter, unlockedAcc, userLevel, unlockedAch, profile]);

  const totalUnlocked = useMemo(() => {
    return MASCOT_ACCESSORIES.filter(isItemUnlocked).length;
  }, [unlockedAcc, userLevel, unlockedAch]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 lg:p-7 space-y-5">
      {/* Header with Title, Stats & Quick Fitting Room Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-[#1E1638]">
              Galeria de Recompensas e Colecionáveis
            </h3>
            <span className="text-xs font-black bg-purple-100 text-[#7650C9] px-2.5 py-0.5 rounded-full">
              {totalUnlocked} / {MASCOT_ACCESSORIES.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acessórios, armaduras e itens especiais desbloqueados pela sua consistência real de treinos.
          </p>
        </div>

        {onOpenCustomizer && (
          <button
            type="button"
            onClick={() => onOpenCustomizer()}
            className="px-4 py-2.5 rounded-2xl bg-[#7650C9] text-white text-xs font-black hover:bg-[#643FB5] shadow-sm shadow-[#7650C9]/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Abrir Provador do Pombo</span>
          </button>
        )}
      </div>

      {/* Filter Tabs by Status (Todos, Conquistados, Disponíveis, Bloqueados) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 bg-[#FAF9FC] p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'unlocked', label: 'Conquistados' },
              { id: 'available', label: 'Disponíveis' },
              { id: 'locked', label: 'Bloqueados' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#7650C9] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#1E1638]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#7650C9] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Modern 2-to-3 Column Collectibles Inventory Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#7650C9]" />
          <p className="text-xs font-bold">Nenhum item encontrado neste filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {filteredItems.map((item) => {
            const unlocked = isItemUnlocked(item);
            const equipped = isItemEquipped(item);
            const rarity = RARITY_CONFIG[item.rarity];

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden select-none ${
                  equipped
                    ? 'border-[#7650C9] bg-gradient-to-b from-purple-50/70 to-white shadow-xs ring-2 ring-[#7650C9]/20'
                    : unlocked
                    ? `border-slate-200 bg-gradient-to-b ${rarity.cardBg} hover:border-[#7650C9]/50 hover:shadow-xs`
                    : 'border-slate-200 bg-slate-50/80 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Top Badge: Rarity & Equipped/Locked Indicator */}
                <div className="w-full flex items-center justify-between gap-1 mb-1">
                  <RarityBadge rarity={item.rarity} size="sm" />

                  {equipped ? (
                    <span className="text-[9px] font-black bg-[#7650C9] text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                      <Check className="w-2.5 h-2.5" />
                      Equipado
                    </span>
                  ) : !unlocked ? (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200/90 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      Nív. {item.requiredLevel}
                    </span>
                  ) : null}
                </div>

                {/* Center Visual Art Artwork */}
                <div className="w-full h-20 sm:h-24 flex items-center justify-center relative my-1">
                  <AccessoryThumbnail
                    accessoryId={item.id}
                    className={`w-16 h-16 sm:w-20 sm:h-20 object-contain filter transition-transform group-hover:scale-105 ${
                      !unlocked ? 'grayscale opacity-50' : 'drop-shadow-xs'
                    }`}
                  />
                </div>

                {/* Item Compact Info */}
                <div className="w-full pt-1 border-t border-slate-100/80">
                  <span className="text-xs font-black text-[#1E1638] block truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>{item.categoryLabel}</span>
                    {unlocked ? (
                      <span className="text-[#7650C9] font-bold">Ver</span>
                    ) : (
                      <span className="text-slate-400 font-medium">Bloqueado</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE DETALHES DA RECOMPENSA */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-purple-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="relative p-5 pb-2 flex items-center justify-between">
              <RarityBadge rarity={selectedItem.rarity} size="md" />
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enlarged Artwork Stage */}
            <div className="px-6 py-4 flex flex-col items-center justify-center relative">
              <div
                className={`w-32 h-32 rounded-3xl bg-gradient-to-b ${
                  RARITY_CONFIG[selectedItem.rarity].cardBg
                } border-2 ${
                  RARITY_CONFIG[selectedItem.rarity].border
                } p-4 flex items-center justify-center relative shadow-sm`}
              >
                <AccessoryThumbnail
                  accessoryId={selectedItem.id}
                  className="w-24 h-24 object-contain filter drop-shadow-md"
                />
              </div>

              {/* Title & Category */}
              <h4 className="text-base font-black text-[#1E1638] text-center mt-3">
                {selectedItem.name}
              </h4>
              <span className="text-xs font-bold text-[#7650C9] mt-0.5">
                {selectedItem.categoryLabel} · {selectedItem.slotLabel}
              </span>
            </div>

            {/* Description & Requirement */}
            <div className="px-5 py-3 space-y-2.5 bg-slate-50/80 border-y border-slate-100 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {selectedItem.description}
              </p>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2">
                <Trophy className="w-4 h-4 text-[#7650C9] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[11px] font-black text-[#1E1638]">
                    Requisito de Desbloqueio:
                  </strong>
                  <span className="text-[11px] text-slate-600">
                    {selectedItem.unlockHint}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white flex flex-col gap-2">
              {isItemUnlocked(selectedItem) ? (
                <>
                  <button
                    type="button"
                    disabled={equipping}
                    onClick={async () => {
                      await handleToggleEquip(selectedItem);
                      setSelectedItem(null);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      isItemEquipped(selectedItem)
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#7650C9] text-white hover:bg-[#643FB5] shadow-md shadow-[#7650C9]/25'
                    }`}
                  >
                    {isItemEquipped(selectedItem) ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>Desequipar do Pombo</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Equipar no Pombo</span>
                      </>
                    )}
                  </button>

                  {onOpenCustomizer && (
                    <button
                      type="button"
                      onClick={() => {
                        const cat = selectedItem.category;
                        setSelectedItem(null);
                        onOpenCustomizer(cat);
                      }}
                      className="w-full py-2.5 rounded-xl border border-purple-200 text-[#7650C9] text-xs font-bold hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver no Provador com Outros Itens</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 text-center">
                  <Lock className="w-4 h-4" />
                  <span>Bloqueado · Alcance o Nível {selectedItem.requiredLevel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
