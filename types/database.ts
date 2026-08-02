export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "agency_admin" | "client_user";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: ProfileRole;
          client_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: ProfileRole;
          client_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          role?: ProfileRole;
          client_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          slug: string;
          country_code: string | null;
          market_label: string | null;
          currency_code: string;
          timezone: string;
          roas_target: number | null;
          report_day: number;
          assigned_manager_profile_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          slug: string;
          country_code?: string | null;
          market_label?: string | null;
          currency_code?: string;
          timezone?: string;
          roas_target?: number | null;
          report_day?: number;
          assigned_manager_profile_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          name?: string;
          slug?: string;
          country_code?: string | null;
          market_label?: string | null;
          currency_code?: string;
          timezone?: string;
          roas_target?: number | null;
          report_day?: number;
          assigned_manager_profile_id?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
