import { useActionState, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth";
import { useI18n } from "@/contexts/I18nContext";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { logError } from "@/lib/logger";
import { LoginBrandHeader } from "@/components/auth/LoginBrandHeader";
import { LoginFormFields } from "@/components/auth/LoginFormFields";

function mapAuthError(errMsg: string, t: (key: string) => string): string {
  if (errMsg.includes("Invalid login credentials")) return t("auth.invalidCredentials");
  if (errMsg.includes("User already registered")) return t("auth.emailAlreadyRegistered");
  if (errMsg.includes("Password should be at least")) return t("auth.passwordTooShort");
  if (errMsg.includes("Unable to validate email address")) return t("auth.invalidEmail");
  if (errMsg.includes("Email not confirmed")) return t("auth.emailNotConfirmed");
  return t("auth.authError");
}

type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [error, formAction] = useActionState<{ message: string | null }, FormData>(
    async (_prev, formData) => {
      const em = String(formData.get("email") ?? "");
      const pw = String(formData.get("password") ?? "");
      const nm = String(formData.get("name") ?? "");
      const errMsg = mode === "login" ? await signIn(em, pw) : await signUp(em, pw, nm);
      if (errMsg) {
        logError(`auth_${mode}`, errMsg);
        return { message: mapAuthError(errMsg, t) };
      }
      navigate("/");
      return { message: null };
    },
    { message: null },
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4 relative overflow-hidden">
      <LoginBrandHeader />

      <div className="relative w-full max-w-md">
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
            <form action={formAction} className="space-y-4">
              <LoginFormFields
                mode={mode}
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
              />

              {error?.message && (
                <div className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2 font-medium">
                  {error.message}
                </div>
              )}

              <FormSubmitButton className="w-full h-11 gap-2" pendingLabel="Aguarde...">
                {mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="w-4 h-4" />
              </FormSubmitButton>

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
                      onClick={() => setMode("register")}
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
                      onClick={() => setMode("login")}
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
