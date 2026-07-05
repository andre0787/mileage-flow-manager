import { useState } from "react";
import { User, Mail, Lock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Perfil() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.user_metadata?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdateName = async () => {
    if (!name.trim()) { toast.error("Nome não pode ficar vazio"); return; }
    setSaving("name");
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    if (error) toast.error(error.message);
    else toast.success("Nome atualizado com sucesso");
    setSaving(null);
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) { toast.error("Email não pode ficar vazio"); return; }
    setSaving("email");
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) toast.error(error.message);
    else toast.success("Email de confirmação enviado para o novo endereço");
    setSaving(null);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) { toast.error("Digite sua senha atual"); return; }
    if (!newPassword || newPassword.length < 6) { toast.error("Nova senha deve ter no mínimo 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("Senhas não conferem"); return; }
    setSaving("password");

    // Verifica senha atual antes de alterar
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (signInError) { toast.error("Senha atual incorreta"); setSaving(null); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Senha atualizada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6 animate-appear">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações de conta
          </p>
        </div>
      </div>

      {/* Nome */}
      <Card className="shadow-card animate-appear animate-delay-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="flex-1"
              />
              <Button onClick={handleUpdateName} disabled={saving === "name"} className="shrink-0 min-h-[44px]">
                {saving === "name" ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Email atual:</span> {user?.email}
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="shadow-card animate-appear animate-delay-400">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Novo Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1"
              />
              <Button onClick={handleUpdateEmail} disabled={saving === "email"} className="shrink-0 min-h-[44px]">
                {saving === "email" ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Será enviado um email de confirmação para o novo endereço
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Senha */}
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>
          <Button
            onClick={handleUpdatePassword}
            disabled={saving === "password"}
            className="bg-gradient-primary hover:opacity-90 min-h-[44px]"
          >
            {saving === "password" ? "Alterando..." : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
