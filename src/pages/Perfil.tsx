import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase";
import { ProfilePersonalInfoCard } from "@/components/profile/ProfilePersonalInfoCard";
import { ProfileEmailCard } from "@/components/profile/ProfileEmailCard";
import { ProfilePasswordCard } from "@/components/profile/ProfilePasswordCard";

export default function Perfil() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.user_metadata?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error("Nome não pode ficar vazio");
      return;
    }
    setSaving("name");
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    if (error) toast.error(error.message);
    else toast.success("Nome atualizado com sucesso");
    setSaving(null);
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      toast.error("Email não pode ficar vazio");
      return;
    }
    setSaving("email");
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) toast.error(error.message);
    else toast.success("Email de confirmação enviado para o novo endereço");
    setSaving(null);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error("Digite sua senha atual");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    setSaving("password");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (signInError) {
      toast.error("Senha atual incorreta");
      setSaving(null);
      return;
    }

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
          <p className="text-sm text-muted-foreground">Gerencie suas informações de conta</p>
        </div>
      </div>

      <ProfilePersonalInfoCard
        user={user}
        name={name}
        setName={setName}
        saving={saving}
        onUpdateName={handleUpdateName}
      />

      <ProfileEmailCard
        email={email}
        setEmail={setEmail}
        saving={saving}
        onUpdateEmail={handleUpdateEmail}
      />

      <ProfilePasswordCard
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        saving={saving}
        onUpdatePassword={handleUpdatePassword}
      />
    </div>
  );
}
