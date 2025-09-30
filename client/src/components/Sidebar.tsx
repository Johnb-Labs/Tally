import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3,
  Upload,
  Map,
  Users,
  FileText,
  UserCog,
  Palette,
  Building,
  History,
  LogOut,
  Database
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { getEffectiveLogo, getEffectiveOrganizationName, currentDivision } = useBrand();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const canUpload = user.role === 'admin' || user.role === 'uploader';

  const navigationItems = [
    { path: "/", icon: BarChart3, label: "Dashboard", show: true },
    { path: "/upload", icon: Upload, label: "Import Data", show: canUpload },
    { path: "/sql-import", icon: Database, label: "SQL Import", show: canUpload },
    { path: "/field-mapping", icon: Map, label: "Field Mapping", show: canUpload },
    { path: "/contacts", icon: Users, label: "Contacts", show: true },
    { path: "/reports", icon: FileText, label: "Reports", show: true },
  ];

  const adminItems = [
    { path: "/users", icon: UserCog, label: "User Management", show: isAdmin },
    { path: "/branding", icon: Palette, label: "Branding", show: isAdmin },
    { path: "/divisions", icon: Building, label: "Divisions", show: isAdmin },
    { path: "/audit", icon: History, label: "Audit Log", show: isAdmin },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const getUserInitials = () => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || "U";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          {getEffectiveLogo() ? (
            <img
              src={getEffectiveLogo()!}
              alt={getEffectiveOrganizationName()}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {getEffectiveOrganizationName()}
            </h1>
            {currentDivision && (
              <p className="text-xs text-muted-foreground">{currentDivision.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.profileImageUrl || ""} alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) =>
          item.show ? (
            <Link key={item.path} href={item.path} onClick={onLinkClick}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                className="w-full justify-start"
                size="sm"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ) : null
        )}

        {/* Admin Section */}
        {adminItems.some(item => item.show) && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Administration
            </p>
            {adminItems.map((item) =>
              item.show ? (
                <Link key={item.path} href={item.path} onClick={onLinkClick}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ) : null
            )}
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          size="sm"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onLinkClick={() => onOpenChange?.(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-64 border-r border-border h-full">
      <SidebarContent />
    </div>
  );
}
