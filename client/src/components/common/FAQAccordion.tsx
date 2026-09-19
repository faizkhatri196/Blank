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
            'SERVORA currently supports two primary production verticals: Solar Photovoltaic (PV) systems (inverters, solar panels, power generation diagnostics) and AC / HVAC systems (cooling failures, water leaks, gas pressure, compressor diagnostics). SERVORA is designed around configurable service verticals, allowing additional service categories to be introduced in future releases.',
        },
        {
          question: 'How does location selection work for service requests?',
          answer:
            'Customer location selection is powered by live OpenStreetMap Nominatim search with precise India boundaries. When a customer enters their area or city, structured coordinates, pincodes, and boundaries are retrieved in real-time. There are zero hardcoded city fallbacks.',
        },
        {
          question: 'Why are photos required for certain problems but not others?',
          answer:
            'Each problem category defines calibrated photo requirements: REQUIRED (such as Inverter Error Codes or AC Water Leaking) where visual evidence is essential to dispatch correct components; RECOMMENDED where photos aid preliminary diagnosis; and NOT_USEFUL (such as AC noise or burning odor) where physical testing instruments on site are required rather than visual inspection.',
        },
      ],
    },
    {
      id: 'manager',
      title: 'Manager & Dispatch',
      icon: Building,
      items: [
        {
          question: 'How does the 5-factor technician recommendation work?',
          answer:
            'The matching engine scores active company technicians using deterministic criteria: Certified Skill Match (40%), Equipped Tool Verification (20%), Availability & Status (20%), Geographic Service Area Coverage (10%), and Industry Experience (10%). Technicians outside coverage boundaries are marked as ineligible with clear diagnostic explanations.',
        },
        {
          question: 'What happens if I try to assign a technician outside the service area?',
          answer:
            'The platform enforces strict service area validation. If a technician does not cover the customer’s locality, radius, or pincode, assignment fails safely with a structured in-app diagnostic modal detailing the mismatch and offering one-click actions to adjust technician coverage or choose another eligible technician.',
        },
        {
          question: 'Can managers customize service radius and technician coverage?',
          answer:
            'Yes. In Company Settings and Technician Management, managers can edit operating coverage radius (in kilometers), assigned localities, and pincodes with smooth keystroke handling and live boundary validation.',
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
            'When a manager assigns a job, a tenant-isolated in-app notification is immediately generated. Technicians see a real-time badge count, service summary, customer locality, and a direct deep-link [View Job] that opens the job execution terminal at /technician/jobs/:id.',
        },
        {
          question: 'What lifecycle stages exist for field job execution?',
          answer:
            'Technicians move tickets through strict operational milestones: Assigned → Accepted → On The Way → On Site → Diagnosing → Repairing → Completed, with tamper-resistant audit timestamps and milestone notes.',
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
            'Every organization has an isolated company boundary. All database queries, tickets, customer profiles, technician rosters, notifications, and telemetry strictly filter by companyId to guarantee zero cross-tenant leakage.',
        },
        {
          question: 'Is SERVORA extensible to future service verticals?',
          answer:
            'Yes. SERVORA’s service registry, problem catalog, and AI triage architecture are completely modular. While currently active production services focus strictly on Solar and AC / HVAC, additional verticals can be registered seamlessly in upcoming releases without modifying the core matching and workflow engine.',
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
            'AI analysis normalizes unstructured customer complaints into structured symptom definitions, probable root causes, recommended toolkits, and safety advisories. Manager reviews can annotate recommendations while original AI output remains immutable for post-job accuracy audits.',
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
          question: 'How has the platform been validated for real testing?',
          answer:
            'The entire core workflow has undergone end-to-end automated and human testing across location search, technician matching, area validation, in-app notifications, and field execution across both Solar and AC verticals.',
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
