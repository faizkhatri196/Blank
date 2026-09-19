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
      description: 'The end-to-end field operations journey from request to field completion.',
    },
    {
      id: 'customer',
      timestamp: '00:20',
      seconds: 20,
      title: 'Customer Experience',
      description: 'Location-first service availability check, AI problem triage, and request creation.',
    },
    {
      id: 'manager-dispatch',
      timestamp: '01:15',
      seconds: 75,
      title: 'Manager Operations',
      description: 'Incoming request review, AI triage confidence, and technician dispatch.',
    },
    {
      id: 'technician-field',
      timestamp: '02:10',
      seconds: 130,
      title: 'Technician Workflow',
      description: 'Accepting job, travel status, on-site diagnostics, readings, parts, and closeout report.',
    },
    {
      id: 'field-operations',
      timestamp: '03:05',
      seconds: 185,
      title: 'Field Operations & Telemetry',
      description: 'Real-time fleet monitoring, location freshness tiers (Fresh/Warm/Stale), and progress.',
    },
    {
      id: 'completion-comparison',
      timestamp: '03:35',
      seconds: 215,
      title: 'Service Completion & AI vs Actual',
      description: 'Preserving verified service records and comparing initial AI diagnosis with field truth.',
    },
    {
      id: 'feedback-history',
      timestamp: '03:50',
      seconds: 230,
      title: 'Feedback & Service History',
      description: 'Customer rating, verified receipt, and audit-ready service history.',
    },
  ] as WalkthroughChapter[],

  voiceover: [
    {
      role: 'OPENING',
      title: 'The Operational Journey',
      script:
        'Every service request has a journey — from the moment a customer reports a problem to the moment a service professional completes the job.',
    },
    {
      role: 'CUSTOMER',
      title: 'Location & Intake',
      script:
        'With SERVORA, the journey starts with location. Customers enter where they need service, and SERVORA checks which services are actually available in that area. Customers select the service, describe the problem, add visual evidence, and review an AI-assisted understanding before submitting the request.',
    },
    {
      role: 'MANAGER',
      title: 'Review & Dispatch',
      script:
        'Managers receive the request in their operations dashboard, review the service details, and assign the appropriate service professional.',
    },
    {
      role: 'TECHNICIAN',
      title: 'Field Execution',
      script:
        'The technician receives the assigned job and manages the entire field workflow — from accepting the job and traveling to the customer, to diagnosis, readings, photos, parts, and service completion.',
    },
    {
      role: 'OPERATIONS',
      title: 'Field Operations & Freshness',
      script:
        'Managers can monitor active field operations and the latest available technician location, with location freshness clearly shown.',
    },
    {
      role: 'COMPLETION',
      title: 'AI vs Actual Ground Truth',
      script:
        'Once the service is completed, SERVORA preserves the actual service record and allows managers to compare the initial AI understanding with the actual result.',
    },
    {
      role: 'CUSTOMER_FEEDBACK',
      title: 'Transparency & Feedback',
      script:
        'Customers can follow the service progress and provide feedback after completion.',
    },
    {
      role: 'CLOSING',
      title: 'Platform Summary',
      script:
        'SERVORA connects the entire field-service operation — customer, manager, and service professional — in one operational platform. SERVORA. AI-powered field service operations.',
    },
  ] as WalkthroughVoiceoverSection[],
};
