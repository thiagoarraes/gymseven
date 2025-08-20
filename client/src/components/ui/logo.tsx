interface LogoProps {
  imagePath?: string;
  alt?: string;
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <h1 className="text-3xl font-black tracking-tight select-none">
        <span className="bg-gradient-to-r from-orange-500 via-red-500 to-red-600 dark:from-orange-400 dark:via-red-400 dark:to-red-500 bg-clip-text text-transparent font-black italic tracking-wide transform skew-x-[-8deg] inline-block drop-shadow-sm">
          GymSeven
        </span>
      </h1>
    </div>
  );
}