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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      jurusan: {
        Row: {
          created_at: string
          id: string
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      kelas: {
        Row: {
          created_at: string
          id: string
          jurusan_id: string
          nama: string
          tingkat: number
          updated_at: string
          wali_kelas: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan_id: string
          nama: string
          tingkat?: number
          updated_at?: string
          wali_kelas?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jurusan_id?: string
          nama?: string
          tingkat?: number
          updated_at?: string
          wali_kelas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_jurusan_id_fkey"
            columns: ["jurusan_id"]
            isOneToOne: false
            referencedRelation: "jurusan"
            referencedColumns: ["id"]
          },
        ]
      }
      prakerin: {
        Row: {
          alamat_prakerin: string | null
          created_at: string
          id: string
          keterangan: string | null
          nilai_akhir: number | null
          pembimbing_industri: string | null
          pembimbing_sekolah: string | null
          siswa_id: string | null
          status: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          tempat_prakerin: string | null
          updated_at: string
        }
        Insert: {
          alamat_prakerin?: string | null
          created_at?: string
          id?: string
          keterangan?: string | null
          nilai_akhir?: number | null
          pembimbing_industri?: string | null
          pembimbing_sekolah?: string | null
          siswa_id?: string | null
          status?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tempat_prakerin?: string | null
          updated_at?: string
        }
        Update: {
          alamat_prakerin?: string | null
          created_at?: string
          id?: string
          keterangan?: string | null
          nilai_akhir?: number | null
          pembimbing_industri?: string | null
          pembimbing_sekolah?: string | null
          siswa_id?: string | null
          status?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tempat_prakerin?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prakerin_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      sekolah: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          kepala_sekolah: string | null
          nama: string
          telepon: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kepala_sekolah?: string | null
          nama: string
          telepon?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kepala_sekolah?: string | null
          nama?: string
          telepon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      siswa: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          jenis_kelamin: string | null
          jurusan_id: string
          kelas_id: string
          nama: string
          nama_orangtua: string | null
          nis: string
          tanggal_lahir: string | null
          telepon: string | null
          telepon_orangtua: string | null
          tempat_lahir: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jenis_kelamin?: string | null
          jurusan_id: string
          kelas_id: string
          nama: string
          nama_orangtua?: string | null
          nis: string
          tanggal_lahir?: string | null
          telepon?: string | null
          telepon_orangtua?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jenis_kelamin?: string | null
          jurusan_id?: string
          kelas_id?: string
          nama?: string
          nama_orangtua?: string | null
          nis?: string
          tanggal_lahir?: string | null
          telepon?: string | null
          telepon_orangtua?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_jurusan_id_fkey"
            columns: ["jurusan_id"]
            isOneToOne: false
            referencedRelation: "jurusan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          jurusan: string
          name: string
          password: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan: string
          name: string
          password: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          jurusan?: string
          name?: string
          password?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_authenticated_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      allow_school_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      armor: {
        Args: { "": string }
        Returns: string
      }
      authenticate_user: {
        Args: { input_password: string; input_username: string }
        Returns: {
          id: string
          jurusan: string
          name: string
          role: string
          username: string
        }[]
      }
      dearmor: {
        Args: { "": string }
        Returns: string
      }
      gen_random_bytes: {
        Args: { "": number }
        Returns: string
      }
      gen_random_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_salt: {
        Args: { "": string }
        Returns: string
      }
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_jurusan: string
          user_role: string
        }[]
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      is_authenticated_school_personnel: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_authenticated_school_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_valid_api_request: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      pgp_key_id: {
        Args: { "": string }
        Returns: string
      }
      verify_password: {
        Args: { hash: string; password: string }
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
