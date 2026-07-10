import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Loader2, ArrowRight } from "lucide-react";
import { logError } from "@/lib/logger";

function mapAuthError(errMsg: string): string {
  if (errMsg.includes("Invalid login credentials")) return "Credenciais inválidas";
  if (errMsg.includes("User already registered")) return "Este email já está cadastrado";
  if (errMsg.includes("Password should be at least")) return "A senha deve ter pelo menos 6 caracteres";
  if (errMsg.includes("Unable to validate email address")) return "Email inválido";
  if (errMsg.includes("Email not confirmed")) return "Email não confirmado. Verifique sua caixa de entrada";
  return "Erro ao autenticar. Tente novamente";
}

type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const errMsg =
      mode === "login" ? await signIn(email, password) : await signUp(email, password, name);

    setLoading(false);
    if (errMsg) {
      logError(`auth_${mode}`, errMsg);
      setError(mapAuthError(errMsg));
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/[0.04] rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl shadow-elegant mb-4">
            <Plane className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">MilesControl</h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Gestão inteligente de milhas aéreas
          </p>
        </div>

        <Card className="border-primary/10 shadow-elegant animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </CardTitle>
            <CardDescription className="text-sm font-body">
              {mode === "login"
                ? "Entre com suas credenciais para continuar"
                : "Preencha os dados para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Senha
                  </Label>
                  {mode === "login" && (
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
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
                    {mode === "login" ? "Entrar" : "Criar conta"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground font-body">
                {mode === "login" ? (
                  <>
                    Novo por aqui?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-medium transition-colors min-h-[44px] inline-flex items-center"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                    >
                      Cadastre-se
                    </button>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-medium transition-colors min-h-[44px] inline-flex items-center"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                    >
                      Entrar
                    </button>
                  </>
                )}
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 font-body">
          Gerencie suas milhas com inteligência e praticidade
        </p>
      </div>
    </div>
  );
}
