/**
 * Database Types - Auto-generated from Supabase schema
 * Run: npm run supabase:generate-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      lines: {
        Row: {
          id: string;
          name: string;
          publisher: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          publisher?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          publisher?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      figures: {
        Row: {
          id: string;
          name: string;
          line_id: string;
          year: number | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          line_id: string;
          year?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          line_id?: string;
          year?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mold_families: {
        Row: {
          id: string;
          name: string;
          aliases: string[];
          confidence_score: number;
          description: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          aliases?: string[];
          confidence_score?: number;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          aliases?: string[];
          confidence_score?: number;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      part_definitions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          part_type: string;
          mold_family_id: string | null;
          description: string | null;
          year_introduced: number | null;
          pinless: boolean | null;
          knee_type: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          part_type: string;
          mold_family_id?: string | null;
          description?: string | null;
          year_introduced?: number | null;
          pinless?: boolean | null;
          knee_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          part_type?: string;
          mold_family_id?: string | null;
          description?: string | null;
          year_introduced?: number | null;
          pinless?: boolean | null;
          knee_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      figure_parts: {
        Row: {
          id: string;
          figure_id: string;
          part_definition_id: string;
          slot_label: string | null;
          is_primary: boolean | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          figure_id: string;
          part_definition_id: string;
          slot_label?: string | null;
          is_primary?: boolean | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          figure_id?: string;
          part_definition_id?: string;
          slot_label?: string | null;
          is_primary?: boolean | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      kitbashes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator: string | null;
          tags: string[];
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator?: string | null;
          tags?: string[];
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator?: string | null;
          tags?: string[];
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      kitbash_parts: {
        Row: {
          id: string;
          kitbash_id: string;
          part_definition_id: string;
          position: string | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kitbash_id: string;
          part_definition_id: string;
          position?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kitbash_id?: string;
          part_definition_id?: string;
          position?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      images: {
        Row: {
          id: string;
          storage_key: string;
          hash: string | null;
          width: number | null;
          height: number | null;
          mime_type: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          storage_key: string;
          hash?: string | null;
          width?: number | null;
          height?: number | null;
          mime_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          storage_key?: string;
          hash?: string | null;
          width?: number | null;
          height?: number | null;
          mime_type?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      image_links: {
        Row: {
          id: string;
          image_id: string;
          entity_type: string;
          entity_id: string;
          role: string | null;
          position: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_id: string;
          entity_type: string;
          entity_id: string;
          role?: string | null;
          position?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          image_id?: string;
          entity_type?: string;
          entity_id?: string;
          role?: string | null;
          position?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      claims: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          claim_type: string;
          data: Json;
          source: string | null;
          confidence: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          claim_type: string;
          data: Json;
          source?: string | null;
          confidence?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          claim_type?: string;
          data?: Json;
          source?: string | null;
          confidence?: number;
          created_at?: string;
        };
      };
      aliases: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          alias: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          alias: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          alias?: string;
          created_at?: string;
        };
      };
      part_compatibility: {
        Row: {
          id: string;
          source_part_definition_id: string;
          target_part_definition_id: string;
          compatibility_level: 'green' | 'yellow' | 'red';
          notes: string | null;
          modification_type: string | null;
          confidence: number;
          submitted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_part_definition_id: string;
          target_part_definition_id: string;
          compatibility_level: 'green' | 'yellow' | 'red';
          notes?: string | null;
          modification_type?: string | null;
          confidence?: number;
          submitted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_part_definition_id?: string;
          target_part_definition_id?: string;
          compatibility_level?: 'green' | 'yellow' | 'red';
          notes?: string | null;
          modification_type?: string | null;
          confidence?: number;
          submitted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      mold_family_usage: {
        Row: {
          mold_family_id: string | null;
          name: string | null;
          part_definition_count: number | null;
          figure_count: number | null;
          kitbash_usage_count: number | null;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}
