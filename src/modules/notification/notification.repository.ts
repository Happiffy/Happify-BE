import prisma from '@/config/prisma.js';

class NotificationRepository {
  get fcmToken() { return prisma.fcmToken; }
}

export default new NotificationRepository();
