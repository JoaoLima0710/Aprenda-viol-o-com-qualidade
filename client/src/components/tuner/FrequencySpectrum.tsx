import { useEffect, useRef } from 'react';

interface FrequencySpectrumProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export function FrequencySpectrum({ analyser, isActive }: FrequencySpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Limpar canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Desenhar espectro
      const barWidth = (rect.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * rect.height * 0.8;

        // Gradiente de cor baseado na frequência
        const hue = (i / bufferLength) * 180 + 180; // Cyan para roxo
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

        // Desenhar barra com bordas arredondadas
        ctx.beginPath();
        // Desenhar retângulo com cantos arredondados manualmente
      const radius = 2;
      ctx.moveTo(x + radius, rect.height);
      ctx.lineTo(x + radius, rect.height - barHeight + radius);
      ctx.quadraticCurveTo(x, rect.height - barHeight, x, rect.height - barHeight + radius);
      ctx.lineTo(x, rect.height);
      ctx.closePath();
        ctx.fill();

        x += barWidth;
      }

      // Desenhar linha de referência
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rect.height / 2);
      ctx.lineTo(rect.width, rect.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive]);

  return (
    <div className="relative w-full h-32 bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      <div className="absolute top-2 left-2 text-xs text-gray-400 font-mono">
        ESPECTRO DE FREQUÊNCIA
      </div>
    </div>
  );
}
