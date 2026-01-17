import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPrompt);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      toast.success('MusicTutor instalado com sucesso! 🎸', {
        description: 'Agora você pode acessar o app direto da tela inicial',
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setRegistration(reg);

      // Check for updates on load
      reg.update();

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              setUpdateAvailable(true);
              showUpdateNotification(newWorker);
            }
          });
        }
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      console.log('[PWA] Service Worker registered successfully');
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  };

  const showUpdateNotification = (newWorker: ServiceWorker) => {
    toast.success('Nova versão disponível! 🎉', {
      description: 'Clique em "Atualizar" para usar a versão mais recente',
      duration: Infinity,
      action: {
        label: 'Atualizar Agora',
        onClick: () => {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        },
      },
      cancel: {
        label: 'Depois',
        onClick: () => {
          toast.dismiss();
        },
      },
    });
  };

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
      } else {
        console.log('[PWA] User dismissed installation');
      }

      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Installation failed:', error);
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      try {
        await registration.update();
        toast.info('Verificando atualizações...', {
          description: 'Aguarde um momento',
        });
      } catch (error) {
        console.error('[PWA] Update check failed:', error);
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    updateAvailable,
    installApp,
    checkForUpdates,
  };
}
