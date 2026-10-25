import { Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileEmailCardProps {
  email: string;
  setEmail: (value: string) => void;
  saving: string | null;
  onUpdateEmail: () => Promise<void> | void;
}

export function ProfileEmailCard({
  email,
  setEmail,
  saving,
  onUpdateEmail,
}: ProfileEmailCardProps) {
  return (
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
            <Button
              onClick={onUpdateEmail}
              disabled={saving === "email"}
              className="shrink-0 min-h-[44px]"
            >
              {saving === "email" ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Será enviado um email de confirmação para o novo endereço
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
