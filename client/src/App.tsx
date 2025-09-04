import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-nav";
import { AuthProvider, useAuth } from "@/contexts/supabase-auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { WorkoutProvider } from "@/contexts/workout-context";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Workouts from "@/pages/workouts";
import AchievementsPage from "@/pages/progress";
import WorkoutSession from "@/pages/workout-session";
import WorkoutTemplateEditor from "@/pages/workout-template-editor";
import WorkoutHistory from "@/pages/workout-history";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import TimerTest from "@/pages/timer-test";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyOTP from "@/pages/verify-otp";
import ForgotPassword from "@/pages/forgot-password";
import NotFound from "@/pages/not-found";

// Route wrapper components to handle params
function ExercisesRoute() {
  return <Exercises />;
}

function WorkoutTemplateEditorRoute({ params }: { params: { id: string } }) {
  return <WorkoutTemplateEditor />;
}

function AuthenticatedRouter() {
  return (
    <WorkoutProvider>
      <div className="min-h-screen bg-background" style={{ position: 'relative' }}>
        <Header />
        <BottomNavigation />
        <div className="overflow-y-auto scroll-behind-fixed" style={{ height: '100vh', paddingTop: '0px', paddingBottom: '0px' }}>
          <main className="mobile-container mobile-spacing" style={{ paddingTop: '80px', paddingBottom: '130px', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/exercicios" component={ExercisesRoute} />
              <Route path="/treinos" component={Workouts} />
              <Route path="/workout-template/:id" component={WorkoutTemplateEditorRoute} />
              <Route path="/progresso" component={AchievementsPage} />
              <Route path="/workout-session/:id" component={WorkoutSession} />
              <Route path="/workout-history" component={WorkoutHistory} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route path="/timer-test" component={TimerTest} />
              <Route path="/login" component={Dashboard} />
              <Route path="/register" component={Dashboard} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </WorkoutProvider>
  );
}

function UnauthenticatedRouter() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-otp" component={VerifyOTP} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    </div>
  );
}

function Router() {
  try {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center mobile-container">
          <div className="flex flex-col items-center mobile-spacing">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="mobile-body text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }

    return isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
  } catch (error) {
    console.error('Router error:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center mobile-container">
        <div className="flex flex-col items-center mobile-spacing">
          <p className="mobile-body text-muted-foreground">Erro de contexto. Recarregando...</p>
        </div>
      </div>
    );
  }
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
