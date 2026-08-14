import { useActionState, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // React 19 form action (rule-45): submit via <form action> — o botão deriva
  // pending de useFormStatus, sem estado de carregamento manual.
  const [error, formAction] = useActionState<{ message: string | null }, FormData>(
    async (_prev, formData) => {
      const em = String(formData.get("email") ?? "");
      const errMsg = await resetPassword(em);
      if (errMsg) {
        return { message: errMsg };
      }
      setSent(true);
      return { message: null };
    },
    { message: null },
  );

  if (sent) {
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
          </div>

          <Card className="border-primary/10 shadow-elegant animate-slide-up">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg font-display text-center">Email enviado!</CardTitle>
              <CardDescription className="text-sm font-body text-center">
                Enviamos um link de redefinição de senha para <strong>{email}</strong>. Verifique
                sua caixa de entrada e spam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground text-center">
                O link expira em 1 hora. Se não encontrar o email, verifique a pasta de spam.
              </p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </Link>
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
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Recuperar acesso à sua conta
          </p>
        </div>

        <Card className="border-primary/10 shadow-elegant animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Esqueceu sua senha?</CardTitle>
            <CardDescription className="text-sm font-body">
              Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11"
                />
              </div>

              {error?.message && (
                <div className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2 font-medium">
                  {error.message}
                </div>
              )}

              <FormSubmitButton className="w-full h-11 gap-2" pendingLabel="Enviando...">
                <Mail className="w-4 h-4" />
                Enviar link de recuperação
              </FormSubmitButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button asChild variant="ghost" className="w-full gap-2">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
