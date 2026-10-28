export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string
          age: number
          occupation: string
          dependents: number
          monthly_income: number
          monthly_expenses: number
          monthly_emi: number
          current_savings: number
          existing_investments: number
          monthly_investment: number
          horizon_years: number
          risk_tolerance: number
          income_stability: number
          goals: Json
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string
          age?: number
          occupation?: string
          dependents?: number
          monthly_income?: number
          monthly_expenses?: number
          monthly_emi?: number
          current_savings?: number
          existing_investments?: number
          monthly_investment?: number
          horizon_years?: number
          risk_tolerance?: number
          income_stability?: number
          goals?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string
          age?: number
          occupation?: string
          dependents?: number
          monthly_income?: number
          monthly_expenses?: number
          monthly_emi?: number
          current_savings?: number
          existing_investments?: number
          monthly_investment?: number
          horizon_years?: number
          risk_tolerance?: number
          income_stability?: number
          goals?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
