import preferenceRepository from '@/modules/preference/preference.repository.js';
import type { PreferenceDTO } from '@/modules/preference/preference.validation.js';

class PreferenceService {
  getByUserId(userId: string) {
    return preferenceRepository.userPreference.findUnique({ where: { userId } });
  }

  upsert(userId: string, body: PreferenceDTO) {
    const data = {
      primaryGoal: body.primaryGoal,
      triggers: body.triggers,
      supportTone: body.supportTone,
      highRiskAction: body.highRiskAction,
      accessibilityMode: body.accessibilityMode,
      textScale: body.accessibility.textScale,
      highContrast: body.accessibility.highContrast,
      reducedMotion: body.accessibility.reducedMotion,
      screenReaderOptimized: body.accessibility.screenReaderOptimized,
      consentToAi: body.consentToAi,
      careChatNotifications: body.notifications.careChat,
      referralNotifications: body.notifications.referral,
      moodReminderNotifications: body.notifications.moodReminders,
      wellbeingUpdateNotifications: body.notifications.wellbeingUpdates,
    };
    return preferenceRepository.userPreference.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  }
}

export default new PreferenceService();
