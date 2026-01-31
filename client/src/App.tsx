import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LaunchV2 from "./pages/LaunchV2";
import Templates from "./pages/Templates";
import ProjectDetails from "./pages/ProjectDetails";
import Supply from "./pages/Supply";
import Store from "./pages/Store";
import CustomOrder from "./pages/CustomOrder";
import LaunchV2Preview from "./pages/LaunchV2Preview";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/launch"} component={LaunchV2} />
      <Route path={"/launch/preview"} component={LaunchV2Preview} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/supply"} component={Supply} />
      <Route path={"/store"} component={Store} />
      <Route path={"/custom-order"} component={CustomOrder} />
      <Route path={"/project/:id"} component={ProjectDetails} />
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
