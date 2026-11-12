import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'card' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'card' ? (
        <div className="bg-[#F2EDFF] border border-[#E4D9FF] rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7650C9] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#24212B]">Instalar PomboFit na Tela Inicial</h4>
              <p className="text-xs text-slate-600">
                Acesso rápido em tela cheia no iPhone, Android ou Computador.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTrigger}
            className="px-4 py-2.5 rounded-xl bg-[#7650C9] text-white text-xs font-semibold hover:bg-[#633EB3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Instalar App
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTrigger}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F2EDFF] text-[#7650C9] hover:bg-[#E4D9FF] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Instalar App</span>
        </button>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#24212B]">
                Instalar o PomboFit no Dispositivo
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-600">
                <p>Para instalar o PomboFit no seu iPhone ou iPad:</p>
                <ol className="list-decimal list-inside space-y-2 font-medium text-[#24212B]">
                  <li>Toque no ícone <strong>Compartilhar</strong> na barra inferior do Safari.</li>
                  <li>Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                  <li>Confirme tocando em <strong>Adicionar</strong> no canto superior direito.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-600">
                <p>Para instalar o PomboFit na sua tela inicial ou área de trabalho:</p>
                <ol className="list-decimal list-inside space-y-2 font-medium text-[#24212B]">
                  <li>Abra o menu do navegador (ícone de três pontos ou barra de endereço).</li>
                  <li>Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#7650C9] text-white text-sm font-semibold hover:bg-[#6440B5] transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineConnectivityBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>
        Modo offline ativo — Suas séries e registros estão salvos localmente e sincronizarão assim que a conexão voltar.
      </span>
    </div>
  );
};
