import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, BarChart3, Download, MapPin, AlertCircle, CheckCircle } from 'lucide-react'; // Users e MessageSquare removidos
import { Header } from '../Layout/Header';
import { Sidebar } from '../Layout/Sidebar';
import { MetricCard } from '../UI/MetricCard';
import { UserManagement } from '../Admin/UserManagement';
import { FeedbackManagement } from '../Admin/FeedbackManagement';
import { AdvancedAnalytics } from '../Admin/AdvancedAnalytics';
import { billsService } from '../../services/bills';
import { AdminMetrics, EnergyBill } from '../../types';

export const EnhancedAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [bills, setBills] = useState<EnergyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // Corrigido o erro de digitação

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
      'Distribuidora',
      'Região'
    ];

    const csvContent = [
      headers.join(','),
      ...bills.map(bill => [
        new Date(bill.processed_at).toLocaleDateString('pt-BR'),
        `"${bill.customer_name}"`,
        bill.consumption_kwh,
        bill.total_value.toFixed(2),
        new Date(bill.due_date).toLocaleDateString('pt-BR'),
        bill.tariff_flag,
        `"${bill.distributor}"`,
        `"${bill.address.split(' - ').pop() || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_energyreader_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRegionStats = () => {
    const regionStats: Record<string, { count: number; avgConsumption: number; totalValue: number }> = {};
    
    bills.forEach(bill => {
      const region = bill.address.includes('SP') ? 'São Paulo' :
                     bill.address.includes('RJ') ? 'Rio de Janeiro' :
                     bill.address.includes('MG') ? 'Minas Gerais' :
                     bill.address.includes('PR') ? 'Paraná' :
                     bill.address.includes('RS') ? 'Rio Grande do Sul' : 'Outros';
      
      if (!regionStats[region]) {
        regionStats[region] = { count: 0, avgConsumption: 0, totalValue: 0 };
      }
      
      regionStats[region].count++;
      regionStats[region].avgConsumption += bill.consumption_kwh;
      regionStats[region].totalValue += bill.total_value;
    });

    // Calcular médias
    Object.keys(regionStats).forEach(region => {
      if (regionStats[region].count > 0) {
        regionStats[region].avgConsumption = Math.round(regionStats[region].avgConsumption / regionStats[region].count);
      }
    });

    return regionStats;
  };

  const getFlagDistribution = () => {
    const distribution = { verde: 0, amarela: 0, vermelha: 0 };
    bills.forEach(bill => {
      if (bill.tariff_flag in distribution) {
        distribution[bill.tariff_flag as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const renderDashboard = () => {
    const regionStats = getRegionStats();
    const flagDistribution = getFlagDistribution();
    const totalBills = bills.length;

    return (
      <div className="space-y-8">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total de Contas"
            value={metrics?.total_bills_processed || 0}
            subtitle="Processadas com sucesso"
            icon={FileText}
            color="blue"
          />
          
          <MetricCard
            title="Consumo Médio"
            value={`${metrics?.average_consumption || 0} kWh`}
            subtitle="Por conta processada"
            icon={TrendingUp}
            color="green"
          />
          
          <MetricCard
            title="Valor Médio"
            value={`R$ ${metrics?.average_value?.toFixed(2) ?? 0}`} /* Corrigido: Usando nullish coalescing (??) para 0 */
            subtitle="Por fatura"
            icon={BarChart3}
            color="purple"
          />
          
          <MetricCard
            title="Contas Este Mês" // Título mais claro
            value={metrics?.bills_this_month || 0}
            subtitle="Processadas no mês atual" // Subtítulo mais claro
            icon={FileText} // Usando FileText para contas, Users é mais para usuários
            color="yellow" // Corrigido de 'orange' para 'yellow' (válido)
          />
        </div>

        {/* Distribuição por Região */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-blue-600" />
              Consumo por Região
            </h3>
            <div className="space-y-4">
              {Object.entries(regionStats).length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum dado de região disponível.</div>
              ) : (
                Object.entries(regionStats).map(([region, stats]) => (
                  <div key={region} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{region}</p>
                      <p className="text-sm text-gray-600">{stats.count} contas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{stats.avgConsumption} kWh</p>
                      <p className="text-sm text-gray-600">R$ {(stats.totalValue / stats.count).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Distribuição de Bandeiras */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-green-600" />
              Distribuição de Bandeiras
            </h3>
            <div className="space-y-4">
              {totalBills === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum dado de bandeira disponível.</div>
              ) : (
                Object.entries(flagDistribution).map(([flag, count]) => {
                  const percentage = totalBills > 0 ? (count / totalBills) * 100 : 0;
                  const color = flag === 'verde' ? 'green' : flag === 'amarela' ? 'yellow' : 'red';
                  
                  return (
                    <div key={flag} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-medium text-gray-900">{flag}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            color === 'green' ? 'bg-green-500' :
                            color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">🚀 Ações Administrativas</h3>
              <p className="text-gray-600">Ferramentas de gerenciamento e exportação</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={bills.length === 0}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Exportar Relatório CSV
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Taxa de Sucesso OCR</p>
                  <p className="text-2xl font-bold text-blue-600">94.2%</p> {/* Placeholder estático */}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Crescimento Mensal</p>
                  <p className="text-2xl font-bold text-green-600">+23%</p> {/* Placeholder estático */}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"> {/* Corrigido de orange-50 para yellow-50 */}
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-8 h-8 text-yellow-600" /> {/* Corrigido de orange-600 para yellow-600 */}
                <div>
                  <p className="font-medium text-yellow-900">Feedbacks Pendentes</p> {/* Corrigido de orange-900 para yellow-900 */}
                  <p className="text-2xl font-bold text-yellow-600">7</p> {/* Placeholder estático */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBillsTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">📋 Contas Processadas Recentemente</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Região</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.slice(0, 20).map((bill) => (
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
                  <div className="text-sm font-medium text-gray-900">{bill.consumption_kwh} kWh</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">R$ {bill.total_value.toFixed(2)}</div>
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
                  {bill.address.split(' - ').pop() || 'N/A'}
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
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Nenhuma conta processada ainda</p>
          <p>As contas aparecerão aqui conforme forem sendo processadas pelos usuários.</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'feedback':
        return <FeedbackManagement />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'bills':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Gerenciar Contas</h2>
            {renderBillsTable()}
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard Administrativo" />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
