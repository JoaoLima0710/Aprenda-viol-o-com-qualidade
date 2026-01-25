import React, { useEffect, useState } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioInitializerProps {
  children: React.ReactNode;
}

/**
 * Botão simples para inicializar o sistema de áudio
 */
export function AudioInitButton() {
  const { isReady, isInitializing, error, initialize } = useAudio();

  const handleClick = async () => {
    if (!isReady && !isInitializing) {
      await initialize();
    }
  };

  if (isReady) {
    // Mostrar indicador visual quando áudio está pronto (para testes)
    return (
      <div data-testid="audio-playing" className="fixed top-4 left-4 z-50">
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1 text-xs text-green-400">
          🔊 Áudio Ativo
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isInitializing}
      variant="outline"
      size="sm"
      className="bg-background/80 backdrop-blur-sm border-white/20 hover:bg-background/90"
      title={isInitializing ? 'Inicializando áudio...' : 'Inicializar sistema de áudio'}
    >
      {isInitializing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Inicializando...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
          <span>Erro de Áudio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 mr-2" />
          <span>Ativar Áudio</span>
        </>
      )}
    </Button>
  );
}

/**
 * Componente que garante inicialização do áudio antes de renderizar children
 */
export function AudioInitializer({ children }: AudioInitializerProps) {
  const { isReady, isInitializing, error, initialize } = useAudio();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Mostrar prompt se áudio não estiver pronto após 500ms
    const timer = setTimeout(() => {
      if (!isReady) {
        setShowPrompt(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isReady]);

  const handleInitialize = async () => {
    await initialize();
    setShowPrompt(false);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro de Áudio</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível inicializar o sistema de áudio. 
            Verifique se seu navegador suporta Web Audio API.
          </p>
          <p className="text-sm text-red-400">{error.message}</p>
          <button
            onClick={handleInitialize}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (showPrompt && !isReady) {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-2xl max-w-md text-center shadow-2xl border border-border">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Toque para Ativar Áudio</h2>
            <p className="text-muted-foreground mb-4">
              Para uma experiência completa de aprendizado, precisamos ativar o sistema de áudio.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 mb-6 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Por que isso é necessário?</p>
              <p>
                Os navegadores modernos (Chrome, Safari, Firefox) exigem interação do usuário antes de reproduzir áudio.
                Isso protege contra reprodução automática indesejada.
              </p>
            </div>
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                  Inicializando...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2 inline" />
                  Ativar Áudio
                </>
              )}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar sem áudio
            </button>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}

export default AudioInitializer;
