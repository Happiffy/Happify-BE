import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import heatmapService from '@/modules/heatmap/heatmap.service.js';
import { heatmapContributionSchema, heatmapQuerySchema } from '@/modules/heatmap/heatmap.validation.js';

class HeatmapController {
  async list(request: Request, response: Response) {
    try {
      const query = heatmapQuerySchema.parse(request.query);
      const items = await heatmapService.list(query.days);
      return response.json({ status: 'success', data: { items } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async contribute(request: Request, response: Response) {
    try {
      const contribution = await heatmapService.contribute(getAuthUser(response).id, heatmapContributionSchema.parse(request.body));
      return response.json({ status: 'success', data: { contribution } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new HeatmapController();
