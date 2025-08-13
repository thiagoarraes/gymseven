import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-nav";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Workouts from "@/pages/workouts";
import Progress from "@/pages/progress";
import WorkoutSession from "@/pages/workout-session";
import WorkoutTemplateEditor from "@/pages/workout-template-editor";
import WorkoutHistory from "@/pages/workout-history";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

// Route wrapper components to handle params
function ExercisesRoute() {
  return <Exercises />;
}

function WorkoutTemplateEditorRoute({ params }: { params: { id: string } }) {
  return <WorkoutTemplateEditor templateId={params.id} />;
}

function AuthenticatedRouter() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-20">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/exercicios" component={ExercisesRoute} />
          <Route path="/treinos" component={Workouts} />
          <Route path="/workout-template/:id" component={WorkoutTemplateEditorRoute} />
          <Route path="/progresso" component={Progress} />
          <Route path="/workout-session/:id" component={WorkoutSession} />
          <Route path="/workout-history" component={WorkoutHistory} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/login" component={Dashboard} />
          <Route path="/register" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
    </div>
  );
}

function UnauthenticatedRouter() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    </div>
  );
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
