import { firebaseMessaging } from '@/config/firebase.js';
import notificationRepository from '@/modules/notification/notification.repository.js';

export type PushPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
};

const invalidTokenCodes = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

class NotificationService {
  register(userId: string, token: string, platform: 'ANDROID' | 'IOS' | 'WEB') {
    return notificationRepository.fcmToken.upsert({
      where: { token },
      update: { userId, platform, lastSeenAt: new Date() },
      create: { userId, token, platform },
    });
  }

  remove(userId: string, token: string) {
    return notificationRepository.fcmToken.deleteMany({ where: { userId, token } });
  }

  async sendToUser(userId: string, payload: PushPayload) {
    const rows = await notificationRepository.fcmToken.findMany({ where: { userId }, select: { token: true } });
    await this.send(rows.map((row) => row.token), payload);
  }

  async sendToRole(role: 'USER' | 'PSYCHOLOGIST', payload: PushPayload) {
    const rows = await notificationRepository.fcmToken.findMany({ where: { user: { role } }, select: { token: true } });
    await this.send(rows.map((row) => row.token), payload);
  }

  private async send(tokens: string[], payload: PushPayload) {
    for (let index = 0; index < tokens.length; index += 500) {
      const chunk = tokens.slice(index, index + 500);
      if (chunk.length === 0) continue;
      const result = await firebaseMessaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: { priority: 'high', notification: { channelId: 'care_updates' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      const invalidTokens = result.responses.flatMap((response, responseIndex) => {
        const token = chunk[responseIndex];
        return !response.success && token && response.error?.code && invalidTokenCodes.has(response.error.code) ? [token] : [];
      });
      if (invalidTokens.length > 0) {
        await notificationRepository.fcmToken.deleteMany({ where: { token: { in: invalidTokens } } });
      }
    }
  }
}

export default new NotificationService();
