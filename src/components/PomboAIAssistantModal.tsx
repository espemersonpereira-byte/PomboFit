import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  BodyMeasurement,
  DailyHabitLog,
} from '../types';
import { MASCOT_DATA } from '../data/gamificationAndMascot';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Dumbbell,
  TrendingUp,
  Calendar,
  HelpCircle,
  Utensils,
  ShieldCheck,
} from 'lucide-react';

interface PomboAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  workouts: WorkoutPlan[];
  sessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  habits: DailyHabitLog[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const PomboAIAssistantModal: React.FC<PomboAIAssistantModalProps> = ({
  isOpen,
  onClose,
  profile,
  workouts,
  sessions,
  measurements,
  habits,
}) => {
  const activeMascot = MASCOT_DATA[profile.mascotForm || 'pombo_seco'];
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Olá, ${profile.displayName || 'Atleta'}! Eu sou o **Pombo IA**, seu assistente oficial de treinamento no PomboFit. Posso consultar suas fichas, explicar exercícios e aparelhos, analisar seu equilíbrio muscular, revisar sua evolução de cargas ou ajudar na sua rotina e alimentação. Como posso ajudar hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Build authorized, strictly isolated user context
  const userContext = useMemo(() => {
    const workoutsSummary =
      workouts.length > 0
        ? workouts
            .map(
              (w) =>
                `${w.name} (${w.scheduledDays.join(', ')} - ${w.exercises.length} exercícios: ${w.muscleGroups.join('/')})`
            )
            .join('; ')
        : 'Nenhuma ficha cadastrada ainda';

    const recentSessionsSummary =
      sessions.length > 0
        ? sessions
            .slice(0, 8)
            .map(
              (s) =>
                `${s.dateISO.slice(0, 10)}: ${s.workoutName} (Volume: ${s.totalVolumeKg}kg, Séries: ${s.setsCompleted}, PRs: ${s.prCount})`
            )
            .join('; ')
        : 'Nenhuma sessão concluída ainda';

    // Calculate muscle group frequency
    const freqMap: Record<string, number> = {};
    sessions.forEach((s) => {
      s.muscleGroups.forEach((m) => {
        freqMap[m] = (freqMap[m] || 0) + 1;
      });
    });
    const sortedMuscles = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
    const muscleBalanceSummary =
      sortedMuscles.length > 0
        ? sortedMuscles.map(([m, c]) => `${m}: ${c}x`).join(', ')
        : 'Sem sessões suficientes para cálculo de frequência muscular';

    const latestMeas = measurements[0];
    const measurementsSummary = latestMeas
      ? `Peso: ${latestMeas.weightKg}kg${latestMeas.waistCm ? `, Cintura: ${latestMeas.waistCm}cm` : ''}${latestMeas.armCm ? `, Braço: ${latestMeas.armCm}cm` : ''}${latestMeas.bodyFatPercent ? `, BF: ${latestMeas.bodyFatPercent}%` : ''} (${latestMeas.dateISO})`
      : `Peso inicial: ${profile.weightKg || 75}kg, Altura: ${profile.heightCm || 175}cm`;

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayHabit = habits.find((h) => h.dateKey === todayKey);
    const totalKcal = (todayHabit?.meals || []).reduce(
      (acc, m) => acc + (m.calories || 0),
      0
    );
    const totalProt = (todayHabit?.meals || []).reduce(
      (acc, m) => acc + (m.proteinG || 0),
      0
    );
    const nutritionSummary = todayHabit
      ? `Água: ${todayHabit.waterMl}/${todayHabit.waterGoalMl}ml, Refeições: ${todayHabit.meals.length} (${totalKcal} kcal, ${totalProt}g proteína)`
      : 'Sem registros alimentares hoje';

    return {
      displayName: profile.displayName,
      goal: activeMascot.goalLabel,
      experienceLevel: profile.experienceLevel,
      weeklyDays: profile.weeklyDays,
      limitations: profile.limitations || 'Nenhuma',
      workoutsSummary,
      recentSessionsSummary,
      muscleBalanceSummary,
      measurementsSummary,
      nutritionSummary,
    };
  }, [profile, workouts, sessions, measurements, habits, activeMascot]);

  if (!isOpen) return null;

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/pombo-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          userContext,
        }),
      });

      const json = await response.json();
      const replyText =
        response.ok && json.ok
          ? json.reply
          : json.error || 'Não consegui processar sua pergunta agora. Tente novamente em instantes.';

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          text: 'Verifique sua conexão e tente novamente. Seus dados continuam salvos com segurança.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const quickSuggestions = [
    {
      label: 'Equilíbrio Muscular',
      prompt: 'Analise meu histórico de treinos e identifique se há algum desequilíbrio entre os grupos musculares mais e menos treinados.',
      icon: TrendingUp,
    },
    {
      label: 'Avaliar Minhas Fichas',
      prompt: 'Consulte minhas fichas atuais e me diga como está a divisão semanal e volume de exercícios.',
      icon: Dumbbell,
    },
    {
      label: 'Organizar Rotina',
      prompt: 'Como posso organizar melhor meus dias de treino e descanso nesta semana?',
      icon: Calendar,
    },
    {
      label: 'Resumo Nutricional',
      prompt: 'Analise meu registro de água e alimentação de hoje e sugira como bater minhas metas diárias.',
      icon: Utensils,
    },
    {
      label: 'Dúvida de Execução',
      prompt: 'Quais são os principais cuidados posturais no Supino, Agachamento e Puxada Frontal?',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#FAF8FF] w-full max-w-2xl h-[88vh] max-h-[760px] rounded-[32px] flex flex-col overflow-hidden shadow-2xl border border-purple-100">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#4A1CD8] via-[#5E2EE8] to-[#7C4DFF] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-sm shrink-0 overflow-hidden">
              <img
                src="/assets/mascots/pombo_head.jpg"
                alt="Pombo IA"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Pombo IA — Assistente Inteligente
                </h2>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-[11px] text-purple-100">
                Treinos, biomecânica, evolução e rotina personalizada
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fechar Pombo IA"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Topic Chips */}
        <div className="px-4 py-2.5 bg-white border-b border-purple-50 flex items-center gap-2 overflow-x-auto shrink-0">
          {quickSuggestions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                disabled={sending}
                onClick={() => sendPrompt(item.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0EBFE] hover:bg-[#E4DCFC] text-[#5E2EE8] text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {!isUser ? (
                  <img
                    src="/assets/mascots/pombo_head.jpg"
                    alt="Pombo IA"
                    className="w-8 h-8 rounded-full object-cover border border-[#5E2EE8] shrink-0 mt-1"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#5E2EE8] text-white text-xs font-black flex items-center justify-center shrink-0 mt-1">
                    {(profile.displayName || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-[#5E2EE8] text-white rounded-tr-xs'
                      : 'bg-white border border-purple-100 text-[#1E1638] rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-purple-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex items-center gap-3">
              <img
                src="/assets/mascots/pombo_head.jpg"
                alt="Pombo IA"
                className="w-8 h-8 rounded-full object-cover border border-[#5E2EE8] shrink-0"
              />
              <div className="bg-white border border-purple-100 rounded-2xl px-4 py-3 text-xs font-bold text-[#5E2EE8] flex items-center gap-2">
                <Bot className="w-4 h-4 animate-bounce" />
                <span>Pombo IA está analisando seus dados...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Privacy Notice + Input Bar */}
        <div className="p-3.5 bg-white border-t border-purple-100 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5E2EE8] shrink-0" />
            <span>
              Privacidade garantida: o Pombo IA consulta apenas os seus próprios dados de treino.
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre suas fichas, exercícios, evolução ou rotina..."
              className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF8FF] border border-purple-100 text-xs sm:text-sm text-[#1E1638] focus:outline-none focus:border-[#5E2EE8]"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-4 py-3 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
