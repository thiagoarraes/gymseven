import { Dumbbell } from "lucide-react";

interface LogoProps {
  imagePath?: string;
  alt?: string;
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <div className="flex items-center space-x-2 group">
        {/* Icon with animation */}
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 dark:border-blue-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg backdrop-blur-sm">
            <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-10 h-10 rounded-xl bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Text with enhanced styling */}
        <h1 className="text-3xl font-black tracking-tight select-none">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-300 bg-clip-text text-transparent font-black tracking-wide inline-block drop-shadow-lg relative">
            Gym<span className="text-purple-600 dark:text-purple-400">Seven</span>
            {/* Subtle underline accent */}
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0 rounded-full opacity-60"></div>
          </span>
        </h1>
      </div>
    </div>
  );
}