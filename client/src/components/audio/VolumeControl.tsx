import React, { useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { getAudioMixer } from '../../audio';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import { toast } from 'sonner';

interface VolumeControlProps {
  className?: string;
}

export function VolumeControl({ className = '' }: VolumeControlProps) {
  // Usar store global para volume (persistido)
  const { masterVolume, setMasterVolume } = useAudioSettingsStore();
  const volume = Math.round(masterVolume * 100); // Converter para 0-100
  
  // Estado local para mute e slider
  const [isMuted, setIsMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const userInitiatedChangeRef = React.useRef(false);

  // Sincronizar AudioMixer com store ao montar e quando volume mudar
  useEffect(() => {
    const mixer = getAudioMixer();
    if (mixer) {
      // Sincronizar volume do store com AudioMixer
      mixer.setMasterVolume(masterVolume);
    }
  }, [masterVolume]);

  // Sincronizar estado de mute apenas ao montar
  useEffect(() => {
    const mixer = getAudioMixer();
    if (mixer) {
      const mixerIsMuted = mixer.getIsMuted();
      setIsMuted(mixerIsMuted);
    }
  }, []); // Apenas ao montar

  const handleVolumeChange = useCallback((newVolume: number) => {
    const volumeNormalized = newVolume / 100; // Converter para 0-1
    
    // Marcar como mudança iniciada pelo usuário
    userInitiatedChangeRef.current = true;
    
    // Atualizar store global (persistido automaticamente)
    setMasterVolume(volumeNormalized);
    
    // Atualizar AudioMixer imediatamente
    const mixer = getAudioMixer();
    if (mixer) {
      mixer.setMasterVolume(volumeNormalized);
    }
    
    // Feedback visual imediato
    toast.success(`${newVolume}%`, {
      duration: 500,
      position: 'top-center',
      style: {
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        fontSize: '14px',
        padding: '8px 16px',
      },
    });
    
    // Se estava mutado e aumentou volume, desmutar
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
      const mixer = getAudioMixer();
      if (mixer) {
        mixer.unmute();
      }
    }
    
    // Reset flag após pequeno delay
    setTimeout(() => {
      userInitiatedChangeRef.current = false;
    }, 100);
  }, [setMasterVolume, isMuted]);

  const handleMuteToggle = useCallback(() => {
    const mixer = getAudioMixer();
    if (mixer) {
      mixer.toggleMute();
      const newMutedState = mixer.getIsMuted();
      setIsMuted(newMutedState);
      
      // Feedback visual
      toast.info(newMutedState ? 'Mudo' : 'Som ativado', {
        duration: 500,
        position: 'top-center',
        style: {
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: '14px',
          padding: '8px 16px',
        },
      });
    }
  }, []);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 50) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleMuteToggle}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
        className="p-2 rounded-lg hover:bg-muted transition"
      >
        {getVolumeIcon()}
      </button>

      {/* Volume Slider Popup */}
      {showSlider && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-card rounded-xl border border-border shadow-lg"
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
        >
          <div className="w-32">
            <div className="text-xs text-muted-foreground text-center mb-2">
              Volume: {volume}%
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VolumeControl;
