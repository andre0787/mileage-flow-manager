/**
 * Sistema simples de i18n (internacionalização).
 * Suporta pt-BR (padrão) e en-US.
 */

export type Locale = "pt-BR" | "en-US";

const translations: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    // Navigation
    "nav.dashboard": "Resumo",
    "nav.entries": "Entradas",
    "nav.sales": "Vendas",
    "nav.clients": "Clientes",
    "nav.profiles": "Perfil",
    "nav.settings": "Configurações",
    "nav.reports": "Relatórios",

    // Common
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.delete": "Excluir",
    "common.edit": "Editar",
    "common.create": "Criar",
    "common.search": "Buscar",
    "common.loading": "Carregando...",
    "common.noData": "Nenhum dado encontrado",
    "common.confirm": "Confirmar",
    "common.back": "Voltar",
    "common.next": "Próximo",
    "common.previous": "Anterior",
    "common.of": "de",
    "common.showing": "Mostrando",
    "common.items": "itens",

    // Actions
    "action.newEntry": "Nova Entrada",
    "action.newSale": "Nova Venda",
    "action.newClient": "Novo Cliente",
    "action.newAccount": "Nova Conta",
    "action.newOwner": "Novo Dono",
    "action.newProgram": "Novo Programa",
    "action.newType": "Nova Operação",
    "action.exportCSV": "Exportar CSV",
    "action.simulate": "Simular",

    // Messages
    "message.success.create": "criado com sucesso",
    "message.success.update": "atualizado com sucesso",
    "message.success.delete": "excluído com sucesso",
    "message.error.create": "Erro ao criar",
    "message.error.update": "Erro ao atualizar",
    "message.error.delete": "Erro ao excluir",
    "message.confirm.delete": "Tem certeza que deseja excluir?",
    "message.warning.cascade": "ATENÇÃO: Esta ação irá excluir dados vinculados.",

    // Dashboard
    "dashboard.title": "Painel de Controle",
    "dashboard.totalBalance": "Saldo Total",
    "dashboard.totalInvested": "Total Investido",
    "dashboard.averageCost": "Custo Médio",
    "dashboard.profit": "Lucro",
    "dashboard.pendingEntries": "Entradas Pendentes",

    // Settings
    "settings.title": "Configurações",
    "settings.dataManagement": "Gerenciamento de Dados",
    "settings.clearCache": "Limpar Cache",
    "settings.clearAccount": "Limpar Conta",
    "settings.clearConfirm": "Tem certeza que deseja limpar todos os dados da sua conta?",

    // Keyboard shortcuts
    "shortcuts.title": "Atalhos de Teclado",
    "shortcuts.description": "Use estas teclas para navegar rapidamente pelo aplicativo.",
    "shortcuts.press": "Pressione",
    "shortcuts.toNavigate": "para navegar",

    // Auth
    "auth.login": "Entrar",
    "auth.register": "Criar conta",
    "auth.forgotPassword": "Esqueceu a senha?",
    "auth.noAccount": "Novo por aqui?",
    "auth.hasAccount": "Já tem conta?",
    "auth.invalidCredentials": "Credenciais inválidas",
    "auth.emailAlreadyRegistered": "Este email já está cadastrado",
    "auth.passwordTooShort": "A senha deve ter pelo menos 6 caracteres",
    "auth.invalidEmail": "Email inválido",
    "auth.emailNotConfirmed": "Email não confirmado. Verifique sua caixa de entrada",
    "auth.authError": "Erro ao autenticar. Tente novamente",
  },

  "en-US": {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.entries": "Entries",
    "nav.sales": "Sales",
    "nav.clients": "Clients",
    "nav.profiles": "Profile",
    "nav.settings": "Settings",
    "nav.reports": "Reports",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.noData": "No data found",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.of": "of",
    "common.showing": "Showing",
    "common.items": "items",

    // Actions
    "action.newEntry": "New Entry",
    "action.newSale": "New Sale",
    "action.newClient": "New Client",
    "action.newAccount": "New Account",
    "action.newOwner": "New Owner",
    "action.newProgram": "New Program",
    "action.newType": "New Type",
    "action.exportCSV": "Export CSV",
    "action.simulate": "Simulate",

    // Messages
    "message.success.create": "created successfully",
    "message.success.update": "updated successfully",
    "message.success.delete": "deleted successfully",
    "message.error.create": "Error creating",
    "message.error.update": "Error updating",
    "message.error.delete": "Error deleting",
    "message.confirm.delete": "Are you sure you want to delete?",
    "message.warning.cascade": "WARNING: This action will delete linked data.",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.totalBalance": "Total Balance",
    "dashboard.totalInvested": "Total Invested",
    "dashboard.averageCost": "Average Cost",
    "dashboard.profit": "Profit",
    "dashboard.pendingEntries": "Pending Entries",

    // Settings
    "settings.title": "Settings",
    "settings.dataManagement": "Data Management",
    "settings.clearCache": "Clear Cache",
    "settings.clearAccount": "Clear Account",
    "settings.clearConfirm": "Are you sure you want to clear all your account data?",

    // Keyboard shortcuts
    "shortcuts.title": "Keyboard Shortcuts",
    "shortcuts.description": "Use these keys to navigate quickly through the application.",
    "shortcuts.press": "Press",
    "shortcuts.toNavigate": "to navigate",

    // Auth
    "auth.login": "Login",
    "auth.register": "Create account",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "New here?",
    "auth.hasAccount": "Already have an account?",
    "auth.invalidCredentials": "Invalid credentials",
    "auth.emailAlreadyRegistered": "This email is already registered",
    "auth.passwordTooShort": "Password must be at least 6 characters",
    "auth.invalidEmail": "Invalid email",
    "auth.emailNotConfirmed": "Email not confirmed. Check your inbox",
    "auth.authError": "Authentication error. Try again",
  },
};

export function t(key: string, locale: Locale = "pt-BR"): string {
  return translations[locale]?.[key] ?? key;
}

export function getLocale(): Locale {
  const stored = localStorage.getItem("mc_locale");
  if (stored === "en-US" || stored === "pt-BR") return stored;
  return "pt-BR";
}

export function setLocale(locale: Locale): void {
  localStorage.setItem("mc_locale", locale);
}
