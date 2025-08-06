// Configuração do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
  console.warn('⚠️ Supabase não configurado. Clique em "Connect to Supabase" no canto superior direito para configurar.');
}

export const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project') 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: string;
          created_at?: string;
        };
      };
      energy_bills: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string;
          processed_at: string;
          consumption_kwh: number;
          total_value: number;
          due_date: string;
          installation_number: string;
          customer_name: string;
          address: string;
          distributor: string;
          tariff_flag: string;
          reference_month: string;
          raw_data: any;
        };
      };
      feedback: {
        Row: {
          id: string;
          bill_id: string;
          field_corrected: string;
          correct_value: string;
          user_id: string;
          created_at: string;
        };
      };
    };
  };
};