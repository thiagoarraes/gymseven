export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border relative overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-blue-600 dark:from-primary dark:via-blue-400 dark:to-blue-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 48 48" 
          className="relative z-10 drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.95" />
              <stop offset="50%" stopColor="white" stopOpacity="0.85" />
              <stop offset="100%" stopColor="white" stopOpacity="0.75" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Logo G7 moderno e fitness */}
          <g fill="url(#logoGradient)" filter="url(#glow)">
            {/* G principal com design limpo */}
            <path 
              d="M 24 8 
                 C 16 8, 10 14, 10 22 
                 L 10 26 
                 C 10 34, 16 40, 24 40 
                 L 30 40 
                 C 32 40, 34 38, 34 36 
                 L 34 32 
                 L 26 32 
                 L 26 28 
                 L 38 28 
                 L 38 36 
                 C 38 40, 35 43, 30 43 
                 L 24 43 
                 C 14 43, 7 36, 7 26 
                 L 7 22 
                 C 7 12, 14 5, 24 5 
                 L 30 5 
                 C 35 5, 38 8, 38 13 
                 L 35 13 
                 C 35 10, 33 8, 30 8 
                 L 24 8 Z"
              strokeWidth="0.5"
              stroke="rgba(255,255,255,0.4)"
            />
            
            {/* Número 7 integrado e estilizado */}
            <path 
              d="M 30 7 
                 L 41 7 
                 L 41 10 
                 L 35 10 
                 L 31 25 
                 L 28 25 
                 L 30 7 Z"
              opacity="0.9"
            />
            
            {/* Elementos fitness - halteres estilizados */}
            <circle cx="8" cy="24" r="1.5" opacity="0.7"/>
            <circle cx="40" cy="24" r="1.5" opacity="0.7"/>
            <rect x="6" y="23" width="4" height="2" rx="1" opacity="0.7"/>
            <rect x="38" y="23" width="4" height="2" rx="1" opacity="0.7"/>
          </g>
        </svg>
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