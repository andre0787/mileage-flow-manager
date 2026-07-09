import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Loader2, Key, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Supabase appends #access_token=... to the URL after the user clicks the magic link
    // The onAuthStateChange event will fire with "PASSWORD_RECOVERY"
    // We just need to wait for the session to be established
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      // Session will be set by onAuthStateChange in AuthContext
      setVerifying(false);
    } else {
      // Check if already authenticated via magic link
      const timer = setTimeout(() => {
        if (!user) {
          setError("Link inválido ou expirado. Solicite um novo link de recuperação.");
        }
        setVerifying(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const errMsg = await updatePassword(password);
    setLoading(false);

    if (errMsg) {
      setError(errMsg);
    } else {
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Verificando link de recuperação...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="relative w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl shadow-elegant mb-4">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold font-display mb-2">Senha redefinida!</h2>
          <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  if (!user && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="relative w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl shadow-elegant mb-4">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <Card className="border-destructive/20 shadow-elegant">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-lg font-display">Link inválido</CardTitle>
              <CardDescription className="text-sm">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="/forgot-password">Solicitar novo link</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/[0.04] rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl shadow-elegant mb-4">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">MilesControl</h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">Redefina sua senha</p>
        </div>

        <Card className="border-primary/10 shadow-elegant animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Nova senha</CardTitle>
            <CardDescription className="text-sm font-body">
              Escolha uma senha forte para sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">
                  Nova senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2 font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Redefinir senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
