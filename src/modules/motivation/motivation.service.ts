import motivationRepository from '@/modules/motivation/motivation.repository.js';
class MotivationService {
  async today(locale: string) {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return motivationRepository.motivation.findFirst({ where: { locale, date: { lte: date } }, orderBy: { date: 'desc' } });
  }
}
export default new MotivationService();
