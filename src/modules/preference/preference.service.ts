import preferenceRepository from '@/modules/preference/preference.repository.js';
import type { PreferenceDTO } from '@/modules/preference/preference.validation.js';

class PreferenceService {
  async getByUserId(userId: string) {
    return preferenceRepository.userPreference.findUnique({ where: { userId } });
  }

  async upsert(body: PreferenceDTO) {
    return preferenceRepository.userPreference.upsert({
      where: { userId: body.userId },
      update: {
        primaryGoal: body.primaryGoal,
        triggers: body.triggers,
        supportTone: body.supportTone,
        highRiskAction: body.highRiskAction,
        accessibilityMode: body.accessibilityMode,
        consentToAi: body.consentToAi,
      },
      create: body,
    });
  }
}

export default new PreferenceService();
