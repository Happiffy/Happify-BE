import preferenceRepository from '@/modules/preference/preference.repository.js';
import type { NotificationPreferencesPatchDTO, PreferenceDTO } from '@/modules/preference/preference.validation.js';

class PreferenceService {
  getByUserId(userId: string) {
    return preferenceRepository.userPreference.findUnique({ where: { userId } });
  }

  async updateNotifications(userId: string, body: NotificationPreferencesPatchDTO) {
    const existing = await preferenceRepository.userPreference.findUnique({ where: { userId }, select: { id: true } });
    if (!existing) throw new Error('Complete onboarding preferences before changing notifications.');
    return preferenceRepository.userPreference.update({ where: { userId }, data: {
      ...(body.careChat === undefined ? {} : { careChatNotifications: body.careChat }),
      ...(body.referral === undefined ? {} : { referralNotifications: body.referral }),
      ...(body.moodReminders === undefined ? {} : { moodReminderNotifications: body.moodReminders }),
      ...(body.wellbeingUpdates === undefined ? {} : { wellbeingUpdateNotifications: body.wellbeingUpdates }),
    } });
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
