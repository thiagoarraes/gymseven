import { Home, Dumbbell, List, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNavigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Início", icon: Home, path: "/" },
    { id: "exercises", label: "Exercícios", icon: Dumbbell, path: "/exercicios" },
    { id: "workouts", label: "Treinos", icon: List, path: "/treinos" },
    { id: "progress", label: "Progresso", icon: TrendingUp, path: "/progresso" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glassmorphism border-t border-border/40 shadow-2xl">
      <div className="safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`group relative flex flex-col items-center justify-center min-w-[64px] px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-t from-primary/20 to-primary/10" 
                    : "hover:bg-accent/30"
                }`}
              >
                <div className={`relative p-1 rounded-lg transition-all duration-200 ${
                  isActive ? "bg-primary/20" : ""
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-200 ${
                    isActive 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground group-hover:text-foreground"
                  }`} />
                </div>
                <span className={`text-[10px] font-medium mt-1 transition-all duration-200 ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
