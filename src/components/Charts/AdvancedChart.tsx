import React, { useState, useMemo, useEffect } from 'react';
import { EnergyBill } from '../../types';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react'; // 'Calendar' removido
import { billsService } from '../../services/bills'; // Importe o serviço de bills

// Definindo os tipos para os itens de dados do gráfico
interface TimeSeriesDataItem {
  label: string;
  value: number; // Pode ser consumption_kwh ou total_value
  consumption: number;
  totalValue: number;
  flag: 'verde' | 'amarela' | 'vermelha';
  date: Date;
}

interface RegionDataItem {
  label: string; // Nome da região
  value: number; // Consumo médio da região
  count: number; // Número de contas na região
  totalValue: number; // Valor total das contas na região
  avgValue: number; // Valor médio das contas na região
}

interface FlagDataItem {
  label: string; // 'verde', 'amarela', 'vermelha'
  value: number; // Contagem de ocorrências
  percentage: number;
}

// Tipo de união para os dados processados no useMemo
type ChartDataItem = TimeSeriesDataItem | RegionDataItem | FlagDataItem;

interface AdvancedChartProps {
  type?: 'consumption' | 'value' | 'region' | 'flags';
  title: string;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({ 
  type = 'consumption',
  title 
}) => {
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
        console.error('Erro ao carregar contas para o gráfico avançado:', error);
        // Tratar erro, talvez exibir uma mensagem ao usuário
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []); // Array de dependências vazio para rodar apenas uma vez na montagem

