
export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/25 border border-primary/30 relative overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-blue-600 dark:from-primary dark:via-blue-400 dark:to-blue-500">
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
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
            </linearGradient>
            <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Logo G7 moderno e fitness */}
          <g fill="url(#logoGradient)" filter="url(#innerGlow)">
            {/* Haltere estilizado formando G */}
            <circle cx="8" cy="24" r="4" opacity="0.8"/>
            <rect x="6" y="22" width="8" height="4" rx="2"/>
            <rect x="12" y="23" width="12" height="2" rx="1"/>
            
            {/* Parte principal do G */}
            <path 
              d="M 24 12 
                 C 18 12, 13 17, 13 23 
                 L 13 25 
                 C 13 31, 18 36, 24 36 
                 L 30 36 
                 L 30 32 
                 L 24 32 
                 C 20 32, 17 29, 17 25 
                 L 17 23 
                 C 17 19, 20 16, 24 16 
                 L 30 16 
                 L 30 20 
                 L 26 20 
                 L 26 24 
                 L 34 24 
                 L 34 12 
                 L 24 12 Z"
              strokeWidth="0.5"
              stroke="rgba(255,255,255,0.4)"
            />
            
            {/* Número 7 integrado e moderno */}
            <path 
              d="M 26 8 
                 L 38 8 
                 L 38 11 
                 L 31 11 
                 L 28 20 
                 L 25 20 
                 L 26 8 Z"
              opacity="0.9"
            />
            
            {/* Segundo haltere menor para equilíbrio */}
            <circle cx="40" cy="24" r="3" opacity="0.7"/>
            <rect x="38" y="22.5" width="6" height="3" rx="1.5"/>
            
            {/* Detalhes de força - linhas dinâmicas */}
            <rect x="6" y="38" width="12" height="2" rx="1" opacity="0.6"/>
            <rect x="30" y="38" width="12" height="2" rx="1" opacity="0.6"/>
            <rect x="18" y="6" width="12" height="2" rx="1" opacity="0.6"/>
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
