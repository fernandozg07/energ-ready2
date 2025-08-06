import { ProcessedData } from '../types';

// Simulação de OCR - em produção seria integrado com Google Vision API ou Tesseract
export const ocrService = {
  // O parâmetro 'file' é mantido aqui, mas não é usado na simulação atual.
  // Em uma implementação real, o 'file' seria enviado para uma API de OCR.
  async processEnergyBill(file: File): Promise<ProcessedData> {
    // Simula processamento OCR
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Dados simulados baseados no nome do arquivo ou conteúdo
    // Para uma simulação mais realista, você poderia usar o nome do arquivo
    // ou um hash do conteúdo para retornar dados mockados específicos.
    console.log("Simulando processamento OCR para o arquivo:", file.name);

    const mockData: ProcessedData = {
      customer_name: "João Silva Santos",
      address: "Rua das Flores, 123 - Centro - São Paulo/SP",
      installation_number: "12345678901",
      consumption_kwh: Math.floor(Math.random() * 300) + 100,
      total_value: parseFloat((Math.random() * 200 + 80).toFixed(2)), // Garante 2 casas decimais
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tariff_flag: ['verde', 'amarela', 'vermelha'][Math.floor(Math.random() * 3)] as 'verde' | 'amarela' | 'vermelha', // Cast para o tipo correto
      distributor: "Enel São Paulo",
      reference_month: new Date().toISOString().substring(0, 7)
    };

    return mockData;
  },

  async extractDataFromText(text: string): Promise<ProcessedData | null> {
    // Regex patterns para diferentes distribuidoras
    const patterns = {
      consumption: /(\d+)\s*kWh/i,
      value: /R\$\s*(\d+[,.]?\d*)/,
      installation: /(\d{10,})/,
      dueDate: /vencimento[:\s]*(\d{2}\/\d{2}\/\d{4})/i
    };

    try {
      const consumptionMatch = text.match(patterns.consumption);
      const valueMatch = text.match(patterns.value);
      const installationMatch = text.match(patterns.installation);
      const dueDateMatch = text.match(patterns.dueDate);

      const consumption = consumptionMatch ? consumptionMatch[1] : undefined;
      const value = valueMatch ? valueMatch[1] : undefined;
      const installation = installationMatch ? installationMatch[1] : undefined;
      const dueDate = dueDateMatch ? dueDateMatch[1] : undefined;

      if (consumption && value) {
        return {
          customer_name: "Cliente Extraído",
          address: "Endereço extraído do OCR",
          installation_number: installation || "N/A",
          consumption_kwh: parseInt(consumption),
          total_value: parseFloat(value.replace(',', '.')),
          due_date: dueDate || new Date().toISOString().split('T')[0],
          tariff_flag: "verde", // Valor padrão, pode ser aprimorado com mais regex
          distributor: "Distribuidora Detectada", // Valor padrão, pode ser aprimorado com mais regex
          reference_month: new Date().toISOString().substring(0, 7)
        };
      }
    } catch (error) {
      console.error('Erro ao extrair dados:', error);
    }

    return null;
  }
};
