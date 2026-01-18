import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface RealtimeChordDetectorProps {
  onResult?: (result: any) => void;
  targetChord?: string;
  onPracticeComplete?: () => void;
  autoStart?: boolean;
  showVisualization?: boolean;
  practiceMode?: boolean;
}

export function RealtimeChordDetector({ onResult }: RealtimeChordDetectorProps) {
  // Sistema temporariamente desabilitado - migrando para nova arquitetura de IA
  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#0f0f1a]/95 backdrop-blur-md border-white/20">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Sistema em Atualização</h3>
        <p className="text-gray-400 mb-4">
          O detector de acordes está sendo migrado para a nova arquitetura de IA baseada em TensorFlow.js.
          Use o sistema de exercícios adaptativos para feedback em tempo real.
        </p>
        <Button
          onClick={() => window.location.href = '/practice'}
          className="bg-purple-500 hover:bg-purple-600"
        >
          Ir para Exercícios Adaptativos
        </Button>
      </CardContent>
    </Card>
  );
}