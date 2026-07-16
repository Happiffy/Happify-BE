import journalRepository from '@/modules/journal/journal.repository.js';
import type { CreateJournalDTO } from '@/modules/journal/journal.validation.js';
import { completeText, parseJsonObject } from '@/utils/ai.util.js';
import { richTextToPlainText, sanitizeRichText } from '@/utils/html.util.js';

type JournalAnalysis = {
  title: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRISIS';
  detectedMood: 'HAPPY' | 'CALM' | 'NEUTRAL' | 'ANXIOUS' | 'SAD' | 'DISTRESSED';
  aiReflection: string;
};

class JournalService {
  async list(userId: string, limit: number, page: number) {
    return journalRepository.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit });
  }

  async create(body: CreateJournalDTO) {
    const content = sanitizeRichText(body.content);
    const plainText = richTextToPlainText(content);
    if (!plainText) throw new Error('Journal content is required');
    const analysis = await this.analyze(plainText, body.detectedMood);
    const journal = await journalRepository.journalEntry.create({
      data: {
        userId: body.userId,
        title: analysis.title,
        content,
        imageUrl: body.imageUrl ?? null,
        riskLevel: analysis.riskLevel,
        detectedMood: analysis.detectedMood,
        aiReflection: analysis.aiReflection,
      },
    });

    if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRISIS') {
      await journalRepository.referral.create({
        data: {
          userId: body.userId,
          riskLevel: analysis.riskLevel,
          reason: `Journal flagged ${analysis.riskLevel.toLowerCase()} risk: ${body.title}`,
          requestComment: plainText,
          providerName: 'Happify Professional Care',
          providerType: 'Verified psychologist',
        },
      });
    }

    return journal;
  }

  private async analyze(content: string, fallbackMood?: CreateJournalDTO['detectedMood']): Promise<JournalAnalysis> {
    const fallback = this.analyzeHeuristically(content, fallbackMood);
    const aiResponse = await completeText([
      {
        role: 'system',
        content: 'Analyze a wellbeing journal. Return only JSON with keys title (a concise 2-5 word topic, never copy the full journal), riskLevel (LOW|MEDIUM|HIGH|CRISIS), detectedMood (HAPPY|CALM|NEUTRAL|ANXIOUS|SAD|DISTRESSED), and aiReflection. Use CRISIS for explicit suicidal intent/self-harm. Reflection must be empathetic, concise, actionable, in the journal language, and must recommend immediate human/emergency help for CRISIS. Never diagnose.',
      },
      { role: 'user', content },
    ], 260);
    const parsed = parseJsonObject<JournalAnalysis>(aiResponse);
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRISIS'];
    const moods = ['HAPPY', 'CALM', 'NEUTRAL', 'ANXIOUS', 'SAD', 'DISTRESSED'];
    if (!parsed || !parsed.title?.trim() || !riskLevels.includes(parsed.riskLevel) || !moods.includes(parsed.detectedMood) || !parsed.aiReflection?.trim()) return fallback;
    const severity = { LOW: 0, MEDIUM: 1, HIGH: 2, CRISIS: 3 } as const;
    return severity[fallback.riskLevel] > severity[parsed.riskLevel] ? fallback : parsed;
  }

  private analyzeHeuristically(content: string, fallbackMood?: CreateJournalDTO['detectedMood']): JournalAnalysis {
    const text = content.toLowerCase();
    const crisisWords = ['bunuh diri', 'suicide', 'mati aja', 'mengakhiri hidup', 'kill myself', 'self harm'];
    const highWords = ['nyakitin diri', 'melukai diri', 'ga kuat', 'nggak kuat', 'putus asa', 'hopeless'];
    const mediumWords = ['cape banget', 'capek banget', 'overwhelmed', 'cemas', 'panic', 'panik', 'takut'];
    const sadWords = ['sedih', 'cape', 'capek', 'lelah', 'sendiri', 'kesepian'];
    const anxiousWords = ['cemas', 'panic', 'panik', 'takut', 'khawatir'];
    const title = this.createTopicTitle(text);

    if (crisisWords.some((word) => text.includes(word))) {
      return { title, riskLevel: 'CRISIS' as const, detectedMood: 'DISTRESSED' as const, aiReflection: 'This sounds urgent and serious. Please reach out to someone you trust right now and contact local emergency support if you might hurt yourself. Happify also created a professional care request for follow-up.' };
    }

    if (highWords.some((word) => text.includes(word))) {
      return { title, riskLevel: 'HIGH' as const, detectedMood: 'DISTRESSED' as const, aiReflection: 'This sounds really heavy. Please do not handle it alone. Try contacting someone you trust today, and Happify created a professional care request for support.' };
    }

    if (mediumWords.some((word) => text.includes(word))) {
      return { title, riskLevel: 'MEDIUM' as const, detectedMood: anxiousWords.some((word) => text.includes(word)) ? 'ANXIOUS' as const : 'SAD' as const, aiReflection: 'You seem to be carrying a lot. Try one small reset: drink water, slow your breathing, and write down the main thing that drained you today.' };
    }

    return { title, riskLevel: 'LOW' as const, detectedMood: sadWords.some((word) => text.includes(word)) ? 'SAD' as const : fallbackMood ?? 'NEUTRAL' as const, aiReflection: 'Thanks for writing this down. Keep noticing what affects your energy and mood, one entry at a time.' };
  }

  private createTopicTitle(text: string) {
    if (/bunuh diri|suicide|mati aja|mengakhiri hidup|kill myself/.test(text)) return 'Butuh Dukungan Segera';
    if (/ketemu|bertemu|orang baru|kenalan/.test(text)) return 'Pertemuan Hari Ini';
    if (/sekolah|tugas|ujian|belajar/.test(text)) return 'Tekanan Sekolah';
    if (/keluarga|orang tua|rumah/.test(text)) return 'Tentang Keluarga';
    if (/teman|sahabat|hubungan|pacar/.test(text)) return 'Tentang Hubungan';
    if (/capek|cape|lelah|overwhelmed/.test(text)) return 'Hari yang Melelahkan';
    if (/cemas|khawatir|panic|panik|takut/.test(text)) return 'Rasa Cemas';
    if (/senang|bahagia|happy|bersyukur/.test(text)) return 'Momen yang Menyenangkan';
    if (/makan|lapar|food/.test(text)) return 'Tentang Keseharian';
    return 'Catatan Hari Ini';
  }
}

export default new JournalService();
