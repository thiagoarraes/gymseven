import { Dumbbell } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/20">
          <Dumbbell className="text-white text-xl w-6 h-6 rotate-45" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-2 border-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse"></div>
      </div>
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
          Gym<span className="text-emerald-400">Seven</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">
          Treinos Inteligentes
        </p>
      </div>
    </div>
  );
}
