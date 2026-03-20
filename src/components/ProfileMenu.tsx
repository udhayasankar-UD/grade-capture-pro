import { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut, ChevronDown, Coins, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SettingsModal } from "@/components/SettingsModal";

export function ProfileMenu() {
  const { user, credits, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-muted p-1 sm:px-3 sm:py-2 rounded-lg transition-colors border border-transparent hover:border-border"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-border object-cover bg-background shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="hidden md:flex flex-col items-start min-w-[80px]">
          <span className="text-xs font-heading font-bold text-foreground line-clamp-1 break-all">
            {user.displayName || user.email?.split('@')[0] || "Account"}
          </span>
          <span className="text-[10px] text-muted-foreground font-data font-semibold">
            {credits} Credits
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground hidden md:block transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="flex flex-col gap-1 mb-1">
              <p className="text-lg font-bold text-muted-foreground truncate" title={user.email || ""}>{user.email}</p>
            </div>
            {user.uid && (
               <p className="text-[11px] text-muted-foreground/60 font-data uppercase tracking-wider mt-2 truncate">ID: {user.uid}</p>
            )}
          </div>
          <div className="p-2 border-b border-border">
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#E8F3F1] rounded-lg border border-[#34A853]/20">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#34A853]" />
                <span className="text-sm font-heading font-bold text-[#34A853]">Credits</span>
              </div>
              <span className="text-base font-data font-extrabold text-[#34A853]">{credits}</span>
            </div>
          </div>
          <div className="p-2 border-b border-border">
            <button
              onClick={() => { setIsSettingsOpen(true); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-heading font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              Settings
            </button>
          </div>
          <div className="p-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-heading font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
