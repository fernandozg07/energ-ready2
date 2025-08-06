import React, { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, BarChart3, Download } from 'lucide-react';
import { Header } from '../Layout/Header';
import { billsService } from '../../services/bills';
import { AdminMetrics, EnergyBill } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [bills, setBills] = useState<EnergyBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [adminMetrics, allBills] = await Promise.all([
        billsService.getAdminMetrics(),
        billsService.getAllBills()
      ]);
      
      setMetrics(adminMetrics);
      setBills(allBills);
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (bills.length === 0) return;

    const headers = [
      'Data Processamento',
      'Cliente',
      'Consumo (kWh)',
      'Valor (R$)',
      'Vencimento',
      'Bandeira',
      'Distribuidora'
    ];

    const csvContent = [
      headers.join(','),
      ...bills.map(bill => [
        new Date(bill.processed_at).toLocaleDateString('pt-BR'),
        bill.customer_name,
        bill.consumption_kwh,
        bill.total_value.toFixed(2),
        new Date(bill.due_date).toLocaleDateString('pt-BR'),
        bill.tariff_flag,
        bill.distributor
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_contas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Dashboard Administrativo" />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard Administrativo" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Contas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.total_bills_processed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consumo Médio</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.average_consumption || 0} kWh</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-2xl font-bold text-gray-900">R$ {metrics?.average_value || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.bills_this_month || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de exportação */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exportar Dados</h3>
              <p className="text-sm text-gray-600">Baixe um relatório completo em CSV</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={bills.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Lista de contas recentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Contas Processadas Recentemente</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bandeira
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.slice(0, 10).map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {bill.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bill.installation_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bill.consumption_kwh} kWh</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">R$ {bill.total_value.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        bill.tariff_flag === 'verde' ? 'bg-green-100 text-green-800' :
                        bill.tariff_flag === 'amarela' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.tariff_flag}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.processed_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bills.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma conta processada ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};