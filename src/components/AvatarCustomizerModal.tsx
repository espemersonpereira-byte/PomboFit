import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile, AccessoryCategory, MascotForm, FitnessGoal } from '../types';
import {
  Camera,
  Check,
  Lock,
  Move,
  RotateCcw,
  Sliders,
  Sparkles,
  User,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  MASCOT_ACCESSORIES,
  MascotAccessoryItem,
  calculateLevelFromXp,
  MASCOT_DATA,
  goalToMascotForm,
} from '../data/gamificationAndMascot';
import {
  AccessoryThumbnail,
  MascotAnatomicalOverlays,
  RarityBadge,
  CATEGORIES_CONFIG,
  RARITY_CONFIG,
  AnatomicalFitMap,
  DEFAULT_ANATOMICAL_FIT,
  loadAnatomicalFit,
  saveAnatomicalFit,
  getMascotFormScaleClass,
} from './MascotAccessoryArt';

/* =========================================================================
   1. AVATAR HEAD DISPLAY (FOR HEADERS, MENUS, DRAWER, CHAT)
   ========================================================================= */

export const AvatarHeadDisplay: React.FC<{
  profile: UserProfile;
  sizeClassName?: string;
}> = ({ profile, sizeClassName = 'w-10 h-10' }) => {
  const avatarType = profile.avatarType || 'pombo_custom';
  const activeMascotForm = profile.mascotForm || goalToMascotForm(profile.goal || 'gain_muscle');
  const activeMascot = MASCOT_DATA[activeMascotForm] || MASCOT_DATA.pombo_grande;

  if (avatarType === 'personal' && profile.personalPhotoUrl) {
    return (
      <div
        className={`${sizeClassName} rounded-full overflow-hidden border-2 border-[#7650C9] bg-white shadow-xs shrink-0`}
      >
        <img
          src={profile.personalPhotoUrl}
          alt={profile.displayName || 'Usuário'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Interactive 3D Mascot Head with live equipped skins & accessories
  return (
    <div
      className={`${sizeClassName} rounded-full overflow-hidden border-2 border-[#7650C9] bg-gradient-to-b from-[#F5F1FF] to-white relative shadow-xs shrink-0 flex items-center justify-center select-none`}
    >
      <div className="absolute inset-0 w-[240%] h-[240%] -top-[12%] -left-[70%] pointer-events-none">
        <img
          src="/assets/mascots/pombo_hero_bust.png"
          alt={activeMascot.name}
          className="w-full h-full object-contain"
        />
        <MascotAnatomicalOverlays
          equippedHat={profile.equippedHat}
          equippedGlasses={profile.equippedGlasses}
          equippedMask={profile.equippedMask}
          equippedHeadband={profile.equippedHeadband || 'headband_classic'}
          equippedOutfit={profile.equippedOutfit || 'outfit_classic'}
          equippedSpecial={profile.equippedSpecial}
          mascotForm={activeMascotForm}
        />
      </div>
    </div>
  );
};

/* =========================================================================
   2. AVATAR CUSTOMIZER MODAL (PROVADOR DO POMBO)
   ========================================================================= */

interface AvatarCustomizerModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (updates: Partial<UserProfile>) => Promise<void>;
  initialCategory?: AccessoryCategory;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSaveAvatar,
  initialCategory = 'outfit',
}) => {
  const [activeMode, setActiveMode] = useState<'pombo_custom' | 'pombo_head' | 'personal'>(
    profile.avatarType === 'personal' ? 'personal' : 'pombo_custom'
  );
  const [activeCategory, setActiveCategory] = useState<AccessoryCategory>(initialCategory);
  const [selectedMascotForm, setSelectedMascotForm] = useState<MascotForm>(
    profile.mascotForm || goalToMascotForm(profile.goal || 'gain_muscle')
  );
  const [personalPhoto, setPersonalPhoto] = useState<string>(
    profile.personalPhotoUrl || profile.photoURL || ''
  );

  // Equipped state in live customizer
  const [equippedHat, setEquippedHat] = useState<string>(profile.equippedHat || 'none');
  const [equippedGlasses, setEquippedGlasses] = useState<string>(profile.equippedGlasses || 'none');
  const [equippedMask, setEquippedMask] = useState<string>(profile.equippedMask || 'none');
  const [equippedHeadband, setEquippedHeadband] = useState<string>(
    profile.equippedHeadband || 'headband_classic'
  );
  const [equippedOutfit, setEquippedOutfit] = useState<string>(
    profile.equippedOutfit || 'outfit_classic'
  );
  const [equippedSpecial, setEquippedSpecial] = useState<string>(
    profile.equippedSpecial || 'none'
  );
  const [saving, setSaving] = useState(false);

  // Sync live customizer state whenever modal opens or user profile changes
  useEffect(() => {
    if (isOpen) {
      setActiveMode(profile.avatarType === 'personal' ? 'personal' : 'pombo_custom');
      setSelectedMascotForm(
        profile.mascotForm || goalToMascotForm(profile.goal || 'gain_muscle')
      );
      setEquippedHat(profile.equippedHat || 'none');
      setEquippedGlasses(profile.equippedGlasses || 'none');
      setEquippedMask(profile.equippedMask || 'none');
      setEquippedHeadband(profile.equippedHeadband || 'headband_classic');
      setEquippedOutfit(profile.equippedOutfit || 'outfit_classic');
      setEquippedSpecial(profile.equippedSpecial || 'none');
      setPersonalPhoto(profile.personalPhotoUrl || profile.photoURL || '');
      if (initialCategory) {
        setActiveCategory(initialCategory);
      }
    }
  }, [isOpen, profile, initialCategory]);

  // Anatomical Fine-Tuning State (per category)
  const [anatomicalFit, setAnatomicalFit] = useState<AnatomicalFitMap>(() => loadAnatomicalFit());
  const [showFitControls, setShowFitControls] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialSlotX: number;
    initialSlotY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialSlotX: 0,
    initialSlotY: 0,
  });

  const updateSlotFit = (
    slot: AccessoryCategory,
    patch: Partial<{ x: number; y: number; scale: number; rotate: number }>
  ) => {
    setAnatomicalFit((prev) => {
      const current = prev[slot] || DEFAULT_ANATOMICAL_FIT[slot];
      const updatedSlot = {
        x: Math.max(-45, Math.min(45, Math.round((patch.x ?? current.x) * 2) / 2)),
        y: Math.max(-45, Math.min(45, Math.round((patch.y ?? current.y) * 2) / 2)),
        scale: Math.max(0.55, Math.min(1.6, Number((patch.scale ?? current.scale).toFixed(2)))),
        rotate: Math.max(-35, Math.min(35, Math.round(patch.rotate ?? current.rotate))),
      };
      const next = { ...prev, [slot]: updatedSlot };
      saveAnatomicalFit(next);
      return next;
    });
  };

  const resetSlotFit = (slot: AccessoryCategory) => {
    setAnatomicalFit((prev) => {
      const next = { ...prev, [slot]: { ...DEFAULT_ANATOMICAL_FIT[slot] } };
      saveAnatomicalFit(next);
      return next;
    });
  };

  const resetAllFits = () => {
    setAnatomicalFit(DEFAULT_ANATOMICAL_FIT);
    saveAnatomicalFit(DEFAULT_ANATOMICAL_FIT);
  };

  // Drag on Mascot Stage to reposition active category accessory
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const currentSlot = anatomicalFit[activeCategory] || DEFAULT_ANATOMICAL_FIT[activeCategory];
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialSlotX: currentSlot.x,
      initialSlotY: currentSlot.y,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const scaleX = 380 / Math.max(rect.width, 1);
    const scaleY = 320 / Math.max(rect.height, 1);
    const dx = (e.clientX - dragStateRef.current.startX) * scaleX;
    const dy = (e.clientY - dragStateRef.current.startY) * scaleY;
    updateSlotFit(activeCategory, {
      x: dragStateRef.current.initialSlotX + dx,
      y: dragStateRef.current.initialSlotY + dy,
    });
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.isDragging) {
      dragStateRef.current.isDragging = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // User progression info
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

  if (!isOpen) return null;

  // Check if an accessory is unlocked for the user
  const isItemUnlocked = (item: MascotAccessoryItem) => {
    if (unlockedAcc.has(item.id)) return true;
    if (userLevel >= item.requiredLevel) return true;
    if (item.requiredAchievementId && unlockedAch.includes(item.requiredAchievementId)) return true;
    return false;
  };

  // Check if item is currently equipped
  const isItemEquipped = (item: MascotAccessoryItem) => {
    switch (item.category) {
      case 'hat':
        return equippedHat === item.id;
      case 'glasses':
        return equippedGlasses === item.id;
      case 'mask':
        return equippedMask === item.id;
      case 'headband':
        return equippedHeadband === item.id;
      case 'outfit':
        return equippedOutfit === item.id;
      case 'special':
        return equippedSpecial === item.id;
      default:
        return false;
    }
  };

  // Toggle or Equip item in real time (all items interactive in the Provador)
  const handleToggleItem = (item: MascotAccessoryItem) => {
    setActiveMode('pombo_custom');

    switch (item.category) {
      case 'hat':
        setEquippedHat((prev) => (prev === item.id ? 'none' : item.id));
        break;
      case 'glasses':
        setEquippedGlasses((prev) => (prev === item.id ? 'none' : item.id));
        break;
      case 'mask':
        setEquippedMask((prev) => (prev === item.id ? 'none' : item.id));
        break;
      case 'headband':
        setEquippedHeadband((prev) => (prev === item.id ? 'none' : item.id));
        break;
      case 'outfit':
        setEquippedOutfit((prev) => (prev === item.id ? 'outfit_classic' : item.id));
        break;
      case 'special':
        setEquippedSpecial((prev) => (prev === item.id ? 'none' : item.id));
        break;
    }
  };

  // Remove accessory from active category
  const handleRemoveCategoryItem = (category: AccessoryCategory) => {
    switch (category) {
      case 'hat':
        setEquippedHat('none');
        break;
      case 'glasses':
        setEquippedGlasses('none');
        break;
      case 'mask':
        setEquippedMask('none');
        break;
      case 'headband':
        setEquippedHeadband('none');
        break;
      case 'outfit':
        setEquippedOutfit('outfit_classic');
        break;
      case 'special':
        setEquippedSpecial('none');
        break;
    }
  };

  // Reset to default official Pombo
  const handleResetToDefault = () => {
    setEquippedHat('none');
    setEquippedGlasses('none');
    setEquippedMask('none');
    setEquippedHeadband('headband_classic');
    setEquippedOutfit('outfit_classic');
    setEquippedSpecial('none');
    resetAllFits();
  };

  // Handle local photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 400);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
        setPersonalPhoto(canvas.toDataURL('image/jpeg', 0.85));
        setActiveMode('personal');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Save changes to profile
  const handleSave = async () => {
    setSaving(true);
    try {
      saveAnatomicalFit(anatomicalFit);
      const formToGoal: Record<MascotForm, FitnessGoal> = {
        pombo_seco: 'lose_weight',
        pombo_grande: 'gain_muscle',
        pombo_bruto: 'get_strong',
      };
      await onSaveAvatar({
        avatarType: activeMode === 'personal' ? 'personal' : 'pombo_custom',
        personalPhotoUrl: personalPhoto,
        mascotForm: selectedMascotForm,
        goal: formToGoal[selectedMascotForm] || profile.goal,
        equippedHat: equippedHat,
        equippedGlasses: equippedGlasses,
        equippedMask: equippedMask,
        equippedHeadband: equippedHeadband,
        equippedOutfit: equippedOutfit,
        equippedSpecial: equippedSpecial,
      });
    } catch (err) {
      console.warn('Avatar save fallback applied:', err);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  // Items for the selected category
  const categoryItems = MASCOT_ACCESSORIES.filter(
    (item) => item.category === activeCategory
  );

  const activeCategoryLabel =
    CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.shortLabel || 'Acessório';
  const currentSlotFit = anatomicalFit[activeCategory] || DEFAULT_ANATOMICAL_FIT[activeCategory];

  const equippedCount = [
    equippedHat !== 'none',
    equippedGlasses !== 'none',
    equippedMask !== 'none',
    equippedHeadband !== 'none' && equippedHeadband !== 'headband_classic',
    equippedOutfit !== 'none' && equippedOutfit !== 'outfit_classic',
    equippedSpecial !== 'none',
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-purple-100 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7650C9] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1E1638]">
                Provador do PomboFit
              </h3>
              <p className="text-xs text-slate-500">
                Troque a forma física, skins de roupa e acessórios em tempo real.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-3.5 pb-1 shrink-0 bg-white border-b border-slate-100">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveMode('pombo_custom')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'pombo_custom'
                  ? 'bg-white text-[#7650C9] shadow-xs'
                  : 'text-slate-600 hover:text-[#1E1638]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Provador 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('pombo_head')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'pombo_head'
                  ? 'bg-white text-[#7650C9] shadow-xs'
                  : 'text-slate-600 hover:text-[#1E1638]'
              }`}
            >
              <span>Formas do Pombo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('personal')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'personal'
                  ? 'bg-white text-[#7650C9] shadow-xs'
                  : 'text-slate-600 hover:text-[#1E1638]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto Pessoal</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* TAB 1: PROVADOR DO POMBO (LIVE 3D MASCOT WITH REAL-TIME SKINS & ACCESSORIES) */}
          {activeMode === 'pombo_custom' && (
            <div className="space-y-4">
              {/* Big Centered Mascot Spotlight Arena */}
              <div className="relative rounded-3xl bg-gradient-to-b from-[#F5F1FF] via-[#FAF8FF] to-white border-2 border-[#E4D9FF] p-4 flex flex-col items-center justify-center overflow-hidden shadow-xs">
                {/* Background Pedestal & Glow Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(118,80,201,0.18),transparent_70%)] pointer-events-none" />

                {/* Level & Status Badges */}
                <div className="w-full flex items-center justify-between z-10 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#7650C9] text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs">
                      Nível {userLevel}
                    </span>
                    <span className="text-[11px] font-bold text-[#7650C9] bg-purple-100/90 px-2.5 py-1 rounded-xl">
                      {MASCOT_DATA[selectedMascotForm]?.name || 'Pombo Grande'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFitControls((prev) => !prev)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                        showFitControls
                          ? 'bg-[#7650C9] text-white border-[#7650C9]'
                          : 'bg-white text-[#7650C9] border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Ajuste Anatômico</span>
                    </button>

                    {equippedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="text-[11px] font-bold text-slate-500 hover:text-[#7650C9] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Restaurar padrão"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Limpar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* The Interactive 3D Mascot Stage (Drag to fine-tune active accessory position) */}
                <div
                  ref={stageRef}
                  onPointerDown={handleStagePointerDown}
                  onPointerMove={handleStagePointerMove}
                  onPointerUp={handleStagePointerUp}
                  onPointerCancel={handleStagePointerUp}
                  className="w-full max-w-[280px] sm:max-w-[320px] aspect-[380/320] relative flex items-center justify-center my-1 select-none cursor-grab active:cursor-grabbing touch-none"
                  title={`Arraste para ajustar a posição de ${activeCategoryLabel}`}
                >
                  <div
                    className={`w-full h-full relative flex items-center justify-center transition-transform duration-300 ${getMascotFormScaleClass(
                      selectedMascotForm
                    )}`}
                  >
                    {/* Interactive 3D Pigeon Mannequin Base (100% compatible with SVG skins & accessories) */}
                    <img
                      src="/assets/mascots/pombo_hero_bust.png"
                      alt={MASCOT_DATA[selectedMascotForm]?.name || 'PomboFit'}
                      className="w-full h-full object-contain filter drop-shadow-md pointer-events-none"
                    />

                    {/* Real-time Anatomical Skins & Accessories Overlay */}
                    <MascotAnatomicalOverlays
                      equippedHat={equippedHat}
                      equippedGlasses={equippedGlasses}
                      equippedMask={equippedMask}
                      equippedHeadband={equippedHeadband}
                      equippedOutfit={equippedOutfit}
                      equippedSpecial={equippedSpecial}
                      mascotForm={selectedMascotForm}
                      customFit={anatomicalFit}
                    />
                  </div>
                </div>

                {/* Drag Hint Pill */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7650C9] bg-purple-100/80 px-2.5 py-1 rounded-full z-10">
                  <Move className="w-3 h-3" />
                  <span>
                    Dica: Clique nas skins abaixo ou arraste sobre o Pombo para ajustar{' '}
                    <strong>{activeCategoryLabel}</strong>
                  </span>
                </div>

                {/* Interactive Anatomical Adjustment Panel */}
                {showFitControls && (
                  <div className="w-full mt-3 pt-3 border-t border-purple-200/70 z-10 bg-white/90 rounded-2xl p-3 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#7650C9]" />
                        <span className="text-[11px] font-black text-[#1E1638] uppercase tracking-wider">
                          Encaixe Anatômico: {activeCategoryLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => resetSlotFit(activeCategory)}
                        className="text-[10px] font-bold text-[#7650C9] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Centralizar {activeCategoryLabel}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Scale / Size */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <ZoomIn className="w-3 h-3 text-[#7650C9]" />
                            Tamanho
                          </span>
                          <span className="text-[#7650C9] font-black">
                            {Math.round(currentSlotFit.scale * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.65"
                          max="1.45"
                          step="0.02"
                          value={currentSlotFit.scale}
                          onChange={(e) =>
                            updateSlotFit(activeCategory, { scale: parseFloat(e.target.value) })
                          }
                          className="w-full accent-[#7650C9] cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Vertical Y */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Altura (Y)</span>
                          <span className="text-[#7650C9] font-black">
                            {currentSlotFit.y > 0 ? `+${currentSlotFit.y}` : currentSlotFit.y}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-35"
                          max="35"
                          step="0.5"
                          value={currentSlotFit.y}
                          onChange={(e) =>
                            updateSlotFit(activeCategory, { y: parseFloat(e.target.value) })
                          }
                          className="w-full accent-[#7650C9] cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Horizontal X */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Posição (X)</span>
                          <span className="text-[#7650C9] font-black">
                            {currentSlotFit.x > 0 ? `+${currentSlotFit.x}` : currentSlotFit.x}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-35"
                          max="35"
                          step="0.5"
                          value={currentSlotFit.x}
                          onChange={(e) =>
                            updateSlotFit(activeCategory, { x: parseFloat(e.target.value) })
                          }
                          className="w-full accent-[#7650C9] cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Rotation */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>Inclinação</span>
                          <span className="text-[#7650C9] font-black">
                            {currentSlotFit.rotate > 0
                              ? `+${currentSlotFit.rotate}°`
                              : `${currentSlotFit.rotate}°`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-25"
                          max="25"
                          step="1"
                          value={currentSlotFit.rotate}
                          onChange={(e) =>
                            updateSlotFit(activeCategory, { rotate: parseInt(e.target.value, 10) })
                          }
                          className="w-full accent-[#7650C9] cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Loadout Pills */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 z-10 max-w-md">
                  {equippedHeadband !== 'none' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-[#7650C9]">
                      Faixa: {MASCOT_ACCESSORIES.find((a) => a.id === equippedHeadband)?.name.slice(0, 16) || 'Ativa'}
                    </span>
                  )}
                  {equippedHat !== 'none' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-[#7650C9]">
                      Chapéu: {MASCOT_ACCESSORIES.find((a) => a.id === equippedHat)?.name.slice(0, 16)}
                    </span>
                  )}
                  {equippedGlasses !== 'none' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-[#7650C9]">
                      Óculos: {MASCOT_ACCESSORIES.find((a) => a.id === equippedGlasses)?.name.slice(0, 16)}
                    </span>
                  )}
                  {equippedMask !== 'none' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-[#7650C9]">
                      Máscara: {MASCOT_ACCESSORIES.find((a) => a.id === equippedMask)?.name.slice(0, 16)}
                    </span>
                  )}
                  {equippedOutfit !== 'none' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-[#7650C9]">
                      Skin/Roupa: {MASCOT_ACCESSORIES.find((a) => a.id === equippedOutfit)?.name.slice(0, 18) || 'Regata Oficial'}
                    </span>
                  )}
                  {equippedSpecial !== 'none' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-[#7650C9]">
                      Especial: {MASCOT_ACCESSORIES.find((a) => a.id === equippedSpecial)?.name.slice(0, 16)}
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Pigeon Form / Physique Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-[#1E1638] uppercase tracking-wider block">
                  1. Forma Física do Pombo:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['pombo_seco', 'pombo_grande', 'pombo_bruto'] as MascotForm[]).map((formId) => {
                    const m = MASCOT_DATA[formId];
                    const isSelected = selectedMascotForm === formId;
                    return (
                      <button
                        key={formId}
                        type="button"
                        onClick={() => setSelectedMascotForm(formId)}
                        className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-[#7650C9] bg-purple-50/90 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-purple-200'
                        }`}
                      >
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 bg-white border border-slate-100"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-[#1E1638] block truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {m.goalLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Selector Bar (6 Visual Categories) */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-[#1E1638] uppercase tracking-wider block">
                  2. Escolha a Categoria de Skins e Acessórios:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORIES_CONFIG.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-[#7650C9] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-200 hover:bg-purple-50/50'
                        }`}
                      >
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Accessories Gallery for the Active Category */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Tile 0: "Nenhum / Desequipar" */}
                <button
                  type="button"
                  onClick={() => handleRemoveCategoryItem(activeCategory)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    (activeCategory === 'hat' && equippedHat === 'none') ||
                    (activeCategory === 'glasses' && equippedGlasses === 'none') ||
                    (activeCategory === 'mask' && equippedMask === 'none') ||
                    (activeCategory === 'headband' && equippedHeadband === 'none') ||
                    (activeCategory === 'outfit' && equippedOutfit === 'outfit_classic') ||
                    (activeCategory === 'special' && equippedSpecial === 'none')
                      ? 'border-[#7650C9] bg-purple-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-extrabold text-slate-700 block">
                      {activeCategory === 'outfit' ? 'Regata Padrão' : 'Nenhum'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeCategory === 'outfit' ? 'Skin Original' : 'Desequipar'}
                    </span>
                  </div>
                </button>

                {/* Items in Category */}
                {categoryItems.map((item) => {
                  const unlocked = isItemUnlocked(item);
                  const equipped = isItemEquipped(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleItem(item)}
                      className={`relative p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 overflow-hidden ${
                        equipped
                          ? 'border-[#7650C9] bg-purple-50/80 shadow-md ring-2 ring-[#7650C9]/30'
                          : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="w-full flex items-center justify-between gap-1">
                        <RarityBadge rarity={item.rarity} size="sm" />
                        {equipped ? (
                          <span className="text-[10px] font-black bg-[#7650C9] text-white px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            Equipado
                          </span>
                        ) : !unlocked ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#7650C9]" />
                            Nív. {item.requiredLevel}
                          </span>
                        ) : null}
                      </div>

                      {/* Thumbnail Artwork */}
                      <div className="w-full flex items-center justify-center py-1">
                        <AccessoryThumbnail
                          accessoryId={item.id}
                          className="w-14 h-14 object-contain filter drop-shadow-xs"
                        />
                      </div>

                      {/* Name & Short Hint */}
                      <div className="w-full">
                        <span className="text-xs font-black text-[#1E1638] block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {item.slotLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FORMAS OFICIAIS DO POMBO */}
          {activeMode === 'pombo_head' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-purple-50/70 to-white border border-purple-100 rounded-3xl text-center space-y-3">
                <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-[#7650C9] shadow-lg bg-white p-2">
                  <img
                    src={(MASCOT_DATA[selectedMascotForm] || MASCOT_DATA.pombo_grande).imageUrl}
                    alt="Pombo Oficial"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/mascots/pombo_hero_bust.png';
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#1E1638]">
                    {(MASCOT_DATA[selectedMascotForm] || MASCOT_DATA.pombo_grande).name}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mt-1">
                    {(MASCOT_DATA[selectedMascotForm] || MASCOT_DATA.pombo_grande).description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['pombo_seco', 'pombo_grande', 'pombo_bruto'] as MascotForm[]).map((formId) => {
                  const m = MASCOT_DATA[formId];
                  const isSelected = selectedMascotForm === formId;
                  return (
                    <button
                      key={formId}
                      type="button"
                      onClick={() => setSelectedMascotForm(formId)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-[#7650C9] bg-purple-50/90 shadow-md ring-2 ring-[#7650C9]/30'
                          : 'border-slate-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="w-20 h-20 rounded-xl object-contain bg-white p-1 border border-slate-100"
                      />
                      <div className="text-center">
                        <span className="text-xs font-black text-[#1E1638] block">{m.name}</span>
                        <span className="text-[10px] font-bold text-[#7650C9] block mt-0.5">
                          {m.goalLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FOTO PESSOAL */}
          {activeMode === 'personal' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 bg-[#FAF9FC] border border-slate-200 rounded-3xl text-center space-y-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#7650C9] shadow-lg bg-white flex items-center justify-center">
                  {personalPhoto ? (
                    <img
                      src={personalPhoto}
                      alt={profile.displayName || 'Sua Foto'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>

                <div className="space-y-2 w-full max-w-sm">
                  <label className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-[#7650C9] bg-white text-[#7650C9] font-black text-xs cursor-pointer hover:bg-purple-50 transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>Escolher Foto da Galeria</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    A imagem será ajustada circularmente para o seu perfil e cabeçalhos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-[#7650C9] text-white text-xs font-black hover:bg-[#643FB5] shadow-md shadow-[#7650C9]/25 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Aplicar no Pombo'}
          </button>
        </div>
      </div>
    </div>
  );
};
