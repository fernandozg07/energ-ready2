import React from 'react';
// Import specific icons or just React.ElementType for the icon prop
import { TrendingUp, TrendingDown } from 'lucide-react';

// Use React.ElementType for the icon prop type
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType; // Correctly type the icon prop as a React component
  // Updated color prop to accept specific color names
  color?: 'primary' | 'secondary' | 'warning' | 'danger' | 'green' | 'blue' | 'purple' | 'yellow' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon, // Destructure as Icon to use in JSX
  color = 'primary',
  trend,
  onClick
}) => {
  // Map color prop to Tailwind CSS classes
  const iconColorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    secondary: 'bg-gray-100 text-gray-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  const trendColorClass = trend?.isPositive ? 'text-red-500' : 'text-green-500'; // Assuming positive trend is bad (more consumption/cost)

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
        <div className={`p-2 rounded-full ${iconColorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-medium ${trendColorClass}`}>
          {trend.isPositive ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          <span>{trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}% vs mês anterior</span>
        </div>
      )}
    </div>
  );
};
