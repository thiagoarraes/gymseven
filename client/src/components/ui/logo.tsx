import logoImage from "../../assets/logo.jpg";

export function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden bg-black">
        <img 
          src={logoImage} 
          alt="GymSeven Logo" 
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-wider uppercase">
          <span className="text-slate-700 dark:text-slate-300 font-black">
            GYM
          </span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent font-black tracking-widest transform scale-y-110 inline-block">
            SEVEN
          </span>
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Treine. Registre. Evolua.</p>
      </div>
    </div>
  );
}
