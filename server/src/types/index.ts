export type ServiceType =
  | 'SOLAR'
  | 'AC'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'RO_PURIFIER'
  | 'REFRIGERATOR'
  | 'WASHING_MACHINE'
  | 'APPLIANCE_REPAIR'
  | string;

export interface ServiceAreaConfig {
  city: string;
  state?: string;
  country?: string;
  areas?: string[];
  pincodes?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  services: ServiceType[];
}

export type LocationFreshnessLevel = 'FRESH' | 'WARM' | 'STALE' | 'UNAVAILABLE';

export interface LocationFreshness {
  level: LocationFreshnessLevel;
  label: string;
  color: string;
  minutesAgo?: number;
}

export interface ActiveFieldOperation {
  ticketId: string;
  ticketNumber: string;
  serviceType: ServiceType;
  problemCategory: string;
  customerName: string;
  customerPhone?: string;
  serviceLocation: {
    address: string;
    city: string;
    area?: string;
    pincode?: string;
  };
  technician: {
    id: string;
    name: string;
    phone: string;
    profilePhoto?: string;
    currentLocation?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      accuracy?: number;
      timestamp?: string;
    };
    locationFreshness: LocationFreshness;
  } | null;
  status: TicketStatus;
  statusLabel: string;
  etaMinutes?: number;
  startedAt?: string;
  latestActivity: {
    action: string;
    timestamp: string;
    note?: string;
  };
  progressSteps: Array<{
    key: string;
    label: string;
    completed: boolean;
    current: boolean;
  }>;
}

export type UserRole = 'SERVICE_MANAGER' | 'TECHNICIAN' | 'CUSTOMER';

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

export type EnvironmentContext = 'DEMO' | 'PILOT';

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
  rawComplaint?: string;
  normalizedComplaint?: string;
  isUnknownTriage?: boolean;
  knownFacts?: string[];
  unknownFacts?: string[];
  missingInformation?: string[];
  statusMessage?: string;
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
  coverageRadiusKm?: number;
  pincodes?: string[];
  isEligible: boolean;
  coverageStatus: 'COVERS_LOCATION' | 'OUTSIDE_SERVICE_AREA' | 'NO_COVERAGE_CONFIGURED';
  coverageExplanation: string;
  ineligibilityReason?: string;
  customerLocationSummary?: string;
  technicianCoverageSummary?: string;
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

export interface ServiceAreaConfig {
  city: string;
  areas?: string[];
  pincodes?: string[];
  services: ServiceType[];
}

export interface CustomerLocation {
  address: string;
  city: string;
  area?: string;
  pincode?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  locationSource?: 'GEOLOCATION' | 'MANUAL' | string;
}

export interface CustomerProblemCard {
  code: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  recommendedEvidence: string[];
  triageQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
}

export interface CustomerTimelineStep {
  key: string;
  label: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  timestamp?: string;
  description?: string;
}

export interface CustomerFeedbackInput {
  rating: number; // 1-5
  comment?: string;
  onTime?: boolean;
  resolved?: boolean;
}

export interface CustomerSafeTicketResponse {
  _id: string;
  ticketNumber: string;
  serviceType: ServiceType;
  problemCategory?: string;
  problemCode?: string;
  rawComplaint?: string;
  normalizedComplaint: string;
  serviceLocation: CustomerLocation;
  photos: string[];
  status: TicketStatus;
  customerStatusLabel: string;
  customerTimeline: CustomerTimelineStep[];
  assignedProfessionalRole?: string;
  assignedProfessionalName?: string; // Only if company.settings.showTechnicianNameToCustomer is true
  approvedCompanyContact?: {
    phone?: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  feedback?: {
    rating: number;
    comment?: string;
    submittedAt?: string;
  };
}

