import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import mindfulnessService from '@/modules/mindfulness/mindfulness.service.js';
import { mindfulnessProgressSchema, mindfulnessQuerySchema } from '@/modules/mindfulness/mindfulness.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
class MindfulnessController {
  async list(request: Request, response: Response) {
    try { const query = mindfulnessQuerySchema.parse(request.query); return response.json({ status: 'success', data: { items: await mindfulnessService.list(getAuthUser(response).id, query.locale, query.type) } }); }
    catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
  async progress(request: Request, response: Response) {
    try { const progress = await mindfulnessService.updateProgress(getAuthUser(response).id, mindfulnessProgressSchema.parse(request.body)); return response.json({ status: 'success', data: { progress } }); }
    catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
}
export default new MindfulnessController();
