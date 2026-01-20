/**
 * Floating Action Button (FAB)
 * Menu radial com ações frequentes: Afinador, Metrônomo, Gravar Áudio, Assistente IA
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { 
  Plus, 
  X, 
  Guitar, 
  Timer, 
  Mic, 
  Sparkles,
  Music,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const FAB_ACTIONS: FABAction[] = [
  {
    id: 'tuner',
    label: 'Afinador',
    icon: <Guitar className="w-5 h-5" />,
    path: '/tuner',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'metronome',
    label: 'Metrônomo',
    icon: <Timer className="w-5 h-5" />,
    path: '/practice',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'record',
    label: 'Gravar Áudio',
    icon: <Mic className="w-5 h-5" />,
    path: '/practice',
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'ai',
    label: 'Assistente IA',
    icon: <Sparkles className="w-5 h-5" />,
    path: '/',
    color: 'from-purple-500 to-pink-500'
  }
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  // Não mostrar na home
  if (location === '/') {
    return null;
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (path: string) => {
    setIsOpen(false);
    // Navegação será feita pelo Link
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 mb-2 space-y-3"
          >
            {FAB_ACTIONS.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={action.path}>
                  <button
                    onClick={() => handleActionClick(action.path)}
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${action.color} shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white group relative`}
                  >
                    {action.icon}
                    <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {action.label}
                    </span>
                  </button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Principal */}
      <motion.button
        onClick={toggleMenu}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
