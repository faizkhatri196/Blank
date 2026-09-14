import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createTechnicianSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  experienceYears: z.number().min(0, 'Experience years must be positive').default(1),
  serviceTypes: z.array(z.enum(['SOLAR', 'AC'])).min(1, 'At least one service type must be selected'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  tools: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  serviceAreas: z.array(z.string()).min(1, 'At least one service area is required'),
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).default('AVAILABLE'),
});

export const updateTechnicianSchema = createTechnicianSchema.partial().omit({ password: true });

export const updateTechnicianStatusSchema = z.object({
  availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Complete address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
});

export const createSolarSystemSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  capacityKW: z.number().positive('Capacity must be greater than 0'),
  panelMake: z.string().min(2, 'Panel brand is required'),
  panelModel: z.string().optional(),
  inverterMake: z.string().min(2, 'Inverter brand is required'),
  inverterModel: z.string().optional(),
  inverterSerial: z.string().optional(),
  systemType: z.enum(['ON_GRID', 'OFF_GRID', 'HYBRID']).default('ON_GRID'),
  batteryPresent: z.boolean().default(false),
  batteryDetails: z
    .object({
      brand: z.string().optional(),
      capacityKWh: z.number().optional(),
      voltage: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const createACUnitSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  brand: z.string().min(2, 'AC brand is required'),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  acType: z.enum(['SPLIT', 'WINDOW', 'CASSETTE', 'DUCTED', 'OTHER']).default('SPLIT'),
  capacityTR: z.number().positive('Tonnage must be greater than 0'),
  refrigerantType: z.string().default('R32'),
  compressorType: z.enum(['INVERTER', 'NON_INVERTER', 'ROTARY', 'SCROLL']).default('INVERTER'),
  notes: z.string().optional(),
});

export const createServiceTicketSchema = z.object({
  serviceType: z.enum(['SOLAR', 'AC']),
  customerId: z.string().min(1, 'Customer ID is required'),
  assetId: z.string().min(1, 'Asset ID is required'),
  complaint: z.string().min(5, 'Detailed complaint is required'),
  symptoms: z.array(z.string()).default([]),
  errorCode: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  photos: z.array(z.string()).default([]),
  repeatVisit: z.boolean().default(false),
  previousTicketId: z.string().optional(),
  repeatVisitReason: z.string().optional(),
  isDemoData: z.boolean().default(false),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'AI_ANALYZED',
    'WAITING_FOR_ASSIGNMENT',
    'ASSIGNED',
    'ACCEPTED',
    'ON_THE_WAY',
    'ON_SITE',
    'DIAGNOSING',
    'REPAIRING',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().optional(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().min(1, 'Technician ID is required'),
});

export const aiAnalysisReviewSchema = z.object({
  accepted: z.boolean().default(true),
  editedChecklist: z.array(z.string()).optional(),
  editedTools: z.array(z.string()).optional(),
  editedParts: z.array(z.string()).optional(),
  managerNotes: z.string().optional(),
});

export const createServiceReportSchema = z.object({
  actualDiagnosis: z.string().min(3, 'Actual diagnosis is required'),
  workPerformed: z.string().min(5, 'Detailed work performed description is required'),
  readings: z.record(z.any()).default({}),
  partsUsed: z.array(z.string()).default([]),
  toolsUsed: z.array(z.string()).default([]),
  beforePhotos: z.array(z.string()).default([]),
  afterPhotos: z.array(z.string()).default([]),
  technicianNotes: z.string().optional(),
  aiHelpful: z.boolean().optional(),
  aiAccuracyRating: z.number().min(1).max(5).optional(),
  toolsHelpful: z.boolean().optional(),
  partsHelpful: z.boolean().optional(),
  additionalFeedback: z.string().optional(),
});

export const createPilotFeedbackSchema = z.object({
  aiUtilityRating: z.number().min(1).max(5),
  diagnosisHelpfulness: z.number().min(1).max(5).optional(),
  toolHelpfulness: z.number().min(1).max(5).optional(),
  partsHelpfulness: z.number().min(1).max(5).optional(),
  technicianMatchingHelpfulness: z.number().min(1).max(5).optional(),
  timeSavedMinutes: z.number().optional(),
  comments: z.string().optional(),
});

export const aiOutputSchema = z.object({
  serviceType: z.enum(['SOLAR', 'AC']),
  possibleIssues: z.array(
    z.object({
      issue: z.string(),
      probabilityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      explanation: z.string(),
    })
  ).min(1),
  diagnosticSteps: z.array(z.string()).min(1),
  recommendedTools: z.array(z.string()).min(1),
  possibleParts: z.array(z.string()),
  safetyWarnings: z.array(z.string()).min(1),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reasoning: z.string(),
  knowledgeSources: z.array(z.string()),
});
