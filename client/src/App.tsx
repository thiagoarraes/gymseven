import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-nav";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Workouts from "@/pages/workouts";
import Progress from "@/pages/progress";
import WorkoutSession from "@/pages/workout-session";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="pt-20 pb-20">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/exercises" component={Exercises} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/progress" component={Progress} />
          <Route path="/workout-session/:id" component={WorkoutSession} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
