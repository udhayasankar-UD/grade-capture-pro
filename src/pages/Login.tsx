import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back, Professor!");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
      <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-md bg-black/40 border-neutral-800/50 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary" />
        
        <CardHeader className="space-y-1 pb-8 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <span className="text-3xl font-bold bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">தா</span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Thaal</CardTitle>
          <CardDescription className="text-neutral-400 text-base">
            Exam Grade Capture System
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Academic Email</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-neutral-900/50 border-neutral-800 pl-10 h-12 focus-visible:ring-primary/30 transition-all text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-neutral-900/50 border-neutral-800 pl-10 h-12 focus-visible:ring-primary/30 transition-all text-white"
                  required
                />
              </div>
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-primary/20" 
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pb-8">
          <div className="flex items-center justify-between w-full text-xs text-neutral-500 px-1">
             <span>Admin-Only Access</span>
             <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                System Secure
             </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
