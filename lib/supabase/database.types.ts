export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      lead_intakes: {
        Row: {
          abidin_record_id: string | null
          budget_range: string | null
          company: string | null
          company_stage: string | null
          consent_contact: boolean
          consent_contact_at: string | null
          consent_updates: boolean
          consent_updates_at: string | null
          created_at: string
          desired_outcome: string | null
          email: string
          id: string
          internal_note: string | null
          internal_tags: string[]
          locale: string
          message: string | null
          multiplier_map_id: string | null
          name: string
          primary_constraint: string | null
          review_status: string
          source: string
          timeline: string | null
          transferred_to_abidin_at: string | null
          updated_at: string
          user_id: string | null
          utm: Json | null
        }
        Insert: {
          abidin_record_id?: string | null
          budget_range?: string | null
          company?: string | null
          company_stage?: string | null
          consent_contact?: boolean
          consent_contact_at?: string | null
          consent_updates?: boolean
          consent_updates_at?: string | null
          created_at?: string
          desired_outcome?: string | null
          email: string
          id?: string
          internal_note?: string | null
          internal_tags?: string[]
          locale?: string
          message?: string | null
          multiplier_map_id?: string | null
          name: string
          primary_constraint?: string | null
          review_status?: string
          source?: string
          timeline?: string | null
          transferred_to_abidin_at?: string | null
          updated_at?: string
          user_id?: string | null
          utm?: Json | null
        }
        Update: {
          abidin_record_id?: string | null
          budget_range?: string | null
          company?: string | null
          company_stage?: string | null
          consent_contact?: boolean
          consent_contact_at?: string | null
          consent_updates?: boolean
          consent_updates_at?: string | null
          created_at?: string
          desired_outcome?: string | null
          email?: string
          id?: string
          internal_note?: string | null
          internal_tags?: string[]
          locale?: string
          message?: string | null
          multiplier_map_id?: string | null
          name?: string
          primary_constraint?: string | null
          review_status?: string
          source?: string
          timeline?: string | null
          transferred_to_abidin_at?: string | null
          updated_at?: string
          user_id?: string | null
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_intakes_multiplier_map_id_fkey"
            columns: ["multiplier_map_id"]
            isOneToOne: false
            referencedRelation: "multiplier_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplier_maps: {
        Row: {
          answers: Json
          claim_token_hash: string | null
          created_at: string
          id: string
          locale: string
          result: Json
          rubric_version: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers: Json
          claim_token_hash?: string | null
          created_at?: string
          id?: string
          locale?: string
          result: Json
          rubric_version: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          claim_token_hash?: string | null
          created_at?: string
          id?: string
          locale?: string
          result?: Json
          rubric_version?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      os_credits: {
        Row: {
          created_at: string
          granted: number
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: number
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: number
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      os_runs: {
        Row: {
          claims: Json
          cost_usd: number
          created_at: string
          decided_at: string | null
          decision: string
          decision_note: string | null
          draft: string | null
          effort: string | null
          error: string | null
          id: string
          input_tokens: number
          model: string | null
          output_tokens: number
          published_at: string | null
          published_url: string | null
          shape: string
          sources: Json
          status: string
          template: string
          topic: string
          updated_at: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          claims?: Json
          cost_usd?: number
          created_at?: string
          decided_at?: string | null
          decision?: string
          decision_note?: string | null
          draft?: string | null
          effort?: string | null
          error?: string | null
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          published_at?: string | null
          published_url?: string | null
          shape?: string
          sources?: Json
          status?: string
          template?: string
          topic: string
          updated_at?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          claims?: Json
          cost_usd?: number
          created_at?: string
          decided_at?: string | null
          decision?: string
          decision_note?: string | null
          draft?: string | null
          effort?: string | null
          error?: string | null
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          published_at?: string | null
          published_url?: string | null
          shape?: string
          sources?: Json
          status?: string
          template?: string
          topic?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "os_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      os_workflows: {
        Row: {
          active: boolean
          brief: string
          created_at: string
          destination: string | null
          id: string
          key: string
          max_sources: number
          name: string
          owner_user_id: string | null
          purpose: string
          shape: string
          standing_sources: Json
          updated_at: string
          window_days: number
        }
        Insert: {
          active?: boolean
          brief: string
          created_at?: string
          destination?: string | null
          id?: string
          key: string
          max_sources?: number
          name: string
          owner_user_id?: string | null
          purpose: string
          shape?: string
          standing_sources?: Json
          updated_at?: string
          window_days?: number
        }
        Update: {
          active?: boolean
          brief?: string
          created_at?: string
          destination?: string | null
          id?: string
          key?: string
          max_sources?: number
          name?: string
          owner_user_id?: string | null
          purpose?: string
          shape?: string
          standing_sources?: Json
          updated_at?: string
          window_days?: number
        }
        Relationships: []
      }
      pilot_invoices: {
        Row: {
          address: string
          amount_sats: number
          amount_usd: number
          baseline_sats: number
          checked_at: string | null
          created_at: string
          expires_at: string
          id: string
          label: string
          observed_sats: number
          paid_at: string | null
          pilot_id: string
          rate_usd: number
          status: string
          txid: string | null
          updated_at: string
        }
        Insert: {
          address: string
          amount_sats: number
          amount_usd: number
          baseline_sats?: number
          checked_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          label: string
          observed_sats?: number
          paid_at?: string | null
          pilot_id: string
          rate_usd: number
          status?: string
          txid?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          amount_sats?: number
          amount_usd?: number
          baseline_sats?: number
          checked_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          label?: string
          observed_sats?: number
          paid_at?: string | null
          pilot_id?: string
          rate_usd?: number
          status?: string
          txid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_invoices_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_proposals: {
        Row: {
          angle: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          headline: string
          id: string
          observations: Json
          origin: string
          pilot_id: string
          published: boolean
          role_note: string | null
          role_title: string | null
          sample_body: string | null
          sample_note: string | null
          sample_title: string | null
          scope: Json
          terms: string | null
          updated_at: string
        }
        Insert: {
          angle: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          headline: string
          id?: string
          observations?: Json
          origin?: string
          pilot_id: string
          published?: boolean
          role_note?: string | null
          role_title?: string | null
          sample_body?: string | null
          sample_note?: string | null
          sample_title?: string | null
          scope?: Json
          terms?: string | null
          updated_at?: string
        }
        Update: {
          angle?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          headline?: string
          id?: string
          observations?: Json
          origin?: string
          pilot_id?: string
          published?: boolean
          role_note?: string | null
          role_title?: string | null
          sample_body?: string | null
          sample_note?: string | null
          sample_title?: string | null
          scope?: Json
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_proposals_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: true
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_updates: {
        Row: {
          approval_latency_minutes: number | null
          body: string | null
          cost_usd: number | null
          created_at: string
          id: string
          kind: string
          output_count: number | null
          period_label: string | null
          pilot_id: string
          published: boolean
          source_coverage_pct: number | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_latency_minutes?: number | null
          body?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          kind?: string
          output_count?: number | null
          period_label?: string | null
          pilot_id: string
          published?: boolean
          source_coverage_pct?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_latency_minutes?: number | null
          body?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          kind?: string
          output_count?: number | null
          period_label?: string | null
          pilot_id?: string
          published?: boolean
          source_coverage_pct?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_updates_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      pilots: {
        Row: {
          client_email: string
          client_user_id: string | null
          company: string
          created_at: string
          ends_on: string | null
          id: string
          next_step: string | null
          offer: string
          starts_on: string | null
          status: string
          summary: string | null
          updated_at: string
          workflow: string
        }
        Insert: {
          client_email: string
          client_user_id?: string | null
          company: string
          created_at?: string
          ends_on?: string | null
          id?: string
          next_step?: string | null
          offer?: string
          starts_on?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          workflow: string
        }
        Update: {
          client_email?: string
          client_user_id?: string | null
          company?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          next_step?: string | null
          offer?: string
          starts_on?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          workflow?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          job_role: string | null
          locale: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          job_role?: string | null
          locale?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_role?: string | null
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          confirmation_at: string | null
          consent_at: string | null
          created_at: string
          email: string
          id: string
          locale: string
          source: string
          status: string
          topics: string[]
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confirmation_at?: string | null
          consent_at?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string
          source?: string
          status?: string
          topics?: string[]
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confirmation_at?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          source?: string
          status?: string
          topics?: string[]
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      operator_status: {
        Row: {
          user_id: string | null
        }
        Insert: {
          user_id?: string | null
        }
        Update: {
          user_id?: string | null
        }
        Relationships: []
      }
      os_beta_status: {
        Row: {
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      os_spend_credit: { Args: { p_user_id: string }; Returns: number }
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

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
