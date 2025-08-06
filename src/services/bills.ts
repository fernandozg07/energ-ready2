import { supabase } from './supabase';
import { EnergyBill, AdminMetrics, User, Feedback } from '../types'; // Adicionei 'User' e 'Feedback' aqui

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
    
    // Busca todas as contas de energia
    const { data: bills, error: billsError } = await supabaseClient
      .from('energy_bills')
      .select('*');

    // Busca todos os usuários
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, address'); // Selecionamos o endereço para o consumo por região

    if (billsError) throw billsError;
    if (usersError) throw usersError;

    const totalBills = bills?.length || 0;
    const avgConsumption = bills?.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / totalBills || 0;
    const avgValue = bills?.reduce((acc, bill) => acc + bill.total_value, 0) / totalBills || 0;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const billsThisMonth = bills?.filter(bill =>
      bill.processed_at.substring(0, 7) === thisMonth
    ).length || 0;

    // Lógica para buscar o total de usuários
    const totalUsers = users?.length || 0;

    // Lógica para calcular o consumo por região
    const consumptionByRegion: { [key: string]: number } = {};
    if (bills && users) {
      bills.forEach(bill => {
        const user = users.find(u => u.id === bill.user_id);
        if (user && user.address) {
          // Extrai a região (ex: São Paulo/SP) do endereço
          const regionMatch = user.address.match(/(\w+\/\w+)$/);
          const region = regionMatch ? regionMatch[1] : 'Não especificada';
          consumptionByRegion[region] = (consumptionByRegion[region] || 0) + bill.consumption_kwh;
        }
      });
    }

    return {
      total_bills_processed: totalBills,
      average_consumption: Math.round(avgConsumption),
      total_users: totalUsers,
      bills_this_month: billsThisMonth,
      average_value: Math.round(avgValue),
      consumption_by_region: consumptionByRegion
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
  
  // Funções adicionadas para o UserManagement
  async getAllUsers(): Promise<User[]> {
    const supabaseClient = getSupabase();
    const { data, error } = await supabaseClient
      .from('users')
      .select('*');

    if (error) throw error;
    return data || [];
  },
  
  async deleteUser(userId: string): Promise<void> {
    const supabaseClient = getSupabase();
    const { error } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },
  
  async updateUser(user: User): Promise<User> {
    const supabaseClient = getSupabase();
    const { data, error } = await supabaseClient
      .from('users')
      .update(user)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  // Funções adicionadas/atualizadas para o FeedbackManagement
  async getAllFeedbacks(): Promise<Feedback[]> {
    const supabaseClient = getSupabase();
    const { data, error } = await supabaseClient
      .from('feedback')
      .select(`
        *,
        users(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any[]).map(f => ({
      ...f,
      customer_name: f.users.name,
      status: f.status || 'pending', // Garante que o status tenha um valor padrão
    })) || [];
  },

  async updateFeedbackStatus(feedbackId: string, status: 'approved' | 'rejected') {
    const supabaseClient = getSupabase();
    const { error } = await supabaseClient
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId);
    
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