import prisma from '@/config/prisma.js';

class NotificationRepository {
  get fcmToken() { return prisma.trFcmToken; }
}

export default new NotificationRepository();
