// Tipos principais do sistema
export interface User {
  id: string;
  email: string;
  // name e role são opcionais aqui e serão lidos de user_metadata
  name?: string; // Make optional as it comes from user_metadata
  role?: 'user' | 'admin'; // Make optional as it comes from user_metadata
  created_at: string;
  // Add user_metadata to reflect Supabase's structure
  user_metadata?: {
    name?: string;
    role?: 'user' | 'admin';
    [key: string]: any; // Allows for other custom metadata properties
  };
}

export interface EnergyBill {
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
  tariff_flag: 'verde' | 'amarela' | 'vermelha';
  reference_month: string;
  raw_data: any;
}

export interface ProcessedData {
  customer_name: string;
  address: string;
  installation_number: string;
  consumption_kwh: number;
  total_value: number;
  due_date: string;
  tariff_flag: string;
  distributor: string;
  reference_month: string;
}

export interface Feedback {
  id: string;
  bill_id: string;
  field_corrected: string;
  correct_value: string;
  user_id: string;
  created_at: string;
}

export interface AdminMetrics {
  total_bills_processed: number;
  average_consumption: number;
  total_users: number;
  bills_this_month: number;
  average_value: number;
  consumption_by_region: Record<string, number>;
}

export interface ConsumptionInsight {
  type: 'warning' | 'info' | 'success' | 'tip'; // Added 'tip' here
  title: string;
  description: string;
  value?: number;
}
