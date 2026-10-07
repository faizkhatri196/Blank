import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Shield, Wrench, Users, Building, Brain, CheckCircle2 } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: FAQItem[];
}

export const FAQAccordion: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('customer');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: string, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: FAQCategory[] = [
    {
      id: 'customer',
      title: 'Customer Operations',
      icon: Users,
      items: [
        {
          question: 'Which services are currently supported on SERVORA?',
          answer:
            'SERVORA supports five core field service trades: Solar Photovoltaic (PV) systems (inverter fault triage, array generation diagnostics), AC / HVAC (cooling issues, condensate leaks, gas pressure), Plumbing (pipe leaks, drainage blockages, valve replacements), Electrical (MCB tripping, short circuits, switchboard faults), and Home Maintenance / Civil (tile replacement, wall seepage, masonry waterproofing). Each service has custom intake workflows, problem catalogs, and diagnostic guidance.',
        },
        {
          question: 'How does location selection work for service requests?',
          answer:
            'Customer location selection is powered by live OpenStreetMap Nominatim search with precise India boundaries. When a customer enters their area or city, structured coordinates, pincodes, and boundaries are retrieved in real-time. There are zero hardcoded city fallbacks, and invalid coordinates are strictly rejected.',
        },
        {
          question: 'Why are photos required for certain problems but not others?',
          answer:
            'Each problem category defines calibrated photo requirements: REQUIRED (such as Inverter Error Codes, Pipe Leakage, or Tile Damage) where visual inspection is essential to dispatch correct materials; RECOMMENDED where photos aid preliminary diagnosis; and NOT_USEFUL (such as burning odor or electrical buzzing) where physical on-site testing instruments are required.',
        },
      ],
    },
    {
      id: 'manager',
      title: 'Manager & Dispatch',
      icon: Building,
      items: [
        {
          question: 'How does service-aware technician matching work?',
          answer:
            'The matching engine scores active company technicians using deterministic criteria: Certified Service Capability Match (strictly filtering by trade, e.g. Plumbing vs Solar), Equipped Tool Verification, Availability & Shift Status, Geographic Service Area Coverage, and Experience. Technicians lacking certification for the requested service vertical are disqualified with clear diagnostic explanations.',
        },
        {
          question: 'What happens if I try to assign a technician to an uncertified service?',
          answer:
            'The platform enforces strict capability validation. If a manager attempts to assign a Solar-only technician to a Plumbing or Electrical ticket, the backend rejects the assignment with a SERVICE_TYPE_MISMATCH error and displays an in-app diagnostic guide recommending qualified personnel.',
        },
        {
          question: 'Can managers customize service radius and technician coverage?',
          answer:
            'Yes. In Company Settings and Technician Management, managers can edit operating coverage radius (in kilometers), assigned service capabilities, localities, and pincodes with smooth keystroke handling and live boundary validation.',
        },
      ],
    },
    {
      id: 'technician',
      title: 'Technician Field Ops',
      icon: Wrench,
      items: [
        {
          question: 'How do technicians receive job assignments?',
          answer:
            'When a manager assigns a job, a tenant-isolated in-app notification is immediately generated. Technicians see a real-time badge count, service summary, customer locality, and a direct deep-link [View Job] that opens the trade-specific execution terminal at /technician/jobs/:id.',
        },
        {
          question: 'What lifecycle stages exist for field job execution?',
          answer:
            'Technicians move tickets through strict operational milestones: Assigned → Accepted → On The Way → On Site → Diagnosing → In Progress → Completed, with tamper-resistant audit timestamps, field observations, and trade-specific checklists.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'Enterprise Architecture & Multi-Tenancy',
      icon: Shield,
      items: [
        {
          question: 'How is tenant data isolated between service providers?',
          answer:
            'Every organization operates within an isolated tenant boundary. All database queries, tickets, customer profiles, technician rosters, notifications, and telemetry strictly filter by companyId to guarantee zero cross-tenant data leakage.',
        },
        {
          question: 'How is the multi-trade service model architected?',
          answer:
            'SERVORA utilizes a modular Service Registry where each trade (Solar, AC, Plumbing, Electrical, Home Maintenance) defines its problem taxonomies, required diagnostic tools, safety warnings, and execution steps. Companies opt into specific service verticals, enabling single-trade or multi-trade dispatch from a single platform.',
        },
      ],
    },
    {
      id: 'ai_privacy',
      title: 'AI Diagnostics & Privacy',
      icon: Brain,
      items: [
        {
          question: 'How does the AI triage assist without hallucinating?',
          answer:
            'The AI analysis engine parses unstructured customer complaints into structured symptom definitions, probable root causes, recommended toolkits, and mandatory safety advisories. It assists technicians and managers without replacing physical diagnosis on site.',
        },
        {
          question: 'How is customer and technician privacy protected?',
          answer:
            'Customer contact details and precise location telemetry are restricted to authenticated roles with legitimate dispatch context. Passwords and credentials are never stored in plaintext.',
        },
      ],
    },
    {
      id: 'verification',
      title: 'Testing & Real-World Validation',
      icon: CheckCircle2,
      items: [
        {
          question: 'How has the platform been validated for real-world operations?',
          answer:
            'The entire operational flow has undergone comprehensive end-to-end automated and human testing across location search, trade capability matching, multi-tenant boundaries, and field execution across Solar, AC, Plumbing, Electrical, and Home Maintenance.',
        },
      ],
    },
  ];

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500">
            Platform capabilities, active service verticals, dispatch workflows & security
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion Items */}
      <div className="space-y-3">
        {currentCategory.items.map((item, idx) => {
          const key = `${currentCategory.id}-${idx}`;
          const isOpen = !!openItems[key];

          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
            >
              <button
                type="button"
                onClick={() => toggleItem(currentCategory.id, idx)}
                aria-expanded={isOpen}
                className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 bg-white animate-fadeIn">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
