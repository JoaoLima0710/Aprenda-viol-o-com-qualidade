import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';

interface RealTimeChordPracticeProps {
  chordName?: string;
  onComplete?: (success: boolean, performance: any) => void;
  onExit?: () => void;
  autoStart?: boolean;
}

export function RealTimeChordPractice({
  chordName = 'C',
  onComplete,
  onExit,
  autoStart = false
}: RealTimeChordPracticeProps) {
  // Componente temporariamente desabilitado devido a problemas de dependências
  // TODO: Reimplementar com arquitetura de IA atual
  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#0f0f1a]/95 backdrop-blur-md border-white/20">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Prática de Acordes</h3>
        <p className="text-gray-400 mb-4">
          Sistema de prática em tempo real sendo atualizado para a nova arquitetura de IA baseada em TensorFlow.js.
          Use os exercícios adaptativos para prática com feedback inteligente.
        </p>
        <div className="space-x-2">
          <Button
            onClick={() => onExit?.()}
            variant="outline"
          >
            Voltar
          </Button>
          <Button
            onClick={() => window.location.href = '/practice'}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Exercícios Adaptativos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}