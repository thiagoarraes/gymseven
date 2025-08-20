
export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/25 border border-primary/30 relative overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-blue-600 dark:from-primary dark:via-blue-400 dark:to-blue-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 100 100" 
          className="relative z-10 drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g7Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          
          {/* Logo G7 integrado - design criativo e moderno */}
          <g fill="url(#g7Gradient)">
            {/* Contorno principal do G com curva do 7 */}
            <path 
              d="M 15 25 
                 C 15 15, 25 5, 40 5 
                 L 75 5 
                 L 75 15 
                 L 55 15 
                 L 45 95 
                 L 35 95 
                 L 42 25 
                 L 40 25 
                 C 30 25, 25 30, 25 40 
                 L 25 75 
                 C 25 85, 30 90, 40 90 
                 L 60 90 
                 C 70 90, 75 85, 75 75 
                 L 75 55 
                 L 55 55 
                 L 55 45 
                 L 85 45 
                 L 85 75 
                 C 85 90, 75 100, 60 100 
                 L 40 100 
                 C 25 100, 15 90, 15 75 
                 L 15 25 Z"
              fillRule="evenodd"
            />
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
