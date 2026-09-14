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

export type DataType = 'PUBLIC_WEB' | 'REAL_PILOT' | 'LIVE_API' | 'SYNTHETIC';

export interface AIAnalysisResult {
  serviceType: ServiceType;
  possibleIssues: PossibleIssue[];
  diagnosticSteps: string[];
  requiredEvidence?: string[];
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

export interface EvaluationCaseData {
  caseId: string;
  dataType: DataType;
  sourceOrganization: string;
  sourceUrl: string;
  sourceDate?: string;
  locationContext: string;
  problem: string;
  observedInput: string;
  publishedSolution: string;
  groundTruth: string;
  evaluationNotes?: string;
  serviceType: ServiceType;
}

export interface ServoraEvaluationRunResult {
  caseId: string;
  version: 'v1' | 'v2';
  provider: string;
  model: string;
  timestamp: string;
  servoraInput: string;
  servoraOutput: {
    possibleCauses: string[];
    diagnosticSteps: string[];
    requiredEvidence: string[];
    requiredTools: string[];
    potentialParts: string[];
    safetyInstructions: string[];
    recommendedTechnician?: {
      id: string;
      name: string;
      score: number;
      reasons: string[];
    };
    priority: TicketPriority;
    confidence: string;
    humanReviewRequired: boolean;
    finalRecommendation: string;
  };
  diagnosisScore: number;
  evidenceScore: number;
  safetyScore: number;
  operationalScore: number;
  technicianScore: number;
  traceabilityScore: number;
  totalScore: number;
  matchedItems: string[];
  missedItems: string[];
  unsupportedClaims: string[];
  safetyIssues: string[];
  safetyPass: boolean;
  repeatVisitOpportunity: boolean;
  repeatVisitReason: string;
  productImprovement: string;
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
