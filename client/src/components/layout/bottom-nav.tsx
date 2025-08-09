import { Home, Dumbbell, List, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNavigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Início", icon: Home, path: "/" },
    { id: "exercises", label: "Exercícios", icon: Dumbbell, path: "/exercicios" },
    { id: "workouts", label: "Treinos", icon: List, path: "/treinos" },
    { id: "progress", label: "Progresso", icon: TrendingUp, path: "/progress" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-950/98 to-slate-950/95 backdrop-blur-2xl border-t border-slate-700/40 shadow-2xl shadow-black/50">
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
                    ? "bg-gradient-to-t from-blue-500/20 to-blue-500/10" 
                    : "hover:bg-slate-800/30"
                }`}
              >
                <div className={`relative p-1 rounded-lg transition-all duration-200 ${
                  isActive ? "bg-blue-500/20" : ""
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-200 ${
                    isActive 
                      ? "text-blue-400 scale-110" 
                      : "text-slate-500 group-hover:text-slate-300"
                  }`} />
                </div>
                <span className={`text-[10px] font-medium mt-1 transition-all duration-200 ${
                  isActive 
                    ? "text-blue-300" 
                    : "text-slate-500 group-hover:text-slate-400"
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
