import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chords from "./pages/Chords";
import Scales from "./pages/Scales";
import Missions from "./pages/Missions";
import Achievements from "./pages/Achievements";
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Songs from "./pages/Songs";
import SongDetail from "./pages/SongDetail";
import Practice from "./pages/Practice";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chords"} component={Chords} />
      <Route path={"/scales"} component={Scales} />
      <Route path={"/missions"} component={Missions} />
      <Route path={"/achievements"} component={Achievements} />
       <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path={"/songs"} component={Songs} />
      <Route path={"/songs/:id"} component={SongDetail} />
      <Route path={"/practice"} component={Practice} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
