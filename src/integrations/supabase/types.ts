export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_item_closures: {
        Row: {
          action_item_id: string
          closed_by: string
          closure_text: string
          created_at: string
          id: string
          media_urls: string[] | null
        }
        Insert: {
          action_item_id: string
          closed_by: string
          closure_text: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
        }
        Update: {
          action_item_id?: string
          closed_by?: string
          closure_text?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "action_item_closures_action_item_id_fkey"
            columns: ["action_item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_item_closures_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_item_verifications: {
        Row: {
          action_item_id: string
          created_at: string
          id: string
          verification_comments: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_by: string
        }
        Insert: {
          action_item_id: string
          created_at?: string
          id?: string
          verification_comments?: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_by: string
        }
        Update: {
          action_item_id?: string
          created_at?: string
          id?: string
          verification_comments?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_item_verifications_action_item_id_fkey"
            columns: ["action_item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_item_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_items: {
        Row: {
          assigned_to: string
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["action_item_priority"]
          status: Database["public"]["Enums"]["action_item_status"]
          target_date: string
          title: string
          updated_at: string
          verified_at: string | null
          verifier_id: string | null
        }
        Insert: {
          assigned_to: string
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["action_item_priority"]
          status?: Database["public"]["Enums"]["action_item_status"]
          target_date: string
          title: string
          updated_at?: string
          verified_at?: string | null
          verifier_id?: string | null
        }
        Update: {
          assigned_to?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["action_item_priority"]
          status?: Database["public"]["Enums"]["action_item_status"]
          target_date?: string
          title?: string
          updated_at?: string
          verified_at?: string | null
          verifier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      component_permissions: {
        Row: {
          component_name: string
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean | null
          permission_type: string
          role_required: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          component_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          permission_type: string
          role_required: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          component_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          permission_type?: string
          role_required?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_permissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_work: {
        Row: {
          admin_comments: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          work_date: string
          work_description: string
        }
        Insert: {
          admin_comments?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          work_date?: string
          work_description: string
        }
        Update: {
          admin_comments?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          work_date?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_work_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_updates: {
        Row: {
          achieved_count: number
          comments: string | null
          created_at: string
          efficiency: number | null
          id: string
          objective_id: string
          photos: string[] | null
          update_date: string
          user_id: string
        }
        Insert: {
          achieved_count?: number
          comments?: string | null
          created_at?: string
          efficiency?: number | null
          id?: string
          objective_id: string
          photos?: string[] | null
          update_date?: string
          user_id: string
        }
        Update: {
          achieved_count?: number
          comments?: string | null
          created_at?: string
          efficiency?: number | null
          id?: string
          objective_id?: string
          photos?: string[] | null
          update_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "objective_updates_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          num_activities: number
          owner_id: string
          target_completion_date: string
          title: string
          updated_at: string
          weightage: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          num_activities: number
          owner_id: string
          target_completion_date?: string
          title: string
          updated_at?: string
          weightage: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          num_activities?: number
          owner_id?: string
          target_completion_date?: string
          title?: string
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          banned_until: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_component_permission: {
        Args: {
          component_name: string
          permission_type: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      get_system_setting: {
        Args: {
          setting_key: string
        }
        Returns: Json
      }
      has_role: {
        Args:
          | { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
          | { user_id: number; role_name: string }
        Returns: boolean
      }
      update_system_setting: {
        Args: {
          setting_key: string
          setting_value: Json
          description?: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          user_id: string
          check_role: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_item_priority: "low" | "medium" | "high" | "critical"
      action_item_status: "open" | "closed" | "pending_verification" | "verified"
      app_role: "admin" | "user" | "superadmin"
      verification_status: "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"])
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "superadmin"],
      action_item_priority: ["low", "medium", "high", "critical"],
      action_item_status: ["open", "closed", "pending_verification", "verified"],
      verification_status: ["approved", "rejected"],
    },
  },
} as const