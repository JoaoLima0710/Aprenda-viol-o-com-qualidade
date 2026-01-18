import { Download, Smartphone, Monitor, Apple, Chrome, X, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

type DeviceType = 'mobile' | 'desktop' | 'tablet';
type Platform = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown';

export function InstallPWA() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);

  // Detect device and platform
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    // Detect platform
    if (userAgent.includes('android')) {
      setPlatform('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      setPlatform('ios');
    } else if (userAgent.includes('windows')) {
      setPlatform('windows');
    } else if (userAgent.includes('mac')) {
      setPlatform('mac');
    } else if (userAgent.includes('linux')) {
      setPlatform('linux');
    }

    // Detect device type
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);

    if (isTablet) {
      setDeviceType('tablet');
    } else if (isMobile) {
      setDeviceType('mobile');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  const getInstallInstructions = () => {
    if (platform === 'ios') {
      return {
        icon: Apple,
        title: 'Instalar no iOS',
        steps: [
          'Toque no botão compartilhar (📤)',
          'Role para baixo e toque em "Adicionar à Tela Inicial"',
          'Toque em "Adicionar" para confirmar'
        ],
        color: 'bg-blue-600'
      };
    } else if (platform === 'android') {
      return {
        icon: Smartphone,
        title: 'Instalar no Android',
        steps: [
          'Toque em "Instalar" ou no menu (⋮)',
          'Selecione "Adicionar à tela inicial"',
          'Toque em "Adicionar" para confirmar'
        ],
        color: 'bg-green-600'
      };
    } else {
      return {
        icon: Monitor,
        title: 'Instalar no Desktop',
        steps: [
          'Clique no ícone de instalação na barra de endereços',
          'Ou clique em "Instalar MusicTutor"',
          'O app será adicionado aos seus apps'
        ],
        color: 'bg-purple-600'
      };
    }
  };

  const instructions = getInstallInstructions();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <Card className="bg-gradient-to-r from-purple-600 to-cyan-600 p-[1px] shadow-2xl">
          <CardContent className="bg-slate-900 rounded-lg p-0">
            {!showInstructions ? (
              // Banner de instalação principal
              <div className="p-4 relative">
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
                      🎸 Instalar MusicTutor
                    </h3>
                    <p className="text-slate-300 text-xs mb-3">
                      Acesso rápido, funciona offline e como app nativo
                    </p>

                    <div className="flex gap-2 mb-3">
                      {isInstallable ? (
                        <Button
                          onClick={installApp}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Instalar Agora
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowInstructions(true)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                        >
                          <Chrome className="w-3 h-3 mr-1" />
                          Ver Instruções
                        </Button>
                      )}

                      <Button
                        onClick={() => setDismissed(true)}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                      >
                        Depois
                      </Button>
                    </div>

                    {/* Device info */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Badge variant="outline" className="text-xs">
                        {deviceType === 'mobile' ? '📱' : deviceType === 'tablet' ? '📱' : '🖥️'}
                        {deviceType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {platform === 'ios' ? '🍎' : platform === 'android' ? '🤖' : '💻'}
                        {platform}
                      </Badge>
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
            ) : (
              // Instruções detalhadas
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <instructions.icon className="w-4 h-4" />
                    {instructions.title}
                  </h3>
                  <Button
                    onClick={() => setShowInstructions(false)}
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white p-1 h-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {instructions.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-xs text-slate-300 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-300 text-sm">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Compatível com {platform === 'ios' ? 'iOS 16.4+' : platform === 'android' ? 'Android 8.0+' : 'Chrome/Edge 89+'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
