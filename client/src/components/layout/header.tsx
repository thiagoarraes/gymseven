import { User, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-slate-800/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center space-x-2">
            <div className="glass-card rounded-full p-2 hover-lift cursor-pointer">
              <User className="text-blue-400 w-4 h-4" />
            </div>
            <div className="glass-card rounded-full p-2 hover-lift cursor-pointer">
              <Settings className="text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
