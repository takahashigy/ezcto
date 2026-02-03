import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LaunchV2 from "./pages/LaunchV2";
import ProjectDetails from "./pages/ProjectDetails";
import LaunchV2Preview from "./pages/LaunchV2Preview";
import PaymentHistory from "./pages/PaymentHistory";
import AdminWhitelist from "./pages/AdminWhitelist";
import AdminFreePeriod from "./pages/AdminFreePeriod";
import { useEffect } from "react";
import { toast } from "sonner";

function Router() {
  const [location, setLocation] = useLocation();

  // Check for unfinished project on mount
  useEffect(() => {
    const checkUnfinishedProject = () => {
      const stored = localStorage.getItem('currentGeneratingProject');
      if (!stored) return;

      try {
        const { projectId, projectName, timestamp } = JSON.parse(stored);
        
        // Only show if timestamp is within last 24 hours
        const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSince > 24) {
          localStorage.removeItem('currentGeneratingProject');
          return;
        }

        // Don't show if already on preview page
        if (location.includes('/launch/preview')) return;

        // Show toast with action
        toast.info(
          `You have a project "${projectName}" in progress`,
          {
            description: 'Click to continue viewing the generation progress',
            duration: 10000,
            action: {
              label: 'View Progress',
              onClick: () => setLocation(`/launch/preview?projectId=${projectId}`),
            },
          }
        );
      } catch (error) {
        console.error('Failed to parse stored project:', error);
        localStorage.removeItem('currentGeneratingProject');
      }
    };

    // Check after a short delay to ensure auth is loaded
    const timer = setTimeout(checkUnfinishedProject, 1000);
    return () => clearTimeout(timer);
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/launch"} component={LaunchV2} />
      <Route path={"/launch/preview"} component={LaunchV2Preview} />
      <Route path={"/project/:id"} component={ProjectDetails} />
      <Route path={"/payment-history"} component={PaymentHistory} />
      <Route path={"/admin/whitelist"} component={AdminWhitelist} />
      <Route path={"/admin/free-period"} component={AdminFreePeriod} />
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
        defaultTheme="light"
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
