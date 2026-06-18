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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          game_id: string
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          game_id: string
          id: string
          payload: Json
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          id: string
          meta: Json
          snapshot: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          id: string
          meta: Json
          snapshot?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          snapshot?: Json | null
          status?: string
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
