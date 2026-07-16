import type { Request, Response } from 'express';
import motivationService from '@/modules/motivation/motivation.service.js';
import { motivationQuerySchema } from '@/modules/motivation/motivation.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
class MotivationController {
  async today(request: Request, response: Response) {
    try { return response.json({ status: 'success', data: { motivation: await motivationService.today(motivationQuerySchema.parse(request.query).locale) } }); }
    catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
}
export default new MotivationController();
