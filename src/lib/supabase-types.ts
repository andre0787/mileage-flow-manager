export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id: string
          name?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          id: string
          user_id: string
          name: string
          cpf: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          cpf?: string
          phone?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          cpf?: string
          phone?: string
          created_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          user_id: string
          name: string
          type: "pontos" | "milhas"
          max_passengers: number | null
          passenger_cycle_type: "anual" | "dias" | null
          passenger_cycle_days: number | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: "pontos" | "milhas"
          max_passengers?: number | null
          passenger_cycle_type?: "anual" | "dias" | null
          passenger_cycle_days?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: "pontos" | "milhas"
          max_passengers?: number | null
          passenger_cycle_type?: "anual" | "dias" | null
          passenger_cycle_days?: number | null
        }
        Relationships: []
      }
      origem_types: {
        Row: {
          id: string
          user_id: string
          name: string
          account_type: "pontos" | "milhas"
          color: string
          description: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          account_type: "pontos" | "milhas"
          color?: string
          description?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          account_type?: "pontos" | "milhas"
          color?: string
          description?: string | null
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          owner_id: string
          program_id: string
          name: string
          type: "pontos" | "milhas"
          balance: number
          average_cost_per_mile: number | null
          total_invested: number | null
          status: "ativa" | "inativa"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          owner_id: string
          program_id: string
          name: string
          type: "pontos" | "milhas"
          balance?: number
          average_cost_per_mile?: number | null
          total_invested?: number | null
          status?: "ativa" | "inativa"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          owner_id?: string
          program_id?: string
          name?: string
          type?: "pontos" | "milhas"
          balance?: number
          average_cost_per_mile?: number | null
          total_invested?: number | null
          status?: "ativa" | "inativa"
          created_at?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          id: string
          user_id: string
          account_id: string
          origem_type_id: string
          amount: number
          amount_paid: number
          cost_per_thousand: number
          conversion_rate: number | null
          miles_generated: number | null
          cost_per_mile: number | null
          source_account_id: string | null
          bonus_percent: number | null
          date: string
          description: string | null
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          origem_type_id: string
          amount: number
          amount_paid?: number
          cost_per_thousand?: number
          conversion_rate?: number | null
          miles_generated?: number | null
          cost_per_mile?: number | null
          source_account_id?: string | null
          bonus_percent?: number | null
          date?: string
          description?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          origem_type_id?: string
          amount?: number
          amount_paid?: number
          cost_per_thousand?: number
          conversion_rate?: number | null
          miles_generated?: number | null
          cost_per_mile?: number | null
          source_account_id?: string | null
          bonus_percent?: number | null
          date?: string
          description?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          cpf: string | null
          email: string | null
          phone: string
          telegram: string | null
          total_purchases: number
          usage_history: { program: string; count: number; year: number }[]
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          cpf?: string | null
          email?: string | null
          phone?: string
          telegram?: string | null
          total_purchases?: number
          usage_history?: { program: string; count: number; year: number }[]
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          cpf?: string | null
          email?: string | null
          phone?: string
          telegram?: string | null
          total_purchases?: number
          usage_history?: { program: string; count: number; year: number }[]
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          account_name: string
          owner_name: string
          program: string
          client_id: string
          client_name: string
          miles_used: number
          sale_value: number
          price_per_mile: number | null
          cost_per_mile: number
          additional_cost: number | null
          additional_cost_desc: string | null
          profit: number
          profit_margin: number
          status: "pendente" | "pago" | "concluido" | "cancelado"
          ticket_locator: string
          passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[]
          date: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          account_name?: string
          owner_name?: string
          program?: string
          client_id: string
          client_name?: string
          miles_used: number
          sale_value: number
          price_per_mile?: number | null
          cost_per_mile: number
          additional_cost?: number | null
          additional_cost_desc?: string | null
          profit?: number
          profit_margin?: number
          status?: "pendente" | "pago" | "concluido" | "cancelado"
          ticket_locator?: string
          passengers?: { name: string; passengerId: string; cpf: string; clientId?: string }[]
          date?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          account_name?: string
          owner_name?: string
          program?: string
          client_id?: string
          client_name?: string
          miles_used?: number
          sale_value?: number
          price_per_mile?: number | null
          cost_per_mile?: number
          additional_cost?: number | null
          additional_cost_desc?: string | null
          profit?: number
          profit_margin?: number
          status?: "pendente" | "pago" | "concluido" | "cancelado"
          ticket_locator?: string
          passengers?: { name: string; passengerId: string; cpf: string; clientId?: string }[]
          date?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
