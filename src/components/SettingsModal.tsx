import { X, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, credits, logout } = useAuth();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl text-foreground">Profile & Credits</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-background space-y-6">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full border border-border object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-heading font-bold text-base text-foreground truncate">{user?.displayName || "Account"}</h4>
              <p className="text-sm text-muted-foreground font-data truncate">{user?.email}</p>
              {user?.uid && <p className="text-xs text-muted-foreground/60 font-data uppercase mt-1 truncate">ID: {user.uid}</p>}
            </div>
          </div>

          <div className="bg-[#E8F3F1] border border-[#34A853]/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-heading font-bold text-[#34A853]">Remaining Credits</span>
              <p className="text-xs text-[#34A853]/80">Used for AI Extraction</p>
            </div>
            <span className="text-3xl font-data font-extrabold text-[#34A853]">{credits}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-heading font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 rounded-lg transition-colors w-full justify-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
