import { motion } from 'framer-motion';
import { Heart, Music, Play, Lock } from 'lucide-react';
import { Song } from '@/data/songs';
import { useSongStore } from '@/stores/useSongStore';
import { useSongUnlockStore } from '@/stores/useSongUnlockStore';

interface SongCardProps {
  song: Song;
  onClick: () => void;
}

const genreColors: Record<Song['genre'], string> = {
  'MPB': 'from-[#a855f7] to-[#8b5cf6]',
  'Bossa Nova': 'from-[#06b6d4] to-[#0891b2]',
  'Samba': 'from-[#f97316] to-[#ea580c]',
  'Rock': 'from-[#ec4899] to-[#db2777]',
  'Sertanejo': 'from-[#10b981] to-[#059669]',
  'Forró': 'from-[#eab308] to-[#ca8a04]',
};

const difficultyLabels: Record<Song['difficulty'], string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export function SongCard({ song, onClick }: SongCardProps) {
  const { isFavorite, toggleFavorite } = useSongStore();
  const { isSongUnlocked } = useSongUnlockStore();
  const favorite = isFavorite(song.id);
  const isUnlocked = isSongUnlocked(song.id);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(song.id);
  };
  
  return (
    <motion.div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl bg-[#1a1a2e]/60 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${genreColors[song.genre]} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${genreColors[song.genre]} text-white text-xs font-semibold`}>
            {song.genre}
          </div>
          
          <button
            onClick={handleFavoriteClick}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        </div>
        
        {/* Title & Artist */}
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{song.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{song.artist}</p>
        
        {/* Info */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {song.key}
          </span>
          <span>•</span>
          <span>{song.bpm} BPM</span>
          <span>•</span>
          <span>{difficultyLabels[song.difficulty]}</span>
        </div>
        
        {/* Chords */}
        <div className="flex flex-wrap gap-2 mb-4">
          {song.chords.slice(0, 5).map((chord, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-md bg-white/5 text-white text-xs font-mono"
            >
              {chord}
            </span>
          ))}
          {song.chords.length > 5 && (
            <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 text-xs">
              +{song.chords.length - 5}
            </span>
          )}
        </div>
        
        {/* Play Button */}
        <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${
          isUnlocked 
            ? `bg-gradient-to-r ${genreColors[song.genre]} text-white font-semibold text-sm group-hover:shadow-lg transition-shadow`
            : 'bg-gray-600/50 text-gray-400 font-semibold text-sm cursor-not-allowed'
        }`}>
          {isUnlocked ? (
            <>
              <Play className="w-4 h-4" />
              <span>Praticar</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Bloqueada</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
