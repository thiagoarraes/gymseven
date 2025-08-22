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
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Até logo! Volte sempre ao GymSeven.",
    });
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.username?.charAt(0).toUpperCase() || "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border/50 mobile-safe-header">
      <div className="mobile-container mx-auto py-3">
        <div className="flex items-center justify-between">
          <Logo imagePath="/src/assets/logo.png" alt="GymSeven" />
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="glass-card rounded-full p-1 hover-lift cursor-pointer touch-feedback mobile-touch-target" data-testid="user-menu-trigger">
                  <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username || ""} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 sm:w-56 bg-card/95 border-border backdrop-blur-sm mr-2 mobile-glass" sideOffset={8}>
                <div className="px-3 py-2">
                  <p className="mobile-body font-semibold text-foreground truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username}
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
                <Link href="/settings">
                  <DropdownMenuItem className="mobile-button text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer mobile-focus" data-testid="menu-settings">
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Configurações</span>
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
