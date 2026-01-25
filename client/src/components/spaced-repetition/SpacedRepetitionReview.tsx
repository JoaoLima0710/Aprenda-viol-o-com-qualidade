/**
 * Componente para exibir e processar revisões espaçadas
 * Integrado no Treino do Dia
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSpacedRepetitionStore } from '@/stores/useSpacedRepetitionStore';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Calendar,
  Music,
  Guitar,
  BookOpen,
  Target
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export function SpacedRepetitionReview() {
  const { getDueItems, processReview, getStats } = useSpacedRepetitionStore();
  const [, setLocation] = useLocation();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  const dueItems = getDueItems();
  const stats = getStats();
  const currentItem = dueItems[currentItemIndex];

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'chord':
        return <Guitar className="w-5 h-5" />;
      case 'scale':
        return <Music className="w-5 h-5" />;
      case 'theory':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getContentLink = (item: typeof currentItem) => {
    if (item.contentType === 'chord') {
      return `/chords?chord=${item.contentId}`;
    } else if (item.contentType === 'scale') {
      return `/scales?scale=${item.contentId}`;
    } else if (item.contentType === 'theory') {
      return `/theory?module=${item.contentId}`;
    }
    return '/practice';
  };

  const handleQualitySelect = (quality: number) => {
    setSelectedQuality(quality);
    setShowResult(true);
  };

  const handleConfirm = () => {
    if (currentItem && selectedQuality !== null) {
      // Feedback sonoro de confirmação
      import('@/services/ActionFeedbackService').then(({ actionFeedbackService }) => {
        actionFeedbackService.playActionFeedback('confirmation');
      });
      
      processReview(currentItem.contentId, currentItem.contentType, selectedQuality);
      
      // Feedback baseado na qualidade
      if (selectedQuality >= 4) {
        toast.success(`Ótimo! Revisão de "${currentItem.name}" registrada`);
      } else if (selectedQuality >= 3) {
        toast.info(`Revisão de "${currentItem.name}" registrada`);
      } else {
        toast.warning(`Revisão de "${currentItem.name}" registrada - será revisado novamente em breve`);
      }
      
      // Próximo item ou concluir
      if (currentItemIndex < dueItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
        setShowResult(false);
        setSelectedQuality(null);
      } else {
        // Todas as revisões concluídas
        toast.success('🎉 Todas as revisões de hoje concluídas!');
        setCurrentItemIndex(0);
        setShowResult(false);
        setSelectedQuality(null);
      }
    }
  };

  if (dueItems.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Nenhuma Revisão Pendente</h3>
            <p className="text-sm text-gray-300">
              Você está em dia com suas revisões! 🎉
            </p>
          </div>
          {stats.totalItems > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400">
                {stats.totalItems} itens na fila de revisão • 
                {stats.dueThisWeek > 0 && ` ${stats.dueThisWeek} esta semana`}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  const progress = ((currentItemIndex + 1) / dueItems.length) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">📚 Revisão Espaçada</h3>
            <p className="text-sm text-gray-300">
              {currentItemIndex + 1} de {dueItems.length} revisões
            </p>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            {dueItems.length} pendentes
          </Badge>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Current Item */}
        {currentItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                {getContentIcon(currentItem.contentType)}
                <div className="flex-1">
                  <h4 className="font-bold text-white">{currentItem.name}</h4>
                  <p className="text-xs text-gray-400 capitalize">
                    {currentItem.contentType === 'chord' ? 'Acorde' :
                     currentItem.contentType === 'scale' ? 'Escala' :
                     currentItem.contentType === 'theory' ? 'Módulo Teórico' :
                     currentItem.contentType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Última revisão: {currentItem.lastReviewDate 
                      ? new Date(currentItem.lastReviewDate).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{currentItem.repetitions} revisões</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Intervalo: {currentItem.interval} dia{currentItem.interval !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Quality Selection */}
            {!showResult ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-300 text-center">
                  Como você se saiu com esta revisão?
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((quality) => (
                    <motion.button
                      key={quality}
                      onClick={() => handleQualitySelect(quality)}
                      className={`p-3 rounded-lg border transition-all ${
                        quality === 0
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                          : quality <= 2
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30'
                          : quality <= 4
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-2xl mb-1">
                        {quality === 0 ? '😞' :
                         quality === 1 ? '😕' :
                         quality === 2 ? '😐' :
                         quality === 3 ? '🙂' :
                         quality === 4 ? '😊' :
                         '😄'}
                      </div>
                      <div className="text-xs font-semibold">{quality}</div>
                    </motion.button>
                  ))}
                </div>
                <div className="text-xs text-gray-400 text-center space-y-1">
                  <p>0 = Esqueci completamente</p>
                  <p>5 = Lembrei perfeitamente</p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-300 mb-2">
                    {selectedQuality !== null && selectedQuality >= 4
                      ? 'Ótimo! Você lembrou bem deste conteúdo.'
                      : selectedQuality !== null && selectedQuality >= 3
                      ? 'Bom! Continue praticando.'
                      : 'Não se preocupe! Vamos revisar novamente em breve.'}
                  </p>
                  {selectedQuality !== null && selectedQuality < 3 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(getContentLink(currentItem))}
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      Praticar Agora
                    </Button>
                  )}
                </div>
                <Button
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {currentItemIndex < dueItems.length - 1 ? 'Próxima Revisão' : 'Concluir Revisões'}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
