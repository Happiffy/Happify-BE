import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import consentService from '@/modules/consent/consent.service.js';
import { consentQuerySchema, updateConsentSchema } from '@/modules/consent/consent.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class ConsentController {
  async list(request: Request, response: Response) {
    try {
      const query = consentQuerySchema.parse(request.query);
      return response.json({ status: 'success', data: { items: await consentService.list(getAuthUser(response).id, query.scope) } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
  async update(request: Request, response: Response) {
    try {
      const consent = await consentService.update(getAuthUser(response).id, updateConsentSchema.parse(request.body));
      return response.json({ status: 'success', data: { consent } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
}
export default new ConsentController();
