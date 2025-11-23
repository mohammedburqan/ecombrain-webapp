export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'admin' | 'user'
          subscription_tier: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'user'
          subscription_tier?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'user'
          subscription_tier?: string | null
          created_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          name: string
          type: AgentType
          status: 'active' | 'inactive'
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: AgentType
          status?: 'active' | 'inactive'
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: AgentType
          status?: 'active' | 'inactive'
          config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      agent_tasks: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          task_type: string
          input_data: Json
          output_data: Json | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          user_id: string
          task_type: string
          input_data: Json
          output_data?: Json | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          user_id?: string
          task_type?: string
          input_data?: Json
          output_data?: Json | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
        }
      }
      agent_logs: {
        Row: {
          id: string
          agent_id: string
          task_id: string | null
          log_level: 'info' | 'warn' | 'error' | 'debug'
          message: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          agent_id: string
          task_id?: string | null
          log_level?: 'info' | 'warn' | 'error' | 'debug'
          message: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          agent_id?: string
          task_id?: string | null
          log_level?: 'info' | 'warn' | 'error' | 'debug'
          message?: string
          metadata?: Json | null
          timestamp?: string
        }
      }
      agent_metrics: {
        Row: {
          id: string
          agent_id: string
          metric_name: string
          metric_value: number
          timestamp: string
        }
        Insert: {
          id?: string
          agent_id: string
          metric_name: string
          metric_value: number
          timestamp?: string
        }
        Update: {
          id?: string
          agent_id?: string
          metric_name?: string
          metric_value?: number
          timestamp?: string
        }
      }
      collaboration_sessions: {
        Row: {
          id: string
          session_name: string
          agents_involved: string[]
          workflow_data: Json
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          session_name: string
          agents_involved: string[]
          workflow_data: Json
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_name?: string
          agents_involved?: string[]
          workflow_data?: Json
          status?: string
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          agent_id: string | null
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          agent_id?: string | null
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          agent_id?: string | null
          metadata?: Json | null
          timestamp?: string
        }
      }
      shopify_stores: {
        Row: {
          id: string
          user_id: string
          store_name: string
          shopify_domain: string
          access_token: string
          status: 'creating' | 'active' | 'suspended'
          store_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_name: string
          shopify_domain: string
          access_token: string
          status?: 'creating' | 'active' | 'suspended'
          store_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_name?: string
          shopify_domain?: string
          access_token?: string
          status?: 'creating' | 'active' | 'suspended'
          store_config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      store_creation_jobs: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          niche_data: Json | null
          color_scheme: Json | null
          products_data: Json | null
          deployment_status: 'pending' | 'deploying' | 'live' | 'failed'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          niche_data?: Json | null
          color_scheme?: Json | null
          products_data?: Json | null
          deployment_status?: 'pending' | 'deploying' | 'live' | 'failed'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string | null
          niche_data?: Json | null
          color_scheme?: Json | null
          products_data?: Json | null
          deployment_status?: 'pending' | 'deploying' | 'live' | 'failed'
          created_at?: string
          completed_at?: string | null
        }
      }
      niche_recommendations: {
        Row: {
          id: string
          user_id: string
          niche_name: string
          market_data: Json
          competition_score: number
          opportunity_score: number
          recommended_colors: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          niche_name: string
          market_data: Json
          competition_score: number
          opportunity_score: number
          recommended_colors: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          niche_name?: string
          market_data?: Json
          competition_score?: number
          opportunity_score?: number
          recommended_colors?: string[]
          created_at?: string
        }
      }
    }
  }
}

export type AgentType =
  | 'market_intelligence'
  | 'copywriting'
  | 'video_generation'
  | 'market_gap'
  | 'shopify_store_creation'
  | 'niche_selection'
  | 'color_scheme'
  | 'product_management'
  | 'shopify_deployment'

