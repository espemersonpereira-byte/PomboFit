import React, { useState, useRef } from 'react';
import {
  ExerciseItem,
  ExerciseHistoryLog,
  MuscleCategory,
} from '../types';
import {
  EXERCISES_CATALOG,
  MUSCLE_CATEGORIES,
  getExerciseById,
} from '../data/exercisesCatalog';
import { ExerciseDetailModal } from './ExerciseLibraryAndDetailModal';
import { ExerciseVerifiedVisual } from './AnatomicalVisuals';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Info,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

interface EquipmentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteIds: string[];
  exerciseLogs: ExerciseHistoryLog[];
  onToggleFavorite: (exerciseId: string) => void;
  onAddExerciseToWorkout?: (exercise: ExerciseItem) => void;
}

interface ScanResultData {
  equipmentName: string;
  equipmentCategory: string;
  primaryMuscleGroup: string;
  secondaryMuscles: string[];
  confidence: 'high' | 'medium' | 'low' | string;
  uncertaintyNote: string;
  usageInstructions: string[];
  safetyTips: string;
  compatibleExerciseIds: string[];
}

async function compressScannerImage(file: File, maxWidth = 900, quality = 0.8): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao preparar canvas de imagem.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ base64, dataUrl, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Erro na leitura da foto.'));
    reader.readAsDataURL(file);
  });
}

