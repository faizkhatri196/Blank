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

export type SolarSystemType = 'ON_GRID' | 'OFF_GRID' | 'HYBRID';

export type ACUnitType = 'SPLIT' | 'WINDOW' | 'CASSETTE' | 'DUCTED' | 'OTHER';

export type ProbabilityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PossibleIssue {
  issue: string;
  probabilityLevel: ProbabilityLevel;
  explanation: string;
}

export interface AIAnalysisResult {
  serviceType: ServiceType;
  possibleIssues: PossibleIssue[];
  diagnosticSteps: string[];
  recommendedTools: string[];
  possibleParts: string[];
  safetyWarnings: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  knowledgeSources: string[];
  promptVersion?: string;
  provider?: string;
  model?: string;
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

export interface SolarReadings {
  dcVoltage?: number | string;
  dcCurrent?: number | string;
  acVoltage?: number | string;
  acCurrent?: number | string;
  frequency?: number | string;
  dailyGenerationKWh?: number | string;
  inverterStatus?: string;
}

export interface ACReadings {
  indoorTemp?: number | string;
  outdoorTemp?: number | string;
  grilleTemp?: number | string;
  operatingCurrent?: number | string;
  voltage?: number | string;
  suctionPressurePSI?: number | string;
  dischargePressurePSI?: number | string;
  refrigerantState?: string;
}

export interface EvaluationComparison {
  diagnosisMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH';
  toolMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH';
  partMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' | 'NOT APPLICABLE';
  technicianMatch: 'MATCH' | 'DIFFERENT ASSIGNMENT';
  aiHelpful: boolean;
  notes: string;
}
