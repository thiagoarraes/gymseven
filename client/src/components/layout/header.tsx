import { User, Settings, LogOut } from "lucide-react";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context-new";

export function Header() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo! Volte sempre ao GymSeven.",
    });
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const username = user.username || user.email || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || username.charAt(0).toUpperCase() || "U";
  };

  return (
    <header className="glassmorphism border-b border-border/50">
      <div className="mobile-container mx-auto h-16 flex items-center">
        <div className="flex items-center justify-between w-full">
          <Logo imagePath="/src/assets/logo.png" alt="GymSeven" />
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="glass-card rounded-full p-1 hover-lift cursor-pointer touch-feedback mobile-touch-target" data-testid="user-menu-trigger">
                  <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={user?.username || user?.email || ""} 
                      key={user?.profileImageUrl} // Force re-render when avatar changes
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 sm:w-56 bg-slate-900/98 border-slate-700 backdrop-blur-lg mr-2 shadow-2xl shadow-black/40" sideOffset={8}>
                <div className="px-3 pb-2 pt-1">
                  <p className="mobile-body font-semibold text-foreground truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || user?.email}
                  </p>
                  <p className="mobile-caption text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <Link href="/profile">
                  <DropdownMenuItem className="mobile-button text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer mobile-focus" data-testid="menu-profile">
                    <User className="mr-3 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  className="mobile-button text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer mobile-focus"
                  onClick={handleLogout}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
