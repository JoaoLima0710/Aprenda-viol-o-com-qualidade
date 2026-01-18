import { Download, Smartphone, Monitor, Apple, Chrome, Info } from 'lucide-react';
import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, installApp, deviceInfo } = usePWA();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled) {
    return null; // Don't show if already installed
  }

  const getInstallIcon = () => {
    if (deviceInfo.platform === 'ios') return Apple;
    if (deviceInfo.platform === 'android') return Smartphone;
    return Monitor;
  };

  const getInstallText = () => {
    if (deviceInfo.platform === 'ios') return 'Instalar no iPhone/iPad';
    if (deviceInfo.platform === 'android') return 'Instalar no Android';
    return 'Instalar no Desktop';
  };

  const getCompatibilityInfo = () => {
    const { platform, supportsPWA } = deviceInfo;

    if (!supportsPWA) {
      return {
        compatible: false,
        message: 'Este navegador não suporta instalação PWA',
        icon: '❌',
        color: 'text-red-400'
      };
    }

    if (platform === 'ios') {
      return {
        compatible: true,
        message: 'Compatível com iOS 16.4+ (Safari)',
        icon: '✅',
        color: 'text-green-400'
      };
    }

    if (platform === 'android') {
      return {
        compatible: true,
        message: 'Compatível com Android 8.0+ (Chrome/Edge)',
        icon: '✅',
        color: 'text-green-400'
      };
    }

    return {
      compatible: true,
      message: 'Compatível com Chrome/Edge/Firefox',
      icon: '✅',
      color: 'text-green-400'
    };
  };

  const compatibility = getCompatibilityInfo();
  const InstallIcon = getInstallIcon();

  return (
    <div className="flex items-center gap-2">
      {/* Botão de instalação principal */}
      {isInstallable ? (
        <Button
          onClick={installApp}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          {getInstallText()}
        </Button>
      ) : (
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-purple-400 text-purple-300 hover:bg-purple-400/10"
            >
              <InstallIcon className="w-4 h-4 mr-2" />
              Como Instalar
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Instalar MusicTutor
              </DialogTitle>
              <DialogDescription>
                Transforme o MusicTutor em um app nativo no seu dispositivo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Compatibilidade */}
              <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                <span className="text-lg">{compatibility.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${compatibility.color}`}>
                    {compatibility.message}
                  </p>
                </div>
              </div>

              {/* Device Info */}
              <div className="flex gap-2">
                <Badge variant="outline">
                  {deviceInfo.type === 'mobile' ? '📱' : deviceInfo.type === 'tablet' ? '📱' : '🖥️'}
                  {deviceInfo.type}
                </Badge>
                <Badge variant="outline">
                  {deviceInfo.platform === 'ios' ? '🍎' : deviceInfo.platform === 'android' ? '🤖' : '💻'}
                  {deviceInfo.platform}
                </Badge>
              </div>

              {/* Instruções por plataforma */}
              {deviceInfo.platform === 'ios' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Apple className="w-4 h-4" />
                      iOS (Safari)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-purple-400 font-mono">1.</span>
                      <span>Toque no botão compartilhar (📤)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-400 font-mono">2.</span>
                      <span>Role para baixo e toque em "Adicionar à Tela Inicial"</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-400 font-mono">3.</span>
                      <span>Toque em "Adicionar" para confirmar</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {deviceInfo.platform === 'android' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Android (Chrome/Edge)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-green-400 font-mono">1.</span>
                      <span>Toque no botão "Instalar" na parte superior</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-400 font-mono">2.</span>
                      <span>Ou toque no menu (⋮) e selecione "Adicionar à tela inicial"</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-400 font-mono">3.</span>
                      <span>Toque em "Adicionar" para confirmar</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(deviceInfo.platform === 'windows' || deviceInfo.platform === 'mac' || deviceInfo.platform === 'linux') && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Desktop (Chrome/Edge)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-blue-400 font-mono">1.</span>
                      <span>Clique no ícone de instalação na barra de endereços</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400 font-mono">2.</span>
                      <span>Ou clique no botão "Instalar MusicTutor"</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400 font-mono">3.</span>
                      <span>O app será instalado automaticamente</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefícios */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-cyan-400 text-lg">⚡</div>
                  <div className="text-xs text-slate-400">Mais Rápido</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 text-lg">📱</div>
                  <div className="text-xs text-slate-400">App Nativo</div>
                </div>
                <div className="text-center">
                  <div className="text-cyan-400 text-lg">🔒</div>
                  <div className="text-xs text-slate-400">Offline</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Badge de compatibilidade */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Info className="w-4 h-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Compatibilidade PWA</DialogTitle>
            <DialogDescription>
              Verifique se seu dispositivo suporta Progressive Web Apps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Dispositivo:</span>
              <Badge>{deviceInfo.type}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Plataforma:</span>
              <Badge>{deviceInfo.platform}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Suporte PWA:</span>
              <Badge variant={deviceInfo.supportsPWA ? "default" : "destructive"}>
                {deviceInfo.supportsPWA ? "✅ Sim" : "❌ Não"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Já instalado:</span>
              <Badge variant={isInstalled ? "default" : "secondary"}>
                {isInstalled ? "✅ Sim" : "❌ Não"}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}