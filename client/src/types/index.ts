export type ServiceType = 'SOLAR' | 'AC';

export type UserRole = 'SERVICE_MANAGER' | 'TECHNICIAN';

export type TechnicianAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus =
  | 'NEW'
  | 'AI_ANALYZED'
  | 'WAITING_FOR_ASSIGNMENT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ON_SITE'
  | 'DIAGNOSING'
  | 'REPAIRING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  servicesSupported: ServiceType[];
}

export interface Technician {
  _id: string;
  name: string;
  phone: string;
  email: string;
  experienceYears: number;
  serviceTypes: ServiceType[];
  skills: string[];
  tools: string[];
  certifications: string[];
  serviceAreas: string[];
  availability: TechnicianAvailability;
  active: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  notes?: string;
  createdAt: string;
}

export interface SolarSystem {
  _id: string;
  customerId: string;
  capacityKW: number;
  panelMake: string;
  panelModel?: string;
  inverterMake: string;
  inverterModel?: string;
  inverterSerial?: string;
  systemType: 'ON_GRID' | 'OFF_GRID' | 'HYBRID';
  batteryPresent: boolean;
}

export interface ACUnit {
  _id: string;
  customerId: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  acType: 'SPLIT' | 'WINDOW' | 'CASSETTE' | 'DUCTED' | 'OTHER';
  capacityTR: number;
  refrigerantType?: string;
  compressorType?: string;
}

export interface PossibleIssue {
  issue: string;
  probabilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface AIAnalysis {
  _id: string;
  ticketId: string;
  provider: string;
  model: string;
  serviceType: ServiceType;
  possibleIssues: PossibleIssue[];
  diagnosticSteps: string[];
  recommendedTools: string[];
  possibleParts: string[];
  safetyWarnings: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  knowledgeSources: string[];
  promptVersion: string;
  createdAt: string;
}

export interface ServiceTicket {
  _id: string;
  ticketNumber: string;
  serviceType: ServiceType;
  customerId: Customer | any;
  assetId: string;
  assetType: 'SolarSystem' | 'ACUnit';
  complaint: string;
  symptoms: string[];
  errorCode?: string;
  priority: TicketPriority;
  photos: string[];
  status: TicketStatus;
  aiAnalysisId?: AIAnalysis | any;
  assignedTechnicianId?: Technician | any;
  repeatVisit: boolean;
  repeatVisitReason?: string;
  isDemoData: boolean;
  createdBy?: any;
  statusHistory: Array<{
    status: TicketStatus;
    changedBy: any;
    timestamp: string;
    note?: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReport {
  _id: string;
  ticketId: string;
  technicianId: any;
  actualDiagnosis: string;
  workPerformed: string;
  readings: Record<string, any>;
  partsUsed: string[];
  toolsUsed: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  technicianNotes?: string;
  aiHelpful?: boolean;
  aiAccuracyRating?: number;
  toolsHelpful?: boolean;
  partsHelpful?: boolean;
  additionalFeedback?: string;
  completedAt: string;
}

export interface ServiceHistory {
  _id: string;
  ticketId: string;
  ticketNumber: string;
  serviceType: ServiceType;
  complaint: string;
  aiPredictionSummary: string;
  actualDiagnosis: string;
  workPerformed: string;
  partsUsed: string[];
  readings: Record<string, any>;
  technicianName: string;
  comparisonResult?: {
    diagnosisMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH';
    toolMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH';
    partMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' | 'NOT APPLICABLE';
  };
  completedAt: string;
}

export interface TechnicianMatchResult {
  technicianId: string;
  technicianName: string;
  phone: string;
  experienceYears: number;
  serviceTypes: ServiceType[];
  score: number;
  reasons: string[];
  missingSkills: string[];
  missingTools: string[];
  availability: TechnicianAvailability;
  serviceCompatibility: boolean;
  serviceAreas: string[];
}

export interface PilotMetrics {
  filter: {
    serviceType: string;
    includeDemoData: boolean;
  };
  overview: {
    totalTickets: number;
    openTickets: number;
    completedTickets: number;
    aiAnalyzedTickets: number;
    availableTechnicians: number;
    totalTechnicians: number;
  };
  rates: {
    diagnosisMatch: {
      matched: number;
      evaluated: number;
      percentage: number;
      display: string;
    };
    toolMatch: {
      matched: number;
      evaluated: number;
      percentage: number;
      display: string;
    };
    partMatch: {
      matched: number;
      evaluated: number;
      percentage: number;
      display: string;
    };
    repeatVisitRate: {
      repeatVisits: number;
      totalCompleted: number;
      percentage: number;
      display: string;
    };
  };
  averages: {
    avgCompletionTimeMinutes: number;
    aiHelpfulRating: number;
    managerSatisfactionRating: number;
  };
  breakdown: {
    solarCount: number;
    acCount: number;
    demoCount: number;
    pilotCount: number;
  };
}
