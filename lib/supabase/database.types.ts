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

