import React from 'react';

export interface AppLoadingScreenProps {
  step: number; // 0: Preparando, 1: Organizando, 2: Sincronizando, 3: Conquistas, 4: Quase pronto, 5: Tudo pronto
  isExiting?: boolean;
}

export const LOADING_MESSAGES = [
  'Preparando seu PomboFit...',
  'Organizando seus treinos...',
  'Sincronizando sua evolução...',
  'Carregando suas conquistas...',
  'Quase tudo pronto...',
  'Tudo pronto! Vamos treinar?',
];

// Target completion percentages for smooth progressive bar animation
const STEP_PROGRESS: number[] = [18, 42, 68, 86, 95, 100];

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  step,
  isExiting = false,
}) => {
  const currentStep = Math.min(Math.max(0, step), LOADING_MESSAGES.length - 1);
  const currentMessage = LOADING_MESSAGES[currentStep];
  const progressPercent = STEP_PROGRESS[currentStep];
  const isFinished = currentStep === LOADING_MESSAGES.length - 1;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 bg-[#FAF8FF] flex flex-col items-center justify-between p-6 select-none transition-opacity duration-400 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
      }}
    >
      {/* Top spacer for vertical balance */}
      <div className="w-full flex justify-end">
        <span className="text-[11px] font-semibold text-purple-300 tracking-wider uppercase">
          PomboFit v2.5
        </span>
      </div>

      {/* Central composition: Official Mascot + Brand Lockup + Tagline */}
      <div className="w-full max-w-sm flex flex-col items-center text-center -mt-6">
        {/* Soft atmospheric glow behind the official mascot */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-[#5E2EE8]/15 via-[#8E52F4]/15 to-transparent blur-2xl pointer-events-none" />

          {/* Official PomboFit Mascot Hero */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center transition-transform duration-700 ease-out">
            <img
              src="/assets/mascots/pombo_hero_bust.png"
              onError={(e) => {
                // Guaranteed local fallback if PNG fails
                (e.target as HTMLImageElement).src = '/assets/mascots/pombo_head.jpg';
              }}
              alt="Mascote Oficial PomboFit"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(94,46,232,0.18)]"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="mt-4 flex items-center justify-center gap-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E1638] leading-none">
            Pombo<span className="text-[#5E2EE8]">Fit</span>
          </h1>
        </div>

        {/* Mandatory Identity Tagline */}
        <p className="mt-2 text-[11px] sm:text-xs font-bold tracking-[0.22em] text-[#5E2EE8] uppercase">
          SEU TREINO. SUA EVOLUÇÃO.
        </p>

        {/* Dynamic Loading Message & Elegant Progress Bar */}
        <div className="mt-8 w-full flex flex-col items-center gap-3">
          {/* Discrete, elegant purple progress track */}
          <div
            className="w-56 sm:w-64 h-1.5 sm:h-2 bg-purple-100/90 rounded-full overflow-hidden p-0.5 border border-purple-200/50 shadow-inner"
            aria-hidden="true"
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-[#5E2EE8] via-[#7650C9] to-[#8E52F4] rounded-full transition-all duration-400 ease-out shadow-xs"
            />
          </div>

          {/* Dynamic Stage Message */}
          <p
            key={currentMessage}
            className={`text-xs sm:text-sm font-semibold transition-all duration-300 ${
              isFinished ? 'text-[#5E2EE8] font-bold scale-102' : 'text-slate-600'
            }`}
          >
            {currentMessage}
          </p>
        </div>
      </div>

      {/* Discreet bottom footer */}
      <div className="text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          Treinamento Inteligente & Acompanhamento
        </p>
      </div>
    </div>
  );
};
