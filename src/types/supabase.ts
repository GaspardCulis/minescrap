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
      players: {
        Row: {
          discovered: string
          id: string
          last_time_online: string
          name: string
          servers_played: string[]
        }
        Insert: {
          discovered?: string
          id: string
          last_time_online?: string
          name: string
          servers_played: string[]
        }
        Update: {
          discovered?: string
          id?: string
          last_time_online?: string
          name?: string
          servers_played?: string[]
        }
        Relationships: []
      }
      servers: {
        Row: {
          description: string
          discovered: string
          ip: string
          last_time_online: string
          max_players: number | null
          modded: boolean | null
          online_count: number | null
          online_mode: boolean | null
          players: string[]
          protocol: number | null
          version: string | null
          whitelist: boolean | null
        }
        Insert: {
          description: string
          discovered?: string
          ip: string
          last_time_online?: string
          max_players?: number | null
          modded?: boolean | null
          online_count?: number | null
          online_mode?: boolean | null
          players: string[]
          protocol?: number | null
          version?: string | null
          whitelist?: boolean | null
        }
        Update: {
          description?: string
          discovered?: string
          ip?: string
          last_time_online?: string
          max_players?: number | null
          modded?: boolean | null
          online_count?: number | null
          online_mode?: boolean | null
          players?: string[]
          protocol?: number | null
          version?: string | null
          whitelist?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      random_servers: {
        Row: {
          description: string | null
          discovered: string | null
          ip: string | null
          last_time_online: string | null
          max_players: number | null
          modded: boolean | null
          online_count: number | null
          online_mode: boolean | null
          players: string[] | null
          protocol: number | null
          version: string | null
          whitelist: boolean | null
        }
        Insert: {
          description?: string | null
          discovered?: string | null
          ip?: string | null
          last_time_online?: string | null
          max_players?: number | null
          modded?: boolean | null
          online_count?: number | null
          online_mode?: boolean | null
          players?: string[] | null
          protocol?: number | null
          version?: string | null
          whitelist?: boolean | null
        }
        Update: {
          description?: string | null
          discovered?: string | null
          ip?: string | null
          last_time_online?: string | null
          max_players?: number | null
          modded?: boolean | null
          online_count?: number | null
          online_mode?: boolean | null
          players?: string[] | null
          protocol?: number | null
          version?: string | null
          whitelist?: boolean | null
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
