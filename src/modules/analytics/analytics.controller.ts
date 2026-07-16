import type { Request, Response } from 'express';
import analyticsService from '@/modules/analytics/analytics.service.js';
import { analyticsQuerySchema } from '@/modules/analytics/analytics.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class AnalyticsController {
  async dashboard(request: Request, response: Response) {
    try {
      const query = analyticsQuerySchema.parse(request.query);
      const dashboard = await analyticsService.getDashboard(query.userId);
      return response.json({ status: 'success', data: { dashboard } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new AnalyticsController();
