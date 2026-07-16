import type { Request, Response } from 'express';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import { listByUserSchema } from '@/modules/shared.validation.js';
import moodService from '@/modules/mood/mood.service.js';
import { createMoodSchema } from '@/modules/mood/mood.validation.js';

class MoodController {
  async list(request: Request, response: Response) {
    try {
      const query = listByUserSchema.parse(request.query);
      const items = await moodService.list(query.userId, query.limit);
      return response.json({ status: 'success', data: { items } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const body = createMoodSchema.parse(request.body);
      const mood = await moodService.create(body);
      return response.status(201).json({ status: 'success', data: { mood } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new MoodController();
