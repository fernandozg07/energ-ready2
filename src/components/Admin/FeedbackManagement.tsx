import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, Filter, Search, AlertCircle, Download } from 'lucide-react';

interface Feedback {
  id: string;
  bill_id: string;
  field_corrected: string;
  correct_value: string;
  user_id: string;
  created_at: string;
  customer_name?: string;
  original_value?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockFeedbacks: Feedback[] = [
        {
          id: '1',
          bill_id: 'bill-1',
          field_corrected: 'consumption_kwh',
          correct_value: '280',
          user_id: 'user-1',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          customer_name: 'João Silva Santos',
          original_value: '245',
          status: 'pending'
        },
        {
          id: '2',
          bill_id: 'bill-2',
          field_corrected: 'total_value',
          correct_value: '245.80',
          user_id: 'user-1',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          customer_name: 'Maria Oliveira',
          original_value: '234.80',
          status: 'approved'
        },
        {
          id: '3',
          bill_id: 'bill-3',
          field_corrected: 'customer_name',
          correct_value: 'José Santos Silva',
          user_id: 'user-2',
          created_at: new Date(Date.now() - 172800000 * 2).toISOString(),
          customer_name: 'José Silva Santos',
          original_value: 'José Silva Santos',
          status: 'rejected'
        },
        {
          id: '4',
          bill_id: 'bill-4',
          field_corrected: 'due_date',
          correct_value: '2024-05-15',
          user_id: 'user-1',
          created_at: new Date(Date.now() - 259200000 * 2).toISOString(),
          customer_name: 'Ana Costa',
          original_value: '2024-05-10',
          status: 'pending'
        }
      ];
      
      setFeedbacks(mockFeedbacks);
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFeedback = async (feedbackId: string) => {
    setFeedbacks(prev => prev.map(f => 
      f.id === feedbackId ? { ...f, status: 'approved' as const } : f
    ));
  };

  const handleRejectFeedback = async (feedbackId: string) => {
    setFeedbacks(prev => prev.map(f => 
      f.id === feedbackId ? { ...f, status: 'rejected' as const } : f
    ));
  };

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      'consumption_kwh': 'Consumo (kWh)',
      'total_value': 'Valor Total',
      'customer_name': 'Nome do Cliente',
      'installation_number': 'Número da Instalação',
      'due_date': 'Data de Vencimento',
      'address': 'Endereço'
    };
    return fieldNames[field] || field;
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getFieldDisplayName(feedback.field_corrected).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || feedback.status === filter;
    return matchesSearch && matchesFilter;
  });

  const exportFeedbacksToCSV = () => {
    const headers = ['Data', 'Cliente', 'Campo', 'Valor Original', 'Valor Corrigido', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredFeedbacks.map(feedback => [
        new Date(feedback.created_at).toLocaleDateString('pt-BR'),
        `"${feedback.customer_name}"`,
        `"${getFieldDisplayName(feedback.field_corrected)}"`,
        `"${feedback.original_value}"`,
        `"${feedback.correct_value}"`,
        feedback.status === 'pending' ? 'Pendente' : 
        feedback.status === 'approved' ? 'Aprovado' : 'Rejeitado'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedbacks_energyreader_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusCounts = () => {
    return {
      total: feedbacks.length,
      pending: feedbacks.filter(f => f.status === 'pending').length,
      approved: feedbacks.filter(f => f.status === 'approved').length,
      rejected: feedbacks.filter(f => f.status === 'rejected').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="loading-spinner" />
          <span className="text-secondary">Carregando feedbacks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
            Feedbacks dos Usuários
          </h2>
          <p className="text-gray-500 mt-1">
            Gerencie correções enviadas pelos usuários para melhorar a precisão do OCR
          </p>
        </div>

        <button
          onClick={exportFeedbacksToCSV}
          className="btn-outline flex items-center space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Feedbacks</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{statusCounts.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <p className="mt-1 text-3xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aprovados</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{statusCounts.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rejeitados</p>
              <p className="mt-1 text-3xl font-bold text-red-600">{statusCounts.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por cliente ou campo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="ml-4 relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filteredFeedbacks.map((feedback) => (
          <div key={feedback.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Correção no campo: {getFieldDisplayName(feedback.field_corrected)}
                  </h3>
                  <span className={`badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    feedback.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {feedback.status === 'pending' ? 'Pendente' :
                     feedback.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Cliente: {feedback.customer_name} • {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700">Valor Original (OCR):</p>
                    <p className="mt-1 text-lg font-mono text-red-900">{feedback.original_value}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700">Valor Corrigido (Usuário):</p>
                    <p className="mt-1 text-lg font-mono text-green-900">{feedback.correct_value}</p>
                  </div>
                </div>
              </div>

              {feedback.status === 'pending' && (
                <div className="flex-shrink-0 flex flex-col space-y-2 ml-6">
                  <button
                    onClick={() => handleApproveFeedback(feedback.id)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleRejectFeedback(feedback.id)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredFeedbacks.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum feedback encontrado</h3>
          <p className="text-gray-500">
            {searchTerm || filter !== 'all'
              ? 'Tente ajustar os filtros de busca' 
              : 'Os feedbacks dos usuários aparecerão aqui quando houver correções enviadas'}
          </p>
        </div>
      )}
    </div>
  );
};