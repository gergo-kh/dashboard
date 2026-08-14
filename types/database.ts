export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "agency_admin" | "client_user";
export type IntegrationProvider =
  | "windsor"
  | "google_ads"
  | "meta_ads"
  | "ga4"
  | "merchant_center"
  | "tiktok_ads";
export type MonthlyOutcomeType = "positive" | "mixed" | "focus";
export type MonthlyReviewStatus = "draft" | "review" | "approved" | "published" | "archived";
export type OptimizationStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type ApprovalStatus = "draft" | "approved" | "hidden";
export type ClientActionPriority = "urgent" | "recommended" | "opportunity";
export type ClientActionStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "resolved"
  | "dismissed"
  | "hidden";
export type DailyMetricProvider =
  | "google_ads"
  | "meta_ads"
  | "ga4"
  | "merchant_center"
  | "tiktok_ads"
  | "manual";
export type IntegrationStatus =
  | "planned"
  | "connected"
  | "syncing"
  | "error"
  | "disabled";
export type SyncStatus = "queued" | "running" | "success" | "failed" | "cancelled";
export type DecimalString = string;

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

type TimestampInsert = {
  created_at?: string;
  updated_at?: string;
};

type TimestampUpdate = {
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
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
          avatar_url?: string | null;
          role: ProfileRole;
          client_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          client_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          status?: string;
          logo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          slug: string;
          country_code: string | null;
          market_label: string | null;
          currency_code: string | null;
          timezone: string;
          roas_target: DecimalString | null;
          report_day: number | null;
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
          currency_code?: string | null;
          timezone?: string;
          roas_target?: DecimalString | null;
          report_day?: number | null;
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
          currency_code?: string | null;
          timezone?: string;
          roas_target?: DecimalString | null;
          report_day?: number | null;
          assigned_manager_profile_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          project_id: string;
          provider: IntegrationProvider;
          status: IntegrationStatus;
          last_successful_sync_at: string | null;
          last_sync_attempt_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          provider: IntegrationProvider;
          status?: IntegrationStatus;
          last_successful_sync_at?: string | null;
          last_sync_attempt_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          provider?: IntegrationProvider;
          status?: IntegrationStatus;
          last_successful_sync_at?: string | null;
          last_sync_attempt_at?: string | null;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_accounts: {
        Row: {
          id: string;
          integration_id: string;
          external_account_id: string;
          external_account_name: string;
          account_type: IntegrationProvider | null;
          metadata: Record<string, Json>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          external_account_id: string;
          external_account_name: string;
          account_type?: IntegrationProvider | null;
          metadata?: Record<string, Json>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          integration_id?: string;
          external_account_id?: string;
          external_account_name?: string;
          account_type?: IntegrationProvider | null;
          metadata?: Record<string, Json>;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_metrics: {
        Row: {
          id: string;
          project_id: string;
          metric_date: string;
          provider: DailyMetricProvider;
          account_id: string | null;
          spend: DecimalString;
          revenue: DecimalString;
          purchases: DecimalString;
          clicks: DecimalString | null;
          impressions: DecimalString | null;
          platform_conversion_value: DecimalString | null;
          platform_conversions: DecimalString | null;
          currency_code: string;
          metadata: Record<string, Json>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          metric_date: string;
          provider: DailyMetricProvider;
          account_id?: string | null;
          spend?: DecimalString;
          revenue?: DecimalString;
          purchases?: DecimalString;
          clicks?: DecimalString | null;
          impressions?: DecimalString | null;
          platform_conversion_value?: DecimalString | null;
          platform_conversions?: DecimalString | null;
          currency_code?: string;
          metadata?: Record<string, Json>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          metric_date?: string;
          provider?: DailyMetricProvider;
          account_id?: string | null;
          spend?: DecimalString;
          revenue?: DecimalString;
          purchases?: DecimalString;
          clicks?: DecimalString | null;
          impressions?: DecimalString | null;
          platform_conversion_value?: DecimalString | null;
          platform_conversions?: DecimalString | null;
          currency_code?: string;
          metadata?: Record<string, Json>;
          updated_at?: string;
        };
        Relationships: [];
      };
      sync_runs: {
        Row: {
          id: string;
          project_id: string;
          integration_id: string | null;
          sync_type: string;
          status: SyncStatus;
          started_at: string;
          completed_at: string | null;
          records_processed: number;
          error_message: string | null;
          metadata: Record<string, Json>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          integration_id?: string | null;
          sync_type: string;
          status?: SyncStatus;
          started_at?: string;
          completed_at?: string | null;
          records_processed?: number;
          error_message?: string | null;
          metadata?: Record<string, Json>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          integration_id?: string | null;
          sync_type?: string;
          status?: SyncStatus;
          started_at?: string;
          completed_at?: string | null;
          records_processed?: number;
          error_message?: string | null;
          metadata?: Record<string, Json>;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_modules: GenericTable<{ project_id: string } & TimestampColumns>;
      monthly_snapshots: GenericTable<{ id: string; project_id: string } & TimestampColumns>;
      monthly_reviews: {
        Row: {
          id: string;
          project_id: string;
          period_start: string;
          period_end: string;
          summary_draft: string | null;
          summary_approved: string | null;
          outcome_type: MonthlyOutcomeType;
          outcome_items: Json[];
          corrective_actions: Json[];
          next_month_plan: Json[];
          status: MonthlyReviewStatus;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          period_start: string;
          period_end: string;
          summary_draft?: string | null;
          summary_approved?: string | null;
          outcome_type?: MonthlyOutcomeType;
          outcome_items?: Json[];
          corrective_actions?: Json[];
          next_month_plan?: Json[];
          status?: MonthlyReviewStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          period_start?: string;
          period_end?: string;
          summary_draft?: string | null;
          summary_approved?: string | null;
          outcome_type?: MonthlyOutcomeType;
          outcome_items?: Json[];
          corrective_actions?: Json[];
          next_month_plan?: Json[];
          status?: MonthlyReviewStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      optimization_items: {
        Row: {
          id: string;
          project_id: string;
          category: string;
          title: string;
          description: string | null;
          status: OptimizationStatus;
          source: string;
          source_reference: string | null;
          source_timestamp: string | null;
          started_at: string | null;
          completed_at: string | null;
          is_client_visible: boolean;
          approval_status: ApprovalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: string;
          title: string;
          description?: string | null;
          status?: OptimizationStatus;
          source?: string;
          source_reference?: string | null;
          source_timestamp?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          is_client_visible?: boolean;
          approval_status?: ApprovalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          category?: string;
          title?: string;
          description?: string | null;
          status?: OptimizationStatus;
          source?: string;
          source_reference?: string | null;
          source_timestamp?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          is_client_visible?: boolean;
          approval_status?: ApprovalStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_action_items: {
        Row: {
          id: string;
          project_id: string;
          source: string;
          category: string;
          title: string;
          description: string | null;
          priority: ClientActionPriority;
          affected_count: number | null;
          external_url: string | null;
          status: ClientActionStatus;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          source?: string;
          category: string;
          title: string;
          description?: string | null;
          priority?: ClientActionPriority;
          affected_count?: number | null;
          external_url?: string | null;
          status?: ClientActionStatus;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          project_id?: string;
          source?: string;
          category?: string;
          title?: string;
          description?: string | null;
          priority?: ClientActionPriority;
          affected_count?: number | null;
          external_url?: string | null;
          status?: ClientActionStatus;
          due_date?: string | null;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      merchant_products: GenericTable<{ id: string; project_id: string } & TimestampColumns>;
      product_daily_metrics: GenericTable<{ id: string; project_id: string } & TimestampColumns>;
      product_issues: GenericTable<{ id: string; project_id: string } & TimestampColumns>;
      reports: GenericTable<{ id: string; project_id: string } & TimestampColumns>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      monthly_outcome_type: MonthlyOutcomeType;
      optimization_status: OptimizationStatus;
      approval_status: ApprovalStatus;
      client_action_priority: ClientActionPriority;
      client_action_status: ClientActionStatus;
      sync_status: SyncStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

type GenericTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row> & TimestampInsert;
  Update: Partial<Row> & TimestampUpdate;
  Relationships: [];
};
