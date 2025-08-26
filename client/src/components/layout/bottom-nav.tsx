import { Home, Dumbbell, List, Trophy } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNavigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Início", icon: Home, path: "/" },
    { id: "exercises", label: "Exercícios", icon: Dumbbell, path: "/exercicios" },
    { id: "workouts", label: "Treinos", icon: List, path: "/treinos" },
    { id: "progress", label: "Conquistas", icon: Trophy, path: "/progresso" },
  ];

  return (
    <nav className="glassmorphism border-t border-border/20 shadow-2xl mobile-safe-bottom backdrop-blur-xl">
      <div className="safe-area-bottom mobile-optimized">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => navigate(item.path)}
                className={`nav-item-mobile touch-feedback mobile-focus ${
                  isActive 
                    ? "bg-gradient-to-t from-primary/25 to-primary/10" 
                    : "hover:bg-accent/30 active:bg-accent/50"
                }`}
              >
                <div className={`relative p-2 rounded-lg transition-all duration-200 ${
                  isActive ? "bg-primary/20 shadow-sm" : ""
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-200 ${
                    isActive 
                      ? "text-primary scale-110 filter drop-shadow-sm" 
                      : "text-muted-foreground group-hover:text-foreground"
                  }`} />
                  {isActive && <div className="nav-indicator"></div>}
                </div>
                <span className={`mobile-caption font-semibold mt-1 transition-all duration-200 leading-tight ${
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
