import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, CheckCircle2, Play, Target, Clock, TrendingUp } from 'lucide-react';
import { SongSkillTree, SkillRequirement } from '@/services/SongAnalysisService';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

interface SongSkillTreeProps {
  skillTree: SongSkillTree;
  onChallengeStart?: (challengeId: string) => void;
}

export function SongSkillTreeComponent({ skillTree, onChallengeStart }: SongSkillTreeProps) {
  const [, setLocation] = useLocation();
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  
  const masteredCount = skillTree.prerequisites.filter(p => p.mastered).length;
  const readinessPercent = (masteredCount / skillTree.prerequisites.length) * 100;
  
  const handleSkillClick = (requirement: SkillRequirement) => {
    if (requirement.practiceUrl) {
      setLocation(requirement.practiceUrl);
    }
  };
  
  const handleChallengeClick = (challengeId: string) => {
    if (onChallengeStart) {
      onChallengeStart(challengeId);
    } else {
      setLocation('/practice');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Micro-Curso: {skillTree.songTitle}</h3>
          <p className="text-sm text-gray-400">Prepare-se tecnicamente para tocar esta música</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{Math.round(readinessPercent)}%</div>
          <div className="text-xs text-gray-400">Pronto</div>
        </div>
      </div>
      
      {/* Readiness Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Progresso de Preparação</span>
          <span className="font-bold text-white">
            {masteredCount} / {skillTree.prerequisites.length} habilidades
          </span>
        </div>
        <Progress 
          value={readinessPercent} 
          className="h-3 bg-white/10"
        />
        {readinessPercent >= 70 && (
          <p className="text-sm text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Você está pronto para começar a praticar esta música!
          </p>
        )}
      </div>
      
      {/* Prerequisites */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Pré-requisitos
        </h4>
        <div className="space-y-2">
          {skillTree.prerequisites.map((req, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSkillClick(req)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                req.mastered
                  ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {req.mastered ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold ${req.mastered ? 'text-green-400 line-through' : 'text-white'}`}>
                      {req.name}
                    </p>
                    <p className="text-xs text-gray-400">{req.description}</p>
                  </div>
                </div>
                {!req.mastered && req.practiceUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkillClick(req);
                    }}
                  >
                    Praticar →
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Micro Challenges */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4" />
          Desafios Progressivos
        </h4>
        <div className="space-y-3">
          {skillTree.microChallenges.map((challenge, index) => {
            const isExpanded = expandedChallenge === challenge.id;
            const difficultyStars = '⭐'.repeat(challenge.difficulty);
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl border overflow-hidden transition-all ${
                  challenge.unlocked
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50'
                    : 'bg-white/5 border-white/10 opacity-50'
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => challenge.unlocked && setExpandedChallenge(isExpanded ? null : challenge.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        challenge.unlocked
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-gray-600/20 text-gray-500 border border-gray-600/30'
                      }`}>
                        {challenge.unlocked ? index + 1 : <Lock className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-white mb-1">{challenge.title}</h5>
                        <p className="text-sm text-gray-300 mb-2">{challenge.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {challenge.estimatedTime} min
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {difficultyStars}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300">
                            {challenge.type === 'riff' ? '🎸 Riff' :
                             challenge.type === 'chord-progression' ? '🎹 Progressão' :
                             challenge.type === 'rhythm' ? '🥁 Ritmo' :
                             '🔄 Transição'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {challenge.unlocked && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChallengeClick(challenge.id);
                        }}
                        size="sm"
                        className="bg-purple-500 text-white hover:bg-purple-600"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && challenge.unlocked && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 pt-4 border-t border-purple-500/20"
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Objetivo:</p>
                          <p className="text-sm text-white font-mono bg-white/5 p-2 rounded">
                            {challenge.target}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Tempo estimado:</span>
                          <span className="text-sm text-purple-400 font-semibold">
                            {challenge.estimatedTime} minutos
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Recommended Order */}
      {readinessPercent >= 70 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-green-400">Pronto para começar!</span>
          </div>
          <p className="text-sm text-gray-300">
            Complete os desafios na ordem recomendada para dominar esta música passo a passo.
          </p>
        </div>
      )}
    </div>
  );
}
