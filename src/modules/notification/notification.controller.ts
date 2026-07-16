import type { Request, Response } from 'express';
import type { AuthUser } from '@/modules/auth/auth.middleware.js';
import notificationService from '@/modules/notification/notification.service.js';
import { registerFcmTokenSchema, removeFcmTokenSchema } from '@/modules/notification/notification.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class NotificationController {
  async register(request: Request, response: Response) {
    try {
      const authUser = response.locals.authUser as AuthUser;
      const body = registerFcmTokenSchema.parse(request.body);
      await notificationService.register(authUser.id, body.token, body.platform);
      return response.json({ status: 'success' });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const authUser = response.locals.authUser as AuthUser;
      const body = removeFcmTokenSchema.parse(request.body);
      await notificationService.remove(authUser.id, body.token);
      return response.status(204).send();
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new NotificationController();
