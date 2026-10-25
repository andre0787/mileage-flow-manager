import { User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfilePersonalInfoCardProps {
  user: User | null;
  name: string;
  setName: (value: string) => void;
  saving: string | null;
  onUpdateName: () => Promise<void> | void;
}

export function ProfilePersonalInfoCard({
  user,
  name,
  setName,
  saving,
  onUpdateName,
}: ProfilePersonalInfoCardProps) {
  return (
    <Card className="shadow-card animate-appear animate-delay-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
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
            <Button
              onClick={onUpdateName}
              disabled={saving === "name"}
              className="shrink-0 min-h-[44px]"
            >
              {saving === "name" ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Email atual:</span> {user?.email}
        </div>
      </CardContent>
    </Card>
  );
}
