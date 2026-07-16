import type { Request, Response } from 'express';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import authService from '@/modules/auth/auth.service.js';
import { authVerifySchema } from '@/modules/auth/auth.validation.js';

class AuthController {
  async verify(request: Request, response: Response) {
    try {
      const body = authVerifySchema.parse(request.body);
      const user = await authService.verify(body);
      return response.json({ status: 'success', data: { user } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new AuthController();
