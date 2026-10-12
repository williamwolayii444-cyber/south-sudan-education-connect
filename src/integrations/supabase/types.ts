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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      budget_lines: {
        Row: {
          allocated: number
          category: string
          code: string
          created_at: string
          created_by: string | null
          fiscal_year: string
          funding_source: string
          id: string
          notes: string | null
          school_id: string | null
          spent: number
          state: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allocated?: number
          category?: string
          code: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: string
          funding_source?: string
          id?: string
          notes?: string | null
          school_id?: string | null
          spent?: number
          state?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allocated?: number
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: string
          funding_source?: string
          id?: string
          notes?: string | null
          school_id?: string | null
          spent?: number
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_items: {
        Row: {
          class_level: string
          code: string
          copies_distributed: number
          copies_printed: number
          created_at: string
          created_by: string | null
          edition_year: number | null
          id: string
          item_type: string
          notes: string | null
          publisher: string | null
          status: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          class_level?: string
          code: string
          copies_distributed?: number
          copies_printed?: number
          created_at?: string
          created_by?: string | null
          edition_year?: number | null
          id?: string
          item_type?: string
          notes?: string | null
          publisher?: string | null
          status?: string
          subject?: string
          title: string
          updated_at?: string
        }
        Update: {
          class_level?: string
          code?: string
          copies_distributed?: number
          copies_printed?: number
          created_at?: string
          created_by?: string | null
          edition_year?: number | null
          id?: string
          item_type?: string
          notes?: string | null
          publisher?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          directorate: string | null
          id: string
          issued_on: string
          link: string | null
          reference: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          directorate?: string | null
          id?: string
          issued_on?: string
          link?: string | null
          reference: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          directorate?: string | null
          id?: string
          issued_on?: string
          link?: string | null
          reference?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_registrations: {
        Row: {
          candidate_number: string
          centre: string | null
          created_at: string
          created_by: string | null
          exam_series: string
          exam_year: number
          grade: string | null
          id: string
          notes: string | null
          school_id: string | null
          score: number
          status: string
          student_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          candidate_number: string
          centre?: string | null
          created_at?: string
          created_by?: string | null
          exam_series?: string
          exam_year?: number
          grade?: string | null
          id?: string
          notes?: string | null
          school_id?: string | null
          score?: number
          status?: string
          student_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          candidate_number?: string
          centre?: string | null
          created_at?: string
          created_by?: string | null
          exam_series?: string
          exam_year?: number
          grade?: string | null
          id?: string
          notes?: string | null
          school_id?: string | null
          score?: number
          status?: string
          student_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_registrations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      field_reports: {
        Row: {
          county: string | null
          created_at: string
          created_by: string | null
          id: string
          learners_present: number
          observations: string | null
          officer_name: string | null
          reference: string
          report_type: string
          reported_on: string
          school_id: string | null
          state: string | null
          status: string
          teachers_present: number
          updated_at: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          learners_present?: number
          observations?: string | null
          officer_name?: string | null
          reference: string
          report_type?: string
          reported_on?: string
          school_id?: string | null
          state?: string | null
          status?: string
          teachers_present?: number
          updated_at?: string
        }
        Update: {
          county?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          learners_present?: number
          observations?: string | null
          officer_name?: string | null
          reference?: string
          report_type?: string
          reported_on?: string
          school_id?: string | null
          state?: string | null
          status?: string
          teachers_present?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          actions: string | null
          created_at: string
          created_by: string | null
          findings: string | null
          id: string
          inspection_type: string
          inspector: string | null
          rating: string
          reference: string
          school_id: string | null
          score: number
          status: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          actions?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          inspection_type?: string
          inspector?: string | null
          rating?: string
          reference: string
          school_id?: string | null
          score?: number
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          actions?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          inspection_type?: string
          inspector?: string | null
          rating?: string
          reference?: string
          school_id?: string | null
          score?: number
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          code: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          focus_areas: string | null
          id: string
          name: string
          notes: string | null
          partner_type: string
          states_covered: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          focus_areas?: string | null
          id?: string
          name: string
          notes?: string | null
          partner_type?: string
          states_covered?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          focus_areas?: string | null
          id?: string
          name?: string
          notes?: string | null
          partner_type?: string
          states_covered?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_reports: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          partner_id: string | null
          period_label: string | null
          published_on: string | null
          reference: string
          report_type: string
          state: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          partner_id?: string | null
          period_label?: string | null
          published_on?: string | null
          reference: string
          report_type?: string
          state?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          partner_id?: string | null
          period_label?: string | null
          published_on?: string | null
          reference?: string
          report_type?: string
          state?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_reports_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_report_replies: {
        Row: {
          author_name: string
          author_side: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          report_id: string
        }
        Insert: {
          author_name: string
          author_side?: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_id: string
        }
        Update: {
          author_name?: string
          author_side?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_report_replies_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "partner_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          broadcast_date: string | null
          class_level: string
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          language: string
          link: string | null
          medium: string
          status: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          broadcast_date?: string | null
          class_level?: string
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          language?: string
          link?: string | null
          medium?: string
          status?: string
          subject?: string
          title: string
          updated_at?: string
        }
        Update: {
          broadcast_date?: string | null
          class_level?: string
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          language?: string
          link?: string | null
          medium?: string
          status?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          duty_station: string | null
          email: string | null
          full_name: string
          id: string
          job_title: string | null
        }
        Insert: {
          created_at?: string
          duty_station?: string | null
          email?: string | null
          full_name?: string
          id: string
          job_title?: string | null
        }
        Update: {
          created_at?: string
          duty_station?: string | null
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          accredited: boolean
          capacity: number
          code: string
          county: string | null
          created_at: string
          created_by: string | null
          email: string | null
          established_year: number | null
          head_teacher: string | null
          id: string
          latitude: number | null
          level: string
          longitude: number | null
          name: string
          notes: string | null
          ownership: string
          payam: string | null
          phone: string | null
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          accredited?: boolean
          capacity?: number
          code: string
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          established_year?: number | null
          head_teacher?: string | null
          id?: string
          latitude?: number | null
          level?: string
          longitude?: number | null
          name: string
          notes?: string | null
          ownership?: string
          payam?: string | null
          phone?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accredited?: boolean
          capacity?: number
          code?: string
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          established_year?: number | null
          head_teacher?: string | null
          id?: string
          latitude?: number | null
          level?: string
          longitude?: number | null
          name?: string
          notes?: string | null
          ownership?: string
          payam?: string | null
          phone?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_actions: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          details: string | null
          end_date: string | null
          from_school_id: string | null
          id: string
          reference: string
          start_date: string | null
          status: string
          teacher_id: string | null
          to_school_id: string | null
          updated_at: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          end_date?: string | null
          from_school_id?: string | null
          id?: string
          reference: string
          start_date?: string | null
          status?: string
          teacher_id?: string | null
          to_school_id?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          end_date?: string | null
          from_school_id?: string | null
          id?: string
          reference?: string
          start_date?: string | null
          status?: string
          teacher_id?: string | null
          to_school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_actions_from_school_id_fkey"
            columns: ["from_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_actions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_actions_to_school_id_fkey"
            columns: ["to_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_level: string
          code: string
          county_of_origin: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          disability: string
          enrollment_date: string
          first_name: string
          gender: string
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          last_name: string
          notes: string | null
          school_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          class_level?: string
          code: string
          county_of_origin?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          disability?: string
          enrollment_date?: string
          first_name: string
          gender?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name: string
          notes?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          class_level?: string
          code?: string
          county_of_origin?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          disability?: string
          enrollment_date?: string
          first_name?: string
          gender?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          employment_status: string
          first_name: string
          gender: string
          grade_level: string | null
          hire_date: string | null
          id: string
          last_name: string
          licence_expiry: string | null
          licence_number: string | null
          main_subject: string | null
          monthly_salary: number
          national_id: string | null
          phone: string | null
          qualification: string
          school_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          employment_status?: string
          first_name: string
          gender?: string
          grade_level?: string | null
          hire_date?: string | null
          id?: string
          last_name: string
          licence_expiry?: string | null
          licence_number?: string | null
          main_subject?: string | null
          monthly_salary?: number
          national_id?: string | null
          phone?: string | null
          qualification?: string
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          employment_status?: string
          first_name?: string
          gender?: string
          grade_level?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string
          licence_expiry?: string | null
          licence_number?: string | null
          main_subject?: string | null
          monthly_salary?: number
          national_id?: string | null
          phone?: string | null
          qualification?: string
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "officer" | "viewer"
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
    Enums: {
      app_role: ["admin", "officer", "viewer"],
    },
  },
} as const
