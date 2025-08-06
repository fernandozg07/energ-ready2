import React from 'react';
import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';

interface InsightCardProps {
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  value?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  description,
  action,
  value
}) => {
  const getConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-500',
          titleColor: 'text-orange-800',
          textColor: 'text-orange-700'
        };
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-500',
          titleColor: 'text-green-800',
          textColor: 'text-green-700'
        };
      case 'tip':
        return {
          icon: Lightbulb,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${config.titleColor}`}>{title}</h4>
            {value && (
              <span className={`text-sm font-bold ${config.titleColor}`}>{value}</span>
            )}
          </div>
          <p className={`text-sm ${config.textColor} mb-3`}>{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`text-sm font-medium ${config.iconColor} hover:underline`}
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};