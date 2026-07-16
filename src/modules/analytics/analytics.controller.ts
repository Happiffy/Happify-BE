import type { Request, Response } from 'express';
import analyticsService from '@/modules/analytics/analytics.service.js';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class AnalyticsController {
  async dashboard(_request: Request, response: Response) {
    try {
      const dashboard = await analyticsService.getDashboard(getAuthUser(response).id);
      return response.json({ status: 'success', data: { dashboard } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new AnalyticsController();
