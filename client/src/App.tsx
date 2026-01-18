import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPWA } from '@/components/InstallPWA';
import { OfflineStatus } from '@/components/offline/OfflineStatus';
import { usePWA } from '@/hooks/usePWA';
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chords from "./pages/Chords";
import Scales from "./pages/Scales";
import Missions from "./pages/Missions";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import Tuner from "./pages/Tuner";
import Settings from './pages/Settings';
import Songs from "./pages/Songs";
import SongDetail from "./pages/SongDetail";
import Practice from "./pages/Practice";
import { ChordPractice } from "./pages/ChordPractice";
import Theory from "./pages/Theory";
import Explore from "./pages/Explore";
import { TrainingDashboard } from "./pages/TrainingDashboard";

function Router() {
  return (
    <Switch>
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
  );
}

function App() {
  const { isInstalled } = usePWA();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <Router />
            <InstallPWA />
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;