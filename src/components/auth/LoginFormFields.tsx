import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "register";

interface LoginFormFieldsProps {
  mode: Mode;
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export function LoginFormFields({
  mode,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
}: LoginFormFieldsProps) {
  return (
    <>
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-medium">
            Nome
          </Label>
          <Input
            id="name"
            name="name"
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
          name="email"
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
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          required
          className="h-11"
        />
      </div>
    </>
  );
}