export const EquipmentScannerModal: React.FC<EquipmentScannerModalProps> = ({
  isOpen,
  onClose,
  favoriteIds,
  exerciseLogs,
  onToggleFavorite,
  onAddExerciseToWorkout,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [manualMuscleFilter, setManualMuscleFilter] = useState<MuscleCategory | ''>('');
  const [inspectExercise, setInspectExercise] = useState<ExerciseItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setScanResult(null);
    setUserConfirmed(false);
    setManualMuscleFilter('');
    setScanning(true);

    try {
      const { base64, dataUrl, mimeType } = await compressScannerImage(file);
      setPreviewUrl(dataUrl);

      const response = await fetch('/api/scan-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64,
          mimeType,
          availableExercises: EXERCISES_CATALOG.map((ex) => ({
            id: ex.id,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            equipment: ex.equipment,
          })),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Não foi possível identificar o aparelho na foto.');
      }

      setScanResult(json.data as ScanResultData);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Erro ao analisar a fotografia do equipamento.'
      );
    } finally {
      setScanning(false);
    }
  };

  const matchedExercises: ExerciseItem[] = (() => {
    if (manualMuscleFilter) {
      return EXERCISES_CATALOG.filter(
        (ex) => ex.muscleGroup === manualMuscleFilter && ex.equipment === 'Máquinas'
      );
    }
    if (!scanResult) return [];
    const byId = (scanResult.compatibleExerciseIds || [])
      .map((id) => getExerciseById(id))
      .filter((item): item is ExerciseItem => !!item);

    if (byId.length > 0) return byId;

    return EXERCISES_CATALOG.filter(
      (ex) =>
        ex.muscleGroup.toLowerCase() ===
        (scanResult.primaryMuscleGroup || '').toLowerCase()
    ).slice(0, 6);
  })();

  const resetScanner = () => {
    setPreviewUrl(null);
    setScanResult(null);
    setErrorMsg(null);
    setUserConfirmed(false);
    setManualMuscleFilter('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#FAF8FF] w-full max-w-2xl max-h-[92vh] rounded-[32px] flex flex-col overflow-hidden shadow-2xl border border-purple-100">
        {/* Header */}
        <div className="bg-[#5E2EE8] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">
                Identificação Visual Assistida
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Scanner de Aparelhos e Exercícios
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fechar scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Mascot Orientation Card */}
          <div className="bg-white border border-purple-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <img
              src="/assets/mascots/pombo_head.jpg"
              alt="Instrutor Pombo"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#5E2EE8] shrink-0"
            />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-[#1E1638] block text-sm font-extrabold">
                Dica do Instrutor Pombo:
              </strong>
              Fotografe o aparelho da academia mostrando o assento, os apoios e a torre de carga. Eu apresentarei a sugestão do equipamento e os exercícios compatíveis para você confirmar com segurança!
            </div>
          </div>

          {/* Upload / Capture Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleSelectFile}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelectFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
              className="py-4 px-4 rounded-2xl bg-[#5E2EE8] hover:bg-[#4E21D0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span>Fotografar Aparelho Agora</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="py-4 px-4 rounded-2xl bg-white hover:bg-purple-50 text-[#5E2EE8] border border-purple-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span>Enviar Foto da Galeria</span>
            </button>
          </div>

          {/* Image Preview & Loading State */}
          {previewUrl && (
            <div className="bg-white border border-purple-100 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1E1638]">
                  Fotografia Capturada
                </span>
                <button
                  type="button"
                  onClick={resetScanner}
                  className="text-xs font-bold text-[#5E2EE8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Nova Foto</span>
                </button>
              </div>
              <div className="w-full max-h-60 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Equipamento fotografado"
                  className="max-h-60 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {scanning && (
            <div className="bg-white border border-purple-100 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F0EBFE] text-[#5E2EE8] flex items-center justify-center mx-auto animate-pulse">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-[#1E1638]">
                Analisando biomecânica e estrutura do aparelho...
              </h3>
              <p className="text-xs text-slate-500">
                Verificando correspondência precisa com a biblioteca interna do PomboFit.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold block">Não foi possível concluir a leitura</strong>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Scan Result & Mandatory User Confirmation */}
          {scanResult && !scanning && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-[#5E2EE8]/30 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#5E2EE8] block">
                      Sugestão de Identificação Visual
                    </span>
                    <h3 className="text-lg font-black text-[#1E1638] mt-0.5">
                      {scanResult.equipmentName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Categoria: <strong>{scanResult.equipmentCategory}</strong> · Foco Principal:{' '}
                      <strong>{scanResult.primaryMuscleGroup}</strong>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-[11px] font-extrabold ${
                      scanResult.confidence === 'high'
                        ? 'bg-emerald-50 text-emerald-700'
                        : scanResult.confidence === 'medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {scanResult.confidence === 'high'
                      ? 'Alta Precisão'
                      : scanResult.confidence === 'medium'
                      ? 'Confirmação Necessária'
                      : 'Incerteza Visual — Confira'}
                  </span>
                </div>

                {scanResult.uncertaintyNote && (
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{scanResult.uncertaintyNote}</span>
                  </div>
                )}

                {/* User Confirmation Gate */}
                {!userConfirmed ? (
                  <div className="bg-[#F4F0FF] border border-[#E4DCFC] rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[#1E1638]">
                      Este é realmente o aparelho &ldquo;{scanResult.equipmentName}&rdquo;?
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setUserConfirmed(true)}
                        className="px-4 py-2.5 rounded-xl bg-[#5E2EE8] text-white text-xs font-bold hover:bg-[#4E21D0] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Sim, Confirmar Aparelho</span>
                      </button>

                      <select
                        value={manualMuscleFilter}
                        onChange={(e) => {
                          setManualMuscleFilter(e.target.value as MuscleCategory);
                          setUserConfirmed(true);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-white border border-purple-200 text-xs font-bold text-[#1E1638]"
                      >
                        <option value="">Não é este? Filtrar por grupo muscular...</option>
                        {MUSCLE_CATEGORIES.map((m) => (
                          <option key={m} value={m}>
                            Ver aparelhos de {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {manualMuscleFilter
                          ? `Filtro manual selecionado: Máquinas de ${manualMuscleFilter}`
                          : 'Aparelho confirmado pelo usuário'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserConfirmed(false);
                        setManualMuscleFilter('');
                      }}
                      className="text-[11px] underline cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>
                )}

                {/* Usage Instructions & Safety */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#FAF8FF] rounded-2xl p-3.5 border border-purple-50 space-y-2">
                    <h4 className="text-xs font-black text-[#1E1638] uppercase tracking-wider">
                      Orientações de Utilização
                    </h4>
                    <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside">
                      {(scanResult.usageInstructions || []).map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-[#FAF8FF] rounded-2xl p-3.5 border border-purple-50 space-y-2">
                    <h4 className="text-xs font-black text-[#1E1638] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#5E2EE8]" />
                      <span>Segurança Articular</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {scanResult.safetyTips}
                    </p>
                    {scanResult.secondaryMuscles?.length > 0 && (
                      <p className="text-[11px] text-slate-500 pt-1">
                        <strong>Sinergistas:</strong> {scanResult.secondaryMuscles.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Compatible Exercises List */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-extrabold text-[#1E1638] flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#5E2EE8]" />
                  <span>
                    Exercícios Compatíveis na Biblioteca ({matchedExercises.length})
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchedExercises.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setInspectExercise(ex)}
                      className="bg-white rounded-2xl p-3 border border-purple-100 hover:border-[#5E2EE8] transition-all flex items-center justify-between gap-3 text-left cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#FAF8FF] border border-purple-50 flex items-center justify-center shrink-0 overflow-hidden">
                          <ExerciseVerifiedVisual
                            exercise={ex}
                            compact
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-extrabold text-[#1E1638] truncate group-hover:text-[#5E2EE8]">
                            {ex.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {ex.muscleGroup} · {ex.equipment}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#5E2EE8] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-purple-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Nunca associe um aparelho sem confirmar as travas e ajustes.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {inspectExercise && (
        <ExerciseDetailModal
          exercise={inspectExercise}
          exerciseLogs={exerciseLogs}
          isFavorite={favoriteIds.includes(inspectExercise.id)}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setInspectExercise(null)}
          onAddToWorkout={onAddExerciseToWorkout}
        />
      )}
    </div>
  );
};
