import { ServiceType, AIAnalysisResult } from '../types';

export interface AITicketContext {
  ticketNumber: string;
  serviceType: ServiceType;
  complaint: string;
  symptoms: string[];
  errorCode?: string;
  priority?: string;
  assetDetails: {
    // Solar specific
    capacityKW?: number;
    panelMake?: string;
    inverterMake?: string;
    inverterModel?: string;
    inverterSerial?: string;
    systemType?: string;
    batteryPresent?: boolean;
    // AC specific
    brand?: string;
    model?: string;
    serialNumber?: string;
    acType?: string;
    capacityTR?: number;
    refrigerantType?: string;
    compressorType?: string;
  };
  previousHistory?: Array<{
    date: Date | string;
    complaint: string;
    actualDiagnosis: string;
    workPerformed: string;
  }>;
}

export interface AIProvider {
  name: string;
  analyzeServiceTicket(input: AITicketContext): Promise<AIAnalysisResult>;
  healthCheck(): Promise<{ available: boolean; provider: string; details?: string }>;
}
