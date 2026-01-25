import { lazy, Suspense } from 'react';
import { AudioInitButton } from "./components/audio/AudioInitButton";
import { VolumeControl } from "./components/audio/VolumeControl";
import { AudioErrorDisplay } from "./components/audio/AudioErrorDisplay";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPWA } from '@/components/InstallPWA';
import { UpdateBanner } from '@/components/UpdateBanner';
import { usePWA } from '@/hooks/usePWA';
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useUserStore } from "./stores/useUserStore";
import { useEffect } from "react";
import { FloatingActionButton } from "./components/layout/FloatingActionButton";
import { useAudioNavigationGuard } from './hooks/useAudioNavigationGuard';

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Chords = lazy(() => import("./pages/Chords"));
const Scales = lazy(() => import("./pages/Scales"));
const Missions = lazy(() => import("./pages/Missions"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Profile = lazy(() => import("./pages/Profile"));
const Tuner = lazy(() => import("./pages/Tuner"));
const Settings = lazy(() => import("./pages/Settings"));
const Songs = lazy(() => import("./pages/Songs"));
const SongDetail = lazy(() => import("./pages/SongDetail"));
const Practice = lazy(() => import("./pages/Practice"));
const ChordPractice = lazy(() => import("./pages/ChordPractice").then(m => ({ default: m.ChordPractice })));
const Theory = lazy(() => import("./pages/Theory"));
const Explore = lazy(() => import("./pages/Explore"));
const TrainingDashboard = lazy(() => import("./pages/TrainingDashboard").then(m => ({ default: m.TrainingDashboard })));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, refreshUser } = useUserStore();
  
  // Proteger áudio durante navegação
  useAudioNavigationGuard();

  useEffect(() => {
    // Verificar autenticação ao carregar
    refreshUser();
  }, [refreshUser]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/auth" component={Auth} />
        <Route path="/" component={Home} />
        <Route path="/chords" component={Chords} />
        <Route path="/scales" component={Scales} />
        <Route path="/missions" component={Missions} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/profile" component={Profile} />
        <Route path="/tuner" component={Tuner} />
        <Route path="/settings" component={Settings} />
        <Route path="/songs" component={Songs} />
        <Route path="/song/:id" component={SongDetail} />
        <Route path="/practice" component={Practice} />
        <Route path="/chord-practice/:chord" component={ChordPractice} />
        <Route path="/theory" component={Theory} />
        <Route path="/explore" component={Explore} />
        <Route path="/training" component={TrainingDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const { isInstalled } = usePWA();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <UpdateBanner />
            {/* Botão para inicializar o contexto de áudio global */}
            <div className="fixed top-4 left-4 z-50">
              <AudioInitButton />
            </div>
            {/* Controle de volume global do sistema de áudio */}
            <div className="fixed top-4 right-4 z-50">
              <VolumeControl />
            </div>
            <Router />
            <FloatingActionButton />
            <InstallPWA />
            <AudioErrorDisplay compact={true} />
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;