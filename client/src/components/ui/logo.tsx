import { Zap } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gradient-to-br from-primary via-blue-500 to-blue-600 dark:from-primary dark:via-blue-400 dark:to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/25 border border-primary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <span className="text-white text-2xl font-black tracking-tight relative z-10 drop-shadow-sm">
          G
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-wider uppercase">
          <span className="text-slate-700 dark:text-slate-300 font-black">
            GYM
          </span>
          <span className="bg-gradient-to-r from-primary via-blue-500 to-blue-600 dark:from-primary dark:via-blue-400 dark:to-blue-500 bg-clip-text text-transparent font-black tracking-widest transform scale-y-110 inline-block">
            SEVEN
          </span>
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Treine. Registre. Evolua.</p>
      </div>
    </div>
  );
}
