import { supabase } from './supabase';
import { EnergyBill, AdminMetrics } from '../types';

// Helper function to ensure supabase is initialized
const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
  return supabase;
};

export const billsService = {
  async uploadBill(file: File, userId: string): Promise<string> {
    const supabaseClient = getSupabase();
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { error } = await supabaseClient.storage
      .from('energy-bills')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('energy-bills')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async saveBill(billData: Omit<EnergyBill, 'id' | 'processed_at'>): Promise<EnergyBill> {
    const supabaseClient = getSupabase();
    const { data, error } = await supabaseClient
      .from('energy_bills')
      .insert({
        ...billData,
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserBills(userId: string): Promise<EnergyBill[]> {
    const supabaseClient = getSupabase();
    const { data, error } = await supabaseClient
      .from('energy_bills')
      .select('*')
      .eq('user_id', userId)
      .order('processed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllBills(): Promise<EnergyBill[]> {
    const supabaseClient = getSupabase();
    const { data, error } = await supabaseClient
      .from('energy_bills')
      .select('*')
      .order('processed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    const supabaseClient = getSupabase();
    const { data: bills, error } = await supabaseClient
      .from('energy_bills')
      .select('*');

    if (error) throw error;

    const totalBills = bills?.length || 0;
    const avgConsumption = bills?.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / totalBills || 0;
    const avgValue = bills?.reduce((acc, bill) => acc + bill.total_value, 0) / totalBills || 0;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const billsThisMonth = bills?.filter(bill =>
      bill.processed_at.substring(0, 7) === thisMonth
    ).length || 0;

    // TODO: Adicionar lógica para buscar o total de usuários e o consumo por região
    return {
      total_bills_processed: totalBills,
      average_consumption: Math.round(avgConsumption),
      total_users: 0,
      bills_this_month: billsThisMonth,
      average_value: Math.round(avgValue),
      consumption_by_region: {}
    };
  },

  async submitFeedback(billId: string, fieldCorrected: string, correctValue: string, userId: string) {
    const supabaseClient = getSupabase();
    const { error } = await supabaseClient
      .from('feedback')
      .insert({
        bill_id: billId,
        field_corrected: fieldCorrected,
        correct_value: correctValue,
        user_id: userId
      });

    if (error) throw error;
  },

  async exportToCSV(bills: EnergyBill[]): Promise<string> {
    const headers = [
      'Data de Processamento',
      'Cliente',
      'Endereço',
      'Número da Instalação',
      'Consumo (kWh)',
      'Valor Total (R$)',
      'Data de Vencimento',
      'Bandeira Tarifária',
      'Distribuidora',
      'Mês de Referência'
    ];

    const csvContent = [
      headers.join(','),
      ...bills.map(bill => [
        new Date(bill.processed_at).toLocaleDateString('pt-BR'),
        `"${bill.customer_name}"`,
        `"${bill.address}"`,
        bill.installation_number,
        bill.consumption_kwh,
        bill.total_value.toFixed(2),
        new Date(bill.due_date).toLocaleDateString('pt-BR'),
        bill.tariff_flag,
        `"${bill.distributor}"`,
        bill.reference_month
      ].join(','))
    ].join('\n');

    return csvContent;
  }
};