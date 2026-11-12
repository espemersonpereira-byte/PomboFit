import React from 'react';
import { Dumbbell, PlusCircle, Sparkles, X, ChevronRight, Play } from 'lucide-react';

export interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFreeWorkout: () => void;
  onCreateNewWorkoutPlan: () => void;
  onCreateCustomExercise: () => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onStartFreeWorkout,
  onCreateNewWorkoutPlan,
  onCreateCustomExercise,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-purple-100 z-10 animate-in slide-in-from-bottom duration-300">
        {/* Top Handle on Mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-purple-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E2EE8] block">
              Central de Ações
            </span>
            <h3 className="text-lg font-extrabold text-[#1E1638]">
              O que você deseja fazer agora?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mt-4">
          {/* OPÇÃO 1 — TREINO LIVRE */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartFreeWorkout();
            }}
            className="w-full bg-gradient-to-r from-[#FAF8FF] to-[#F3EEFF] hover:from-[#F0EBFE] hover:to-[#E8DFFE] border-2 border-[#5E2EE8]/30 hover:border-[#5E2EE8] rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7650C9] to-[#5E2EE8] text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-white" />
              </div>
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1E1638]">
                    Treino Livre
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5E2EE8]">
                    Sem Ficha
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  Treine na hora escolhendo exercícios avulsos da biblioteca com contagem de séries e descanso.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#5E2EE8] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* OPÇÃO 2 — NOVA FICHA */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewWorkoutPlan();
            }}
            className="w-full bg-white hover:bg-slate-50 border border-purple-100 hover:border-purple-300 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0 pr-2">
                <h4 className="text-sm sm:text-base font-extrabold text-[#1E1638]">
                  Nova Ficha
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Monte uma rotina estruturada com dias da semana, séries planejadas e divisões de treino.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#5E2EE8] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* OPÇÃO 3 — CRIAR EXERCÍCIO PERSONALIZADO */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateCustomExercise();
            }}
            className="w-full bg-white hover:bg-slate-50 border border-purple-100 hover:border-purple-300 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1E1638]">
                    Criar Exercício Personalizado
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Biblioteca
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Cadastre um exercício exclusivo com equipamento, grupos musculares e instruções próprias.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
