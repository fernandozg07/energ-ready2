import React, { useState, useEffect, useCallback } from 'react'; // Adicionado 'useCallback'
import { Upload, Zap, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { FileUpload } from '../Upload/FileUpload';
import { InteractiveChart } from '../Charts/InteractiveChart';
import { MetricCard } from '../UI/MetricCard';
import { InsightCard } from '../UI/InsightCard';
import { EnergyBill, ConsumptionInsight } from '../../types';
import { billsService } from '../../services/bills';
import { useAuth } from '../../hooks/useAuth';

// Funções de utilidade para geração de insights
const generateAdvancedInsights = (bills: EnergyBill[]): ConsumptionInsight[] => {
  if (bills.length < 2) {
    return [];
  }

  const insights: ConsumptionInsight[] = [];
  const [latestBill, previousBill] = bills;

  const consumptionChange = latestBill.consumption_kwh - previousBill.consumption_kwh;
  const percentChange = (consumptionChange / previousBill.consumption_kwh) * 100;

  if (Math.abs(percentChange) > 15) {
    insights.push({
      type: percentChange > 0 ? 'warning' : 'success',
      title: `Consumo ${percentChange > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(percentChange).toFixed(1)}%`,
      description: percentChange > 0
        ? `Aumento de ${Math.abs(consumptionChange)} kWh. Verifique o uso de ar-condicionado e aquecedores.`
        : `Redução de ${Math.abs(consumptionChange)} kWh. Parabéns pela economia!`
    });
  }

  if (latestBill.tariff_flag === 'vermelha') {
    insights.push({
      type: 'warning',
      title: 'Bandeira Vermelha Ativa',
      description: 'Evite usar eletrodomésticos de alto consumo entre 18h e 21h para economizar até R$ 50 na próxima conta.'
    });
  } else if (latestBill.tariff_flag === 'verde' && previousBill.tariff_flag !== 'verde') {
    insights.push({
      type: 'success',
      title: 'Bandeira Verde Ativa',
      description: 'Momento ideal para usar eletrodomésticos! A energia está mais barata este mês.'
    });
  }

  const valueChange = latestBill.total_value - previousBill.total_value;
  if (valueChange > 50) {
    insights.push({
      type: 'warning',
      title: `Conta R$ ${valueChange.toFixed(2)} mais cara`,
      description: 'Considere revisar o uso de chuveiro elétrico e ar-condicionado para reduzir custos.'
    });
  }

  const avgConsumption = bills.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / bills.length;
  if (latestBill.consumption_kwh > avgConsumption * 1.2) {
    insights.push({
      type: 'tip',
      title: 'Consumo Acima da Sua Média',
      description: `${((latestBill.consumption_kwh / avgConsumption - 1) * 100).toFixed(1)}% acima do normal. Que tal definir uma meta de economia para o próximo mês?`
    });
  }

  if (bills.length >= 3) {
    const last3Months = bills.slice(0, 3);
    const avgLast3 = last3Months.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / 3;
    const potentialSavings = avgLast3 * 0.15 * 0.8;
    insights.push({
      type: 'tip',
      title: 'Potencial de Economia com Energia Solar',
      description: `Com base no seu consumo, você poderia economizar até R$ ${potentialSavings.toFixed(2)} por mês com energia solar.`
    });
  }

  return insights.slice(0, 4);
};

export const EnhancedUserDashboard: React.FC = () => {
  const [bills, setBills] = useState<EnergyBill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Alteração: A função loadBills foi extraída para fora do useEffect e envolvida em useCallback.
  // Isso garante que ela seja memorizada e só recriada quando o 'user' ou 'setBills' mudar.
  const loadBills = useCallback(async () => {
    if (!user) {
      setBills([]);
      setLoadingBills(false);
      return;
    }

    setLoadingBills(true);
    try {
      const userBills = await billsService.getUserBills(user.id);
      setBills(userBills.sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()));
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  }, [user]); // Dependências do useCallback

  // Alteração: O useEffect agora simplesmente chama a função 'loadBills'.
  // A lógica de `if (!authLoading)` garante que o fetch só ocorra depois do estado do usuário estar pronto.
  useEffect(() => {
    if (!authLoading) {
      loadBills();
    }
  }, [authLoading, loadBills]); // Dependências do useEffect

  const insights = generateAdvancedInsights(bills);

  const renderEmptyState = () => (
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="text-center py-16">
        <div className="mx-auto h-32 w-32 bg-blue-100 rounded-full flex items-center justify-center mb-8">
          <Zap className="h-16 w-16 text-[#007bf7]" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 font-['Roboto_Slab']">
          Bem-vindo ao EnergyReader!
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg font-['Roboto']">
          Faça upload da sua primeira conta de energia para começar a monitorar seu consumo e receber insights personalizados.
        </p>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-[#007bf7] to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-['Roboto']"
        >
          <Upload className="w-6 h-6 mr-3" />
          Adicionar Nova Conta
        </button>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    if (bills.length === 0) {
      return renderEmptyState();
    }

    const latestBill = bills[0];
    const previousBill = bills.length > 1 ? bills[1] : undefined;

    const avgConsumption = bills.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / bills.length;
    const consumptionTrend = previousBill ? ((latestBill.consumption_kwh - previousBill.consumption_kwh) / previousBill.consumption_kwh) * 100 : 0;

    return (
      <div className="space-y-8 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Última Fatura"
            value={`R$ ${latestBill.total_value.toFixed(2)}`}
            subtitle={`Vence em ${new Date(latestBill.due_date).toLocaleDateString('pt-BR')}`}
            icon={DollarSign}
            color="green"
            trend={previousBill ? {
              value: Math.abs(((latestBill.total_value - previousBill.total_value) / previousBill.total_value) * 100),
              isPositive: latestBill.total_value > previousBill.total_value
            } : undefined}
          />
          <MetricCard
            title="Consumo Atual"
            value={`${latestBill.consumption_kwh} kWh`}
            subtitle="Último mês"
            icon={Zap}
            color="blue"
            trend={previousBill ? {
              value: Math.abs(consumptionTrend),
              isPositive: consumptionTrend > 0
            } : undefined}
          />
          <MetricCard
            title="Média Histórica"
            value={`${Math.round(avgConsumption)} kWh`}
            subtitle={`${bills.length} contas analisadas`}
            icon={TrendingUp}
            color="purple"
          />
          <MetricCard
            title="Bandeira Atual"
            value={latestBill.tariff_flag}
            subtitle="Tarifa vigente"
            color={latestBill.tariff_flag === 'verde' ? 'green' : latestBill.tariff_flag === 'amarela' ? 'yellow' : 'red'}
            icon={Activity}
          />
        </div>
        {insights.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">💡 Insights Personalizados</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <InsightCard key={index} type={insight.type} title={insight.title} description={insight.description} />
              ))}
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">Histórico de Consumo</h3>
          <InteractiveChart bills={bills} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">Detalhes da Última Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Cliente</p>
              <p className="text-gray-900 font-medium font-['Roboto'] text-base">{latestBill.customer_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Instalação</p>
              <p className="text-gray-900 font-['Roboto'] text-base">{latestBill.installation_number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Distribuidora</p>
              <p className="text-gray-900 font-['Roboto'] text-base">{latestBill.distributor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Endereço</p>
              <p className="text-gray-900 font-['Roboto'] text-base">{latestBill.address}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Referência</p>
              <p className="text-gray-900 font-['Roboto'] text-base">{latestBill.reference_month}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Processado em</p>
              <p className="text-gray-900 font-['Roboto'] text-base">{new Date(latestBill.processed_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-[#007bf7] to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-['Roboto']"
          >
            <Upload className="w-6 h-6 mr-3" />
            Adicionar Nova Conta
          </button>
        </div>
      </div>
    );
  };

  const renderHistoryContent = () => (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">📊 Histórico Completo</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">Histórico de Consumo</h3>
        <InteractiveChart bills={bills} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 font-['Roboto_Slab']">Todas as Contas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">Consumo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">Bandeira</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-['Roboto']">Vencimento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-['Roboto']">
                    {new Date(bill.processed_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-['Roboto']">
                    {bill.consumption_kwh} kWh
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-['Roboto']">
                    R$ {bill.total_value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize font-['Roboto'] ${
                      bill.tariff_flag === 'verde' ? 'bg-green-100 text-green-800' :
                      bill.tariff_flag === 'amarela' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bill.tariff_flag}
                  </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-['Roboto']">
                    {new Date(bill.due_date).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (authLoading || loadingBills) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#007bf7] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      );
    }
    
    if (bills.length === 0) {
      return renderEmptyState();
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'history':
        return renderHistoryContent();
      case 'settings':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">⚙️ Configurações</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-600 font-['Roboto']">Configurações em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">❓ Ajuda</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-600 font-['Roboto']">Conteúdo de ajuda em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-['Roboto_Slab']">📤 Upload de Nova Conta</h2>
            <FileUpload onProcessingComplete={() => {
              setShowUploadModal(false);
              if (user) {
                loadBills();
              }
            }} />
          </div>
        );
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard do Usuário" />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-['Roboto_Slab']">📤 Upload de Conta de Energia</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-['Roboto']"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <FileUpload
                onProcessingComplete={() => {
                  setShowUploadModal(false);
                  if (user) {
                    loadBills();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};