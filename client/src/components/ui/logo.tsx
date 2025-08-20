interface LogoProps {
  imagePath?: string;
  alt?: string;
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <h1 className="text-3xl font-black tracking-tight select-none">
        <span className="bg-gradient-to-r from-[hsl(207,90%,54%)] to-[hsl(217,91%,60%)] bg-clip-text text-transparent font-black tracking-wide inline-block drop-shadow-sm">
          GymSeven
        </span>
      </h1>
    </div>
  );
}