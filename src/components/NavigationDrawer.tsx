import React from 'react';
import { UserProfile, MainTab } from '../types';
import { MASCOT_DATA, goalToMascotForm } from '../data/gamificationAndMascot';
import { AvatarHeadDisplay } from './AvatarCustomizerModal';
import {
  User,
  Settings,
  Calendar,
  Bell,
  Dumbbell,
  Clock,
  LogOut,
  X,
  Crown,
  Camera,
  Sparkles,
  Utensils,
  Ruler,
  HeartPulse,
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  userEmail?: string | null;
  onNavigateTab: (tab: MainTab, subtab?: string) => void;
  onOpenAvatarModal: () => void;
  onOpenFlexibleRoutine: () => void;
  onOpenScanner?: () => void;
  onOpenPomboAI?: () => void;
  onLogout: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onNavigateTab,
  onOpenAvatarModal,
  onOpenFlexibleRoutine,
  onOpenScanner,
  onOpenPomboAI,
  onLogout,
}) => {
  if (!isOpen) return null;

  const activeMascotForm = profile.mascotForm || goalToMascotForm(profile.goal || 'gain_muscle');
  const activeMascot = MASCOT_DATA[activeMascotForm] || MASCOT_DATA.pombo_grande;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark backdrop blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel from the right */}
      <aside className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 border-l border-purple-50 overflow-y-auto">
        {/* Drawer Header with user photo, name and Membro Premium */}
        <div className="p-6 bg-white border-b border-purple-50 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAvatarModal();
              }}
              title="Personalizar avatar"
              className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0 rounded-full ring-2 ring-purple-100 p-0.5"
            >
              <AvatarHeadDisplay profile={profile} sizeClassName="w-14 h-14" />
            </button>
            <div>
              <h3 className="text-base font-extrabold text-[#1E1638] leading-tight">
                {profile.displayName || 'Atleta PomboFit'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5E2EE8] mt-1">
                <span>{activeMascot.name}</span>
                <Crown className="w-3.5 h-3.5 text-[#5E2EE8] fill-[#5E2EE8]" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-[#1E1638] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="p-4 space-y-1 flex-1">
          {/* Pombo IA — Assistente Inteligente */}
          {onOpenPomboAI && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPomboAI();
              }}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-[#F6F3FF] hover:bg-[#EDE4FF] text-left transition-colors cursor-pointer group text-[#1E1638] mb-1"
            >
              <Sparkles className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2.2} />
              <div>
                <span className="text-sm font-extrabold text-[#5E2EE8] block leading-tight">
                  Pombo IA — Assistente
                </span>
                <span className="text-[11px] text-slate-500">
                  Treinador inteligente e análise muscular
                </span>
              </div>
            </button>
          )}

          {/* Scanner de Aparelhos */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
            >
              <Camera className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
              <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
                Scanner de Aparelhos
              </span>
            </button>
          )}

          {/* Saúde e dispositivos (Apple Health / Health Connect) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('health');
            }}
            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8FF] border border-purple-100 hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638] mb-1"
          >
            <div className="flex items-center gap-4 min-w-0">
              <HeartPulse className="w-5 h-5 text-[#5E2EE8] shrink-0" strokeWidth={2.2} />
              <div className="min-w-0">
                <span className="text-sm font-extrabold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors block truncate">
                  Saúde e dispositivos
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  Apple Health (iOS) · Health Connect (Android)
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                profile.healthConnected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-purple-100 text-[#5E2EE8]'
              }`}
            >
              {profile.healthConnected ? 'Conectado' : 'Conectar'}
            </span>
          </button>

          {/* Central de Alimentação & Nutrição */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('progress', 'nutricao');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Utensils className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Alimentação e Nutrição
            </span>
          </button>

          {/* Medidas Corporais */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('progress', 'corporal');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Ruler className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Medidas Corporais
            </span>
          </button>

          {/* 1. Meu Perfil */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('profile');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <User className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Meu Perfil e Segurança
            </span>
          </button>

          {/* 2. Evolução do Mascote */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('mascot');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Settings className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Mascote & Conquistas
            </span>
          </button>

          {/* 3. Minha Rotina e Horários */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFlexibleRoutine();
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Calendar className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Minha Rotina e Horários
            </span>
          </button>

          {/* 4. Lembretes e Notificações */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('profile', 'notificacoes');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Bell className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Lembretes e Notificações
            </span>
          </button>

          {/* 5. Ajustes de Treino */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('workouts');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Dumbbell className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Fichas e Ajustes de Treino
            </span>
          </button>

          {/* 6. Histórico de Atividades */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('progress', 'treinos');
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-[#F3EEFF] text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <Clock className="w-5 h-5 text-[#5E2EE8]" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-[#5E2EE8] transition-colors">
              Histórico e Calendário
            </span>
          </button>

          {/* 8. Sair da Conta */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-rose-50 text-left transition-colors cursor-pointer group text-[#1E1638]"
          >
            <LogOut className="w-5 h-5 text-[#5E2EE8] group-hover:text-rose-600 transition-colors" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1E1638] group-hover:text-rose-600 transition-colors">
              Sair da Conta
            </span>
          </button>
        </div>

        {/* Bottom Mascot Card: Displays the user's linked mascot */}
        <div className="p-4 mt-auto">
          <div className="rounded-[24px] p-4 bg-gradient-to-r from-[#EDE7FD] via-[#F3EEFF] to-[#FAF8FF] border border-purple-100 flex items-center gap-3.5 shadow-xs">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-white rounded-2xl p-1 border border-purple-100 overflow-hidden">
              <img
                src={activeMascot.imageUrl}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/mascots/pombo_hero_bust.png';
                }}
                alt={activeMascot.name}
                className="w-full h-full object-contain select-none"
              />
            </div>
            <div>
              <h4 className="text-base font-black text-[#1E1638] tracking-tight">
                <span className="text-[#5E2EE8]">P</span>ombo<span className="text-[#5E2EE8]">F</span>it
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {activeMascot.name} • {activeMascot.goalLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
