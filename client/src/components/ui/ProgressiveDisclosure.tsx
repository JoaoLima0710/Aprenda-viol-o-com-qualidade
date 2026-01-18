import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  MoreHorizontal,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DisclosureItem {
  id: string;
  title: string;
  content: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  metadata?: {
    estimatedTime?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    completed?: boolean;
    new?: boolean;
  };
}

interface ProgressiveDisclosureProps {
  items: DisclosureItem[];
  initialVisible?: number;
  showPriority?: boolean;
  showMetadata?: boolean;
  compact?: boolean;
  onItemToggle?: (itemId: string, visible: boolean) => void;
  onItemComplete?: (itemId: string) => void;
}

export function ProgressiveDisclosure({
  items,
  initialVisible = 3,
  showPriority = true,
  showMetadata = true,
  compact = false,
  onItemToggle,
  onItemComplete
}: ProgressiveDisclosureProps) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(
    new Set(items.slice(0, initialVisible).map(item => item.id))
  );
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Auto-expand high priority items
    const highPriorityItems = items
      .filter(item => item.priority === 'high')
      .slice(0, initialVisible)
      .map(item => item.id);

    setVisibleItems(new Set(highPriorityItems));
  }, [items, initialVisible]);

  const toggleItem = (itemId: string) => {
    const newVisibleItems = new Set(visibleItems);
    if (newVisibleItems.has(itemId)) {
      newVisibleItems.delete(itemId);
    } else {
      newVisibleItems.add(itemId);
    }
    setVisibleItems(newVisibleItems);
    onItemToggle?.(itemId, newVisibleItems.has(itemId));
  };

  const toggleAll = () => {
    if (showAll) {
      setVisibleItems(new Set(items.slice(0, initialVisible).map(item => item.id)));
    } else {
      setVisibleItems(new Set(items.map(item => item.id)));
    }
    setShowAll(!showAll);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-500/10 text-red-400';
      case 'medium': return 'border-yellow-400 bg-yellow-500/10 text-yellow-400';
      case 'low': return 'border-gray-400 bg-gray-500/10 text-gray-400';
      default: return 'border-gray-400 bg-gray-500/10 text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    // High priority first
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Then by completion status
    if (a.metadata?.completed !== b.metadata?.completed) {
      return a.metadata?.completed ? 1 : -1;
    }
    // Then by new status
    if (a.metadata?.new !== b.metadata?.new) {
      return a.metadata?.new ? -1 : 1;
    }
    return 0;
  });

  const visibleCount = visibleItems.size;
  const totalCount = items.length;
  const hiddenCount = totalCount - visibleCount;

  return (
    <div className="space-y-3">
      {/* Header with Show/Hide All */}
      {totalCount > initialVisible && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Info className="w-4 h-4" />
            <span>
              {visibleCount} de {totalCount} itens visíveis
              {hiddenCount > 0 && ` (${hiddenCount} ocultos)`}
            </span>
          </div>
          <Button
            onClick={toggleAll}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {showAll ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Recolher
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Mostrar Todos
              </>
            )}
          </Button>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {sortedItems.map((item, index) => {
          const isVisible = visibleItems.has(item.id);
          const isHighPriority = item.priority === 'high';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`transition-all ${
                compact ? 'p-3' : 'p-4'
              } ${
                isVisible
                  ? 'bg-white/5 border-white/20 shadow-lg'
                  : 'bg-white/2 border-white/10 hover:border-white/20 cursor-pointer'
              } ${
                item.metadata?.new ? 'ring-2 ring-blue-400/50' : ''
              }`}>
                <CardContent className={compact ? 'p-0' : 'p-0'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Priority Indicator */}
                      {showPriority && (
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-1 ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority === 'high' ? '🚨' :
                           item.priority === 'medium' ? '⚠️' : 'ℹ️'}
                          {item.priority === 'high' ? 'Alta' :
                           item.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      )}

                      {/* New Indicator */}
                      {item.metadata?.new && (
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                          <Zap className="w-3 h-3 mr-1" />
                          Novo
                        </Badge>
                      )}

                      {/* Completion Indicator */}
                      {item.metadata?.completed && (
                        <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                          ✓ Concluído
                        </Badge>
                      )}

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-white truncate ${
                          compact ? 'text-sm' : 'text-base'
                        }`}>
                          {item.title}
                        </h3>

                        {/* Metadata */}
                        {showMetadata && item.metadata && (
                          <div className="flex items-center gap-3 mt-1">
                            {item.metadata.estimatedTime && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                🕒 {item.metadata.estimatedTime}min
                              </span>
                            )}
                            {item.metadata.difficulty && (
                              <span className={`text-xs flex items-center gap-1 ${
                                getDifficultyColor(item.metadata.difficulty)
                              }`}>
                                🎯 {item.metadata.difficulty === 'beginner' ? 'Iniciante' :
                                   item.metadata.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {item.metadata?.completed === false && onItemComplete && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemComplete(item.id);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 h-7"
                        >
                          ✓ Completar
                        </Button>
                      )}

                      <Button
                        onClick={() => toggleItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        {isVisible ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isVisible && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={`mt-4 pt-4 border-t border-white/10 ${
                          compact ? 'text-sm' : 'text-base'
                        }`}>
                          {item.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Footer */}
      {hiddenCount > 0 && !showAll && (
        <div className="text-center py-4">
          <Button
            onClick={toggleAll}
            variant="outline"
            className="text-sm"
          >
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Ver mais {hiddenCount} itens
          </Button>
        </div>
      )}
    </div>
  );
}

// Hook para usar Progressive Disclosure facilmente
export function useProgressiveDisclosure(
  items: DisclosureItem[],
  options: {
    initialVisible?: number;
    autoExpandHighPriority?: boolean;
    rememberState?: boolean;
  } = {}
) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    // Auto-expand high priority items
    if (options.autoExpandHighPriority !== false) {
      items
        .filter(item => item.priority === 'high')
        .slice(0, options.initialVisible || 3)
        .forEach(item => initial.add(item.id));
    } else {
      items
        .slice(0, options.initialVisible || 3)
        .forEach(item => initial.add(item.id));
    }

    return initial;
  });

  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newVisibleItems = new Set(visibleItems);
    if (newVisibleItems.has(itemId)) {
      newVisibleItems.delete(itemId);
    } else {
      newVisibleItems.add(itemId);
    }
    setVisibleItems(newVisibleItems);

    // Save to localStorage if rememberState is true
    if (options.rememberState) {
      localStorage.setItem(`pd_visible_${itemId}`, newVisibleItems.has(itemId).toString());
    }
  };

  const completeItem = (itemId: string) => {
    setCompletedItems(prev => new Set(Array.from(prev).concat(itemId)));
  };

  const isItemVisible = (itemId: string) => visibleItems.has(itemId);
  const isItemCompleted = (itemId: string) => completedItems.has(itemId);

  return {
    visibleItems,
    completedItems,
    toggleItem,
    completeItem,
    isItemVisible,
    isItemCompleted
  };
}
