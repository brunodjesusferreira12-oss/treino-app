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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          default_workouts_seeded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          default_workouts_seeded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          default_workouts_seeded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
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
          notes?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
