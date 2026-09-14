import Groq from 'groq-sdk';
import { AIProvider, AITicketContext } from './AIProvider';
import { AIAnalysisResult } from '../types';
import { aiOutputSchema } from '../validators';

export class GroqAIProvider implements AIProvider {
  name = 'GroqAIProvider';
  private client: Groq | null = null;
  private model: string;

  constructor(apiKey: string, model = 'llama-3.3-70b-versatile') {
    this.model = model;
    if (apiKey) {
      this.client = new Groq({ apiKey });
    }
  }

  async healthCheck(): Promise<{ available: boolean; provider: string; details?: string }> {
    if (!this.client) {
      return { available: false, provider: 'GroqAIProvider', details: 'API key not configured' };
    }
    return { available: true, provider: 'GroqAIProvider', details: `Connected with model: ${this.model}` };
  }

  async analyzeServiceTicket(input: AITicketContext): Promise<AIAnalysisResult> {
    if (!this.client) {
      throw new Error('Groq API key is not configured');
    }

    const systemPrompt = `You are an expert field-service diagnostic assistant for trained service technicians.
You must provide possible hypotheses, diagnostic checklists, required tools, possible spare parts, and strict safety advisories.
Always state that physical verification on site is required.
Output strictly JSON matching the required schema.`;

    const userPrompt = `
SERVICE TYPE: ${input.serviceType}
TICKET NUMBER: ${input.ticketNumber}
CUSTOMER COMPLAINT: "${input.complaint}"
SYMPTOMS: ${JSON.stringify(input.symptoms || [])}
ERROR CODE: ${input.errorCode || 'None reported'}
EQUIPMENT DETAILS: ${JSON.stringify(input.assetDetails)}
PREVIOUS SERVICE HISTORY: ${JSON.stringify(input.previousHistory || [])}

Required JSON format:
{
  "serviceType": "${input.serviceType}",
  "possibleIssues": [
    {
      "issue": "Title of issue",
      "probabilityLevel": "HIGH" | "MEDIUM" | "LOW",
      "explanation": "Brief explanation"
    }
  ],
  "diagnosticSteps": ["Step 1", "Step 2", "Step 3"],
  "recommendedTools": ["MULTIMETER", "CLAMP_METER"],
  "possibleParts": ["Part 1"],
  "safetyWarnings": ["Safety warning 1"],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "2-sentence summary",
  "knowledgeSources": ["Field Standard Operating Procedure"]
}
`;

    const completion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: this.model,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const validated = aiOutputSchema.parse(parsed);

    return {
      ...validated,
      promptVersion: 'groq-prompt-v0.1',
      provider: 'GroqAIProvider',
      model: this.model,
    };
  }
}
