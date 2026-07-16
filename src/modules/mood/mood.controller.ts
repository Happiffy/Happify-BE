import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import moodService from '@/modules/mood/mood.service.js';
import { createMoodSchema } from '@/modules/mood/mood.validation.js';
import { paginationSchema } from '@/modules/shared.validation.js';

class MoodController {
  async list(request: Request, response: Response) {
    try {
      const query = paginationSchema.parse(request.query);
      const items = await moodService.list(getAuthUser(response).id, query.limit);
      return response.json({ status: 'success', data: { items } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const body = createMoodSchema.parse(request.body);
      const mood = await moodService.create(getAuthUser(response).id, body);
      return response.status(201).json({ status: 'success', data: { mood } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new MoodController();
