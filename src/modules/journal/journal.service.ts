import journalRepository from '@/modules/journal/journal.repository.js';
import notificationService from '@/modules/notification/notification.service.js';
import type { CreateJournalDTO } from '@/modules/journal/journal.validation.js';
import { analyzeJournalWithAi } from '@/modules/journal/journal.client.js';
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

  async create(userId: string, body: CreateJournalDTO) {
    const content = sanitizeRichText(body.content);
    const plainText = richTextToPlainText(content);
    if (!plainText) throw new Error('Journal content is required');
    const latestAiDocument = await journalRepository.consentDocument.findFirst({ where: { scope: 'AI_PROCESSING', isActive: true, effectiveAt: { lte: new Date() } }, orderBy: { version: 'desc' }, select: { id: true } });
    const aiConsent = latestAiDocument ? await journalRepository.consent.findFirst({ where: { userId, documentId: latestAiDocument.id, status: 'ACCEPTED' }, select: { id: true } }) : null;
    const analysis = aiConsent ? await this.analyze(plainText, body.detectedMood) : this.analyzeHeuristically(plainText, body.detectedMood);
    const journal = await journalRepository.journalEntry.create({
      data: {
        userId,
        title: analysis.title,
        content,
        imageUrl: body.imageUrl ?? null,
        riskLevel: analysis.riskLevel,
        detectedMood: analysis.detectedMood,
        aiReflection: analysis.aiReflection,
      },
    });

    if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRISIS') {
      const referral = await journalRepository.referral.create({
        data: {
          userId,
          riskLevel: analysis.riskLevel,
          reason: `Journal flagged ${analysis.riskLevel.toLowerCase()} risk: ${body.title}`,
           requestComment: `Professional review requested after ${analysis.riskLevel.toLowerCase()} risk was detected in journal entry "${analysis.title}".`,

          providerName: 'Happify Professional Care',
          providerType: 'Verified psychologist',
        },
      });
      void notificationService.sendToRole('PSYCHOLOGIST', {
        title: 'New urgent care request',
        body: 'A care request needs review.',
        data: { type: 'referral.created', referralId: referral.id, riskLevel: referral.riskLevel, target: 'care' },
      }).catch(() => undefined);
    }

    return journal;
  }

  private async analyze(content: string, fallbackMood?: CreateJournalDTO['detectedMood']): Promise<JournalAnalysis> {
    const fallback = this.analyzeHeuristically(content, fallbackMood);
    const language = /\b(aku|saya|gue|gw|nggak|tidak|cemas|sedih|capek|takut)\b/i.test(content) ? 'id' : 'en';
    const result = await analyzeJournalWithAi(content, language);
    if (!result) return fallback;
    const severity = { LOW: 0, MEDIUM: 1, HIGH: 2, CRISIS: 3 } as const;
    if (severity[fallback.riskLevel] > severity[result.riskLevel]) return fallback;
    return {
      title: fallback.title,
      riskLevel: result.riskLevel,
      detectedMood: result.detectedMood,
      aiReflection: result.aiReflection,
    };
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
