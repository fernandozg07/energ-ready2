import React from 'react';
import { EnergyBill } from '../../types';

interface ConsumptionChartProps {
  bills: EnergyBill[];
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ bills }) => {
  // Agrupar contas por mês para o gráfico
  const monthlyData = bills
    .sort((a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime())
    .slice(-12) // Últimos 12 meses
    .map(bill => ({
      month: new Date(bill.processed_at).toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: '2-digit' 
      }),
      consumption: bill.consumption_kwh,
      value: bill.total_value
    }));

  const maxConsumption = Math.max(...monthlyData.map(d => d.consumption), 100);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">Histórico de Consumo</h3>
      
      {monthlyData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum dado disponível ainda.</p>
          <p className="text-sm">Faça upload de suas contas para ver o histórico.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Gráfico simples com barras CSS */}
          <div className="flex items-end space-x-2 h-40">
            {monthlyData.map((data, index) => {
              const height = (data.consumption / maxConsumption) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                  <div className="w-full relative group">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${height}%` }}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.consumption} kWh<br />
                      R$ {data.value.toFixed(2)}
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-600 writing-mode-vertical transform rotate-45">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>0 kWh</span>
            <span>{maxConsumption} kWh</span>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(monthlyData.reduce((acc, d) => acc + d.consumption, 0) / monthlyData.length)}
              </p>
              <p className="text-sm text-gray-600">Média kWh</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                R$ {(monthlyData.reduce((acc, d) => acc + d.value, 0) / monthlyData.length).toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Média R$</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {monthlyData.length}
              </p>
              <p className="text-sm text-gray-600">Contas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};