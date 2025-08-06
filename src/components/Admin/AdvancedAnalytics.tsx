import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Calendar, Download, Filter, TrendingDown } from 'lucide-react';
import { EnergyBill } from '../../types';
import { AdvancedChart } from '../Charts/AdvancedChart';
import { billsService } from '../../services/bills';

export const AdvancedAnalytics: React.FC = () => {
  const [bills, setBills] = useState<EnergyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<'consumption' | 'value' | 'both'>('both');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const allBills = await billsService.getAllBills();
      setBills(allBills);
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBills = () => {
    const now = new Date();
    const monthsAgo = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '12m': 12
    }[selectedPeriod];

    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
    
    return bills.filter(bill => new Date(bill.processed_at) >= cutoffDate);
  };

  const getConsumptionTrends = () => {
    const filteredBills = getFilteredBills();
    const monthlyData: Record<string, { consumption: number; value: number; count: number }> = {};

    filteredBills.forEach(bill => {
      const monthKey = new Date(bill.processed_at).toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { consumption: 0, value: 0, count: 0 };
      }
      monthlyData[monthKey].consumption += bill.consumption_kwh;
      monthlyData[monthKey].value += bill.total_value;
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        avgConsumption: Math.round(data.consumption / data.count),
        avgValue: Math.round(data.value / data.count),
        totalBills: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getRegionalInsights = () => {
    const filteredBills = getFilteredBills();
    const regionData: Record<string, { 
      consumption: number; 
      value: number; 
      count: number; 
      flags: Record<string, number> 
    }> = {};

    filteredBills.forEach(bill => {
      const region = bill.address.includes('SP') ? 'São Paulo' :
                     bill.address.includes('RJ') ? 'Rio de Janeiro' :
                     bill.address.includes('MG') ? 'Minas Gerais' :
                     bill.address.includes('PR') ? 'Paraná' :
                     bill.address.includes('RS') ? 'Rio Grande do Sul' : 'Outros';

      if (!regionData[region]) {
        regionData[region] = { 
          consumption: 0, 
          value: 0, 
          count: 0, 
          flags: { verde: 0, amarela: 0, vermelha: 0 } 
        };
      }

      regionData[region].consumption += bill.consumption_kwh;
      regionData[region].value += bill.total_value;
      regionData[region].count++;
      regionData[region].flags[bill.tariff_flag as keyof typeof regionData[string]['flags']]++;
    });

    return Object.entries(regionData).map(([region, data]) => ({
      region,
      avgConsumption: Math.round(data.consumption / data.count),
      avgValue: Math.round(data.value / data.count),
      totalBills: data.count,
      dominantFlag: Object.entries(data.flags).reduce((a, b) => 
        data.flags[a[0] as keyof typeof data.flags] > data.flags[b[0] as keyof typeof data.flags] ? a : b
      )[0]
    }));
  };

  const calculateMonthlyGrowth = () => {
    const trends = getConsumptionTrends();
    if (trends.length < 2) return null;
    
    const lastMonth = trends[trends.length - 1];
    const previousMonth = trends[trends.length - 2];

    if (!lastMonth || !previousMonth) return null;

    const growth = ((lastMonth.avgConsumption - previousMonth.avgConsumption) / previousMonth.avgConsumption) * 100;
    return {
      value: growth.toFixed(1),
      isPositive: growth >= 0
    };
  };

  const exportAnalyticsReport = () => {
    const trends = getConsumptionTrends();
    const regional = getRegionalInsights();
    
    const csvContent = [
      'RELATÓRIO DE ANALYTICS - ENERGYREADER',
      `Período: ${selectedPeriod.toUpperCase()} | Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      'TENDÊNCIAS MENSAIS',
      'Mês,Consumo Médio (kWh),Valor Médio (R$),Total de Contas',
      ...trends.map(t => `${t.month},${t.avgConsumption},${t.avgValue},${t.totalBills}`),
      '',
      'ANÁLISE REGIONAL',
      'Região,Consumo Médio (kWh),Valor Médio (R$),Total de Contas,Bandeira Dominante',
      ...regional.map(r => `${r.region},${r.avgConsumption},${r.avgValue},${r.totalBills},${r.dominantFlag}`)
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

  const trends = getConsumptionTrends();
  const regional = getRegionalInsights();
  const filteredBills = getFilteredBills();
  const monthlyGrowth = calculateMonthlyGrowth();

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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="form-select border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1m">Último Mês</option>
              <option value="3m">Últimos 3 Meses</option>
              <option value="6m">Últimos 6 Meses</option>
              <option value="12m">Último Ano</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Métrica:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="form-select border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="both">Consumo e Valor</option>
              <option value="consumption">Apenas Consumo</option>
              <option value="value">Apenas Valor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card: Crescimento Mensal */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Crescimento Mensal</p>
            <h3 className={`text-3xl font-bold mt-1 ${monthlyGrowth?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyGrowth ? (monthlyGrowth.isPositive ? `+${monthlyGrowth.value}%` : `${monthlyGrowth.value}%`) : 'N/A'}
            </h3>
            <div className={`flex items-center mt-2 text-xs font-semibold ${monthlyGrowth?.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {monthlyGrowth?.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              vs período anterior
            </div>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Card: Eficiência OCR */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Eficiência OCR</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">94.2%</h3>
            <p className="mt-2 text-xs text-gray-500">Taxa de acerto</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Card: Regiões Ativas */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Regiões Ativas</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">{regional.length}</h3>
            <p className="mt-2 text-xs text-gray-500">Com dados</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Card: Período Analisado */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Período Analisado</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-900">
              {selectedPeriod.toUpperCase()}
            </h3>
            <p className="mt-2 text-xs text-gray-500">{filteredBills.length} contas</p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(selectedMetric === 'consumption' || selectedMetric === 'both') && (
          <AdvancedChart
            bills={filteredBills}
            type="consumption"
            title="Tendência de Consumo"
          />
        )}

        {(selectedMetric === 'value' || selectedMetric === 'both') && (
          <AdvancedChart
            bills={filteredBills}
            type="value"
            title="Tendência de Valores"
          />
        )}

        <AdvancedChart
          bills={filteredBills}
          type="region"
          title="Consumo por Região"
        />

        <AdvancedChart
          bills={filteredBills}
          type="flags"
          title="Distribuição de Bandeiras"
        />
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tendências Mensais</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo Médio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Médio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trends.map((trend) => (
                  <tr key={trend.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(trend.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trend.avgConsumption} kWh</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {trend.avgValue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{trend.totalBills}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Analysis Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Análise Regional</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Região</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo Médio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regional.map((region) => (
                  <tr key={region.region}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.avgConsumption} kWh</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        region.dominantFlag === 'verde' ? 'bg-green-100 text-green-800' :
                        region.dominantFlag === 'amarela' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {region.dominantFlag}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{region.totalBills}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};