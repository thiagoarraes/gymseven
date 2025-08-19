import { Zap } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/25 border border-emerald-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <Zap className="text-white w-7 h-7 drop-shadow-sm relative z-10" />
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight relative">
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            GYM
          </span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">
            SEVEN
          </span>
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full opacity-80"></div>
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">gerenciador de treino do @thiagoseven</p>
      </div>
    </div>
  );
}
