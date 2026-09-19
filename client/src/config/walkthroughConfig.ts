export interface WalkthroughChapter {
  id: string;
  timestamp: string;
  seconds: number;
  title: string;
  description: string;
}

export interface WalkthroughVoiceoverSection {
  role: string;
  title: string;
  script: string;
}

export const WALKTHROUGH_CONFIG = {
  // Video source: configurable via environment variable VITE_SERVORA_WALKTHROUGH_VIDEO_URL
  // Set to empty string until the actual screen-recorded video is hosted.
  videoUrl: (import.meta.env.VITE_SERVORA_WALKTHROUGH_VIDEO_URL as string) || '',
  posterUrl: (import.meta.env.VITE_SERVORA_WALKTHROUGH_POSTER_URL as string) || '',

  // Video chapters: easily editable timestamps once the exact final recording cut is produced
  chapters: [
    {
      id: 'overview',
      timestamp: '00:00',
      seconds: 0,
      title: 'SERVORA Overview',
      description: 'The end-to-end field operations journey from fresh setup to verified completion.',
    },
    {
      id: 'new-company',
      timestamp: '00:20',
      seconds: 20,
      title: 'Create a New Company',
      description: 'Registering a fresh service business identity and manager credentials.',
    },
    {
      id: 'coverage-services',
      timestamp: '00:50',
      seconds: 50,
      title: 'Company Coverage & Services',
      description: 'Configuring active service verticals (Solar, AC) and operating coverage boundaries.',
    },
    {
      id: 'manager-dashboard',
      timestamp: '01:20',
      seconds: 80,
      title: 'Manager Dashboard',
      description: 'Operational command center: live tickets, technician roster, and fleet status.',
    },
    {
      id: 'create-technician',
      timestamp: '01:40',
      seconds: 100,
      title: 'Create & Manage Technician',
      description: 'Manually provisioning certified field staff with coverage radius and pincodes.',
    },
    {
      id: 'create-customer',
      timestamp: '02:10',
      seconds: 130,
      title: 'Create Customer Account',
      description: 'Clean homeowner onboarding with strict zero-location initial state.',
    },
    {
      id: 'customer-location',
      timestamp: '02:30',
      seconds: 150,
      title: 'Customer Location Selection',
      description: 'Explicit structured location search via OpenStreetMap Nominatim (No Ahmedabad fallback).',
    },
    {
      id: 'service-discovery',
      timestamp: '02:50',
      seconds: 170,
      title: 'Location-Based Service Discovery',
      description: 'Dynamic discovery of certified Solar and AC providers covering the exact locality.',
    },
    {
      id: 'create-request',
      timestamp: '03:10',
      seconds: 190,
      title: 'Create Service Request',
      description: 'Problem selection, visual evidence guidance, and realistic customer complaint intake.',
    },
    {
      id: 'ai-understanding',
      timestamp: '03:45',
      seconds: 225,
      title: 'AI Understanding & Triage',
      description: 'Structuring customer complaint into technical symptoms and preliminary toolkits.',
    },
    {
      id: 'manager-receives-request',
      timestamp: '04:05',
      seconds: 245,
      title: 'Manager Receives Request',
      description: 'Immediate ticket intake, complaint review, and AI diagnostic assessment.',
    },
    {
      id: 'technician-assignment',
      timestamp: '04:25',
      seconds: 265,
      title: 'Technician Matching & Assignment',
      description: 'Deterministic 5-factor scoring, coverage verification, and validated assignment.',
    },
    {
      id: 'technician-notification',
      timestamp: '04:45',
      seconds: 285,
      title: 'In-App Technician Notification',
      description: 'Real-time alert dispatch with ticket metadata and direct [View Job] deep link.',
    },
    {
      id: 'technician-workflow',
      timestamp: '05:00',
      seconds: 300,
      title: 'Technician Field Workflow',
      description: 'Job acceptance, travel telemetry, on-site milestone transitions, and diagnostic state.',
    },
    {
      id: 'field-operations',
      timestamp: '05:45',
      seconds: 345,
      title: 'Active Field Operations & Telemetry',
      description: 'Manager live monitoring of technician status, telemetry, and location freshness tiers.',
    },
    {
      id: 'diagnosis-report',
      timestamp: '06:15',
      seconds: 375,
      title: 'Diagnosis & Service Report',
      description: 'On-site electrical readings, physical inspection, before/after photos, and parts used.',
    },
    {
      id: 'completion',
      timestamp: '06:45',
      seconds: 405,
      title: 'Job Completion',
      description: 'Technician submits digital completion report and marks job completed.',
    },
    {
      id: 'ai-vs-actual',
      timestamp: '07:00',
      seconds: 420,
      title: 'Manager Reviews AI vs Actual',
      description: 'Audit comparison between initial AI triage and ground-truth field resolution.',
    },
    {
      id: 'customer-feedback',
      timestamp: '07:20',
      seconds: 440,
      title: 'Customer Feedback & History',
      description: 'Customer inspects verified completion record, timeline, and leaves rating.',
    },
    {
      id: 'complete-cycle',
      timestamp: '07:40',
      seconds: 460,
      title: 'SERVORA Complete Cycle',
      description: 'Summary of the verified end-to-end customer, manager, and technician lifecycle.',
    },
  ] as WalkthroughChapter[],

  voiceover: [
    {
      role: 'OPENING',
      title: 'Introduction & Setup',
      script:
        "Let's walk through SERVORA from a completely new setup, using manually created accounts.",
    },
    {
      role: 'COMPANY',
      title: 'Company Identity & Coverage',
      script:
        "We're creating a new service company and defining where the company actually operates and which services it provides.",
    },
    {
      role: 'MANAGER',
      title: 'Command Center',
      script:
        'The manager dashboard is the operational center for the service business.',
    },
    {
      role: 'TECHNICIAN_MANAGEMENT',
      title: 'Workforce Coverage',
      script:
        'Technicians can be managed and their service coverage can be updated as the business changes.',
    },
    {
      role: 'CUSTOMER_INTAKE',
      title: 'Zero-Default Location',
      script:
        'A new customer starts without a preselected service location.',
    },
    {
      role: 'SERVICE_DISCOVERY',
      title: 'Location Verification',
      script:
        "The customer explicitly selects where the service is required. SERVORA then checks service availability for that location.",
    },
    {
      role: 'AI_ASSIST',
      title: 'Triage Assistance',
      script:
        'SERVORA uses AI to help structure the customer’s complaint and assist the service team with initial triage. The AI does not replace professional inspection.',
    },
    {
      role: 'MANAGER_DISPATCH',
      title: 'Eligible Assignment',
      script:
        "The manager assigns an eligible service professional whose configured coverage matches the customer's service location.",
    },
    {
      role: 'AI_VS_ACTUAL',
      title: 'Ground Truth Preservation',
      script:
        'SERVORA keeps the initial AI-assisted understanding separate from the actual findings recorded by the service professional.',
    },
    {
      role: 'CLOSING',
      title: 'Full Operational Cycle',
      script:
        "That's the complete SERVORA workflow — from a customer's first request to manager operations, technician execution, service completion, and customer feedback.",
    },
  ] as WalkthroughVoiceoverSection[],
};
