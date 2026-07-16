import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import preferenceService from '@/modules/preference/preference.service.js';
import { preferenceSchema } from '@/modules/preference/preference.validation.js';

class PreferenceController {
  async getByUserId(_request: Request, response: Response) {
    try {
      const preference = await preferenceService.getByUserId(getAuthUser(response).id);
      return response.json({ status: 'success', data: { preference } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async upsert(request: Request, response: Response) {
    try {
      const body = preferenceSchema.parse(request.body);
      const preference = await preferenceService.upsert(getAuthUser(response).id, body);
      return response.json({ status: 'success', data: { preference } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new PreferenceController();
