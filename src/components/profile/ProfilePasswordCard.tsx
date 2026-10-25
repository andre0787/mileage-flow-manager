import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfilePasswordCardProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  saving: string | null;
  onUpdatePassword: () => Promise<void> | void;
}

export function ProfilePasswordCard({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  saving,
  onUpdatePassword,
}: ProfilePasswordCardProps) {
  return (
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
          onClick={onUpdatePassword}
          disabled={saving === "password"}
          className="bg-gradient-primary hover:opacity-90 min-h-[44px]"
        >
          {saving === "password" ? "Alterando..." : "Alterar Senha"}
        </Button>
      </CardContent>
    </Card>
  );
}
