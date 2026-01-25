/**
 * Hook para facilitar uso do ActionFeedbackService
 * 
 * Fornece funções helper para disparar feedback sonoro em ações do usuário.
 */

import { useCallback } from 'react';
import { actionFeedbackService, ActionType } from '@/services/ActionFeedbackService';

/**
 * Hook para feedback sonoro de ações
 * 
 * @returns Funções para disparar feedback sonoro
 */
export function useActionFeedback() {
  const playButtonClick = useCallback(() => {
    actionFeedbackService.playActionFeedback('button_click');
  }, []);

  const playTrainingStart = useCallback(() => {
    actionFeedbackService.playActionFeedback('training_start');
  }, []);

  const playConfirmation = useCallback(() => {
    actionFeedbackService.playActionFeedback('confirmation');
  }, []);

  const playStepProgress = useCallback(() => {
    actionFeedbackService.playActionFeedback('step_progress');
  }, []);

  const playAction = useCallback((action: ActionType) => {
    actionFeedbackService.playActionFeedback(action);
  }, []);

  return {
    playButtonClick,
    playTrainingStart,
    playConfirmation,
    playStepProgress,
    playAction,
  };
}
