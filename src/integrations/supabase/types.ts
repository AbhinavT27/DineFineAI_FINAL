export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_generated_menus: {
        Row: {
          created_at: string
          id: string
          location: string
          menu_items: Json
          restaurant_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          menu_items?: Json
          restaurant_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          menu_items?: Json
          restaurant_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message: string
          rating: number | null
          subject: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message: string
          rating?: number | null
          subject: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          rating?: number | null
          subject?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      comparison_history: {
        Row: {
          comparison_data: Json
          comparison_key: string | null
          created_at: string
          id: string
          restaurant_ids: string[]
          saved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          comparison_data: Json
          comparison_key?: string | null
          created_at?: string
          id?: string
          restaurant_ids: string[]
          saved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          comparison_data?: Json
          comparison_key?: string | null
          created_at?: string
          id?: string
          restaurant_ids?: string[]
          saved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          created_at: string
          feedback_requests: number
          id: string
          restaurant_scrapes: number
          search_requests: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_requests?: number
          id?: string
          restaurant_scrapes?: number
          search_requests?: number
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_requests?: number
          id?: string
          restaurant_scrapes?: number
          search_requests?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      email_change_requests: {
        Row: {
          created_at: string
          current_email: string
          expires_at: string
          id: string
          new_email: string
          otp: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          current_email: string
          expires_at: string
          id?: string
          new_email: string
          otp: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          current_email?: string
          expires_at?: string
          id?: string
          new_email?: string
          otp?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      forgot_password: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          is_valid_email: boolean
          otp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          is_valid_email?: boolean
          otp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          is_valid_email?: boolean
          otp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      menu_analysis: {
        Row: {
          created_at: string
          id: string
          menu_items: Json
          restaurant_id: string
          restaurant_name: string
          restaurant_website: string
          scraped: boolean
          search_query: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_items?: Json
          restaurant_id: string
          restaurant_name: string
          restaurant_website: string
          scraped?: boolean
          search_query?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_items?: Json
          restaurant_id?: string
          restaurant_name?: string
          restaurant_website?: string
          scraped?: boolean
          search_query?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menus: {
        Row: {
          fetched_at: string | null
          id: string
          menu_json: Json | null
          restaurant_name: string | null
          source_url: string | null
        }
        Insert: {
          fetched_at?: string | null
          id?: string
          menu_json?: Json | null
          restaurant_name?: string | null
          source_url?: string | null
        }
        Update: {
          fetched_at?: string | null
          id?: string
          menu_json?: Json | null
          restaurant_name?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string[] | null
          created_at: string
          daily_searchrequests: number
          dietary_preferences: string[] | null
          distance_unit: string | null
          email: string
          gender: string | null
          health_goals: string[] | null
          height: number | null
          id: string
          language: string
          last_search_reset_date: string
          location: string | null
          phone_number: string | null
          updated_at: string
          usecurrentlocation: boolean | null
          username: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          daily_searchrequests?: number
          dietary_preferences?: string[] | null
          distance_unit?: string | null
          email: string
          gender?: string | null
          health_goals?: string[] | null
          height?: number | null
          id: string
          language?: string
          last_search_reset_date?: string
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          usecurrentlocation?: boolean | null
          username: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          daily_searchrequests?: number
          dietary_preferences?: string[] | null
          distance_unit?: string | null
          email?: string
          gender?: string | null
          health_goals?: string[] | null
          height?: number | null
          id?: string
          language?: string
          last_search_reset_date?: string
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          usecurrentlocation?: boolean | null
          username?: string
          weight?: number | null
        }
        Relationships: []
      }
      py_scraper_restaurants: {
        Row: {
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          id: number
          menu_items: Json | null
          parsed_data: Json | null
          raw_content: string | null
          restaurant_name: string | null
          restaurant_url: string | null
          scraped_at: string | null
          search_session_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: number
          menu_items?: Json | null
          parsed_data?: Json | null
          raw_content?: string | null
          restaurant_name?: string | null
          restaurant_url?: string | null
          scraped_at?: string | null
          search_session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: number
          menu_items?: Json | null
          parsed_data?: Json | null
          raw_content?: string | null
          restaurant_name?: string | null
          restaurant_url?: string | null
          scraped_at?: string | null
          search_session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      python_scraper_restaurants: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          menu_items: Json | null
          parsed_data: string | null
          raw_content: string | null
          restaurant_name: string
          restaurant_url: string
          scraped_at: string | null
          search_session_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          menu_items?: Json | null
          parsed_data?: string | null
          raw_content?: string | null
          restaurant_name: string
          restaurant_url: string
          scraped_at?: string | null
          search_session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          menu_items?: Json | null
          parsed_data?: string | null
          raw_content?: string | null
          restaurant_name?: string
          restaurant_url?: string
          scraped_at?: string | null
          search_session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      restaurant_tags: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "user_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          id: number
          scraped_data: Json
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          scraped_data: Json
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          scraped_data?: Json
          url?: string | null
        }
        Relationships: []
      }
      saved_restaurants: {
        Row: {
          created_at: string
          id: string
          restaurant_data: Json
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_data: Json
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_data?: Json
          restaurant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          allergies: string[] | null
          coordinates: Json | null
          created_at: string
          cuisine_type: string | null
          dietary_restrictions: string[] | null
          id: string
          location: string | null
          price_range: string | null
          saved: boolean
          search_query: string | null
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          coordinates?: Json | null
          created_at?: string
          cuisine_type?: string | null
          dietary_restrictions?: string[] | null
          id?: string
          location?: string | null
          price_range?: string | null
          saved?: boolean
          search_query?: string | null
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          coordinates?: Json | null
          created_at?: string
          cuisine_type?: string | null
          dietary_restrictions?: string[] | null
          id?: string
          location?: string | null
          price_range?: string | null
          saved?: boolean
          search_query?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_rate_limits: {
        Row: {
          action_type: string
          attempt_count: number
          blocked_until: string | null
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          action_type: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          action_type?: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_history: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_history?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_history?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tagged_restaurants: {
        Row: {
          created_at: string
          id: string
          restaurant_data: Json
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_data: Json
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_data?: Json
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_restaurant_history: {
        Row: {
          action_type: string
          created_at: string
          id: string
          restaurant_data: Json
          restaurant_id: string
          saved: boolean
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          restaurant_data: Json
          restaurant_id: string
          saved?: boolean
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          restaurant_data?: Json
          restaurant_id?: string
          saved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_search_restaurants: {
        Row: {
          clicked: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          restaurant_name: string | null
          restaurant_url: string | null
          search_session_id: string | null
          user_id: string
        }
        Insert: {
          clicked?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          restaurant_name?: string | null
          restaurant_url?: string | null
          search_session_id?: string | null
          user_id: string
        }
        Update: {
          clicked?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          restaurant_name?: string | null
          restaurant_url?: string | null
          search_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          tag_name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          tag_name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          tag_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_totals: {
        Row: {
          created_at: string
          id: string
          saved_restaurants_count: number
          tags_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          saved_restaurants_count?: number
          tags_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          saved_restaurants_count?: number
          tags_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_insert_subscription: {
        Args: {
          p_email: string
          p_subscription_end?: string
          p_subscription_tier: string
        }
        Returns: string
      }
      cancel_subscription_at_period_end: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_history: { Args: never; Returns: undefined }
      cleanup_expired_password_otps: { Args: never; Returns: undefined }
      cleanup_old_ai_generated_menus: { Args: never; Returns: undefined }
      cleanup_old_menu_analysis: { Args: never; Returns: undefined }
      delete_user_completely: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      detect_and_translate_search_query: {
        Args: { user_input: string }
        Returns: {
          confidence: number
          detected_language: string
          original_text: string
          translated_text: string
        }[]
      }
      get_or_create_user_totals: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          id: string
          saved_restaurants_count: number
          tags_count: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_totals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_history_expired: {
        Args: { created_date: string; is_saved: boolean }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_details?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      lookup_email_for_username: {
        Args: { input_username: string }
        Returns: string
      }
      lookup_username_for_auth: {
        Args: { input_username: string }
        Returns: {
          id: string
          username: string
        }[]
      }
      process_expired_subscriptions: { Args: never; Returns: undefined }
      reset_daily_search_requests: { Args: never; Returns: undefined }
      reset_daily_usage: { Args: never; Returns: undefined }
      user_has_premium_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
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
  public: {
    Enums: {},
  },
} as const
