import { Download, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPWA() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed || !isInstallable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-[1px] rounded-xl shadow-2xl">
          <div className="bg-slate-900 rounded-xl p-4 relative">
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-cyan-500 p-2 rounded-lg">
                <Smartphone className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">
                  Instalar MusicTutor
                </h3>
                <p className="text-slate-300 text-xs mb-3">
                  Adicione à tela inicial para acesso rápido e use offline
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={installApp}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Instalar Agora
                  </Button>

                  <Button
                    onClick={() => setDismissed(true)}
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                  >
                    Depois
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-cyan-400 font-semibold">⚡</div>
                  <div className="text-slate-400">Rápido</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-semibold">📱</div>
                  <div className="text-slate-400">Nativo</div>
                </div>
                <div className="text-center">
                  <div className="text-cyan-400 font-semibold">🔒</div>
                  <div className="text-slate-400">Offline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
