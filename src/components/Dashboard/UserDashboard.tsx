import React from 'react';
import { DollarSign, Zap, TrendingUp, Activity, Upload } from 'lucide-react';
import { EnergyBill, ConsumptionInsight } from '../../types';
import { MetricCard } from '../UI/MetricCard';
import { InsightCard } from '../UI/InsightCard';
import { InteractiveChart } from '../Charts/InteractiveChart';

interface DashboardContentProps {
  bills: EnergyBill[];
  onUploadClick: () => void;
}

// Melhoria: Extrair a lógica de geração de insights para fora do componente, 
// o que melhora a legibilidade e facilita o teste.
const generateAdvancedInsights = (bills: EnergyBill[]): ConsumptionInsight[] => {
  if (bills.length < 2) return [];

  const insights: ConsumptionInsight[] = [];
  const [latestBill, previousBill, ...restOfBills] = bills; // Melhoria: Usar desestruturação para clareza

  // Insight de mudança de consumo
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

  // Insight de bandeira tarifária
  if (latestBill.tariff_flag === 'vermelha') {
    insights.push({
      type: 'warning',
      title: 'Bandeira Vermelha Ativa',
      description: 'Evite usar eletrodomésticos de alto consumo entre 18h e 21h para economizar na próxima conta.'
    });
  }

  // Insight de valor
  const valueChange = latestBill.total_value - previousBill.total_value;
  if (valueChange > 50) {
    insights.push({
      type: 'warning',
      title: `Conta R$ ${valueChange.toFixed(2)} mais cara`,
      description: 'Considere revisar o uso de chuveiro elétrico e ar-condicionado para reduzir custos.'
    });
  }

  // Insight de comparação com média
  const avgConsumption = bills.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / bills.length;
  if (latestBill.consumption_kwh > avgConsumption * 1.2) {
    insights.push({
      type: 'tip',
      title: 'Consumo Acima da Sua Média',
      description: `${((latestBill.consumption_kwh / avgConsumption - 1) * 100).toFixed(1)}% acima do normal. Que tal definir uma meta de economia para o próximo mês?`
    });
  }

  // Insight de economia potencial
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

  // Retorna apenas os 4 melhores insights
  return insights.slice(0, 4);
};

export const DashboardContent: React.FC<DashboardContentProps> = ({ bills, onUploadClick }) => {
  // Melhoria: Early return para o estado sem dados
  if (bills.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-32 w-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-8">
          <Zap className="h-16 w-16 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Bem-vindo ao EnergyReader!
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
          Faça upload da sua primeira conta de energia para começar a monitorar seu consumo e receber insights personalizados.
        </p>
        <button
          onClick={onUploadClick}
          className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Upload className="w-6 h-6 mr-3" />
          Upload da Primeira Conta
        </button>
      </div>
    );
  }

  // Melhoria: Usar o hook `useMemo` para evitar que a função `generateAdvancedInsights`
  // seja chamada em cada renderização se `bills` não mudar.
  const insights = React.useMemo(() => generateAdvancedInsights(bills), [bills]);

  // Melhoria: Usar desestruturação para acessar dados da última conta
  const [latestBill, previousBill] = bills;
  const avgConsumption = bills.reduce((acc, bill) => acc + bill.consumption_kwh, 0) / bills.length;
  const consumptionTrend = previousBill ? ((latestBill.consumption_kwh - previousBill.consumption_kwh) / previousBill.consumption_kwh) * 100 : 0;

  return (
    <div className="p-8 space-y-8">
      {/* Métricas Principais */}
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
          icon={Activity}
          color={
            latestBill.tariff_flag === 'verde' ? 'green' :
            latestBill.tariff_flag === 'amarela' ? 'yellow' : 'red'
          }
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Insights Personalizados</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gráfico Interativo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Seu Histórico de Consumo</h3>
        <InteractiveChart bills={bills} />
      </div>

      {/* Botão de Upload */}
      <div className="text-center py-4">
        <button
          onClick={onUploadClick}
          className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
        >
          <Upload className="w-6 h-6 mr-3" />
          Adicionar Nova Conta
        </button>
      </div>
    </div>
  );
};