import React, { useState, useEffect } from 'react';
import { EnergyBill } from '../../types';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { billsService } from '../../services/bills'; // Importe o serviço de bills

interface InteractiveChartProps {
  // A prop 'bills' será removida
}

export const InteractiveChart: React.FC<InteractiveChartProps> = () => {
  const [bills, setBills] = useState<EnergyBill[]>([]); // Estado para armazenar as contas
  const [loading, setLoading] = useState(true); // Estado para o carregamento
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'all'>('12m');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Efeito para carregar os dados quando o componente é montado
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const allBills = await billsService.getAllBills();
        setBills(allBills);
      } catch (error) {
        console.error('Erro ao carregar contas para o gráfico interativo:', error);
        // Tratar erro, talvez exibir uma mensagem ao usuário
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []); // Array de dependências vazio para rodar apenas uma vez na montagem

  // Processar dados baseado no período selecionado
  const getFilteredData = () => {
    // Se ainda estiver carregando ou não houver contas, retorne um array vazio
    if (loading || bills.length === 0) return [];

    const sortedBills = bills.sort((a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime());
    
    switch (selectedPeriod) {
      case '6m':
        return sortedBills.slice(-6);
      case '12m':
        return sortedBills.slice(-12);
      default:
        return sortedBills;
    }
  };

  const chartData = getFilteredData().map(bill => ({
    month: new Date(bill.processed_at).toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    }),
    consumption: bill.consumption_kwh,
    value: bill.total_value,
    date: new Date(bill.processed_at),
    flag: bill.tariff_flag
  }));

  const maxConsumption = chartData.length > 0 ? Math.max(...chartData.map(d => d.consumption), 100) : 100;
  const avgConsumption = chartData.length > 0 ? chartData.reduce((acc, d) => acc + d.consumption, 0) / chartData.length : 0;

  // Calcular tendência
  const getTrend = () => {
    if (chartData.length < 2) return null;
    const recent = chartData.slice(-3).reduce((acc, d) => acc + d.consumption, 0) / 3;
    const previous = chartData.slice(-6, -3).reduce((acc, d) => acc + d.consumption, 0) / 3;
    // Evita divisão por zero se 'previous' for 0
    const change = previous !== 0 ? ((recent - previous) / previous) * 100 : (recent > 0 ? 100 : 0);
    return {
      value: Math.abs(change),
      isPositive: change > 0
    };
  };

  const trend = getTrend();

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Carregando histórico...</p>
          <p className="text-sm">Por favor, aguarde.</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Nenhum histórico disponível</p>
          <p className="text-sm">Faça upload de suas contas para ver o gráfico de consumo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Histórico de Consumo</h3>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600' // Inverti as cores para aumento/redução
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">
                {trend.value.toFixed(1)}% {trend.isPositive ? 'aumento' : 'redução'}
              </span>
            </div>
          )}
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: '6m', label: '6M' },
            { key: '12m', label: '12M' },
            { key: 'all', label: 'Tudo' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as '6m' | '12m' | 'all')} // Tipagem mais específica
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedPeriod === period.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{maxConsumption} kWh</span>
          <span>{Math.round(maxConsumption * 0.75)} kWh</span>
          <span>{Math.round(maxConsumption * 0.5)} kWh</span>
          <span>{Math.round(maxConsumption * 0.25)} kWh</span>
          <span>0 kWh</span>
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 h-64">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t border-gray-100"
              style={{ top: `${100 - percent}%` }}
            />
          ))}
        </div>

        {/* Average line */}
        <div
          className="absolute w-full border-t-2 border-dashed border-blue-300 z-10"
          style={{ top: `${100 - (avgConsumption / maxConsumption) * 100}%` }}
        >
          <span className="absolute right-0 -top-2 text-xs text-blue-600 bg-white px-2">
            Média: {Math.round(avgConsumption)} kWh
          </span>
        </div>

        {/* Bars */}
        <div className="flex items-end space-x-2 h-64 relative z-20">
          {chartData.map((data, index) => {
            const height = (data.consumption / maxConsumption) * 100;
            const isHovered = hoveredIndex === index;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative group">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                      data.flag === 'verde' ? 'bg-gradient-to-t from-green-500 to-green-400' :
                      data.flag === 'amarela' ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                      'bg-gradient-to-t from-red-500 to-red-400'
                    } ${isHovered ? 'opacity-90 scale-105' : 'hover:opacity-80'}`}
                    style={{ height: `${height}%` }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-30">
                      <div className="font-medium">{data.consumption} kWh</div>
                      <div>R$ {data.value.toFixed(2)}</div>
                      <div className="capitalize">Bandeira {data.flag}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(avgConsumption)}
          </p>
          <p className="text-sm text-gray-600">Média kWh</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            R$ {(chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length).toFixed(0)}
          </p>
          <p className="text-sm text-gray-600">Média R$</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {chartData.length}
          </p>
          <p className="text-sm text-gray-600">Contas</p>
        </div>
      </div>
    </div>
  );
};
