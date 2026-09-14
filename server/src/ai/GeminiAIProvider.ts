import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AITicketContext } from './AIProvider';
import { AIAnalysisResult } from '../types';
import { aiOutputSchema } from '../validators';

export class GeminiAIProvider implements AIProvider {
  name = 'GeminiAIProvider';
  private client: GoogleGenerativeAI | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  async healthCheck(): Promise<{ available: boolean; provider: string; details?: string }> {
    if (!this.client || !this.apiKey) {
      return { available: false, provider: 'GeminiAIProvider', details: 'API key not configured' };
    }
    return { available: true, provider: 'GeminiAIProvider', details: 'Connected with API key' };
  }

  async analyzeServiceTicket(input: AITicketContext): Promise<AIAnalysisResult> {
    if (!this.client || !this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
You are an expert field-service diagnostic assistant helping trained service managers and technicians prepare for a physical on-site service visit.
Do not claim absolute certainty. Frame all findings as "Possible issue" or "Suggested diagnostic check". Always emphasize that physical testing and safety protocols must be followed on-site.

SERVICE TYPE: ${input.serviceType}
TICKET NUMBER: ${input.ticketNumber}
CUSTOMER COMPLAINT: "${input.complaint}"
SYMPTOMS: ${JSON.stringify(input.symptoms || [])}
ERROR CODE: ${input.errorCode || 'None reported'}
EQUIPMENT DETAILS: ${JSON.stringify(input.assetDetails)}
PREVIOUS SERVICE HISTORY: ${JSON.stringify(input.previousHistory || [])}

You must return a strictly valid JSON object matching this schema:
{
  "serviceType": "${input.serviceType}",
  "possibleIssues": [
    {
      "issue": "Specific descriptive issue title",
      "probabilityLevel": "HIGH" | "MEDIUM" | "LOW",
      "explanation": "Brief explanation connecting reported symptoms to root cause"
    }
  ],
  "diagnosticSteps": [
    "Step 1: Specific verification check with measurement tool",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "recommendedTools": ["MULTIMETER", "CLAMP_METER", ...],
  "possibleParts": ["Suggested replacement component if verified bad", ...],
  "safetyWarnings": ["Clear, realistic electrical/mechanical safety warning", ...],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "Concise 2-3 sentence diagnostic rationale",
  "knowledgeSources": ["Manufacturer Service Guidelines", "Field Ops SOP"]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text);
    const validated = aiOutputSchema.parse(parsed);

    return {
      ...validated,
      promptVersion: 'gemini-prompt-v0.1',
      provider: 'GeminiAIProvider',
      model: 'gemini-2.5-flash',
    };
  }
}