  const processedData: ChartDataItem[] = useMemo(() => {
    // Se ainda estiver carregando ou não houver contas, retorne um array vazio para evitar erros
    if (loading || bills.length === 0) return [];

    const sortedBills = bills.sort((a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime());
    
    let filteredBills = sortedBills;
    switch (selectedPeriod) {
      case '6m':
        filteredBills = sortedBills.slice(-6);
        break;
      case '12m':
        filteredBills = sortedBills.slice(-12);
        break;
      default:
        filteredBills = sortedBills;
    }

    if (type === 'region') {
      const regionData: Record<string, { count: number; consumption: number; value: number }> = {};
      
      filteredBills.forEach(bill => {
        const region = bill.address.includes('SP') ? 'São Paulo' :
                       bill.address.includes('RJ') ? 'Rio de Janeiro' :
                       bill.address.includes('MG') ? 'Minas Gerais' :
                       bill.address.includes('PR') ? 'Paraná' :
                       bill.address.includes('RS') ? 'Rio Grande do Sul' : 'Outros';
        
        if (!regionData[region]) {
          regionData[region] = { count: 0, consumption: 0, value: 0 };
        }
        
        regionData[region].count++;
        regionData[region].consumption += bill.consumption_kwh;
        regionData[region].value += bill.total_value;
      });

      return Object.entries(regionData).map(([region, data]) => ({
        label: region,
        value: Math.round(data.consumption / data.count), // Consumo médio
        count: data.count,
        totalValue: data.value, // Valor total
        avgValue: Math.round(data.value / data.count) // Valor médio
      })) as RegionDataItem[]; // Cast explícito para RegionDataItem[]
    }

    if (type === 'flags') {
      const flagData = { verde: 0, amarela: 0, vermelha: 0 };
      filteredBills.forEach(bill => {
        flagData[bill.tariff_flag as keyof typeof flagData]++;
      });

      return Object.entries(flagData).map(([flag, count]) => ({
        label: flag,
        value: count,
        percentage: filteredBills.length > 0 ? (count / filteredBills.length) * 100 : 0
      })) as FlagDataItem[]; // Cast explícito para FlagDataItem[]
    }

    return filteredBills.map(bill => ({
      label: new Date(bill.processed_at).toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit' 
      }),
      value: type === 'consumption' ? bill.consumption_kwh : bill.total_value,
      consumption: bill.consumption_kwh,
      totalValue: bill.total_value,
      flag: bill.tariff_flag,
      date: new Date(bill.processed_at)
    })) as TimeSeriesDataItem[]; // Cast explícito para TimeSeriesDataItem[]
  }, [bills, selectedPeriod, type, loading]); // Adicione 'loading' às dependências

  // Funções de type guard para estreitar o tipo de 'data'
  const isTimeSeriesDataItem = (item: ChartDataItem): item is TimeSeriesDataItem => {
    return (item as TimeSeriesDataItem).consumption !== undefined && (item as TimeSeriesDataItem).totalValue !== undefined;
  };

  const isRegionDataItem = (item: ChartDataItem): item is RegionDataItem => {
    return (item as RegionDataItem).count !== undefined && (item as RegionDataItem).avgValue !== undefined;
  };

  const isFlagDataItem = (item: ChartDataItem): item is FlagDataItem => {
    return (item as FlagDataItem).percentage !== undefined;
  };

  const maxValue = processedData.length > 0 ? Math.max(...processedData.map(d => d.value), 100) : 100;
  const avgValue = processedData.length > 0 ? processedData.reduce((acc, d) => acc + d.value, 0) / processedData.length : 0;

  const getTrend = () => {
    // Apenas para dados de série temporal (consumo/valor)
    if (processedData.length < 4 || (type !== 'consumption' && type !== 'value')) return null;

    const timeSeriesData = processedData as TimeSeriesDataItem[]; // Cast seguro aqui

    const recent = timeSeriesData.slice(-2).reduce((acc, d) => acc + d.value, 0) / 2;
    const previous = timeSeriesData.slice(-4, -2).reduce((acc, d) => acc + d.value, 0) / 2;
    
    const change = previous !== 0 ? ((recent - previous) / previous) * 100 : (recent > 0 ? 100 : 0);
    return {
      value: Math.abs(change),
      isPositive: change > 0
    };
  };

  const trend = getTrend();

  const renderBarChart = () => (
    <div className="relative">
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
      {type !== 'region' && type !== 'flags' && (
        <div
          className="absolute w-full border-t-2 border-dashed border-blue-300 z-10"
          style={{ top: `${100 - (avgValue / maxValue) * 100}%` }}
        >
          <span className="absolute right-0 -top-2 text-xs text-blue-600 bg-white px-2 rounded">
            Média: {Math.round(avgValue)} {type === 'consumption' ? 'kWh' : 'R$'}
          </span>
        </div>
      )}

      {/* Bars */}
      <div className="flex items-end space-x-2 h-64 relative z-20">
        {processedData.map((data, index) => {
          const height = (data.value / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          
          let barColor = 'bg-gradient-to-t from-blue-500 to-blue-400';
          
          if (type === 'flags' && isFlagDataItem(data)) {
            barColor = data.label === 'verde' ? 'bg-gradient-to-t from-green-500 to-green-400' :
                       data.label === 'amarela' ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                       'bg-gradient-to-t from-red-500 to-red-400';
          } else if (type === 'region') {
            barColor = 'bg-gradient-to-t from-purple-500 to-purple-400';
          } else if (isTimeSeriesDataItem(data)) { // Agora data.flag é seguro de acessar
            barColor = data.flag === 'verde' ? 'bg-gradient-to-t from-green-500 to-green-400' :
                       data.flag === 'amarela' ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                       'bg-gradient-to-t from-red-500 to-red-400';
          }
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full relative group">
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${barColor} ${
                    isHovered ? 'opacity-90 scale-105' : 'hover:opacity-80'
                  }`}
                  style={{ height: `${height}%` }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-30">
                    <div className="font-medium">{data.label}</div>
                    <div>
                      {type === 'consumption' && `${data.value} kWh`}
                      {type === 'value' && `R$ ${data.value.toFixed(2)}`}
                      {type === 'region' && isRegionDataItem(data) && `${data.value} kWh (${data.count} contas)`}
                      {type === 'flags' && isFlagDataItem(data) && `${data.value} contas (${data.percentage?.toFixed(1)}%)`}
                    </div>
                    {/* Exibir consumo e valor total para regiões, se aplicável */}
                    {type === 'region' && isRegionDataItem(data) && (
                      <div className="text-gray-300">
                        Total: {data.totalValue?.toFixed(2)} R$
                      </div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
              
              <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left max-w-16 truncate">
                {data.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPieChart = () => {
    if (type !== 'flags') return null;

    // Garante que processedData é do tipo FlagDataItem[] para o gráfico de pizza
    const flagDataItems = processedData as FlagDataItem[]; 
    const total = flagDataItems.reduce((acc, d) => acc + d.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {flagDataItems.map((data, index) => { // Usando flagDataItems
              const percentage = (data.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;

              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              const colors = {
                verde: '#10b981',
                amarela: '#f59e0b',
                vermelha: '#ef4444'
              };

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[data.label as keyof typeof colors]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="ml-8 space-y-2">
          {flagDataItems.map((data, index) => ( // Usando flagDataItems
            <div key={index} className="flex items-center space-x-2">
              <div 
                className={`w-4 h-4 rounded ${
                  data.label === 'verde' ? 'bg-green-500' :
                  data.label === 'amarela' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-700 capitalize">
                {data.label}: {data.value} ({data.percentage?.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Carregando dados do gráfico...</p>
          <p className="text-sm">Por favor, aguarde.</p>
        </div>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
          <p className="text-sm">Os dados aparecerão aqui quando houver informações suficientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            {type === 'consumption' && <Activity className="w-6 h-6 mr-2 text-blue-600" />}
            {type === 'value' && <TrendingUp className="w-6 h-6 mr-2 text-green-600" />}
            {type === 'region' && <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />}
            {type === 'flags' && <PieChart className="w-6 h-6 mr-2 text-orange-600" />}
            {title}
          </h3>
          {trend && type !== 'region' && type !== 'flags' && (
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
        
        {/* Period Selector - only for time-based charts */}
        {type !== 'region' && type !== 'flags' && (
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
        )}
      </div>

      {/* Chart */}
      {type === 'flags' ? renderPieChart() : renderBarChart()}

      {/* Statistics */}
      {type !== 'flags' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(avgValue)}
            </p>
            <p className="text-sm text-gray-600">
              Média {type === 'consumption' ? 'kWh' : type === 'region' ? 'kWh' : 'R$'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.max(...processedData.map(d => d.value))}
            </p>
            <p className="text-sm text-gray-600">
              Máximo {type === 'consumption' ? 'kWh' : type === 'region' ? 'kWh' : 'R$'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {Math.min(...processedData.map(d => d.value))}
            </p>
            <p className="text-sm text-gray-600">
              Mínimo {type === 'consumption' ? 'kWh' : type === 'region' ? 'kWh' : 'R$'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {processedData.length}
            </p>
            <p className="text-sm text-gray-600">
              {type === 'region' ? 'Regiões' : 'Registros'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
