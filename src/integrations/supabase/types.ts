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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          address: string | null
          balance: number
          contact_type: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      insurance_customers: {
        Row: {
          balance: number
          card_number: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          card_number?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          card_number?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      insurance_sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          sale_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "insurance_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "insurance_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_sales: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          sale_date: string
          total: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          sale_date?: string
          total?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          sale_date?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "insurance_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "insurance_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          total: number
          unit_price: number
          unit_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          total?: number
          unit_price?: number
          unit_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          total?: number
          unit_price?: number
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contact_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          invoice_type: string
          paid: number
          payment_method: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          invoice_type?: string
          paid?: number
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          invoice_type?: string
          paid?: number
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          reference_id: string | null
          reference_type: string | null
          running_balance: number
        }
        Insert: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          running_balance?: number
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          running_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "ledger_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          cost_price: number
          created_at: string
          expiry_date: string | null
          has_expiry: boolean | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock: number
          packaging_type: string | null
          sale_price: number
          scientific_name: string | null
          stock_quantity: number
          trade_name: string
          units_per_package: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          expiry_date?: string | null
          has_expiry?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock?: number
          packaging_type?: string | null
          sale_price?: number
          scientific_name?: string | null
          stock_quantity?: number
          trade_name: string
          units_per_package?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          expiry_date?: string | null
          has_expiry?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock?: number
          packaging_type?: string | null
          sale_price?: number
          scientific_name?: string | null
          stock_quantity?: number
          trade_name?: string
          units_per_package?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      treasury: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          reference_id: string | null
          running_balance: number
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          reference_id?: string | null
          running_balance?: number
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          reference_id?: string | null
          running_balance?: number
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_manager_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
