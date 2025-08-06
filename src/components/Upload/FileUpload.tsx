import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { ocrService } from '../../services/ocr';
import { billsService } from '../../services/bills';
import { useAuth } from '../../hooks/useAuth';
import { ProcessedData } from '../../types';

interface FileUploadProps {
  onProcessingComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onProcessingComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError('Formato de arquivo não suportado. Use JPEG, PNG ou PDF.');
      return false;
    }

    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    if (!user || !validateFile(file)) return;

    setUploading(true);
    setError('');
    setSuccess(false);
    setProcessedData(null);

    try {
      // Upload do arquivo
      const fileUrl = await billsService.uploadBill(file, user.id);
      
      setUploading(false);
      setProcessing(true);

      // Processar com OCR
      const extractedData = await ocrService.processEnergyBill(file);
      setProcessedData(extractedData);

      // Salvar no banco
      await billsService.saveBill({
        user_id: user.id,
        file_name: file.name,
        file_url: fileUrl,
        consumption_kwh: extractedData.consumption_kwh,
        total_value: extractedData.total_value,
        due_date: extractedData.due_date,
        installation_number: extractedData.installation_number,
        customer_name: extractedData.customer_name,
        address: extractedData.address,
        distributor: extractedData.distributor,
        tariff_flag: extractedData.tariff_flag,
        reference_month: extractedData.reference_month,
        raw_data: extractedData
      });

      setSuccess(true);
      onProcessingComplete();
      
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${(uploading || processing) ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*,.pdf"
          onChange={handleChange}
          disabled={uploading || processing}
        />
        
        <div className="space-y-4">
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Fazendo upload...</p>
            </div>
          ) : processing ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Processando conta com OCR...</p>
              <p className="text-xs text-gray-500">Isso pode levar alguns segundos</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arraste sua conta de energia aqui
                </p>
                <p className="text-sm text-gray-600">
                  ou clique para selecionar um arquivo
                </p>
              </div>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Image className="w-4 h-4" />
                  <span>JPG, PNG</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && processedData && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">Conta processada com sucesso!</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Dados extraídos:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Cliente:</span>
                <p className="text-gray-900">{processedData.customer_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Instalação:</span>
                <p className="text-gray-900">{processedData.installation_number}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Consumo:</span>
                <p className="text-gray-900">{processedData.consumption_kwh} kWh</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Valor:</span>
                <p className="text-gray-900">R$ {processedData.total_value.toFixed(2)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Vencimento:</span>
                <p className="text-gray-900">{new Date(processedData.due_date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Bandeira:</span>
                <p className={`capitalize ${
                  processedData.tariff_flag === 'verde' ? 'text-green-600' :
                  processedData.tariff_flag === 'amarela' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {processedData.tariff_flag}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};