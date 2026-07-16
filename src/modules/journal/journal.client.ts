import { z } from 'zod';

const baseUrl = (process.env.AI_JOURNAL_BASE_URL ?? process.env.AI_VOICE_BASE_URL)?.replace(/\/$/, '');
const serviceToken = process.env.AI_SERVICE_TOKEN;
const timeoutMs = Number(process.env.AI_JOURNAL_TIMEOUT_MS ?? 15000);

const journalAnalysisSchema = z.object({
  reflection: z.string().trim().min(1).max(600),
  emotion: z.object({
    state: z.enum(['calm', 'happy', 'neutral', 'sad', 'anxious', 'distressed']),
  }),
  risk_policy: z.object({
    severity: z.enum(['low', 'medium', 'high', 'crisis']),
  }),
  suggested_action: z.string().trim().min(1).max(600),
});

export type JournalAiAnalysis = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRISIS';
  detectedMood: 'HAPPY' | 'CALM' | 'NEUTRAL' | 'ANXIOUS' | 'SAD' | 'DISTRESSED';
  aiReflection: string;
};

export async function analyzeJournalWithAi(content: string, language: 'id' | 'en'): Promise<JournalAiAnalysis | null> {
  if (!baseUrl || !serviceToken) return null;
  try {
    const response = await fetch(`${baseUrl}/api/analyze-journal`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, language }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const parsed = journalAnalysisSchema.safeParse(await response.json());
    if (!parsed.success) return null;
    const value = parsed.data;
    return {
      riskLevel: value.risk_policy.severity.toUpperCase() as JournalAiAnalysis['riskLevel'],
      detectedMood: value.emotion.state.toUpperCase() as JournalAiAnalysis['detectedMood'],
      aiReflection: value.reflection,
    };
  } catch {
    return null;
  }
}
