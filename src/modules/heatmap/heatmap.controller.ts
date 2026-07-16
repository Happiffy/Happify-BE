import type { Request, Response } from 'express';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import heatmapService from '@/modules/heatmap/heatmap.service.js';

class HeatmapController {
  async list(_request: Request, response: Response) {
    try {
      const items = await heatmapService.list();
      return response.json({ status: 'success', data: { items } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new HeatmapController();
