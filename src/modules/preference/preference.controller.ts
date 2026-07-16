import type { Request, Response } from 'express';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import preferenceService from '@/modules/preference/preference.service.js';
import { preferenceSchema } from '@/modules/preference/preference.validation.js';

class PreferenceController {
  async getByUserId(request: Request, response: Response) {
    try {
      const query = preferenceSchema.pick({ userId: true }).parse(request.query);
      const preference = await preferenceService.getByUserId(query.userId);
      return response.json({ status: 'success', data: { preference } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async upsert(request: Request, response: Response) {
    try {
      const body = preferenceSchema.parse(request.body);
      const preference = await preferenceService.upsert(body);
      return response.json({ status: 'success', data: { preference } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new PreferenceController();
