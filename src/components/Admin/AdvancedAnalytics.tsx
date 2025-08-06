import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Download } from 'lucide-react'; // Removidos os ícones não usados
import { billsService } from '../../services/bills';

// Opcional: Interface para as métricas do admin
interface AdminMetrics {
  total_bills_processed: number;
  average_consumption: number;
  total_users: number;
  bills_this_month: number;
  average_value: number;
  consumption_by_region: Record<string, number>;
}

export const AdvancedAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const fetchedMetrics = await billsService.getAdminMetrics();
      setMetrics(fetchedMetrics);
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalyticsReport = () => {
    if (!metrics) return;

    const csvContent = [
      'RELATÓRIO DE ANALYTICS - ENERGYREADER',
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      'MÉTRICAS GERAIS',
      `Total de Contas Processadas,${metrics.total_bills_processed}`,
      `Consumo Médio (kWh),${metrics.average_consumption}`,
      `Valor Médio (R$),${metrics.average_value}`,
      `Total de Usuários,${metrics.total_users}`,
      `Contas este Mês,${metrics.bills_this_month}`,
      '',
      'CONSUMO POR REGIÃO',
      'Região,Consumo Total (kWh)',
      ...Object.entries(metrics.consumption_by_region).map(([region, consumption]) => `${region},${consumption}`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_energyreader_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="loading-spinner" />
          <span className="text-gray-500">Carregando analytics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-center text-gray-500">
        Não foi possível carregar os dados de analytics.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Analytics Avançado
          </h2>
          <p className="text-gray-500 mt-1">
            Análises detalhadas de consumo, tendências e insights regionais.
          </p>
        </div>
        <button
          onClick={exportAnalyticsReport}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório
        </button>
      </div>

      {/* Removi o bloco de Filtros pois não há mais lógica de filtragem local. */}
      
      {/* Key Metrics - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card: Total de Contas Processadas */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Contas Processadas</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">{metrics.total_bills_processed}</h3>
            <p className="mt-2 text-xs text-gray-500">{metrics.bills_this_month} este mês</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        {/* Card: Consumo Médio */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Consumo Médio</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">{metrics.average_consumption} kWh</h3>
            <p className="mt-2 text-xs text-gray-500">Por fatura</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
        {/* Card: Valor Médio */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Valor Médio</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">R$ {metrics.average_value.toFixed(2)}</h3>
            <p className="mt-2 text-xs text-gray-500">Por fatura</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        {/* Card: Total de Usuários */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">{metrics.total_users}</h3>
            <p className="mt-2 text-xs text-gray-500">Cadastrados</p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
};