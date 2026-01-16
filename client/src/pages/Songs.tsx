import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SongCard } from '@/components/songs/SongCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useSongStore } from '@/stores/useSongStore';
import { songs, genres, difficulties, getSongsByGenre, getSongsByDifficulty, searchSongs, Song } from '@/data/songs';
import { Search, Heart, Music2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Songs() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [genreFilter, setGenreFilter] = useState<Song['genre'] | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<Song['difficulty'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [, setLocation] = useLocation();
  
  const { xp, level, xpToNextLevel, currentStreak } = useGamificationStore();
  const { favorites } = useSongStore();
  
  const userName = "João";
  
  // Filter songs
  let filteredSongs = songs;
  
  if (searchQuery) {
    filteredSongs = searchSongs(searchQuery);
  } else {
    if (genreFilter !== 'all') {
      filteredSongs = getSongsByGenre(genreFilter);
    }
    if (difficultyFilter !== 'all') {
      filteredSongs = filteredSongs.filter(song => song.difficulty === difficultyFilter);
    }
  }
  
  if (showFavoritesOnly) {
    filteredSongs = filteredSongs.filter(song => favorites.includes(song.id));
  }
  
  const handleSongClick = (songId: string) => {
    setLocation(`/songs/${songId}`);
  };
  
  return (
    <>
      {/* DESKTOP VERSION */}
      <div className="hidden lg:flex h-screen bg-[#0f0f1a] text-white overflow-hidden">
        <Sidebar 
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8 space-y-6">
            {/* Header */}
            <header>
              <h1 className="text-4xl font-bold text-white mb-2">Biblioteca de Músicas</h1>
              <p className="text-gray-400">{filteredSongs.length} músicas brasileiras para praticar</p>
            </header>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por música, artista ou letra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                variant={showFavoritesOnly ? 'default' : 'outline'}
                className={
                  showFavoritesOnly
                    ? 'bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white'
                    : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                }
              >
                <Heart className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                Favoritas ({favorites.length})
              </Button>
              
              <div className="w-px h-8 bg-white/10"></div>
              
              {/* Genre Filters */}
              <Button
                onClick={() => setGenreFilter('all')}
                variant={genreFilter === 'all' ? 'default' : 'outline'}
                className={
                  genreFilter === 'all'
                    ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white'
                    : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                }
              >
                Todos os Gêneros
              </Button>
              {genres.map((genre) => (
                <Button
                  key={genre}
                  onClick={() => setGenreFilter(genre)}
                  variant={genreFilter === genre ? 'default' : 'outline'}
                  className={
                    genreFilter === genre
                      ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white'
                      : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                  }
                >
                  {genre}
                </Button>
              ))}
              
              <div className="w-px h-8 bg-white/10"></div>
              
              {/* Difficulty Filters */}
              <Button
                onClick={() => setDifficultyFilter('all')}
                variant={difficultyFilter === 'all' ? 'default' : 'outline'}
                className={
                  difficultyFilter === 'all'
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white'
                    : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                }
              >
                Todas Dificuldades
              </Button>
              {difficulties.map((difficulty) => (
                <Button
                  key={difficulty}
                  onClick={() => setDifficultyFilter(difficulty)}
                  variant={difficultyFilter === difficulty ? 'default' : 'outline'}
                  className={
                    difficultyFilter === difficulty
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white'
                      : 'bg-transparent border-white/20 text-gray-300 hover:bg-white/5'
                  }
                >
                  {difficulty === 'beginner' ? 'Iniciante' : difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                </Button>
              ))}
            </div>
            
            {/* Songs Grid */}
            {filteredSongs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onClick={() => handleSongClick(song.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Music2 className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Nenhuma música encontrada</h3>
                <p className="text-gray-500">Tente ajustar os filtros ou buscar por outro termo</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* MOBILE VERSION */}
      <div className="lg:hidden min-h-screen bg-[#0f0f1a] text-white">
        <MobileSidebar 
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          userName={userName}
          userLevel={level}
          currentXP={xp}
          xpToNextLevel={xpToNextLevel}
          streak={currentStreak}
        />
        
        <MobileHeader 
          userName={userName}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="px-5 py-5 space-y-5 pb-24">
          <header>
            <h1 className="text-2xl font-bold text-white mb-1">Músicas</h1>
            <p className="text-sm text-gray-400">{filteredSongs.length} músicas</p>
          </header>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              variant={showFavoritesOnly ? 'default' : 'outline'}
              className={
                showFavoritesOnly
                  ? 'bg-gradient-to-r from-[#ec4899] to-[#db2777] text-white whitespace-nowrap'
                  : 'bg-transparent border-white/20 text-gray-300 whitespace-nowrap'
              }
            >
              <Heart className={`w-3 h-3 mr-1 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              Favoritas
            </Button>
            {genres.map((genre) => (
              <Button
                key={genre}
                size="sm"
                onClick={() => setGenreFilter(genre === genreFilter ? 'all' : genre)}
                variant={genreFilter === genre ? 'default' : 'outline'}
                className={
                  genreFilter === genre
                    ? 'bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white whitespace-nowrap'
                    : 'bg-transparent border-white/20 text-gray-300 whitespace-nowrap'
                }
              >
                {genre}
              </Button>
            ))}
          </div>
          
          {/* Songs List */}
          {filteredSongs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => handleSongClick(song.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Music2 className="w-12 h-12 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-400 mb-1">Nenhuma música</h3>
              <p className="text-sm text-gray-500">Ajuste os filtros</p>
            </div>
          )}
        </main>
        
        <MobileBottomNav />
      </div>
    </>
  );
}
