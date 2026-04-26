export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      assistant_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assistant_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      app_error_events: {
        Row: {
          id: string;
          user_id: string | null;
          level: string;
          source: string;
          route: string | null;
          message: string;
          details: Json | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          level: string;
          source: string;
          route?: string | null;
          message: string;
          details?: Json | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          level?: string;
          source?: string;
          route?: string | null;
          message?: string;
          details?: Json | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          height_cm: number | null;
          target_weight_kg: number | null;
          default_workouts_seeded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          height_cm?: number | null;
          target_weight_kg?: number | null;
          default_workouts_seeded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          height_cm?: number | null;
          target_weight_kg?: number | null;
          default_workouts_seeded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          recorded_on: string;
          weight_kg: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recorded_on: string;
          weight_kg: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recorded_on?: string;
          weight_kg?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sports: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_sport_sessions: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string;
          selected_for_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id: string;
          selected_for_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string;
          selected_for_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string;
          name: string;
          day_of_week: string | null;
          scheduled_days: string[];
          category: string;
          objective: string | null;
          notes: string | null;
          last_accessed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id: string;
          name: string;
          day_of_week?: string | null;
          scheduled_days?: string[];
          category: string;
          objective?: string | null;
          notes?: string | null;
          last_accessed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string;
          name?: string;
          day_of_week?: string | null;
          scheduled_days?: string[];
          category?: string;
          objective?: string | null;
          notes?: string | null;
          last_accessed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_sections: {
        Row: {
          id: string;
          workout_id: string;
          title: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          title: string;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          title?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          section_id: string;
          name: string;
          order_index: number;
          sets: number | null;
          reps: string | null;
          duration: string | null;
          distance: string | null;
          load_default: number | null;
          notes: string | null;
          video_url: string | null;
          muscle_group: string | null;
          is_priority: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          section_id: string;
          name: string;
          order_index: number;
          sets?: number | null;
          reps?: string | null;
          duration?: string | null;
          distance?: string | null;
          load_default?: number | null;
          notes?: string | null;
          video_url?: string | null;
          muscle_group?: string | null;
          is_priority?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          section_id?: string;
          name?: string;
          order_index?: number;
          sets?: number | null;
          reps?: string | null;
          duration?: string | null;
          distance?: string | null;
          load_default?: number | null;
          notes?: string | null;
          video_url?: string | null;
          muscle_group?: string | null;
          is_priority?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_executions: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string | null;
          sport_id: string | null;
          workout_name: string;
          executed_at: string;
          notes: string | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id?: string | null;
          sport_id?: string | null;
          workout_name: string;
          executed_at?: string;
          notes?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string | null;
          sport_id?: string | null;
          workout_name?: string;
          executed_at?: string;
          notes?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_logs: {
        Row: {
          id: string;
          execution_id: string;
          exercise_id: string | null;
          exercise_name: string;
          section_title: string | null;
          prescription: string | null;
          load_used: number | null;
          reps_done: string | null;
          rpe: number | null;
          rest_seconds: number | null;
          notes: string | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          execution_id: string;
          exercise_id?: string | null;
          exercise_name: string;
          section_title?: string | null;
          prescription?: string | null;
          load_used?: number | null;
          reps_done?: string | null;
          rpe?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          execution_id?: string;
          exercise_id?: string | null;
          exercise_name?: string;
          section_title?: string | null;
          prescription?: string | null;
          load_used?: number | null;
          reps_done?: string | null;
          rpe?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gamification_events: {
        Row: {
          id: string;
          user_id: string;
          sport_id: string | null;
          event_type: string;
          points: number;
          reference_type: string | null;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_id?: string | null;
          event_type: string;
          points: number;
          reference_type?: string | null;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport_id?: string | null;
          event_type?: string;
          points?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          total_points: number;
          level: number;
          current_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_points?: number;
          level?: number;
          current_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_points?: number;
          level?: number;
          current_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          sport_slug: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          sport_slug?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          sport_slug?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };
      battles: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          sport_id: string | null;
          battle_type: string;
          scoring_mode: string;
          starts_at: string;
          ends_at: string;
          status: string;
          winner_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          title: string;
          sport_id?: string | null;
          battle_type: string;
          scoring_mode: string;
          starts_at: string;
          ends_at: string;
          status?: string;
          winner_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          title?: string;
          sport_id?: string | null;
          battle_type?: string;
          scoring_mode?: string;
          starts_at?: string;
          ends_at?: string;
          status?: string;
          winner_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      battle_participants: {
        Row: {
          id: string;
          battle_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          user_id: string;
          role: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      battle_scores: {
        Row: {
          id: string;
          battle_id: string;
          user_id: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          user_id: string;
          score?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          user_id?: string;
          score?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_reference_badges: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      sync_user_badges: {
        Args: {
          target_user_id: string;
        };
        Returns: undefined;
      };
      award_gamification_event: {
        Args: {
          target_user_id: string;
          target_sport_id?: string | null;
          target_event_type: string;
          target_points: number;
          target_reference_type?: string | null;
          target_reference_id?: string | null;
          target_description?: string | null;
        };
        Returns: boolean;
      };
      sync_battle_scores: {
        Args: {
          target_battle_id: string;
        };
        Returns: Array<{
          battle_id: string;
          status: string;
          winner_user_id: string | null;
          sport_id: string | null;
          user_id: string;
          score: number;
        }>;
      };
      seed_my_default_workouts: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      seed_default_workouts_for_user: {
        Args: {
          target_user_id: string;
        };
        Returns: undefined;
      };
      list_battle_candidates: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
